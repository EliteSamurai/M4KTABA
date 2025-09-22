import { NextRequest, NextResponse } from 'next/server';
import { readClient } from '@/studio-m4ktaba/client';

export async function GET() {
  try {
    console.log('📋 Listing all orders...');

    // Fetch all orders
    const orders = await (readClient as any).fetch(
      `*[_type == "order"] | order(_createdAt desc) {
        _id,
        status,
        userEmail,
        cart[]{
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

    console.log(`📋 Found ${orders.length} orders`);

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map((order: any) => ({
        id: order._id,
        status: order.status,
        userEmail: order.userEmail,
        itemCount: order.cart?.length || 0,
        createdAt: order._createdAt,
        items:
          order.cart?.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            sellerEmail: item.user?.email,
          })) || [],
      })),
    });
  } catch (error) {
    console.error('❌ Error listing orders:', error);
    return NextResponse.json(
      { error: 'Failed to list orders', details: error },
      { status: 500 }
    );
  }
}
