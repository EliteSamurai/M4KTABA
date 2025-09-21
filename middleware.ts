import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';

// Attach CSRF token cookie on GET navigations to pages
export function middleware(req: NextRequest) {
  const isPageGet =
    req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
  if (!isPageGet) return NextResponse.next();

  const res = NextResponse.next();
  const hasToken = req.cookies.get('csrf_token');
  if (!hasToken) {
    // Generate a proper CSRF token instead of using 'seed'
    const token = crypto.randomBytes(16).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next|api/webhooks).*)'],
};
