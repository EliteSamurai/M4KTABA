import { client } from "@/studio-m4ktaba/client";

export async function uploadImageToSanity(imageUrl) {
  try {
    // Fetch the image as a buffer
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image from URL");
    const imageBuffer = await response.arrayBuffer();

    // Upload to Sanity
    const uploadResponse = await client.assets.upload(
      "image",
      Buffer.from(imageBuffer),
      {
        filename: `google-profile-${Date.now()}.jpeg`,
      }
    );

    return {
      _type: "image",
      asset: { _ref: uploadResponse._id },
    };
  } catch (error) {
    console.error("Failed to upload image to Sanity:", error);
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

    // Convert file to buffer using arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload the image to Sanity
    const uploadResponse = await client.assets.upload("image", fileBuffer, {
      filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), // Clean filename
    });

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
