"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          description: errorData.error || "Subscription failed.",
          variant: "destructive", // Red toast for error
        });
      } else {
        toast({
          description: "You have successfully subscribed!",
          variant: "default",
        });
        setEmail(""); 
      }
    } catch (error) {
      toast({
        description: "An error occurred. Please try again.",
        variant: "destructive", // Red toast for error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-4 max-w-2xl items-center mx-auto">
      <input
        type="email"
        placeholder="Enter your email"
        className="flex-1 border px-4 py-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        onClick={handleSubscribe}
        className="bg-gray-900 text-white px-4 py-2 rounded"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </button>
    </div>
  );
}
