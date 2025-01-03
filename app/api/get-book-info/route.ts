import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userQuery } = await req.json();
    if (!userQuery) {
      return NextResponse.json({ error: "Missing userQuery" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    interface CustomContentBlock {
      type: string;
      text?: string; // Define `text` as optional
    }

    interface CustomAnthropicResponse {
      content: CustomContentBlock[];
    }

    const msg = (await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      temperature: 0,
      system:
        "You are an expert in Islamic literature. When provided with a book title, respond as follows: '1. Provide the author's name, including the Hijri year of death if available. 2. If the author is unknown, state 'Author details not available.' 3. The location the author was known for, if applicable. 4. A brief description of the book.' Ensure the output is concise, well-structured, and thoroughly verified. Don't include words like likely, it shows you're not sure.",
      messages: [
        {
          role: "user",
          content: `Provide the following details for the book titled "${userQuery}":
1. The author's name (include Hijri year of death if applicable; omit this detail if the author is still alive).
2. If the author is unknown, explicitly state: 'Author details not available.'
3. The location the author was known for, if applicable.
4. A brief verified description of the book.`,
        },
      ],
    })) as unknown as CustomAnthropicResponse;
    return NextResponse.json({
      response: msg.content[0]?.text || "No data found.",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data." },
      { status: 500 }
    );
  }
}
