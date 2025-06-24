import { NextRequest, NextResponse } from "next/server";
import { readClient } from "@/studio-m4ktaba/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "4");

    if (!bookId || !categoryId) {
      return NextResponse.json(
        { error: "bookId and categoryId are required" },
        { status: 400 }
      );
    }

    // Fetch related books from the same category, excluding the current book
    const relatedBooks = await readClient.fetch(
      `*[_type == "book" && selectedCategory._ref == $categoryId && _id != $bookId && quantity > 0] | order(_createdAt desc)[0...$limit]{
        _id,
        title,
        price,
        "photos": photos[0]{
          _key,
          asset
        },
        "user": user->{
          _id,
          email
        }
      }`,
      {
        categoryId,
        bookId,
        limit,
      }
    );

    return NextResponse.json({ books: relatedBooks });
  } catch (error) {
    console.error("Error fetching related books:", error);
    return NextResponse.json(
      { error: "Failed to fetch related books" },
      { status: 500 }
    );
  }
}
