import Image from "next/image";
import Link from "next/link";
import {
  Book,
  Truck,
  BookOpen,
  BadgeDollarSign,
  ArrowRight,
} from "lucide-react";
import HeroImage from "@/public/image (1).jpg";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BookProductCard from "@/components/ProductCard";
import { Book as BookType } from "@/types/shipping-types";
import ModalWrapper from "@/components/ModalWrapper";

async function fetchLatestBooks() {
  const query = `*[_type == "book" && quantity > 0] | order(_createdAt desc) [0...5] {
    _id,
    title,
    price,
    _createdAt,
    user->{
      email
    },
    "image": photos[0].asset->url
  }`;

  const endpoint =
    "https://32kxkt38.api.sanity.io/v2025-02-19/data/query/blog-m4ktaba";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch latest books");
  }

  const { result } = await response.json();

  // Sort again on the client side to ensure correct ordering
  return result
    .sort(
      (a: BookType, b: BookType) =>
        new Date(b._createdAt ?? "").getTime() -
        new Date(a._createdAt ?? "").getTime()
    )
    .slice(0, 5);
}

export default async function Home() {
  const latestBooks = await fetchLatestBooks();

  return (
    <div className="min-h-screen">
      <ModalWrapper />

      {/* Hero Section */}
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <Image
          src={HeroImage}
          alt="Buying & Selling Books"
          priority
          fill
          className="absolute top-0 left-0 w-screen h-full object-cover"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            The eBay for Arabic-Islamic Books
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Discover, buy, and sell your favorite Islamic literature in Arabic.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="hover:bg-primary/90" asChild>
              <Link href="/all">
                Browse Collection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sell">Start Selling</Link>
            </Button>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Features Section */}
      <section className="relative z-20 -mt-4 md:-mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Affordable Books",
                description:
                  "Find lots of books at prices that are easy to afford.",
                icon: BadgeDollarSign,
              },
              {
                title: "Fast & Free Shipping",
                description:
                  "Get your books delivered fast, with free shipping every time.",
                icon: Truck,
              },
              {
                title: "Wide Variety of Books",
                description:
                  "Explore many Islamic books in Arabic on many different topics.",
                icon: BookOpen,
              },
              {
                title: "Sell Your Old Books",
                description:
                  "Sell the books you no longer need and let others enjoy them.",
                icon: Book,
              },
            ].map((feature, index) => (
              <Card key={index} className="border-none shadow-lg ">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Books Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">
                Latest Books
              </h2>
              <p className="text-muted-foreground">
                Discover our most recent additions to the collection
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/all">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Separator className="my-8" />

          {latestBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {latestBooks.map((book: BookType) => (
                <BookProductCard
                  key={book._id}
                  id={book._id}
                  title={book.title}
                  user={book.user || "Unknown"}
                  price={book.price || 0}
                  image={book.image || "/placeholder.svg"}
                  loading={false}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-center text-muted-foreground">
                No books found.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
