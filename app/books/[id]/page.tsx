import { groq } from 'next-sanity';
import { readClient } from '@/studio-m4ktaba/client';
import ProductPageClient from '@/components/ProductPageClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const book = await (readClient as any).fetch(
    groq`*[_type == "book" && _id == $id][0]{
      _id,
      title,
      author,
      description,
      price,
      quantity,
      selectedCondition,
      "photos": photos[]{
        _key,
        asset->{
          _ref,
          url
        }
      },
      "user": user->{
        _id,
        name,
        email,
        "image": avatar.asset->{
          _ref,
          url
        }
      },
      "selectedCategory": selectedCategory->{
        _id,
        title
      }
    }`,
    { id }
  );

  // Get declined offers count if user is logged in
  if (session?.user?._id) {
    await (readClient as any).fetch(
      groq`count(*[_type == "offer" && book._ref == $bookId && buyer._ref == $buyerId && status == "declined" && !isCounterOffer])`,
      {
        bookId: id,
        buyerId: session.user._id,
      }
    );
  }

  return <ProductPageClient book={book} />;
}
