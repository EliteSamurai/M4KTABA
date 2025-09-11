"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the ImprovedSellingProcess to avoid SSR issues
const ImprovedSellingProcess = dynamic(
  () => import("./ImprovedSellingProcess"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    ),
  }
);

export default function SellingProcessWrapper() {
  return <ImprovedSellingProcess />;
}
