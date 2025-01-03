import { CartItem } from "@/types/shipping-types";

export async function calculateShippingRateWithKarrio(
  buyerLocation: { city: string; state: string; zip: string },
  cart: CartItem[]
): Promise<number> {
  const apiKey = process.env.KARRIO_API_KEY;
  if (!apiKey) {
    throw new Error("Karrio API key is not configured.");
  }

  const rates = await Promise.all(
    cart.map(async (item) => {
      const [sellerCity, sellerState] = item.user.location.split(", ");

      const requestData = {
        shipper: {
          address: {
            city: sellerCity.trim(),
            state_code: sellerState.trim(),
            postal_code: process.env.SELLER_DEFAULT_POSTAL_CODE || "00000",
            country_code: "US",
          },
        },
        recipient: {
          address: {
            city: buyerLocation.city.trim(),
            state_code: buyerLocation.state.trim(),
            postal_code: buyerLocation.zip.trim(),
            country_code: "US",
          },
        },
        parcels: [
          {
            weight: item.weight || 1, // default weight in lbs
            dimensions: {
              length: 10,
              width: 10,
              height: 10,
              unit: "IN",
            },
          },
        ],
        service_types: ["usps_priority"], // Adjust service type if needed
      };

      const response = await fetch("https://api.karrio.io/v1/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to calculate shipping rate for item: ${item.title}`
        );
      }

      const data = await response.json();
      const rate = data.rates?.[0]?.total_charge; // Fetch the cheapest rate

      if (!rate) {
        throw new Error(`No rate available for item: ${item.title}`);
      }

      return parseFloat(rate);
    })
  );

  // Sum up rates for all items in the cart
  return rates.reduce((total, rate) => total + rate, 0);
}
