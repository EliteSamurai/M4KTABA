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
      throw new Error(`Failed to validate address: ${response.statusText}`);
    }

    // Parse the response data
    const data = await response.json();

    // Access the 'verifications' object and check the status
    const verifications = data?.verifications || {};

    // Check if both `zip4` and `delivery` verification succeeded
    const zip4Valid = verifications.zip4?.success === true;
    const deliveryValid = verifications.delivery?.success === true;

    if (zip4Valid && deliveryValid) {
      return true;
    } else {
      console.error('Address validation failed:', verifications);
      return false;
    }
  } catch (error) {
    console.error('Error validating address:', error);
    return false;
  }
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
