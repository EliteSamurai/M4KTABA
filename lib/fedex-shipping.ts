import { CartItem, FedExAddress } from "@/types/shipping-types";

interface FedExRateResponse {
  output: {
    rateReplyDetails: Array<{
      ratedShipmentDetails: Array<{
        totalNetCharge: { amount: string };
      }>;
    }>;
  };
}

// Fetch FedEx OAuth Token
async function getFedExToken(): Promise<string> {
  const tokenUrl = "https://apis-sandbox.fedex.com/oauth/token"; // Use sandbox or production based on environment
  const credentials = Buffer.from(
    `${process.env.FEDEX_CLIENT_ID}:${process.env.FEDEX_CLIENT_SECRET}`
  ).toString("base64"); // Base64 encode Client ID and Secret

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`, // Use Basic Auth with encoded credentials
    },
    body: new URLSearchParams({
      grant_type: "client_credentials", // Required field
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("FedEx token retrieval error:", errorData);
    throw new Error("FedEx token retrieval failed.");
  }

  const data = await response.json();
  return data.access_token; // Extract the token from the response
}

// Helper function to get the postal code of a seller's location
function extractPostalCodeFromLocation(location: string): string {
  // Replace this with a more robust method, like a database or an API call,
  // if needed to map cities and states to postal codes.
  const postalCodeMap: { [key: string]: string } = {
    "San Jose, California": "95112",
    // Add more mappings as needed
  };

  return postalCodeMap[location] || "00000"; // Default fallback
}

// Calculate rate for a single cart item
async function getShippingRateForItem(
  fedExToken: string,
  item: CartItem,
  address: { city: string; state: string; zip: string }
): Promise<number> {
  const [sellerCity, sellerState] = item.user.location.split(", ");
  const sellerPostalCode = extractPostalCodeFromLocation(item.user.location);

  const requestData = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
    requestedShipment: {
      shipper: {
        address: {
          city: sellerCity.trim(),
          stateOrProvinceCode: sellerState.trim(),
          postalCode: sellerPostalCode.trim(),
          countryCode: "US",
        },
      },
      recipient: {
        address: {
          city: address.city.trim(),
          stateOrProvinceCode: address.state.trim(),
          postalCode: address.zip.trim(),
          countryCode: "US",
        },
      },
      requestedPackageLineItems: [
        {
          weight: {
            units: "LB",
            value: item.weight || 1, // Weight in pounds
          },
          dimensions: {
            length: 10,
            width: 10,
            height: 10,
            units: "IN",
          },
        },
      ],
      serviceType: "FEDEX_GROUND",
      packagingType: "YOUR_PACKAGING",
      pickupType: "DROPOFF",
    },
  };

  const response = await fetch(
    "https://apis-sandbox.fedex.com/rate/v1/rates/quotes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${fedExToken}`,
      },
      body: JSON.stringify(requestData),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rate for item: ${item.title}`);
  }

  const data = (await response.json()) as FedExRateResponse;
  return parseFloat(
    data.output.rateReplyDetails[0].ratedShipmentDetails[0].totalNetCharge
      .amount
  );
}

// Calculate total shipping cost for the cart
export async function calculateShippingCostWithFedEx(
  address: FedExAddress,
  cart: CartItem[],
  accessToken: string
): Promise<number> {
  // Step 1: Prepare Request Data
  const requestData = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
    requestedShipment: {
      shipper: {
        address: {
          city: cart[0].user.location.split(", ")[0].trim(),
          stateOrProvinceCode: cart[0].user.location.split(", ")[1].trim(),
          postalCode: process.env.SELLER_DEFAULT_POSTAL_CODE || "55123",
          countryCode: "US",
        } as FedExAddress,
      },
      recipient: address,
      serviceType: "FEDEX_GROUND",
      packagingType: "YOUR_PACKAGING",
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      // requestedPackageLineItems: cart.map((item) => ({
      //   weight: {
      //     units: "LB",
      //     value: item.weight || 1,
      //   },
      //   dimensions: {
      //     length: 10,
      //     width: 10,
      //     height: 10,
      //     units: "IN",
      //   },
      // })),
    },
  };

  // Step 2: Fetch Shipping Rates
  const response = await fetch(
    "https://apis-sandbox.fedex.com/rate/v1/rates/quotes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json(); // Parse JSON response
    console.error("FedEx API Error:", errorData); // Log the response
    throw new Error("Failed to fetch shipping rates from FedEx.");
  }

  const data = await response.json();
  const rateDetails = data.output?.rateReplyDetails[0]?.ratedShipmentDetails[0];

  if (!rateDetails || !rateDetails.totalNetCharge) {
    throw new Error("Invalid response from FedEx.");
  }

  // Return the total shipping cost
  return parseFloat(rateDetails.totalNetCharge);
}

export async function validateAddressWithFedEx(address: {
  city: string;
  state: string;
  zip: string;
}): Promise<{ isValid: boolean; suggestions?: any }> {
  const token = await getFedExToken();

  const requestBody = {
    transactionId: "AddressValidationTransaction", // Unique ID for tracking
    address: {
      postalCode: address.zip,
      city: address.city,
      stateOrProvinceCode: address.state,
      countryCode: "US", // Adjust as needed
    },
    carrierCodes: ["FDXG", "FDXE"], // Ground and Express services
  };

  const response = await fetch(
    "https://apis-sandbox.fedex.com/address/v1/addresses/resolve",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("FedEx address validation error:", errorData);
    throw new Error("Address validation failed.");
  }

  const data = await response.json();

  const validatedAddress = data.resolvedAddresses?.[0]; // Check the first suggestion
  const isValid = validatedAddress?.score >= 90; // FedEx provides a score (0-100)

  return {
    isValid,
    suggestions: !isValid ? data.resolvedAddresses : undefined,
  };
}
