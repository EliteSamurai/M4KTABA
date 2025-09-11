"use client";

import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

type UpdateFn = (nextQty: number) => void;

export function useOptimisticQty(itemId: string, initialQty: number) {
  const { updateItemQuantity } = useCart();
  const { toast } = useToast();
  const lastStableQtyRef = useRef<number>(initialQty);
  const inFlightRef = useRef<AbortController | null>(null);

  const applyQty: UpdateFn = (nextQty) => {
    if (nextQty < 1) return;

    const prev = lastStableQtyRef.current;
    updateItemQuantity(itemId, nextQty);

    if (inFlightRef.current) {
      inFlightRef.current.abort();
    }
    const controller = new AbortController();
    inFlightRef.current = controller;

    fetch("/api/cart/qty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, quantity: nextQty }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        lastStableQtyRef.current = nextQty;
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        updateItemQuantity(itemId, prev);
        const retryQty = nextQty;
        toast({
          title: "Update failed",
          description: "Couldn't update quantity. Tap to retry.",
          action: (
            <button
              onClick={() => applyQty(retryQty)}
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm"
            >
              Retry
            </button>
          ) as any,
          variant: "destructive" as any,
        });
      });
  };

  return { applyQty };
}


