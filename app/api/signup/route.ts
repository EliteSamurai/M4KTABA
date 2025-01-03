import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { client } from "@/studio-m4ktaba/client";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists in the database
    const existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    );

    if (existingUser) {
      return NextResponse.json(
        { message: "User already has an account" },
        { status: 400 }
      );
    }

    // Hash the password and create the new user
    const hashedPassword = await hash(password, 10);

    const newUser = await client.create({
      _type: "user",
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ userId: newUser._id }, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
