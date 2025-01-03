import { Star, StarHalf } from "lucide-react";
import { urlFor } from "@/utils/imageUrlBuilder";

interface SellerInfoProps {
  email: string;
  rating: number;
  image: string;
}

export function SellerInfo({ email, rating, image }: SellerInfoProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const sellerImg = urlFor(image);

  return (
    <div className="flex items-center justify-between pt-5">
      <span className="flex items-center gap-2 text-sm font-medium">
        <img className="rounded-full w-8 h-8 object-cover object-top" src={sellerImg} alt="sellers image"/>
        {email.split("@")[0]}
      </span>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            );
          } else {
            return <Star key={i} className="w-4 h-4 text-gray-300" />;
          }
        })}
      </div>
    </div>
  );
}
