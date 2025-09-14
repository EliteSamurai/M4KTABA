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
    const body = await req.json();
    OrderCreateSchema.safeParse({
      items: body.cart,
      shippingDetails: body.shippingDetails,
    });
    const { cart, status, userId, paymentId } = body;

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
      cart,
    };

    const response = await (writeClient as any).create(orderDocument);

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
    const orders = await (readClient as any).fetch(
      `*[_type == "order" && _id in *[_id == $userId].orderHistory[]._ref] | order(_createdAt desc) {
          _id,
          status,
          cart,
          paymentId,
          _createdAt
        }`,
      { userId: session.user._id }
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
