import { NextRequest, NextResponse } from "next/server";
import { client } from "@/studio-m4ktaba/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, excludeBookId } = body;

    if (!category) {
      return NextResponse.json(
        { message: "Category ID is required." },
        { status: 400 }
      );
    }

    const books = await client.fetch(
      `*[_type == "book" && selectedCategory._ref == $category && _id != $excludeBookId]{
          _id,
          title,
          photos,
          price
        }`,
      { category, excludeBookId }
    );

    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error("Error fetching related books:", error);
    return NextResponse.json(
      { message: "Error fetching related books", error },
      { status: 500 }
    );
  }
}
