import { NextResponse } from 'next/server';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth/next';
import { verifyCsrf } from '@/lib/csrf';
import { OrderCreateSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const csrf = await verifyCsrf();
  if (csrf) return csrf;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'User email is required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { cart, status, userId, paymentId, shippingDetails } = body;

    console.log('Order API received:', {
      cartLength: cart?.length,
      status,
      userId,
      paymentId,
      hasShippingDetails: !!shippingDetails,
    });

    console.log('First cart item structure:', cart?.[0]);
    console.log('Shipping details:', shippingDetails);

    // Create a simplified cart for validation (remove extra fields)
    const simplifiedCart = cart.map((item: any) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      user: item.user
        ? {
            _id: item.user._id,
            email: item.user.email,
            stripeAccountId: item.user.stripeAccountId,
          }
        : undefined,
    }));

    console.log('Simplified cart for validation:', simplifiedCart[0]);

    // Validate the order data
    const validationResult = OrderCreateSchema.safeParse({
      items: simplifiedCart,
      shippingDetails: shippingDetails || {
        name: 'N/A',
        street1: 'N/A',
        city: 'N/A',
        state: 'N/A',
        zip: 'N/A',
        country: 'N/A',
      },
    });

    if (!validationResult.success) {
      console.error('Order validation failed:', validationResult.error);
      return NextResponse.json(
        {
          message: 'Invalid order data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { message: 'Cart is empty or invalid.' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { message: 'Invalid order status.' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { message: 'User ID is required.' },
        { status: 400 }
      );
    }

    const existingOrder = await (readClient as any).fetch(
      `*[_type == "order" && paymentId == $paymentId][0]`,
      { paymentId }
    );

    if (existingOrder) {
      return NextResponse.json(
        { message: 'Order already exists.', order: existingOrder },
        { status: 200 }
      );
    }

    const orderDocument = {
      _type: 'order',
      status,
      paymentId,
      cart: simplifiedCart, // Use the simplified cart for storage
      userEmail: session.user.email, // Use the real user email from session
      shippingDetails: shippingDetails, // Add shipping details
    };

    console.log('💾 Creating order document:', {
      paymentId: orderDocument.paymentId,
      status: orderDocument.status,
      cartLength: orderDocument.cart?.length,
      userEmail: orderDocument.userEmail,
    });

    const response = await (writeClient as any).create(orderDocument);

    console.log('✅ Order created successfully:', {
      id: response._id,
      paymentId: orderDocument.paymentId,
      status: orderDocument.status,
    });

    for (const cartItem of cart) {
      if (cartItem.id.includes('honey')) {
        continue;
      }

      // Update inventory and unpublish if quantity hits 0
      await (writeClient as any)
        .patch(cartItem.id)
        .dec({ quantity: cartItem.quantity })
        .commit();
    }

    await (writeClient as any)
      .patch(userId)
      .setIfMissing({ orderHistory: [] })
      .insert('after', 'orderHistory[-1]', [
        {
          _type: 'reference',
          _ref: response._id,
          _key: `${userId}-${response._id}-${Date.now()}`,
        },
      ])
      .commit();

    return NextResponse.json(
      {
        message: 'Order saved successfully and added to order history.',
        order: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Optimized query - get orders directly by userEmail instead of complex reference lookup
    const orders = await (readClient as any).fetch(
      `*[_type == "order" && userEmail == $userEmail] | order(_createdAt desc) {
          _id,
          status,
          cart,
          paymentId,
          userEmail,
          shippingDetails,
          _createdAt
        }`,
      { userEmail: session.user.email }
    );

    console.log(
      `📦 Found ${orders.length} buyer orders for ${session.user.email}`
    );
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}
