import { BookOpen, Search } from "lucide-react";
import { readClient } from "@/studio-m4ktaba/client";
import AllBooksClient from "@/components/AllBooksClient";
import { Book } from "@/types/shipping-types";
import { SearchQuerySchema } from "@/lib/validation";
import { notFound } from "next/navigation";

export const revalidate = 60;

async function fetchInitialBooks(limit: number = 10) {
  const books = await readClient.fetch(
    `*[_type == "book" && quantity > 0] | order(_createdAt desc) [0...${limit}] {
      _id,
      title,
      "user": user->{_id, email, location, stripeAccountId}, 
      price,
      "image": photos[0].asset._ref,
      selectedCategory->{ title },
    _createdAt
    }`
  );

  const [total, categories] = await Promise.all([
    readClient.fetch(`count(*[_type == "book"])`),
    readClient.fetch(`*[_type == "category"] { title, _id }`),
  ]);

  return { books, total, categories };
}

export default async function AllBooksPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const parsed = SearchQuerySchema.safeParse({
    q: typeof searchParams?.q === "string" ? searchParams?.q : undefined,
    author:
      typeof searchParams?.author === "string"
        ? searchParams?.author
        : undefined,
    language:
      typeof searchParams?.language === "string"
        ? searchParams?.language
        : undefined,
    condition:
      typeof searchParams?.condition === "string"
        ? searchParams?.condition
        : undefined,
    price_min:
      typeof searchParams?.price_min === "string"
        ? searchParams?.price_min
        : undefined,
    price_max:
      typeof searchParams?.price_max === "string"
        ? searchParams?.price_max
        : undefined,
    sort:
      typeof searchParams?.sort === "string" ? searchParams?.sort : undefined,
    page:
      typeof searchParams?.page === "string" ? searchParams?.page : undefined,
    limit:
      typeof searchParams?.limit === "string" ? searchParams?.limit : undefined,
  });
  if (!parsed.success) notFound();

  // For SSR simplicity, still use initial fetch; the client will refine via API
  const { books, total, categories } = await fetchInitialBooks();
  const uniqueCategories = new Set(
    books.map((book: Book) => book.selectedCategory?.title)
  );

  return (
    <div className="min-h-screen container mx-auto">
      {/* Header Section */}
      <div>
        <div className="container py-8">
          <div className="grid gap-4 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Browse Our Collection
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover a vast selection of Arabic-Islamic literature
            </p>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-8">
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Books</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{total}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Categories</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{uniqueCategories.size}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">New This Week</p>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {
                  books.filter((b: Book) => {
                    if (!b._createdAt) return false; // Exclude books with undefined _createdAt
                    const createdAtDate = new Date(b._createdAt); // Safely create Date object
                    return (
                      createdAtDate.getTime() >
                      Date.now() - 7 * 24 * 60 * 60 * 1000
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <AllBooksClient
          initialBooks={books}
          totalBooks={total}
          // categories={categories}
        />
      </div>
    </div>
  );
}
