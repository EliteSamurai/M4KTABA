import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const protectedRoutes = ['/checkout', '/dashboard', '/orders', '/sell'];

// Routes that require complete profile
const profileRequiredRoutes = ['/checkout', '/sell'];

// Public routes that don't require profile completion (users can browse these)
const publicRoutes = ['/', '/all', '/books', '/about', '/help', '/privacy', '/terms', '/blog', '/signup/complete-profile', '/login', '/signup', '/api'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const requiresProfile = profileRequiredRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Get the session token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if profile is complete for authenticated users
  // Redirect to complete-profile if:
  // 1. User is authenticated
  // 2. Profile is not marked as complete OR address is missing/incomplete
  // 3. User is NOT on a public route (allow browsing public content)
  if (token && !isPublicRoute) {
    const location = token.location as Record<string, unknown> | null | undefined;
    
    // Check if location is missing or incomplete
    const hasCompleteAddress = 
      location && 
      typeof location === 'object' &&
      location.street &&
      location.city &&
      location.state &&
      location.zip &&
      location.country;

    // If profile is not complete OR address is incomplete, redirect to complete-profile
    if (!token.profileComplete || !hasCompleteAddress) {
      const profileUrl = new URL('/signup/complete-profile', req.url);
      profileUrl.searchParams.set('userId', token._id as string || '');
      profileUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(profileUrl);
    }
  }

  // Handle CSRF token for page navigation
  const isPageGet =
    req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
  
  if (isPageGet) {
    const res = NextResponse.next();
    const existingToken = req.cookies.get('csrf_token');

    // Force regenerate token if it's 'seed' or doesn't exist
    if (!existingToken || existingToken.value === 'seed') {
      // Generate a simple random token (avoid crypto import in middleware)
      const token =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      res.cookies.set('csrf_token', token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on page routes, not API routes (except specific ones if needed)
  // This prevents unnecessary middleware execution on API endpoints
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
