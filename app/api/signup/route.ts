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
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { message: 'Invalid request body. Please check your input.' },
        { status: 400 }
      );
    }

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user already exists in the database
    let existingUser;
    try {
      existingUser = await (readClient as any).fetch(
        `*[_type == "user" && email == $email][0]`,
        { email: normalizedEmail }
      );
    } catch (fetchError) {
      console.error('Error checking existing user:', fetchError);
      return NextResponse.json(
        { message: 'Database error. Please try again later.' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already has an account' },
        { status: 400 }
      );
    }

    // Hash the password and create the new user
    let hashedPassword;
    try {
      hashedPassword = await hash(password, 10);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json(
        { message: 'Failed to process password. Please try again.' },
        { status: 500 }
      );
    }

    let newUser;
    try {
      newUser = await (writeClient as any).create({
        _type: 'user',
        email: normalizedEmail,
        password: hashedPassword,
        profileComplete: false, // Ensure new users start with incomplete profile
      });
    } catch (createError) {
      console.error('Error creating user in database:', createError);
      return NextResponse.json(
        { message: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Validate user was created successfully
    if (!newUser || !newUser._id) {
      return NextResponse.json(
        { message: 'Account creation incomplete. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ userId: newUser._id }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
