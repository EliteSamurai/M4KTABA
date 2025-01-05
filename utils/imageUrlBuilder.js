import imageUrlBuilder from "@sanity/image-url";
import { writeClient } from "@/studio-m4ktaba/client"; // Your configured Sanity client

const builder = imageUrlBuilder(writeClient);

export function urlFor(source) {
  if (typeof source === "string" && source.startsWith("http")) {
    // Return external URLs directly
    return source;
  }

  if (source?.asset?._ref) {
    // Handle Sanity image references
    return builder.image(source).url();
  }

  return ""; // Replace with your default image
}

