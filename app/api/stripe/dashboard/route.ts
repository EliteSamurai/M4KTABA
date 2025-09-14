import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(req: NextRequest) {
  try {
    const stripeAccountId = req.nextUrl.searchParams.get('stripeAccountId');

    if (!stripeAccountId) {
      return NextResponse.json(
        { message: 'Stripe account ID is required' },
        { status: 400 }
      );
    }

    // Retrieve balance, charges, and payouts from the Connect Account
    const [balance, charges, payouts] = await Promise.all([
      (stripe as any).balance.retrieve({ stripeAccount: stripeAccountId }),
      (stripe as any).charges.list(
        { limit: 10 }, // Fetch the most recent 10 charges
        { stripeAccount: stripeAccountId }
      ),
      (stripe as any).payouts.list(
        { limit: 5 }, // Fetch the most recent 5 payouts
        { stripeAccount: stripeAccountId }
      ),
    ]);

    console.log('Balance Response:', balance);
    console.log('Charges Response:', charges);
    console.log('Payouts Response:', payouts);

    // Format transactions
    const transactions = charges.data.map((charge: any) => ({
      id: charge.id,
      amount: charge.amount,
      status: charge.status,
      created: charge.created,
      currency: charge.currency,
      customer: {
        name: charge.billing_details.name || 'Anonymous',
        email: charge.billing_details.email || 'N/A',
      },
      payment_method: charge.payment_method_details?.type || 'unknown',
    }));

    // Format payouts
    const formattedPayouts = payouts.data.map((payout: any) => ({
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      arrival_date: payout.arrival_date,
      currency: payout.currency,
    }));

    // Return response with balance, transactions, and payouts
    return NextResponse.json({
      balance: {
        available: balance.available[0]?.amount || 0,
        pending: balance.pending[0]?.amount || 0,
        currency: balance.available[0]?.currency || 'usd',
      },
      transactions,
      payouts: formattedPayouts,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        'Error fetching Stripe account data:',
        error.message || error
      );
      return NextResponse.json(
        { message: 'Failed to fetch Stripe dashboard data' },
        { status: 500 }
      );
    }
  }
}
