import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 TEST ORDER STATUS ENDPOINT - Starting test...');
    
    // Test session
    const session = await getServerSession(authOptions);
    console.log('🔍 Session test:', {
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
    });

    // Test CSRF
    const csrfHeader = req.headers.get('x-csrf-token');
    console.log('🔍 CSRF test:', {
      hasCsrfHeader: !!csrfHeader,
      csrfValue: csrfHeader?.substring(0, 10) + '...',
    });

    // Test request body
    const body = await req.json();
    console.log('🔍 Request body test:', {
      hasBody: !!body,
      bodyKeys: Object.keys(body),
      status: body.status,
      orderId: body.orderId,
    });

    return NextResponse.json({
      success: true,
      message: 'Order status endpoint test successful',
      session: {
        hasSession: !!session,
        userId: session?.user?._id,
        userEmail: session?.user?.email,
      },
      csrf: {
        hasCsrfHeader: !!csrfHeader,
        csrfValue: csrfHeader?.substring(0, 10) + '...',
      },
      body: {
        hasBody: !!body,
        bodyKeys: Object.keys(body),
        status: body.status,
        orderId: body.orderId,
      }
    });

  } catch (error) {
    console.error('❌ Test order status endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to test order status endpoint', details: error },
      { status: 500 }
    );
  }
}
