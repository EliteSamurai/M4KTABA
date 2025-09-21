import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomBytes(16).toString('hex');
  store.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return token;
}

export async function verifyCsrf(): Promise<NextResponse | null> {
  // Always verify CSRF in all environments
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerStore = await headers();
  const headerToken = headerStore.get(CSRF_HEADER);
  
  console.log('🔍 CSRF Verification:', {
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    cookieToken: cookieToken?.substring(0, 10) + '...',
    headerToken: headerToken?.substring(0, 10) + '...',
    tokensMatch: cookieToken === headerToken,
  });
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.log('❌ CSRF verification failed');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  console.log('✅ CSRF verification passed');
  return null;
}

export async function csrfHeader() {
  const token = await getCsrfToken();
  return { [CSRF_HEADER]: token } as Record<string, string>;
}
