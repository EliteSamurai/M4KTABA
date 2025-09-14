import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Environment variables for Mailchimp
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_AUDIENCE_ID = '0f7c1149a8';
    const MAILCHIMP_SERVER = 'us7';

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER) {
      return NextResponse.json(
        { error: 'Mailchimp environment variables are not set' },
        { status: 500 }
      );
    }

    // Mailchimp API URL
    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    // Data to send to Mailchimp
    const data = {
      email_address: email,
      status: 'subscribed',
    };

    // Make a request to Mailchimp API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`, // Mailchimp API requires this format
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to subscribe' },
        { status: response.status }
      );
    }

    // Successfully subscribed
    return NextResponse.json({ message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Error subscribing to Mailchimp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
