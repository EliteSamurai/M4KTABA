import { NextResponse } from "next/server";
import { client } from "@/studio-m4ktaba/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { uploadImageToSanity } from "@/utils/uploadImageToSanity";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized: No session found" },
        { status: 401 }
      );
    }

    const { userId, imageBlob, location, bio } = await req.json();

    if (
      !location?.street ||
      !location?.city ||
      !location?.state ||
      !location?.zip ||
      !location?.country
    ) {
      return NextResponse.json(
        { message: "Missing required location fields" },
        { status: 400 }
      );
    }

    const imageSource = imageBlob ?? session?.user.image ?? "";
    const sanityImage = await uploadImageToSanity(imageSource);

    // Update user profile in Sanity
    const updatedUser = await client
      .patch(userId)
      .set({
        image: sanityImage,
        location,
        bio: bio
          ? [
              {
                _key: crypto.randomUUID(),
                _type: "block",
                children: [
                  {
                    _key: crypto.randomUUID(),
                    _type: "span",
                    text: bio,
                  },
                ],
              },
            ]
          : [],
      })
      .commit();

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating profile:", error.message);
    } else {
      console.error("Unknown error occurred:", error);
    }
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
