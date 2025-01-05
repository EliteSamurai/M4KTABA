import { BookOpen, Search } from "lucide-react";
import { readClient } from "@/studio-m4ktaba/client";
import AllBooksClient from "@/components/AllBooksClient";

export const revalidate = 60;

async function fetchInitialBooks(limit: number = 10) {
  const books = await readClient.fetch(
    `*[_type == "book" && quantity > 0] | order(_createdAt desc) [0...${limit}] {
      _id,
      title,
      "user": user->{_id, email, location, stripeAccountId}, 
      price,
      "image": photos[0].asset._ref,
      categories[]->{ title }
    }`
  );

  const [total, categories] = await Promise.all([
    readClient.fetch(`count(*[_type == "book"])`),
    readClient.fetch(`*[_type == "category"] { title, _id }`),
  ]);

  return { books, total, categories };
}

export default async function AllBooksPage() {
  const { books, total, categories } = await fetchInitialBooks();

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
              <p className="mt-2 text-2xl font-bold">{categories.length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">New This Week</p>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {/* {
                  books.filter(
                    (b: Book) =>
                      new Date(b._createdAt).getTime() >
                      Date.now() - 7 * 24 * 60 * 60 * 1000
                  ).length
                } */}
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
