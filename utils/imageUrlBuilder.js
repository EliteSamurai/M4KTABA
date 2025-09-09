import imageUrlBuilder from "@sanity/image-url";

// Build the image URL builder without importing the server Sanity client.
// Use public env so this file can run in the browser safely.
const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || "32kxkt38";
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "blog-m4ktaba";

const builder = imageUrlBuilder({ projectId, dataset });

export function urlFor(source) {
  if (typeof source === "string") {
    // Handle direct Sanity image references
    if (source.startsWith("image-")) {
      return builder.image({ asset: { _ref: source } }).url();
    }
    // Handle external URLs
    if (source.startsWith("http")) {
      return source;
    }
  }

  if (source?.asset?._ref) {
    // Handle Sanity image references
    return builder.image(source).url();
  }

  return ""; // Replace with your default image
}
