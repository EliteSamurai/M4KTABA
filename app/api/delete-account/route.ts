import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { writeClient } from "@/studio-m4ktaba/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID." },
        { status: 400 }
      );
    }

    // Ensure user can only delete their own account
    if (userId !== session.user._id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Unpublish the document
    await writeClient.delete(userId);

    return NextResponse.json(
      { message: "Account deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
