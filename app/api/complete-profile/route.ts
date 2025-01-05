import { NextResponse } from "next/server";
import { writeClient } from "@/studio-m4ktaba/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { uploadImageToSanity } from "@/utils/uploadImageToSanity";

function isValidUrl(url: string): boolean {
  try {
    // Try to create a URL object using the input string
    new URL(url);
    return true; // If URL creation is successful, it's a valid URL
  } catch (error) {
    return false; // If an error occurs, it's not a valid URL
  }
}

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

    let sanityImage;
    if (imageSource) {
      if (typeof imageSource === "string") {
        if (imageSource.startsWith("data:image/")) {
          // Handle base64 string
          sanityImage = await uploadImageToSanity(imageSource);
        } else if (isValidUrl(imageSource)) {
          // Handle image URL
          sanityImage = await uploadImageToSanity(imageSource);
        } else {
          console.error("Invalid image source: Not a valid base64 or URL");
        }
      } else {
        console.error("Image source is not a string:", imageSource);
      }
    }

    // Update user profile in Sanity
    const updatedUser = await writeClient
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
