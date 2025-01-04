"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import CheckoutButton from "./CheckoutButton";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, getCartTotal, getCartCount } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative w-9 h-9 transition-colors hover:bg-muted"
        >
          <ShoppingCart className="h-5 w-5" />
          {getCartCount() > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0"
            >
              {getCartCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="space-y-2.5">
          <SheetTitle>Cart</SheetTitle>
          <SheetDescription>
            {getCartCount()} {getCartCount() === 1 ? "item" : "items"} in your
            cart
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="mt-6 space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.price} × {item.quantity}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-base font-medium">
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <CheckoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
