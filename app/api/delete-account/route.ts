import { NextResponse } from "next/server";
import { client } from "@/studio-m4ktaba/client";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "Missing user ID." },
        { status: 400 }
      );
    }

    // Unpublish the document
    await client.delete(userId);

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
