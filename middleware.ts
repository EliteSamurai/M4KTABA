import { NextResponse, NextRequest } from 'next/server';

// Attach CSRF token cookie on GET navigations to pages
export function middleware(req: NextRequest) {
  const isPageGet =
    req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
  if (!isPageGet) return NextResponse.next();

  const res = NextResponse.next();
  const existingToken = req.cookies.get('csrf_token');
  
  // Force regenerate token if it's 'seed' or doesn't exist
  if (!existingToken || existingToken.value === 'seed') {
    // Generate a simple random token (avoid crypto import in middleware)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
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
