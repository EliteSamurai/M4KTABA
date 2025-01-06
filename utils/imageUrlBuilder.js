import imageUrlBuilder from "@sanity/image-url";
import { writeClient } from "@/studio-m4ktaba/client"; // Your configured Sanity client

const builder = imageUrlBuilder(writeClient);

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
