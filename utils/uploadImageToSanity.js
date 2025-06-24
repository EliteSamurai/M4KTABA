import { writeClient } from "@/studio-m4ktaba/client";
import axios from "axios";

export async function uploadImageToSanity(imageSource) {
  try {
    let imageBuffer = null;

    // Fetch image buffer for a URL
    if (typeof imageSource === "string" && imageSource.startsWith("http")) {
      const response = await axios.get(imageSource, {
        responseType: "arraybuffer",
      });
      imageBuffer = Buffer.from(response.data, "binary");
    }
    // Handle Base64 image
    else if (
      typeof imageSource === "string" &&
      imageSource.startsWith("data:image/")
    ) {
      const base64Data = imageSource.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid Base64 image data.");
      }
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      throw new Error(
        "Unsupported image source format. Provide a URL or Base64 string."
      );
    }

    if (imageBuffer) {
      // Upload the image to Sanity
      const uploadResponse = await writeClient.assets.upload(
        "image",
        imageBuffer,
        {
          filename: `profile-image-${Date.now()}.jpg`,
        }
      );

      // Return the Sanity image reference
      return {
        _type: "image",
        asset: { _ref: uploadResponse._id },
      };
    } else {
      throw new Error("Failed to process image buffer.");
    }
  } catch (error) {
    console.error("Failed to upload image to Sanity:", error.message);
    return null;
  }
}

// Fetch the image from a URL and return it as a Buffer
async function fetchImageFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image from URL");

    const imageBuffer = await response.arrayBuffer();
    return Buffer.from(imageBuffer);
  } catch (error) {
    console.error("Error fetching image from URL:", error);
    return null;
  }
}

export async function fileImageSanity(file) {
  try {
    // Check if the file exists and is of type "image"
    if (!file || !file.type.startsWith("image/")) {
      console.error("Invalid file type. Must be an image.");
      return null;
    }

    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large. Maximum size is 5MB.");
      return null;
    }

    // Convert file to buffer using arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload the image to Sanity
    const uploadResponse = await writeClient.assets.upload(
      "image",
      fileBuffer,
      {
        filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), // Clean filename
      }
    );

    // Return the uploaded image's reference
    return {
      _type: "image",
      asset: { _ref: uploadResponse._id },
    };
  } catch (error) {
    console.error("Failed to upload image to Sanity:", error);
    return null;
  }
}

export async function uploadImagesToSanity(files) {
  try {
    if (!Array.isArray(files)) {
      throw new Error("Input must be an array of File objects.");
    }

    if (files.length === 0) {
      console.error("No files to upload.");
      return [];
    }

    const uploadPromises = files.map(async (file, index) => {
      if (!file) {
        console.error("One of the files is undefined.");
        return null;
      }

      return await fileImageSanity(file)
        .catch((error) => {
          if (error.response) {
            console.error("Sanity API Response:", error.response.body);
          } else {
            console.error("Upload Error:", error);
          }
        })
        .then((uploadedImage) => {
          if (uploadedImage) {
            // Add _key to the uploaded image
            return {
              ...uploadedImage,
              _key: `image-${index}-${file.name}`, // Add unique key based on index and filename
            };
          }
          return null;
        });
    });

    const uploadedImages = await Promise.all(uploadPromises);
    return uploadedImages.filter((image) => image !== null); // Filter out failed uploads
  } catch (error) {
    console.error("Failed to upload images to Sanity:", error);
    return [];
  }
}
