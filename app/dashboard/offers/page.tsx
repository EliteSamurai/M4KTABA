import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { readClient } from "@/studio-m4ktaba/client";
import OfferList from "@/components/OfferList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { groq } from "next-sanity";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  let offers = [];
  let stats = { pending: 0, accepted: 0, declined: 0, countered: 0 };

  if (userId) {
    // Fetch offers
    offers = await readClient.fetch(
      groq`*[_type == "offer" && seller._ref == $userId] {
        _id,
        _createdAt,
        amount,
        status,
        "buyer": buyer->{
          _id,
          email,
          name
        },
        "book": book->{
          _id,
          title,
          "photos": photos[]{
            "url": asset->url
          }
        }
      } | order(_createdAt desc)`,
      { userId }
    );

    // Calculate stats
    stats = offers.reduce(
      (acc: any, offer: any) => {
        acc[offer.status] = (acc[offer.status] || 0) + 1;
        return acc;
      },
      { pending: 0, accepted: 0, declined: 0, countered: 0 }
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Offers Received
        </h1>
        <p className="text-gray-600">
          Manage offers from potential buyers for your books.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </span>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200"
              >
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                {stats.accepted}
              </span>
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200"
              >
                Accepted
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Declined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">
                {stats.declined}
              </span>
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-200"
              >
                Declined
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Countered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {stats.countered}
              </span>
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                Countered
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      <OfferList offers={offers} />
    </div>
  );
}
