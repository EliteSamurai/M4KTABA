import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch("https://apis-sandbox.fedex.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.FEDEX_CLIENT_ID!,
        client_secret: process.env.FEDEX_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch FedEx token");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
