import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { CartItem } from '@/types/shipping-types';
import { calculateMultiSellerShipping } from '@/lib/shipping-smart';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cart, buyerCountry } = await req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Cart is empty or invalid' },
        { status: 400 }
      );
    }

    // Validate each item in the cart
    const validationResults = await Promise.all(
      cart.map(async (item: CartItem) => {
        try {
          // Fetch the actual product from database
          const product = await (readClient as any).fetch(
            `*[_type == "book" && _id == $id][0]{
              _id,
              title,
              price,
              available,
              "user": user->{
                _id,
                email,
                stripeAccountId,
                location
              }
            }`,
            { id: item.id }
          );

          if (!product) {
            return {
              id: item.id,
              valid: false,
              error: 'Product not found',
            };
          }

          if (!product.available) {
            return {
              id: item.id,
              valid: false,
              error: 'Product no longer available',
            };
          }

          // Check if price matches
          if (Math.abs(product.price - item.price) > 0.01) {
            return {
              id: item.id,
              valid: false,
              error: 'Price has changed',
              oldPrice: item.price,
              newPrice: product.price,
            };
          }

          // Verify seller exists
          if (!product.user || !product.user._id) {
            return {
              id: item.id,
              valid: false,
              error: 'Seller information missing',
            };
          }

          return {
            id: item.id,
            valid: true,
            product: {
              ...product,
              quantity: item.quantity,
            },
          };
        } catch (error) {
          console.error(`Error validating item ${item.id}:`, error);
          return {
            id: item.id,
            valid: false,
            error: 'Validation failed',
          };
        }
      })
    );

    // Check if all items are valid
    const invalidItems = validationResults.filter(result => !result.valid);
    
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          errors: invalidItems,
          message: 'Some items in your cart are no longer valid',
        },
        { status: 400 }
      );
    }

    // Return validated cart with correct data
    const validatedCart = validationResults
      .filter(result => result.valid)
      .map(result => result.product);

    // Calculate shipping based on buyer and seller countries
    const country = buyerCountry?.toUpperCase() || session.user.location?.country?.toUpperCase() || 'US';
    const sellerGroups = new Map<string, { items: any[]; country: string }>();
    
    validatedCart.forEach((item: any) => {
      const sellerId = item.user?._id || 'unknown';
      const sellerCountry = item.user?.location?.country?.toUpperCase() || 'US';
      
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, { items: [], country: sellerCountry });
      }
      sellerGroups.get(sellerId)!.items.push(item);
    });

    const sellers = Array.from(sellerGroups.entries()).map(([sellerId, data]) => ({
      sellerId,
      sellerCountry: data.country,
      itemCount: data.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }));

    const shippingCalculation = calculateMultiSellerShipping(sellers, country);

    return NextResponse.json({
      valid: true,
      cart: validatedCart,
      shipping: shippingCalculation,
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}

