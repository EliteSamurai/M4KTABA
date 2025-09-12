"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import BookProductCard from "./ProductCard";
import { urlFor } from "@/utils/imageUrlBuilder";

interface AllBooksClientProps {
  initialBooks: any[];
  totalBooks: number;
}

export default function AllBooksClient({
  initialBooks,
  totalBooks,
}: AllBooksClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(initialBooks.length);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-all-books?offset=${offset}&limit=10`);
      const { books } = await res.json();
      
      // Filter out any books that already exist to prevent duplicates
      setBooks((prev) => {
        const existingIds = new Set(prev.map(book => book._id));
        const newBooks = books.filter((book: any) => !existingIds.has(book._id));
        return [...prev, ...newBooks];
      });
      
      setOffset((prev) => prev + books.length);
    } catch (err) {
      console.error("Failed to load more books", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex w-full items-center space-x-2 sm:w-[300px]"
      >
        <Input
          type="search"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button type="submit" size="icon">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>

      <Separator />

      {/* Books Grid */}
      {books.length === 0 && !loading ? (
        <EmptyState
          title="No results"
          description="We couldn't find any books matching your criteria. Try adjusting your filters."
          secondaryAction={{ label: "Clear search", onClick: () => setSearchQuery("") }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book, index) => (
            <BookProductCard
              key={`${book._id}-${index}`}
              id={book._id}
              title={book.title}
              user={book.user || "Unknown"}
              price={book.price}
              image={urlFor(book.image)}
            />
          ))}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
        </div>
      )}

      {/* Load More Button */}
      {books.length < totalBooks && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
