"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, DollarSign, Clock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { event } from "@/lib/fbpixel";

interface SellDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  booksImage?: string;
}

export default function PopupModal({
  open,
  setOpen,
  booksImage = "/placeholder.svg",
}: SellDialogProps) {
  const router = useRouter();

  const features = [
    {
      icon: DollarSign,
      title: "Earn Instantly",
      description: "List 2 books, get $10 — no strings attached",
    },
    {
      icon: Clock,
      title: "Fast & Simple",
      description: "Post your books in under a minute",
    },
    {
      icon: Users,
      title: "Trusted Marketplace",
      description: "Thousands of Islamic book lovers waiting",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative h-48 w-full">
          <Image
            src={booksImage}
            alt="Arabic-Islamic Books"
            fill
            className="object-cover brightness-[0.85]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-center text-2xl font-bold tracking-tight">
            List 2 Books, Get $10 Instantly
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Turn your unused Arabic-Islamic books into easy cash. It only takes
            a minute to start — and we’ll send you $10 when you list 2 books.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <DialogFooter className="flex flex-col gap-2 px-6 py-4 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setOpen(false)}
          >
            Maybe Later
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              event("StartSellingClick");
              router.push("/signup");
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Get $10 — List Your Books
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
