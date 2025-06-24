import { NextResponse } from "next/server";
import { readClient } from "@/studio-m4ktaba/client";

export async function GET() {
  try {
    const categories = await readClient.fetch(
      `*[_type == "category"]{_id, title}`
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
