import { NextRequest, NextResponse } from "next/server";
import { client } from "@/studio-m4ktaba/client"; // Adjust the import path as necessary

export async function GET(req: NextRequest,{ params }: { params: { id: string } }) {
  console.log(params); // Check if params is coming through correctly

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    // Fetch the book data from Sanity by the provided `id`
    const book = await client.fetch('*[_type == "book" && _id == $id][0]', {
      id,
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Return the book data in the response
    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}
