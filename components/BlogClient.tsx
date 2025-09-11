"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Hash } from "lucide-react";
import ImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Category = { _id: string; title: string };
type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  categories: Category[];
  mainImage?: SanityImageSource;
};

interface BlogClientProps {
  initialPosts: Post[];
}

// Build-safe image URL builder
const urlFor = (source: SanityImageSource) => {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  
  if (projectId && dataset && projectId !== "dummy" && dataset !== "dummy") {
    return ImageUrlBuilder({ projectId, dataset }).image(source);
  }
  return null;
};

// Helper function for date formatting
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
};

export default function BlogClient({ initialPosts }: BlogClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 6;

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/posts?page=${page + 1}&limit=${POSTS_PER_PAGE}`);
      const data = await response.json();
      
      if (data.posts && data.posts.length > 0) {
        setPosts(prev => [...prev, ...data.posts]);
        setPage(prev => prev + 1);
        setHasMore(data.posts.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 pb-32 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
          <p className="text-sm text-muted-foreground">
            Discover our latest articles and insights
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {posts.map((post) => (
          <Card
            key={post._id}
            className="group overflow-hidden transition-colors hover:bg-muted/50"
          >
            <Link href={`/blog/${post.slug.current}`}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                  {post.categories.length > 0 && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {post.categories.map((category) => (
                          <Badge
                            key={category._id}
                            variant="secondary"
                            className="rounded-full px-2 text-xs font-normal"
                          >
                            {category.title}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 pt-0">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2 text-xl group-hover:underline">
                      {post.title}
                    </CardTitle>
                  </div>
                  {post.mainImage && urlFor(post.mainImage) && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                      <Image
                        src={urlFor(post.mainImage)?.width(200).url() ?? ""}
                        alt={post.title}
                        className="object-cover transition-transform group-hover:scale-110"
                        fill
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={loadMorePosts}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Loading..." : "Show More Posts"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            You've reached the end of our blog posts!
          </p>
        </div>
      )}
    </section>
  );
}
