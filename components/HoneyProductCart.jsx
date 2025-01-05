"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import HoneyPortrait from "@/public/HoneyPortrait.png";
import { useState, useEffect } from "react";
import { readClient } from "@/studio-m4ktaba/client";
import { ShoppingCart } from "lucide-react";

export default function HoneyProductCard() {
  const { addToCart, isInCart } = useCart();
  const [seller, setSeller] = useState(null);

  const product = {
    id: "honey-001",
    title: "Raw Sidr Honey",
    price: 47.99,
    image: HoneyPortrait,
    user: {
      _id: "MH7kyac4DmuRU6j51iL0It",
      email: "contact@m4ktaba.com"
    },
  };

  useEffect(() => {
    async function fetchSeller() {
      try {
        const sellerData = await readClient.fetch(
          `*[_type == "user" && _id == $id][0]{
            _id,
            email,
            location
          }`,
          { id: product.user._id }
        );

        if (sellerData) {
          setSeller(sellerData);
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
      }
    }

    fetchSeller();
  }, [product.user._id]);

  return (
    <Card className="group overflow-hidden">
      <Link href="/honey/sidrhoney" className="block">
        <CardHeader className="border-b p-0">
          <div className="flex items-center justify-center aspect-square w-full mx-auto h-96 overflow-hidden">
            <Image
              src={product.image}
              alt={product.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              width={200}
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 p-4">
          <CardTitle className="line-clamp-1">{product.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge variant="secondary">Premium</Badge>
            <span>By M4KTABA</span>
          </CardDescription>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-2xl font-bold">${product.price}</span>
          <Button
            className="w-full max-w-[200px]"
            variant={isInCart(product.id) ? "secondary" : "default"}
            onClick={() =>
              !isInCart(product.id) &&
              addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                quantity: 1,
                user: seller,
              })
            }
            disabled={isInCart(product.id)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isInCart(product.id) ? "In Cart" : "Add to Cart"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
