import { readClient } from '@/studio-m4ktaba/client'; // Adjust path to your Sanity client

// Function to check quantity in Sanity
export const checkProductAvailability = async productId => {
  try {
    const result = await readClient.fetch(
      `*[_type == "product" && _id == $id][0]{
        quantity
      }`,
      { id: productId }
    );

    return result?.quantity > 0; // Return true if quantity is available
  } catch (error) {
    console.error('Error fetching product quantity:', error);
    return false; // Disable button on error
  }
};
