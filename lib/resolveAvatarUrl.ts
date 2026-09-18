import { urlFor } from '@/utils/imageUrlBuilder';

export type SellerImage =
  | string
  | { _ref?: string; url?: string }
  | null
  | undefined;

export interface ResolvedAvatar {
  /** Resolved avatar URL, or null to show initials. */
  avatarUrl: string | null;
  /** Initials derived from name (fallback: email username). */
  initials: string;
}

/**
 * Resolve a seller's avatar: direct URL → Sanity asset ref (via urlFor) →
 * Sanity asset with inline url → Gmail default profile → null (initials).
 * Shared by seller-facing UI; extracted from ProductPageClient's inline IIFE.
 */
export function resolveAvatarUrl(args: {
  image?: SellerImage;
  email?: string | null;
  name?: string | null;
}): ResolvedAvatar {
  const { image, email = '', name = null } = args;

  let avatarUrl: string | null = null;
  if (typeof image === 'string') {
    avatarUrl = image;
  } else if (image && typeof image === 'object' && image._ref) {
    avatarUrl = urlFor(image);
  } else if (image && typeof image === 'object' && image.url) {
    avatarUrl = image.url;
  } else if (email && email.includes('@gmail.com')) {
    avatarUrl = 'https://lh3.googleusercontent.com/a/default-user=s64-c';
  }

  const initials = ((name || email || '').split('@')[0] || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return { avatarUrl, initials };
}
