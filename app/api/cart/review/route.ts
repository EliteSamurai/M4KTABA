import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cartParam = searchParams.get("cart");
    const cart = cartParam ? JSON.parse(cartParam) : [];

    // Simulate drift via query flag for testing
    const simulate = searchParams.get("simulate") === "1";

    const changes: Array<{
      id: string;
      title?: string;
      field: "price" | "quantity";
      oldValue: number;
      newValue: number;
    }> = [];

    const reviewed = cart.map((item: any) => {
      let newPrice = item.price;
      let newQuantity = item.quantity;
      if (simulate) {
        // Example drift: +1 price on first item, clamp quantity to at most 2
        if (changes.length === 0) {
          newPrice = item.price + 1;
          changes.push({ id: item.id, title: item.title, field: "price", oldValue: item.price, newValue: newPrice });
        }
        if (item.quantity > 2) {
          newQuantity = 2;
          changes.push({ id: item.id, title: item.title, field: "quantity", oldValue: item.quantity, newValue: newQuantity });
        }
      }
      return { ...item, price: newPrice, quantity: newQuantity };
    });

    const hasDrift = changes.length > 0;
    return NextResponse.json({ hasDrift, reviewed, changes });
  } catch (e) {
    return NextResponse.json({ hasDrift: false, reviewed: [], changes: [] });
  }
}


