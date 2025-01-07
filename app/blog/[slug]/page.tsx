import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { readClient } from "@/studio-m4ktaba/client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Image from "next/image";

const POST_QUERY = `
*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  publishedAt,
  mainImage,
  "user": user->{
    email,
    image
  },
  body
}
`;

const { projectId, dataset } = readClient.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

// Helper Functions
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString();

const getAvatarFallback = (name?: string, email?: string) =>
  name
    ?.split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("") ||
  email?.[0]?.toUpperCase() ||
  "?";

// Helper function to calculate word count
const calculateWordCount = (body: any[]): number => {
  let wordCount = 0;

  const extractTextFromBlock = (block: any) => {
    if (block.children) {
      block.children.forEach((child: { text: string }) => {
        if (child.text) {
          wordCount += child.text.split(" ").length;
        }
      });
    }
  };

  body.forEach(extractTextFromBlock);

  return wordCount;
};

// Main Component
export default async function PostPage({
  params: asyncParams,
}: {
  params: { slug: string };
}) {
  const { slug } = await asyncParams;

  // Fetch Post Data
  const post = await readClient.fetch<SanityDocument>(
    POST_QUERY,
    { slug },
    options
  );

  // Guard Clause for Missing Post
  if (!post) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="text-muted-foreground">
          The post you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to posts
          </Link>
        </Button>
      </div>
    );
  }

  // Generate Image URLs
  const postImageUrl = post.mainImage ? urlFor(post.mainImage)?.url() : null;

  const userImageUrl = post.user?.image
    ? urlFor(post.user.image)?.width(100).height(100).fit("crop").url()
    : null;

  // Calculate word count
  const wordCount = calculateWordCount(post.body || []);
  const readTime = wordCount ? Math.ceil(wordCount / 200) : 0;

  return (
    <article className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-6">
        {/* Back Link */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 h-8" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to posts
          </Link>
        </Button>

        {/* Post Image */}
        {postImageUrl && (
          <div className="overflow-hidden rounded-xl border bg-muted">
            <Image
              src={postImageUrl}
              alt={post.title}
              className="aspect-video w-full object-cover transition-transform hover:scale-105"
              width={1200}
              height={675}
            />
          </div>
        )}

        {/* Post Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.categories?.map((category: string) => (
              <Badge
                key={category}
                variant="secondary"
                className="rounded-full px-3"
              >
                {category}
              </Badge>
            ))}
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {post.title}
          </h1>
        </div>

        {/* Author Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/50 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* User Information */}
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 sm:h-12 sm:w-12">
                  {userImageUrl ? (
                    <AvatarImage
                      src={userImageUrl}
                      alt={post.user?.email.split("@")[0] || "User Avatar"}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getAvatarFallback(
                        post.user?.name,
                        post.user?.email.split("@")[0]
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold text-sm sm:text-base">
                    M4KTABA TEAM
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {post.user?.email.split("@")[0]}
                  </p>
                </div>
              </div>

              {/* Post Metadata */}
              <div className="flex flex-wrap justify-between items-center gap-4 text-xs text-muted-foreground sm:text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </div>
                <Separator
                  orientation="vertical"
                  className="h-4 hidden sm:block"
                />
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{readTime} min read</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </header>

      {/* Post Content */}
      <div className="prose prose-gray mx-auto max-w-none dark:prose-invert prose-headings:scroll-m-20 prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-pre:rounded-xl prose-pre:border prose-pre:bg-muted prose-pre:p-4">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>

      {/* Post Footer */}
      <CardFooter className="mt-12 flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Written by M4KTABA TEAM
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/blog">More posts</Link>
        </Button>
      </CardFooter>
    </article>
  );
}
