import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import EditBookForm from '@/components/EditBookForm';

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?._id) {
    redirect('/login');
  }

  // Fetch the book
  const book = await (readClient as any).fetch(
    `*[_type == "book" && _id == $id][0]{
      _id,
      title,
      author,
      description,
      price,
      quantity,
      selectedCondition,
      status,
      "photos": photos[]{
        _key,
        asset->{
          _ref,
          url
        }
      },
      "selectedCategory": selectedCategory->{
        _id,
        title
      },
      "user": user->{
        _id,
        email
      }
    }`,
    { id }
  );

  if (!book) {
    redirect('/dashboard/my-books');
  }

  // Check if user owns this book
  if (book.user._id !== session.user._id) {
    redirect('/dashboard/my-books');
  }

  // Fetch categories for the form
  const categories = await (readClient as any).fetch(
    `*[_type == "category"] | order(title asc) {
      _id,
      title
    }`
  );

  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>Edit Book</h1>
          <p className='text-muted-foreground'>
            Update your book listing information
          </p>
        </div>

        <EditBookForm book={book} categories={categories} />
      </div>
    </div>
  );
}

