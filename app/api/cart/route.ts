import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import { writeClient } from '@/studio-m4ktaba/client';
import { verifyCsrf } from '@/lib/csrf';
import { CartMutationSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const csrf = await verifyCsrf();
  if (csrf) return csrf;
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('Received cart data:', JSON.stringify(body, null, 2));
    console.log(
      'Cart type:',
      typeof body.cart,
      'Is array:',
      Array.isArray(body.cart)
    );
    console.log('Body structure:', {
      bodyKeys: Object.keys(body),
      hasCart: 'cart' in body,
      cartValue: body.cart,
    });

    const parsed = CartMutationSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Cart validation failed:', parsed.error.flatten());
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { cart } = parsed.data;

    await (writeClient as any).patch(session.user._id).set({ cart }).commit();

    return NextResponse.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}
