import imageUrlBuilder from '@sanity/image-url';

// Build the image URL builder without importing the server Sanity client.
// Use public env so this file can run in the browser safely.
const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  '32kxkt38';
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'blog-m4ktaba';

const builder = imageUrlBuilder({ projectId, dataset });

export function urlFor(source) {
  // Return null for invalid sources to make it easier to check
  if (!source) {
    return null;
  }

  // Handle direct Sanity image references (string format)
  if (typeof source === 'string') {
    // Handle direct Sanity image references
    if (source.startsWith('image-')) {
      try {
        return builder.image({ asset: { _ref: source } }).url();
      } catch (error) {
        console.warn(
          'Failed to build image URL for Sanity reference:',
          source,
          error
        );
        return null;
      }
    }
    // Handle external URLs
    if (source.startsWith('http')) {
      return source;
    }
    return null;
  }

  // Handle Sanity image asset objects
  if (source?.asset) {
    // If we have a direct URL from Sanity, use it
    if (source.asset.url) {
      return source.asset.url;
    }

    // If we have a reference, build the URL
    if (source.asset._ref) {
      try {
        return builder.image(source).url();
      } catch (error) {
        console.warn(
          'Failed to build image URL for Sanity asset:',
          source,
          error
        );
        return null;
      }
    }
  }

  // Handle array of photos (take the first one)
  if (Array.isArray(source) && source.length > 0) {
    return urlFor(source[0]);
  }

  return null;
}
