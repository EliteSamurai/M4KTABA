import { Star, StarHalf } from 'lucide-react';
import { urlFor } from '@/utils/imageUrlBuilder';
import Image from 'next/image';

interface SellerInfoProps {
  email: string;
  rating: number;
  image: string | { _ref: string; url: string } | null;
  name?: string | null;
}

export function SellerInfo({ email, rating, image, name }: SellerInfoProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Handle both direct URL strings and Sanity asset objects
  let sellerImg: string | null = null;
  if (typeof image === 'string') {
    // Direct URL
    sellerImg = image;
  } else if (image && typeof image === 'object' && image._ref) {
    // Sanity asset reference
    sellerImg = urlFor(image);
  } else if (image && typeof image === 'object' && image.url) {
    // Sanity asset with direct URL
    sellerImg = image.url;
  }

  // Generate initials from name or email
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    // Fallback to email username
    const username = email.split('@')[0];
    return username.slice(0, 2).toUpperCase();
  };

  // Check if we should show Gmail profile image
  const getGmailProfileImage = (email: string) => {
    if (email.includes('@gmail.com')) {
      return `https://lh3.googleusercontent.com/a/default-user=s64-c`;
    }
    return null;
  };

  // Determine what to display
  const displayImage = () => {
    if (sellerImg) {
      return sellerImg;
    }

    // Try Gmail profile image for Gmail users
    const gmailImg = getGmailProfileImage(email);
    if (gmailImg) {
      return gmailImg;
    }

    // Return null to show initials
    return null;
  };

  const imageUrl = displayImage();
  const initials = getInitials();

  return (
    <div className='flex items-center justify-between pt-5'>
      <span className='flex items-center gap-2 text-sm font-medium'>
        {imageUrl ? (
          <Image
            className='rounded-full w-8 h-8 object-cover object-top'
            src={imageUrl}
            alt='sellers image'
            width={32}
            height={32}
            onError={e => {
              // If image fails to load, show initials instead
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-500 ${imageUrl ? 'hidden' : ''}`}
        >
          {initials}
        </div>
        {email.split('@')[0]}
      </span>
      <div className='flex items-center'>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className='w-4 h-4 fill-yellow-400 text-yellow-400'
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={i}
                className='w-4 h-4 fill-yellow-400 text-yellow-400'
              />
            );
          } else {
            return <Star key={i} className='w-4 h-4 text-gray-300' />;
          }
        })}
      </div>
    </div>
  );
}
