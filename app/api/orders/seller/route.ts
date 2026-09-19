import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch recent orders (bounded) and filter by the current seller in JS.
    // The 200-cap prevents unbounded growth; a seller's relevant lines are
    // resolved by cart[].user._id/email.
    const allOrdersWithDetails = await (readClient as any).fetch(
      `*[_type == "order"] | order(_createdAt desc)[0...200] {
        _id,
        status,
        cart[]{
          _key,
          id,
          title,
          quantity,
          price,
          shippingStatus,
          refundDetails,
          user{
            _id,
            email,
            name,
            location
          }
        },
        paymentId,
        userEmail,
        shippingDetails,
        _createdAt,
        _updatedAt
      }`
    );

    // Filter orders where current user is a seller
    const orders = allOrdersWithDetails.filter((order: any) => {
      // Buyer-facing combined orders are not fulfillment lines; drop them so
      // sellers never see the same purchase twice (once on the combined order,
      // once on their per-seller fragment).
      if (order.orderKind === 'buyer') return false;
      const hasSellerItems = order.cart.some((item: any) => {
        const isSeller =
          item.user?._id === session.user._id ||
          item.user?.email === session.user.email;
        return isSeller;
      });
      return hasSellerItems;
    });

    // Filter cart items to only show items from the current seller (by ID or email)
    const filteredOrders = orders.map((order: any) => ({
      ...order,
      cart: order.cart.filter(
        (item: any) =>
          item.user?._id === session.user._id ||
          item.user?.email === session.user.email
      ),
      // Calculate total for this seller's items only
      sellerTotal: order.cart
        .filter(
          (item: any) =>
            item.user?._id === session.user._id ||
            item.user?.email === session.user.email
        )
        .reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
    }));

    return NextResponse.json({ orders: filteredOrders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller orders' },
      { status: 500 }
    );
  }
}

