import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf';

export async function GET() {
  try {
    const token = await getCsrfToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

