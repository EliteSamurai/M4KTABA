"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import BookProductCard from "./ProductCard";

interface AllBooksClientProps {
  initialBooks: any[];
  totalBooks: number;
  // categories: { title: string; _id: string }[];
}

export default function AllBooksClient({
  initialBooks,
  // categories,
}: AllBooksClientProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Implement search functionality
    setLoading(false);
  };

  const handleSort = async (value: string) => {
    setSortBy(value);
    setLoading(true);
    // Implement sort functionality
    setLoading(false);
  };

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    setLoading(true);
    // Implement category filter
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
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

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Open filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your search with these filters
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {/* {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.title}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                </div>
                {/* Add more filters as needed */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Separator />

      {/* Books Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {initialBooks.map((book) => (
            <BookProductCard
              key={book._id}
              id={book._id}
              title={book.title}
              user={book.user || "Unknown"}
              price={book.price}
              image={book.image}
            />
          ))}
        </div>
      )}
    </div>
  );
}
