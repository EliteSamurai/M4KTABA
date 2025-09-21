import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 DEBUG SHIPPING FLOW - Starting comprehensive test...');
    
    // Test 1: Session status
    const session = await getServerSession(authOptions);
    console.log('🔍 Session status:', {
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?._id) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session',
        step: 'session_check'
      });
    }

    // Test 2: Get recent orders for this seller
    const orders = await (readClient as any).fetch(
      `*[_type == "order" && defined(cart) && count(cart) > 0] | order(_createdAt desc) [0...5] {
        _id,
        status,
        userEmail,
        _createdAt,
        cart[]{
          title,
          quantity,
          price,
          user->{_id, email}
        }
      }`
    );

    console.log('🔍 Recent orders found:', orders.length);

    // Test 3: Check if any orders have items from this seller
    const sellerOrders = orders.filter((order: any) => 
      order.cart?.some((item: any) => item.user?._id === session.user._id)
    );

    console.log('🔍 Orders with items from this seller:', sellerOrders.length);

    if (sellerOrders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No orders found with items from this seller',
        step: 'order_check',
        sellerId: session.user._id
      });
    }

    // Test 4: Get the most recent order with items from this seller
    const testOrder = sellerOrders[0];
    console.log('🔍 Test order:', {
      orderId: testOrder._id,
      status: testOrder.status,
      userEmail: testOrder.userEmail,
      itemCount: testOrder.cart?.length || 0
    });

    // Test 5: Check email configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    console.log('🔍 Email configuration:', {
      hasHost: !!smtpHost,
      hasPort: !!smtpPort,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    });

    return NextResponse.json({
      success: true,
      step: 'comprehensive_check',
      session: {
        hasSession: !!session,
        userId: session.user._id,
        userEmail: session.user.email,
      },
      orders: {
        total: orders.length,
        sellerOrders: sellerOrders.length,
        testOrder: {
          id: testOrder._id,
          status: testOrder.status,
          userEmail: testOrder.userEmail,
          itemCount: testOrder.cart?.length || 0
        }
      },
      emailConfig: {
        hasHost: !!smtpHost,
        hasPort: !!smtpPort,
        hasUser: !!smtpUser,
        hasPass: !!smtpPass,
      }
    });

  } catch (error) {
    console.error('❌ Debug shipping flow error:', error);
    return NextResponse.json(
      { error: 'Failed to debug shipping flow', details: error },
      { status: 500 }
    );
  }
}
