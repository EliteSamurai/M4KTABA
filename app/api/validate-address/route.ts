import { NextRequest, NextResponse } from 'next/server';

// EasyPost API details
const EASYPOST_API_URL = 'https://api.easypost.com/v2';
const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY;

async function validateAddress(address: {
  street1: string;
  street2?: string;
  city: string;
  zip: string;
  state: string;
  country: string;
}) {
  // If EasyPost API key is not configured, fall back to basic validation
  if (!EASYPOST_API_KEY) {
    console.warn('EasyPost API key not configured, falling back to basic address validation');
    return validateAddressBasic(address);
  }

  try {
    // Add the `verify` flag to trigger address verification
    const response = await fetch(`${EASYPOST_API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(EASYPOST_API_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        ...address,
        verify: true, // Use the 'verify' parameter to validate the address
      }),
    });

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      console.warn(`EasyPost API request failed (${response.status}), falling back to basic validation`);
      return validateAddressBasic(address);
    }

    // Parse the response data
    const data = await response.json();

    // Access the 'verifications' object and check the status
    const verifications = data?.verifications || {};

    // Check if delivery verification succeeded (zip4 is optional)
    const deliveryValid = verifications.delivery?.success === true;

    if (deliveryValid) {
      return true;
    } else {
      console.warn('EasyPost delivery verification failed, falling back to basic validation');
      return validateAddressBasic(address);
    }
  } catch (error) {
    console.error('Error validating address with EasyPost:', error);
    console.warn('Falling back to basic address validation');
    return validateAddressBasic(address);
  }
}

// Basic address validation fallback
function validateAddressBasic(address: {
  street1: string;
  city: string;
  zip: string;
  state: string;
  country: string;
}): boolean {
  // Basic validation - just check that required fields are present and have reasonable length
  const isStreetValid = address.street1 && address.street1.length >= 5;
  const isCityValid = address.city && address.city.length >= 2;
  const isStateValid = address.state && address.state.length >= 2;
  const isZipValid = address.zip && /^\d{5}(-\d{4})?$/.test(address.zip); // US zip code format
  const isCountryValid = address.country && address.country.length >= 2;

  const isValid = isStreetValid && isCityValid && isStateValid && isZipValid && isCountryValid;

  if (!isValid) {
    console.warn('Basic address validation failed:', {
      street1: isStreetValid,
      city: isCityValid,
      state: isStateValid,
      zip: isZipValid,
      country: isCountryValid,
    });
  }

  return isValid;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON request body
    const { street1, street2, city, zip, state, country } = await req.json();

    // Ensure the address fields are valid
    if (!street1 || !city || !zip || !state || !country) {
      return NextResponse.json(
        { message: 'Missing required address fields' },
        { status: 400 }
      );
    }

    // Validate the address using EasyPost
    const isValid = await validateAddress({
      street1,
      street2,
      city,
      zip,
      state,
      country,
    });

    // Return the validation result
    return NextResponse.json({ isValid });
  } catch (error) {
    console.error('Error processing address validation:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
