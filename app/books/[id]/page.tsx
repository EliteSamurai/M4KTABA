import { groq } from "next-sanity";
import { readClient } from "@/studio-m4ktaba/client";
import ProductPageClient from "@/components/ProductPageClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  const book = await readClient.fetch(
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
        "avatar": avatar.asset->url
      },
      "selectedCategory": selectedCategory->{
        _id,
        title
      }
    }`,
    { id }
  );

  // Get declined offers count if user is logged in
  let declinedOffersCount = 0;
  if (session?.user?._id) {
    const declinedOffers = await readClient.fetch(
      groq`count(*[_type == "offer" && book._ref == $bookId && buyer._ref == $buyerId && status == "declined" && !isCounterOffer])`,
      {
        bookId: id,
        buyerId: session.user._id,
      }
    );
    declinedOffersCount = declinedOffers;
  }

  return <ProductPageClient book={book} />;
}
