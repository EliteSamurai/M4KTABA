"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QuantitySelectorProps {
  bookId: string;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
}

export default function QuantitySelector({
  bookId,
  quantity,
  onQuantityChange,
}: QuantitySelectorProps) {
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookId !== "honey-001") {
      const fetchAvailability = async () => {
        try {
          const res = await fetch(`/api/check-availability/${bookId}`);
          const data = await res.json();

          if (data.available && data.quantity) {
            setAvailableQuantity(data.quantity);
          } else {
            setAvailableQuantity(0);
          }
        } catch (error) {
          console.error("Error fetching availability:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAvailability();
    } else {
      setAvailableQuantity(999);
      setLoading(false);
    }
  }, [bookId]);

  const increment = () => {
    if (quantity < availableQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-32" />;
  }

  if (availableQuantity <= 1) return null;

  return (
    <div className="inline-flex items-center rounded-md border">
      <Button
        variant="ghost"
        size="icon"
        onClick={decrement}
        disabled={quantity === 1}
        className="h-10 w-10 rounded-none border-r"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex h-10 w-14 items-center justify-center text-center font-medium">
        {quantity}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={increment}
        disabled={quantity >= availableQuantity}
        className="h-10 w-10 rounded-none border-l"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
