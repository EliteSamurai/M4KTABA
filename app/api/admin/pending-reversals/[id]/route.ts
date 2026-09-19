import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { createTransferReversal } from '@/lib/stripe';
import { makeKey, begin, commit, fail } from '@/lib/idempotency';
import { verifyCsrf } from '@/lib/csrf';
import { notifySlack } from '@/lib/notify';

/**
 * POST /api/admin/pending-reversals/[id]
 * Body: { action: 'approve' | 'reject' }
 *
 * Admin-only (getServerSession + ADMIN_EMAIL env check). Approving executes
 * the precomputed transfer reversal (createTransferReversal). Rejecting just
 * marks the pendingReversal rejected. No auto-reversal ever runs from the
 * webhook — this is the only place a reversal is executed (decision B).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = await verifyCsrf();
  if (csrf) return csrf;

  try {
    const session = await getServerSession(authOptions);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || !session?.user?.email || session.user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const reversal = await (readClient as any).fetch(
      `*[_type == "pendingReversal" && _id == $id][0]`,
      { id }
    );
    if (!reversal) {
      return NextResponse.json({ error: 'Pending reversal not found' }, { status: 404 });
    }
    if (reversal.status !== 'pending') {
      return NextResponse.json(
        { error: `Pending reversal already ${reversal.status}`, reversal },
        { status: 409 }
      );
    }

    if (action === 'reject') {
      await (writeClient as any)
        .patch(id)
        .set({ status: 'rejected', reviewedAt: new Date().toISOString() })
        .commit();
      return NextResponse.json({ ok: true, status: 'rejected' });
    }

    // Approve → execute the reversal (idempotent per transfer).
    const reversalKey = makeKey(['phase5', 'pendingReversal', reversal.paymentId, reversal.transferId]);
    const idem = await begin(reversalKey);
    if (idem?.status === 'committed' && idem?.result?.transferReversalId) {
      // Already executed — dedupe.
      await (writeClient as any)
        .patch(id)
        .set({ status: 'executed', executedTransferId: idem.result.transferReversalId, reviewedAt: new Date().toISOString(), executedAt: new Date().toISOString() })
        .commit();
      return NextResponse.json({ ok: true, status: 'executed', alreadyExecuted: true });
    }

    try {
      const reversalRes = await createTransferReversal({
        transferId: reversal.transferId,
        amountCents: reversal.amountCents,
        idempotencyKey: reversalKey,
      });
      await commit(reversalKey, { transferReversalId: reversalRes.id });

      await (writeClient as any)
        .patch(id)
        .set({
          status: 'executed',
          executedTransferId: reversalRes.id,
          reviewedAt: new Date().toISOString(),
          executedAt: new Date().toISOString(),
        })
        .commit();

      // Reflect on the seller order.
      if (reversal.sellerOrderId) {
        await (writeClient as any)
          .patch(reversal.sellerOrderId)
          .set({
            pendingReversalStatus: 'executed',
            reversedTransferIds: [
              { _key: reversal.transferId, transferId: reversal.transferId, reversalId: reversalRes.id, amountCents: reversal.amountCents, executedAt: new Date().toISOString() },
            ],
          })
          .commit();
      }

      return NextResponse.json({
        ok: true,
        status: 'executed',
        reversalId: reversalRes.id,
        amountCents: reversal.amountCents,
      });
    } catch (error: any) {
      // Reversal failed (e.g., insufficient seller balance) → record failure.
      await (writeClient as any)
        .patch(id)
        .set({ status: 'failed', error: error?.message || String(error), reviewedAt: new Date().toISOString() })
        .commit();
      await fail(reversalKey);
      // Human alert: an approved reversal could not execute — needs attention.
      await notifySlack({
        severity: 'critical',
        title: '❌ Reversal Execution FAILED',
        text: `pendingReversal ${id} (transfer ${reversal.transferId}, payment ${reversal.paymentId}) failed to reverse: ${error?.message || String(error)}. Likely insufficient seller balance. Review in Sanity Studio.`,
        footer: 'M4KTABA Payment Flow',
      }).catch(() => {});
      return NextResponse.json(
        { ok: false, error: error?.message || 'Reversal failed', status: 'failed' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Error processing pending reversal:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
