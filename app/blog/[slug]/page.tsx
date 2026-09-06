import { PortableText, type SanityDocument } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { readClient } from '@/studio-m4ktaba/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import RelatedBooks from '@/components/blog/RelatedBooks';

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
  body,
  "categories": categories[]->{_id, title, slug},
  "shopCategories": shopCategories[]->{_id, title, slug}
}
`;

// Build-safe image URL builder
const urlFor = (source: SanityImageSource) => {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;

  if (projectId && dataset && projectId !== 'dummy' && dataset !== 'dummy') {
    return imageUrlBuilder({ projectId, dataset }).image(source);
  }
  return null;
};

const options = { 
  next: { revalidate: 300 }, // 5 min cache for blog posts (rarely change)
  cache: 'force-cache' as RequestCache
};

// Helper Functions
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString();

const getAvatarFallback = (name?: string, email?: string) =>
  name
    ?.split(' ')
    .map(part => part[0]?.toUpperCase())
    .join('') ||
  email?.[0]?.toUpperCase() ||
  '?';

// Helper function to calculate word count
const calculateWordCount = (
  body: { children?: { text: string }[] }[]
): number => {
  let wordCount = 0;

  const extractTextFromBlock = (block: { children?: { text: string }[] }) => {
    if (block.children) {
      block.children.forEach((child: { text: string }) => {
        if (child.text) {
          wordCount += child.text.split(' ').length;
        }
      });
    }
  };

  body.forEach(extractTextFromBlock);

  return wordCount;
};

// Skeleton that exactly mirrors BookProductCard's loading state (aspect-[3/4]
// image box + two title lines + full-width button) so the Suspense fallback
// has the same dimensions as the loaded related-books grid.
function RelatedBooksSkeleton() {
  return (
    <section className='mt-16 border-t pt-12'>
      <div className='mb-6 flex items-center justify-between'>
        <Skeleton className='h-7 w-40' />
        <Skeleton className='h-9 w-32 rounded-full' />
      </div>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='group h-full overflow-hidden flex flex-col'>
            <CardContent className='p-0'>
              <Skeleton className='aspect-[3/4] w-full' />
            </CardContent>
            <CardHeader className='space-y-2 p-4'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </CardHeader>
            <CardFooter className='p-4 pt-0 mt-auto'>
              <Skeleton className='h-10 w-full' />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Main Component
export default async function PostPage({
  params: asyncParams,
}: {
  params: { slug: string };
}) {
  const { slug } = await asyncParams;

  // Fetch Post Data
  const post = (await (readClient as any).fetch(
    POST_QUERY,
    { slug },
    options
  )) as SanityDocument;

  // Guard Clause for Missing Post
  if (!post) {
    return (
      <div className='flex min-h-[40vh] flex-col items-center justify-center gap-2'>
        <h1 className='text-2xl font-bold'>Post not found</h1>
        <p className='text-muted-foreground'>
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild variant='outline' className='mt-4'>
          <Link href='/blog'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to posts
          </Link>
        </Button>
      </div>
    );
  }

  // Generate Image URLs
  const postImageUrl = post.mainImage ? urlFor(post.mainImage)?.url() : null;

  const userImageUrl = post.user?.image
    ? urlFor(post.user.image)?.width(100).height(100).fit('crop').url()
    : null;

  // Calculate word count
  const wordCount = calculateWordCount(post.body || []);
  const readTime = wordCount ? Math.ceil(wordCount / 200) : 0;

  // Related books connected to this post via build-linked `shopCategories`,
  // falling back to editorial `categories`.
  const relatedCategories: any[] =
    post.shopCategories?.length ? post.shopCategories : (post.categories || []);
  const relatedCategoryId = relatedCategories[0]?._id;
  const relatedCategoryTitle = relatedCategories[0]?.title;
  const relatedCategorySlug = relatedCategories[0]?.slug?.current;

    // Related books are fetched + rendered by <RelatedBooks /> below, deferred
  // behind a Suspense boundary so the post + hero paint are not blocked by
  // this second Sanity round-trip (the category already comes from POST_QUERY).

  return (
    <article className='mx-auto min-h-screen max-w-3xl px-4 py-12'>
      <header className='mb-8 space-y-6'>
        {/* Back Link */}
        <Button variant='ghost' size='sm' className='mb-4 -ml-2 h-8' asChild>
          <Link href='/blog'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to posts
          </Link>
        </Button>

        {/* Post Image */}
        {postImageUrl && (
                    <div className='overflow-hidden rounded-xl border bg-muted'>
            <Image
              src={postImageUrl}
              alt={post.title}
              className='aspect-video w-full object-cover transition-transform hover:scale-105'
              width={1200}
              height={675}
              priority
              sizes='(max-width: 768px) 100vw, 60vw'
            />
          </div>
        )}

        {/* Post Header */}
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            {post.categories?.map((category: any) => (
              <Badge
                key={category._id}
                variant='secondary'
                className='rounded-full px-3'
              >
                {category.title}
              </Badge>
            ))}
          </div>
          <h1 className='text-balance text-4xl font-bold tracking-tight sm:text-5xl'>
            {post.title}
          </h1>
        </div>

        {/* Author Card */}
        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/50 p-4 sm:p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              {/* User Information */}
              <div className='flex items-center gap-4'>
                <Avatar className='h-10 w-10 border-2 sm:h-12 sm:w-12'>
                  {userImageUrl ? (
                    <AvatarImage
                      src={userImageUrl}
                      alt={post.user?.email.split('@')[0] || 'User Avatar'}
                    />
                  ) : (
                    <AvatarFallback className='bg-primary/10 text-primary'>
                      {getAvatarFallback(
                        post.user?.name,
                        post.user?.email.split('@')[0]
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className='font-semibold text-sm sm:text-base'>
                    M4KTABA TEAM
                  </p>
                  <p className='text-xs text-muted-foreground sm:text-sm'>
                    {post.user?.email.split('@')[0]}
                  </p>
                </div>
              </div>

              {/* Post Metadata */}
              <div className='flex flex-wrap justify-between items-center gap-4 text-xs text-muted-foreground sm:text-sm'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </div>
                <Separator
                  orientation='vertical'
                  className='h-4 hidden sm:block'
                />
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  <span>{readTime} min read</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </header>

      {/* Post Content */}
      <div className='prose prose-gray mx-auto max-w-none dark:prose-invert prose-headings:scroll-m-20 prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-pre:rounded-xl prose-pre:border prose-pre:bg-muted prose-pre:p-4'>
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>

            {/* Related books — deferred via Suspense so the post + hero paint first. */}
      <Suspense fallback={<RelatedBooksSkeleton />}>
        <RelatedBooks
          categoryId={relatedCategoryId}
          categorySlug={relatedCategorySlug}
          categoryTitle={relatedCategoryTitle}
        />
      </Suspense>

      {/* Post Footer */}
      <CardFooter className='mt-12 flex items-center justify-between rounded-lg border bg-card p-4'>
        <div className='flex items-center gap-2'>
          <User className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>
            Written by M4KTABA TEAM
          </span>
        </div>
        <Button variant='outline' size='sm' asChild>
          <Link href='/blog'>More posts</Link>
        </Button>
      </CardFooter>
    </article>
  );
}
