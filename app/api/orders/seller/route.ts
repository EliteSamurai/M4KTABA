import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';

export async function GET() {
  console.log('🚀 SELLER ORDERS API CALLED');
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    console.log('❌ No session or user ID found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`🔍 Fetching seller orders for user: ${session.user._id}`);
    console.log(`🔍 User email: ${session.user.email}`);

    // Fetch ALL orders first to debug
    const allOrders = await (readClient as any).fetch(
      `*[_type == "order"] | order(_createdAt desc) {
        _id,
        status,
        cart[]{
          _key,
          id,
          title,
          quantity,
          price,
          user{
            _id,
            email
          }
        },
        _createdAt
      }`
    );

    console.log(`📦 All orders in database: ${allOrders.length}`);
    console.log(`🔍 Current user details:`, {
      id: session.user._id,
      email: session.user.email,
    });

    allOrders.forEach((order: any, index: number) => {
      console.log(`📦 Order ${index + 1}:`, {
        _id: order._id,
        cartLength: order.cart?.length,
        cartSellers: order.cart?.map((item: any) => ({
          sellerId: item.user?._id,
          sellerEmail: item.user?.email,
        })),
      });
    });

    // Fetch orders where the current user is a seller
    // Use a different approach - fetch all orders and filter in JavaScript
    console.log(`🔍 Fetching all orders and filtering by seller...`);

    const allOrdersWithDetails = await (readClient as any).fetch(
      `*[_type == "order"] | order(_createdAt desc) {
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

    console.log(
      `📦 Fetched ${allOrdersWithDetails.length} orders for filtering`
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
        if (isSeller) {
          console.log(`🔍 Found seller item in order ${order._id}:`, {
            itemId: item.id,
            itemTitle: item.title,
            sellerId: item.user?._id,
            sellerEmail: item.user?.email,
            currentUserId: session.user._id,
            currentUserEmail: session.user.email,
          });
        }
        return isSeller;
      });
      return hasSellerItems;
    });

    console.log(`📦 Filtered to ${orders.length} seller orders`);

    console.log(`📦 Raw orders found: ${orders.length}`);
    console.log(
      `📦 First order structure:`,
      orders[0]
        ? {
            _id: orders[0]._id,
            cartLength: orders[0].cart?.length,
            firstCartItem: orders[0].cart?.[0]
              ? {
                  id: orders[0].cart[0].id,
                  title: orders[0].cart[0].title,
                  sellerId: orders[0].cart[0].user?._id,
                  sellerEmail: orders[0].cart[0].user?.email,
                }
              : null,
          }
        : 'No orders'
    );

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

    console.log(
      `📦 Found ${filteredOrders.length} orders for seller ${session.user._id}`
    );

    return NextResponse.json({ orders: filteredOrders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller orders' },
      { status: 500 }
    );
  }
}
