import { NextResponse, NextRequest } from 'next/server';

// Attach CSRF token cookie on GET navigations to pages
export function middleware(req: NextRequest) {
  const isPageGet =
    req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
  if (!isPageGet) return NextResponse.next();

  const res = NextResponse.next();
  const hasToken = req.cookies.get('csrf_token');
  if (!hasToken) {
    // mint a token by setting an empty cookie; lib/csrf.ts will fill when read
    res.cookies.set('csrf_token', 'seed', {
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
