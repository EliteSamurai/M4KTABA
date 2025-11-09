import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { capturePayPalOrder } from '@/lib/paypal';
import { reportError } from '@/lib/sentry';
import { counter } from '@/lib/metrics';
import { trackConversion, trackGMV } from '@/lib/observability/metrics';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated.' },
        { status: 401 }
      );
    }

    // Capture the PayPal order
    const captureData = await capturePayPalOrder(orderId);

    // Check if capture was successful
    const capture = captureData.purchase_units[0]?.payments?.captures?.[0];

    if (!capture || capture.status !== 'COMPLETED') {
      trackConversion('paypal', false);
      throw new Error('Payment capture was not completed successfully.');
    }

    counter('checkout_paypal_completed').inc();
    
    // Track observability metrics
    trackConversion('paypal', true);
    const amount = parseFloat(capture.amount.value);
    const currency = capture.amount.currency_code;
    trackGMV(amount, currency, 'US'); // TODO: Get region from order metadata

    return NextResponse.json({
      success: true,
      orderId: captureData.id,
      status: captureData.status,
      captureId: capture.id,
      amount: capture.amount,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error capturing PayPal order:', error.message);
      reportError(error, { where: 'paypal-capture-order' });

      return NextResponse.json(
        { error: error.message || 'Failed to capture PayPal payment.' },
        { status: 500 }
      );
    }

    console.error('An unknown error occurred:', error);
    return NextResponse.json(
      { error: 'An unknown error occurred.' },
      { status: 500 }
    );
  }
}

