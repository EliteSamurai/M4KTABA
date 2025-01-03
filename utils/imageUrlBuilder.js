import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/studio-m4ktaba/client"; // Your configured Sanity client

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  if (source?.src) {
    return source.src; // Return the `src` for Next.js image imports
  }

  // Handle Sanity image references
  if (source) {
    return builder.image(source).url() || ""; // Generate Sanity image URL
  }

  // Fallback: Return an empty string for invalid inputs
  return "";}
