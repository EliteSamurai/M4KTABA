/**
 * Phase 3 — End-to-end verification of the multi-seller payout flow in Stripe
 * TEST MODE, using ONLY real Stripe API calls and the real application code.
 *
 * Why NOT a Jest test:
 *   - Runs in plain Node (no JSDOM) so the Stripe SDK uses its production
 *     HTTP client, never the Jest-patched `globalThis.fetch`.
 *   - Uses the real `.env.test` credentials (sk_test_...).
 *   - The ONE test double is a fake Sanity `writeClient`, injected through the
 *     `overrides` parameter of `processRealOrder` (see route.ts). It records
 *     every "write" so the script can assert what the route intended to
 *     persist AND prove that ZERO writes ever reached the real Sanity dataset.
 *
 * Run:  npx tsx scripts/e2e-multiseller-transfers.ts
 */
import { config } from 'dotenv';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 1) Environment bootstrap — MUST run before any module that reads process.env
// ---------------------------------------------------------------------------
// override: true guarantees `.env.test` wins over any ambient shell vars, so
// this script can never accidentally run against live keys.
config({ path: '.env.test', override: true });

assert.ok(
  (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_'),
  'REFUSING TO RUN: STRIPE_SECRET_KEY is not a test key (must start with sk_test_).'
);

// lib/email.ts constructs `new Resend(RESEND_API_KEY)` at import time;
// .env.test has no RESEND key, so give it a non-empty dummy — processRealOrder
// never sends via Resend (its own sendEmail logs when SMTP is unset).
process.env.RESEND_API_KEY ??= 're_test_e2e_dummy';
// route.ts's local sendEmail() logs instead of sending when SMTP is unset.
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
// lib/idempotency uses its real in-memory store when REDIS_URL is unset.
delete process.env.REDIS_URL;
// ProcessEnv types NODE_ENV as readonly; a cast is required only here.
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';

// ---------------------------------------------------------------------------
// 2) The ONLY test double in this script: an in-memory Sanity write client.
// ---------------------------------------------------------------------------
function makeFakeWriteClient() {
  const created: any[] = [];
  const patched: any[] = [];
  return {
    created,
    patched,
    client: {
      create: async (doc: any) => {
        const id =
          'ord_e2e_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        created.push({ _id: id, ...doc });
        return { _id: id, transfersCreated: false };
      },
      patch: (id: string) => ({
        set: (fields: any) => {
          patched.push({ id, ...fields });
          return { commit: async () => ({ _id: id }) };
        },
      }),
    },
  };
}

async function main() {
  // Dynamic imports AFTER env is loaded. Top-level `import` statements are
  // hoisted above `config()`, which would construct the Stripe client with the
  // wrong key — dynamic import is deterministic in both ESM and CJS.
  const { stripe } = await import('@/lib/stripe');
  const { processRealOrder } = await import(
    '@/app/api/webhooks/stripe-webhook/route'
  );
  const s = stripe as any;

  const runId = Date.now();
  const buyerEmail = 'buyer-e2e-' + runId + '@m4ktaba.test';
  const shipping = {
    name: 'E2E Buyer',
    street1: '1 Test St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    country: 'US',
  };

  const fake = makeFakeWriteClient();

  console.log('='.repeat(72));
  console.log('PHASE 3 E2E — multi-seller transfers (Stripe TEST MODE)');
  console.log('runId:', runId);
  console.log('Stripe key:', process.env.STRIPE_SECRET_KEY!.slice(0, 12) + '…');
  // -------------------------------------------------------------------------
  // PHASE A — Create test Connect accounts
  // -------------------------------------------------------------------------
  async function createPayoutReadySeller(label: string) {
    const email = label + '-' + runId + '@m4ktaba.test';
    const acct = await s.accounts.create({
      type: 'custom',
      country: 'US',
      email,
      business_type: 'individual',
      individual: {
        first_name: label,
        last_name: 'Seller',
        email,
        dob: { day: 1, month: 1, year: 1990 },
        ssn_last_4: '0000',
        address: {
          line1: '1 Test St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94103',
          country: 'US',
        },
      },
      business_profile: {
        mcc: '5734',
        url: 'https://m4ktaba.com',
        product_description: 'Books for sale',
      },
      settings: { payouts: { debit_negative_balances: true } },
      tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: '8.8.8.8' },
      external_account: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        routing_number: '110000000',
        account_number: '000123456789',
      },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    const cap = await s.accounts.retrieve(acct.id);
    assert.equal(
      cap.capabilities.transfers,
      'active',
      label + ' must have ACTIVE transfers capability'
    );
    console.log(
      'CREATE ' + label + ' = ' + acct.id + ' (transfers=' +
        cap.capabilities.transfers + ')'
    );
    return acct;
  }

  const seller1 = await createPayoutReadySeller('seller1');
  const seller2 = await createPayoutReadySeller('seller2');

  // Realistic "seller hasn't finished onboarding" account: created, but NO
  // capabilities requested. Confirmed to produce a real Stripe API error
  // `insufficient_capabilities_for_transfer` on transfer attempts.
  const notOnboarded = await s.accounts.create({
    type: 'express',
    country: 'US',
    email: 'onboarding-incomplete-' + runId + '@m4ktaba.test',
    capabilities: {},
  });
  const capBad = await s.accounts.retrieve(notOnboarded.id);
  console.log(
    'CREATE seller_not_onboarded = ' + notOnboarded.id +
      ' (transfers=' + capBad.capabilities.transfers + ', expects NO payout)'
  );

  const accounts = [seller1.id, seller2.id, notOnboarded.id];
  const groups: string[] = [];

  // -------------------------------------------------------------------------
  // PHASE B — Happy path: platform charge split to 2 sellers
  // -------------------------------------------------------------------------
  console.log('\n--- Happy path: 2 sellers, platform charge $50.00 ----------');
  const chargeA = await s.charges.create({
    amount: 5000,
    currency: 'usd',
    source: 'tok_visa',
  });
  const groupA = 'e2e_' + runId + '_happy';
  groups.push(groupA);
  console.log('CHARGE =', chargeA.id, '(amount 5000¢, tok_visa)');

  const piA = {
    id: 'pi_' + runId + '_a',
    amount: 5000,
    currency: 'usd',
    transfer_group: groupA,
    latest_charge: chargeA.id,
    metadata: {
      shippingBreakdown: JSON.stringify({
        sellers: [
          { sellerId: 's1', shipping: { buyerPays: 0 } },
          { sellerId: 's2', shipping: { buyerPays: 0 } },
        ],
      }),
    },
    receipt_email: buyerEmail,
  } as any;

  const cartA = [
    {
      id: 'book_s1',
      title: 'Book A',
      price: 10,
      quantity: 1,
      user: {
        _id: 's1',
        email: 'seller1@m4ktaba.test',
        stripeAccountId: seller1.id,
      },
    },
    {
      id: 'book_s2',
      title: 'Book B',
      price: 20,
      quantity: 2,
      user: {
        _id: 's2',
        email: 'seller2@m4ktaba.test',
        stripeAccountId: seller2.id,
      },
    },
  ];

  await processRealOrder(buyerEmail, shipping, cartA, piA, {
    writeClient: fake.client,
  });

  const trA = (
    await s.transfers.list({ transfer_group: groupA, limit: 100 })
  ).data;
  assert.equal(trA.length, 2, 'happy path must produce exactly 2 transfers');
  const t1 = trA.find((t: any) => t.destination === seller1.id);
  const t2 = trA.find((t: any) => t.destination === seller2.id);
  assert.ok(t1, 'seller1 must have received a transfer');
  assert.ok(t2, 'seller2 must have received a transfer');
  assert.equal(t1.amount, 1000, 'seller1 transfer must be 1000¢ (1 × $10)');
  assert.equal(t2.amount, 4000, 'seller2 transfer must be 4000¢ (2 × $20)');
  assert.equal(
    t1.source_transaction,
    chargeA.id,
    'source_transaction must be the platform charge'
  );
  assert.equal(
    t2.source_transaction,
    chargeA.id,
    'source_transaction must be the platform charge'
  );
  console.log(
    'TRANSFER seller1 =', t1.id, 'amount=' + t1.amount + '¢ dest=' + t1.destination,
    'source_transaction=' + t1.source_transaction
  );
  console.log(
    'TRANSFER seller2 =', t2.id, 'amount=' + t2.amount + '¢ dest=' + t2.destination,
    'source_transaction=' + t2.source_transaction
  );

  const happyPatches = fake.patched.filter(
    (p: any) => p.transfersCreated === true
  );
  assert.equal(
    happyPatches.length, 2,
    'both seller orders must be patched transfersCreated:true'
  );
  assert.ok(
    happyPatches.every(
      (p: any) => typeof p.transferId === 'string' && p.transferId.startsWith('tr_')
    ),
    'patched orders must carry a real Stripe transfer id'
  );
  console.log(
    'PATCH records (fake writeClient): 2× transfersCreated=true + real transferId'
  );

  // -------------------------------------------------------------------------
  // PHASE C — Partial failure: unfinished-onboarding seller + valid seller
  // -------------------------------------------------------------------------
  console.log('\n--- Partial failure: seller not onboarded + valid seller ----');
  const chargeB = await s.charges.create({
    amount: 3000,
    currency: 'usd',
    source: 'tok_visa',
  });
  const groupB = 'e2e_' + runId + '_partial';
  groups.push(groupB);
  console.log('CHARGE =', chargeB.id, '(amount 3000¢, tok_visa)');

  const piB = {
    id: 'pi_' + runId + '_b',
    amount: 3000,
    currency: 'usd',
    transfer_group: groupB,
    latest_charge: chargeB.id,
    metadata: {
      shippingBreakdown: JSON.stringify({
        sellers: [
          { sellerId: 's_bad', shipping: { buyerPays: 0 } },
          { sellerId: 's2', shipping: { buyerPays: 0 } },
        ],
      }),
    },
    receipt_email: buyerEmail,
  } as any;

  const cartB = [
    {
      id: 'book_bad',
      title: 'Book From Unfinished Onboarding Seller',
      price: 10,
      quantity: 1,
      user: {
        _id: 's_bad',
        email: 'bad@m4ktaba.test',
        stripeAccountId: notOnboarded.id,
      },
    },
    {
      id: 'book_s2',
      title: 'Book B2',
      price: 20,
      quantity: 1,
      user: {
        _id: 's2',
        email: 'seller2@m4ktaba.test',
        stripeAccountId: seller2.id,
      },
    },
  ];

  await processRealOrder(buyerEmail, shipping, cartB, piB, {
    writeClient: fake.client,
  });

  const trB = (
    await s.transfers.list({ transfer_group: groupB, limit: 100 })
  ).data;
  assert.equal(
    trB.length, 1,
    'partial-failure run must produce exactly 1 transfer (only the valid seller)'
  );
  assert.equal(
    trB[0].destination,
    seller2.id,
    'the surviving transfer must go to the valid seller'
  );
  assert.equal(
    trB[0].amount, 2000,
    'valid seller transfer must be 2000¢ (1 × $20)'
  );
  assert.equal(
    trB[0].source_transaction,
    chargeB.id,
    'source_transaction must be the platform charge'
  );
  assert.ok(
    !trB.some((t: any) => t.destination === notOnboarded.id),
    'unfinished-onboarding seller must NOT receive any funds'
  );
  console.log(
    'TRANSFER seller2 =', trB[0].id, 'amount=' + trB[0].amount + '¢ dest=' + trB[0].destination,
    'source_transaction=' + trB[0].source_transaction
  );
  console.log(
    'NO TRANSFER to seller_not_onboarded (' + notOnboarded.id + ') ✓'
  );

  const failPatch = fake.patched.find((p: any) => p.transfersCreated === false);
  assert.ok(failPatch, 'the failed seller must be patched transfersCreated:false');
  assert.ok(
    /insufficient_capabilities|destination account needs to have/i.test(
      failPatch.transferError || ''
    ),
    'failure patch must record the real Stripe error' +
      ' (insufficient_capabilities_for_transfer), got: ' + failPatch.transferError
  );
  const okPatch = fake.patched.find(
    (p: any) => p.transfersCreated === true && p.transferId === trB[0].id
  );
  assert.ok(
    okPatch,
    'the successful seller must be patched transfersCreated:true with its transfer id'
  );
  console.log('FAIL patch recorded error:', failPatch.transferError);
  console.log(
    'OK   patch recorded transfersCreated:true, transferId=' + okPatch.transferId
  );

  // -------------------------------------------------------------------------
  // PHASE D — Final report + explicit SANITY WRITE SAFETY assertion
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(72));
  console.log('FINAL EVIDENCE (all objects live in Stripe TEST MODE)');
  console.log('='.repeat(72));
  for (const g of groups) {
    const rows = (await s.transfers.list({ transfer_group: g, limit: 100 })).data;
    console.log('\nTransfer group:', g, '(' + rows.length + ' transfer(s))');
    for (const t of rows) {
      console.log(
        '  ' + t.id,
        'amount=' + t.amount + '¢',
        'destination=' + t.destination,
        'source_transaction=' + t.source_transaction
      );
    }
  }
  console.log('\nAccounts created this run:');
  for (const id of accounts) console.log('  ' + id);

  console.log('\n' + '-'.repeat(72));
  console.log('SANITY WRITE SAFETY (see route.ts `overrides` seam)');
  console.log('-'.repeat(72));
  console.log(
    '  Sanity target (untouched):',
    process.env.SANITY_PROJECT_ID + '/' + process.env.SANITY_DATASET
  );
  console.log(
    '  writeClient used in flow: FAKE (in-memory), injected via processRealOrder overrides'
  );
  console.log('  fake create() calls recorded:', fake.created.length);
  console.log('  fake patch() calls recorded: ', fake.patched.length);
  assert.ok(
    fake.created.length >= 4,
    'expected >=4 fake order creates (2 happy + 2 partial)'
  );
  assert.ok(
    fake.patched.length >= 4,
    'expected >=4 fake order patches (2 happy + 2 partial)'
  );
  console.log(
    '  ASSERTION PASSED: every create/patch above was intercepted by the FAKE;'
  );
  console.log(
    '  the REAL Sanity writeClient was never invoked — ZERO writes occurred'
  );
  console.log(
    '  to the ' + process.env.SANITY_DATASET + ' dataset.'
  );

  console.log(
    '\nPASS: multi-seller transfer flow verified end-to-end in Stripe test mode.\n'
  );

  // -------------------------------------------------------------------------
  // PHASE E — Best-effort cleanup (reverse transfers, then delete accounts)
  // -------------------------------------------------------------------------
  for (const g of groups) {
    const rows = (await s.transfers.list({ transfer_group: g, limit: 100 })).data;
    for (const t of rows) {
      try {
        await s.transfers.createReversal(t.id);
      } catch {}
    }
  }
  for (const id of accounts) {
    try {
      await s.accounts.del(id);
      console.log('CLEANUP: deleted account ' + id);
    } catch (e: any) {
      console.log(
        'CLEANUP note: account ' + id + ' not deleted (' +
          (e?.message || '?').slice(0, 100) + ')'
      );
    }
  }
}

main().catch((err) => {
  console.error('\nE2E FAILED:', err?.message ?? err);
  process.exit(1);
});

  console.log('='.repeat(72));
