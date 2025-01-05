import { NextRequest, NextResponse } from "next/server";
import { readClient } from "@/studio-m4ktaba/client"; // Adjust the path as needed

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const books = await readClient.fetch(
      `*[_type == "book"] | order(_createdAt desc) [${offset}...${offset + limit}] {
        _id,
        title,
        user->{_id, email, location, stripeAccountId}, // Ensure data consistency
        price,
        "image": photos[0].asset._ref
      }`
    );

    const total = await readClient.fetch(`count(*[_type == "book"])`);
    return NextResponse.json({ books, total });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
