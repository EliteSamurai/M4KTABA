import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    console.log('🔍 CSRF token endpoint called');

    const cookieStore = await cookies();
    const existingToken = cookieStore.get('csrf_token');

    console.log('🔍 Existing CSRF token:', {
      exists: !!existingToken,
      value: existingToken?.value?.substring(0, 10) + '...',
    });

    if (existingToken && existingToken.value !== 'seed') {
      console.log('✅ Returning existing CSRF token');
      return NextResponse.json({
        success: true,
        csrfToken: existingToken.value,
      });
    }

    // Generate a new token if none exists or if it's 'seed'
    const newToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    console.log(
      '🔄 Generating new CSRF token:',
      newToken.substring(0, 10) + '...'
    );

    const response = NextResponse.json({
      success: true,
      csrfToken: newToken,
    });

    // Set the cookie
    response.cookies.set('csrf_token', newToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ CSRF token endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get CSRF token' },
      { status: 500 }
    );
  }
}
