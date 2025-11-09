import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { createPayPalOrder, type PayPalOrderItem } from '@/lib/paypal';
import { CartItem } from '@/types/shipping-types';
import { reportError } from '@/lib/sentry';
import { counter } from '@/lib/metrics';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  try {
    const { cart, shippingDetails, currency = 'USD' } = await req.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please add items before checkout.' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    const subtotal = cart.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid cart total. Please check your items.' },
        { status: 400 }
      );
    }

    if (
      !shippingDetails ||
      !shippingDetails.name ||
      !shippingDetails.street1 ||
      !shippingDetails.city ||
      !shippingDetails.state ||
      !shippingDetails.zip ||
      !shippingDetails.country
    ) {
      return NextResponse.json(
        { error: 'Invalid or incomplete shipping details.' },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No buyer email found in session' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId =
      (shippingDetails?.orderId as string | undefined) ||
      `m4k-${Date.now()}-${session.user._id}`;

    // Convert cart items to PayPal format
    const items: PayPalOrderItem[] = cart.map((item: CartItem) => ({
      name: item.title || 'Book',
      description: item.author ? `by ${item.author}` : undefined,
      quantity: item.quantity.toString(),
      unit_amount: {
        currency_code: currency.toUpperCase(),
        value: item.price.toFixed(2),
      },
    }));

    // Create PayPal order
    const order = await createPayPalOrder({
      items,
      totalAmount: subtotal.toFixed(2),
      currency: currency.toUpperCase(),
      orderId,
      buyerEmail: session.user.email,
      shippingAddress: {
        name: shippingDetails.name,
        address_line_1: shippingDetails.street1,
        address_line_2: shippingDetails.street2,
        admin_area_2: shippingDetails.city,
        admin_area_1: shippingDetails.state,
        postal_code: shippingDetails.zip,
        country_code: shippingDetails.country,
      },
    });

    counter('checkout_paypal_started').inc();

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      approveLink: order.links.find((link) => link.rel === 'approve')?.href,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating PayPal order:', error.message);
      reportError(error, { where: 'paypal-create-order' });

      return NextResponse.json(
        { error: error.message || 'Failed to create PayPal order.' },
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

