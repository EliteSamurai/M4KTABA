import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';

// Attach CSRF token cookie on GET navigations to pages
export function middleware(req: NextRequest) {
  const isPageGet =
    req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
  if (!isPageGet) return NextResponse.next();

  const res = NextResponse.next();
  const existingToken = req.cookies.get('csrf_token');
  
  // Force regenerate token if it's 'seed' or doesn't exist
  if (!existingToken || existingToken.value === 'seed') {
    // Generate a proper CSRF token instead of using 'seed'
    const token = crypto.randomBytes(16).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    console.log('🔄 Regenerated CSRF token (was seed or missing)');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next|api/webhooks).*)'],
};
