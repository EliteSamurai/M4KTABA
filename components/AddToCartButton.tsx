"use client";

import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import type { User } from "@/types/shipping-types";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  bookId: string;
  isAvailable: boolean;
  bookTitle: string;
  bookPrice: number;
  quantity: number;
  bookUser: User;
}

export default function AddToCartButton({
  bookId,
  isAvailable,
  quantity,
  bookTitle,
  bookPrice,
  bookUser,
}: AddToCartButtonProps) {
  const { cart, addToCart, isInCart } = useCart();

  const isInCart2 = cart.some((item) => item.id === bookId);

  const handleAddToCart = () => {
    if (!isAvailable || isInCart2) return;

    if (!isInCart(bookId)) {
      addToCart({
        id: bookId,
        title: bookTitle,
        price: bookPrice,
        quantity: quantity,
        user: bookUser,
      });
    }
  };  

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!isAvailable || isInCart2}
      size="lg"
      className={cn(
        "w-full transition-all",
        isInCart2 && "bg-green-600 hover:bg-green-700"
      )}
    >
      {isInCart2 ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
