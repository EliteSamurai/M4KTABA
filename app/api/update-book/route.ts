import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { readClient, writeClient } from "@/studio-m4ktaba/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, updates } = body;

  try {
    const existing = await readClient.fetch(
      `*[_type == "book" && _id == $bookId][0]{_id, user->{_id, email}, photos}`,
      { bookId }
    );

    if (!existing) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    console.log("Comparing IDs:", {
      existingUserId: existing.user._id,
      sessionUserId: session.user?._id,
      typeExistingUserId: typeof existing.user._id,
      typeSessionUserId: typeof session.user?._id,
    });

    if (existing.user._id !== session.user?._id) {
      console.log("Permission denied:", {
        bookUserId: existing.user._id,
        sessionUserId: session.user?._id,
        bookUserEmail: existing.user.email,
        sessionUserEmail: session.user?.email,
      });
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Ensure photos have _key property
    const photosWithKeys =
      existing.photos?.map((photo: any, index: number) => ({
        ...photo,
        _key: photo._key || `photo-${index}-${Date.now()}`,
      })) || [];

    await writeClient
      .patch(bookId)
      .set({
        title: updates.title,
        author: updates.author,
        description: updates.description,
        price: updates.price,
        quantity: updates.quantity,
        selectedCondition: updates.selectedCondition,
        selectedCategory: { _type: "reference", _ref: updates.category },
        photos: photosWithKeys,
      })
      .commit();

    return NextResponse.json({ message: "Updated" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
