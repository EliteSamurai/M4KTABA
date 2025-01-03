import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Hash } from "lucide-react";
import { client } from "@/studio-m4ktaba/client";
import BlogHeroImg from "@/public/islamiclibrary.jpg";
import ImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id,
  title,
  slug,
  publishedAt,
  mainImage,
  categories[]->{
    title,
    _id
  }
}`;

const options = { next: { revalidate: 30 } };

// Memoized image URL builder
const urlFor = (source: SanityImageSource) => {
  return ImageUrlBuilder(client).image(source);
};

// Helper function for date formatting
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

type Category = { _id: string; title: string };
type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  categories: Category[];
  mainImage?: SanityImageSource;
};

const Blog = async () => {
  const posts = await client.fetch<Post[]>(POSTS_QUERY, {}, options);

  return (
    <main className="min-h-screen bg-gradient-to-b">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={BlogHeroImg}
            alt="Arabic-Islamic Books Background"
            className="object-cover object-center brightness-[0.25]"
            priority
            fill
          />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center text-white sm:px-6 lg:px-8">
          <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            M4KTABA Blog: A Treasure Trove for Knowledge Seekers
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-300">
            A blog designed to share benefits from the books of the scholars.
          </p>
          <div className="mt-10">
            <Button size="lg" variant="secondary" className="rounded-full">
              Start Reading
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Recent Posts Section */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-32 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
            <p className="text-sm text-muted-foreground">
              Discover our latest articles and insights
            </p>
          </div>
          <Button variant="outline" className="hidden sm:flex">
            View all posts
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
                    {post.mainImage && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                        <Image
                          src={urlFor(post.mainImage).width(200).url() ?? ""}
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

        {/* <Button variant="outline" className="mt-8 w-full sm:hidden">
          View all posts
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button> */}
      </section>
    </main>
  );
};

export default Blog;
