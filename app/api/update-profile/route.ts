import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "@/studio-m4ktaba/client";
import { v4 as uuidv4 } from "uuid";
import { fileImageSanity } from "@/utils/uploadImageToSanity";
import { verifyCsrf } from "@/lib/csrf";
import { ProfileUpdateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const csrf = verifyCsrf(req);
  if (csrf) return csrf as unknown as NextResponse;
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    return new Response("Missing EasyPost API Key", { status: 500 });
  }
  const formData = await req.formData(); // If using FormData on server
  const bio = formData.get("bio");
  const city = formData.get("city");
  const state = formData.get("state");
  const zip = formData.get("zip");
  const country = formData.get("country");
  const street = formData.get("street");
  const userId = formData.get("userId");
  const imageFile = formData.get("image");

  // Basic validation (form-data)
  if (!street || !city || !state || !zip || !country) {
    throw new Error("Complete address is required.");
  }

  try {
    const response = await fetch("https://api.easypost.com/v2/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        street1: street,
        city,
        state,
        zip,
        country,
        verify: ["delivery"],
      }),
    });

    const verifiedAddress = await response.json();

    if (!verifiedAddress.verifications?.delivery?.success) {
      throw new Error(
        "Address verification failed. Please check your address details."
      );
    }

    let imageReference = null;
    if (imageFile && imageFile instanceof File) {
      imageReference = await fileImageSanity(imageFile);
    }

    // Update user information in Sanity
    if (userId) {
      // Optional schema enforcement for consistency
      const parsed = ProfileUpdateSchema.safeParse({
        location: { street, city, state, zip, country },
      });
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Invalid profile data" },
          { status: 400 }
        );
      }
      await writeClient
        .patch(userId.toString())
        .set({
          bio: bio
            ? [
                {
                  _type: "block",
                  _key: uuidv4(),
                  children: [{ _type: "span", text: bio }],
                },
              ]
            : [],
          location: {
            street: verifiedAddress.street1,
            city: verifiedAddress.city,
            state: verifiedAddress.state,
            zip: verifiedAddress.zip,
            country: verifiedAddress.country,
          },
          image: imageReference,
        })
        .commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }
}
