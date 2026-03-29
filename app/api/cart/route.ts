import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import { writeClient } from '@/studio-m4ktaba/client';
import { verifyCsrf } from '@/lib/csrf';
import { CartMutationSchema } from '@/lib/validation';
import { CartItem } from '@/types/shipping-types';

function normalizeCartItem(item: any, index: number): CartItem | null {
  if (!item || typeof item !== 'object') return null;
  if (!item.id || !item.title) return null;
  if (typeof item.price !== 'number' || !Number.isFinite(item.price)) return null;
  if (
    typeof item.quantity !== 'number' ||
    !Number.isFinite(item.quantity) ||
    item.quantity <= 0
  ) {
    return null;
  }

  const normalized: CartItem = {
    _key:
      typeof item._key === 'string' && item._key.trim().length > 0
        ? item._key
        : `cart-${item.id}-${index}-${Date.now()}`,
    id: item.id,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    user:
      item.user && typeof item.user === 'object'
        ? {
            email:
              typeof item.user.email === 'string' ? item.user.email : undefined,
            location:
              item.user.location && typeof item.user.location === 'object'
                ? {
                    street:
                      typeof item.user.location.street === 'string'
                        ? item.user.location.street
                        : undefined,
                    city:
                      typeof item.user.location.city === 'string'
                        ? item.user.location.city
                        : undefined,
                    state:
                      typeof item.user.location.state === 'string'
                        ? item.user.location.state
                        : undefined,
                    zip:
                      typeof item.user.location.zip === 'string'
                        ? item.user.location.zip
                        : undefined,
                    country:
                      typeof item.user.location.country === 'string'
                        ? item.user.location.country
                        : undefined,
                  }
                : undefined,
          }
        : undefined,
  };

  return normalized;
}

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
    const { cart: cartString } = parsed.data;

    // Parse the cart string back to an array for database storage
    let cartArray;
    try {
      cartArray = JSON.parse(cartString);
      if (!Array.isArray(cartArray)) {
        throw new Error('Cart must be an array');
      }
    } catch (error) {
      console.error('Failed to parse cart string:', error);
      return NextResponse.json(
        { error: 'Invalid cart format' },
        { status: 400 }
      );
    }

    const sanitizedCart = cartArray
      .map((item: any, index: number) => normalizeCartItem(item, index))
      .filter(Boolean);

    await (writeClient as any)
      .patch(session.user._id)
      .set({ cart: sanitizedCart })
      .commit();

    return NextResponse.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}
