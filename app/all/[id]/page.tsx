import { notFound } from "next/navigation";
import { readClient } from "@/studio-m4ktaba/client";
import ProductPageClient from "@/components/ProductPageClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/types/shipping-types";

function ProductPageSkeleton() {
  return (
    <div className="container space-y-8 py-6">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// Fetch function
async function fetchBookData(id: string): Promise<Book> {
  try {
    const book = await readClient.fetch(
      `*[_type == "book" && _id == $id][0]{
        _id,
        title,
        author,
        user->{
          _id,
          email,
          image,
          ratings,
          stripeAccountId
        },
        description,
        price,
        selectedCondition,
        photos,
        quantity,
        selectedCategory->{
          _id,
          title 
        }
      }`,
      { id }
    );

    if (!book) {
      throw new Error("Book not found");
    }

    return book;
  } catch (error) {
    console.error("Error fetching book data:", error);
    throw error;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductContent id={id} />
    </Suspense>
  );
}

async function ProductContent({ id }: { id: string }) {
  try {
    const book = await fetchBookData(id);

    // Check if quantity is greater than 0
    if (book?.quantity === undefined || book.quantity <= 0) {
      return (
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="mb-2 text-2xl font-bold">Out of Stock</h2>
            <p className="text-muted-foreground">
              This product is currently out of stock. Please check back later.
            </p>
          </div>
        </div>
      );
    }

    return <ProductPageClient book={book} />;
  } catch (error) {
    if (error instanceof Error && error.message === "Book not found") {
      return notFound();
    }

    return (
      <div className="container flex min-h-[40vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold">Error Loading Product</h2>
          <p className="text-muted-foreground">
            There was an error loading the product details. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
}
