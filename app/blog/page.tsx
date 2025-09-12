import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { readClient } from "@/studio-m4ktaba/client";
import BlogHeroImg from "@/public/islamiclibrary.jpg";
import BlogClient from "@/components/BlogClient";
import { Button } from "@/components/ui/button";

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current) && publishedAt <= now()
]|order(publishedAt desc)[0...6]{
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

type Category = { _id: string; title: string };
type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  categories: Category[];
  mainImage?: any;
};

const Blog = async () => {
  // Check if Sanity is configured
  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
    return (
      <main className="min-h-screen bg-gradient-to-b">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Blog content will be available once the system is fully configured.
          </p>
        </div>
      </main>
    );
  }

  const posts = await readClient.fetch(POSTS_QUERY, {}, options) as Post[];

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
              <Link href="https://www.m4ktaba.com/blog/welcome-to-m4ktaba">
              Start Reading
              </Link>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Recent Posts Section */}
      <BlogClient initialPosts={posts} />
    </main>
  );
};

export default Blog;
