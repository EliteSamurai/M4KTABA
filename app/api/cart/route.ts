import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { writeClient } from "@/studio-m4ktaba/client";
import { verifyCsrf } from "@/lib/csrf";
import { CartMutationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const csrf = await verifyCsrf();
  if (csrf) return csrf;
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CartMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { cart } = parsed.data;

    await writeClient.patch(session.user._id).set({ cart }).commit();

    return NextResponse.json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}
