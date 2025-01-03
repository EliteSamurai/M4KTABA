"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import ItemListingForm from "@/components/itemListingForm"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface BookData {
  title: string
  author: string
  description: string
  price?: number
  condition?: string
  tags?: string[]
  imageUrl?: string
}

function BookDetailsSkeleton() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Author */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Condition */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Photos */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
          </div>
        </div>
        {/* Price & Quantity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Submit Button */}
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export default function SellPage() {
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()

  useEffect(() => {
    let isCancelled = false

    const fetchBookData = async () => {
      setIsLoading(true)
      try {
        const slug = decodeURIComponent(
          Array.isArray(params.slug) ? params.slug.join("/") : params.slug || ""
        )

        if (!slug) {
          throw new Error("Book title is required.")
        }

        const response = await fetch(`/api/get-book-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userQuery: slug }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch book data: ${errorText}`)
        }

        const { response: rawContent } = await response.json()

        const authorMatch = rawContent.match(
          /Author:\s*([^,]+)(?:\s*$$.*?died\s+(\d+.*?)$$)?/i
        )
        const titleMatch = rawContent.match(/The book "(.+?)"/i)
        const descriptionMatch = rawContent.match(/The book ".+?"\s*(.+)/i)

        const parsedData = {
          title: titleMatch?.[1] ?? "Unknown Title",
          author: authorMatch
            ? authorMatch[2]
              ? `${authorMatch[1]} (died ${authorMatch[2]})`
              : authorMatch[1]
            : "Unknown Author",
          description: descriptionMatch
            ? `This book ${descriptionMatch[1]}`
            : "No Description Available",
        }

        if (!isCancelled) {
          setBookData(parsedData)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBookData()

    return () => {
      isCancelled = true
    }
  }, [params.slug])

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <BookDetailsSkeleton />
      </div>
    )
  }

  if (!bookData) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            We couldn&apos;t find any information about this book. Please try
            again with a different title.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <ItemListingForm bookData={bookData} />
    </div>
  )
}

