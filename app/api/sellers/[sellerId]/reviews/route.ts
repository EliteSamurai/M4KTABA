import { client } from "@/studio-m4ktaba/client";

export async function POST(
  req: Request,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { score, review } = await req.json();

    if (typeof score !== "number" || score < 1 || score > 5) {
      return new Response(JSON.stringify({ message: "Invalid score." }), {
        status: 400,
      });
    }

    const seller = await client.fetch(
      `*[_type == "user" && _id == $sellerId][0]`,
      { sellerId: params.sellerId }
    );

    if (!seller) {
      return new Response(JSON.stringify({ message: "Seller not found." }), {
        status: 404,
      });
    }

    const updatedSeller = await client
      .patch(params.sellerId)
      .setIfMissing({ ratings: [] })
      .insert("after", "ratings[-1]", [
        {
          _key: `${Date.now()}-${Math.random()}`,
          score,
          review,
        },
      ])
      .commit();

    return new Response(
      JSON.stringify({
        message: "Review added successfully",
        seller: updatedSeller,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error adding review:", error);
    return new Response(
      JSON.stringify({
        message: "Error adding review",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
