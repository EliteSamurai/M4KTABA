import { Metadata } from "next";
import Image from "next/image";
import NewHoneyHero from "@/public/IMG_1470.jpg";
import HoneyProductCard from "@/components/HoneyProductCart";

export const metadata: Metadata = {
  title: "Honey | M4KTABA",
  description: "Discover our premium selection of raw Sidr honey from Yemen",
};

export default function HoneyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={NewHoneyHero}
            alt="Sidr Honey"
            priority
            className="h-full w-full object-cover object-bottom"
            fill
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 container mx-auto flex h-full items-center justify-center px-4">
          <div className="max-w-2xl text-center text-white">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Raw Sidr Honey
            </h1>
            <p className="text-lg text-white/90 sm:text-xl">
              Experience the pure, natural sweetness of Yemen's finest honey
            </p>
          </div>
        </div>
      </section>
  
      {/* Products Section */}
      <section className="container mx-auto py-12 md:py-20">
        <div className="mx-auto max-w-md">
          <HoneyProductCard />
        </div>
      </section>
    </div>
  );
  
}
