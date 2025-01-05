import bcrypt from "bcryptjs"; // For hashing and comparing passwords
import { writeClient, readClient } from "@/studio-m4ktaba/client"; // Your configured Sanity client
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map hyphenated keys to camelCase
    const mappedBody = {
      userId: body.userId,
      currentPassword: body["current-password"],
      newPassword: body["new-password"],
      confirmPassword: body["confirm-password"],
    };

    const { userId, currentPassword, newPassword, confirmPassword } =
      mappedBody;

    // Basic validations
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Fetch the user's password from Sanity
    const query = `*[_type == "user" && _id == $userId][0]`;
    const user = await readClient.fetch(query, { userId });

    if (!user || !user.password) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in Sanity
    await writeClient.patch(userId).set({ password: hashedPassword }).commit();

    return NextResponse.json(
      { message: "Password updated successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
