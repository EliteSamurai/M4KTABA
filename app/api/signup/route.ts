import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { readClient, writeClient } from '@/studio-m4ktaba/client';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  // TODO: Implement rate limiting to prevent brute force attacks
  // Consider using a library like 'express-rate-limit' or similar
  // Recommended: max 5 signup attempts per IP per 15 minutes

  try {
    const body = await req.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if the user already exists in the database
    const existingUser = await (readClient as any).fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    );

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already has an account' },
        { status: 400 }
      );
    }

    // Hash the password and create the new user
    const hashedPassword = await hash(password, 10);

    const newUser = await (writeClient as any).create({
      _type: 'user',
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ userId: newUser._id }, { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
