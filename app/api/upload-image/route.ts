import { writeClient } from "@/studio-m4ktaba/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let file: File | null = null;
    let bookId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData request (file upload)
      const formData = await req.formData();
      file = formData.get("file") as File;
      bookId = formData.get("bookId") as string;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded." },
          { status: 400 }
        );
      }

      if (!bookId) {
        return NextResponse.json(
          { error: "Book ID is required." },
          { status: 400 }
        );
      }

      const stream = file.stream() as unknown as NodeJS.ReadableStream;

      // Upload the file as an asset to the media store
      const asset = await writeClient.assets.upload("image", stream, {
        filename: file.name,
        contentType: file.type,
      });

      return NextResponse.json({ asset });
    } else {
      // Handle JSON request (updating photos array)
      const { bookId, photos } = await req.json();

      if (!bookId) {
        return NextResponse.json(
          { error: "Book ID is required." },
          { status: 400 }
        );
      }

      if (!photos || !Array.isArray(photos)) {
        return NextResponse.json(
          { error: "Photos array is required." },
          { status: 400 }
        );
      }

      // Ensure photos have _key property
      const photosWithKeys = photos.map((photo: any, index: number) => ({
        ...photo,
        _key: photo._key || `photo-${index}-${Date.now()}`,
      }));

      // Update the book's photos in Sanity
      const result = await writeClient
        .patch(bookId)
        .set({ photos: photosWithKeys })
        .commit();

      return NextResponse.json({ success: true, result });
    }
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
