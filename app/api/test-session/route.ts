import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET() {
  try {
    console.log('🔍 Testing session...');

    const session = await getServerSession(authOptions);

    console.log('🔍 Session test result:', {
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
    });

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      userId: session?.user?._id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
    });
  } catch (error) {
    console.error('❌ Session test error:', error);
    return NextResponse.json(
      { error: 'Failed to test session', details: error },
      { status: 500 }
    );
  }
}
