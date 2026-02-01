import { NextResponse } from 'next/server';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const email = body?.email?.trim();

    // Validate email is provided
    if (!email) {
      console.error('Subscribe API: Missing email in request body');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      console.error('Subscribe API: Invalid email format:', email);
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Environment variables for Mailchimp
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_AUDIENCE_ID = '0f7c1149a8';
    const MAILCHIMP_SERVER = 'us7';

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER) {
      console.error('Subscribe API: Mailchimp environment variables not configured');
      return NextResponse.json(
        { error: 'Subscription service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Mailchimp API URL
    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    // Data to send to Mailchimp
    const data = {
      email_address: email.toLowerCase(), // Normalize email to lowercase
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

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle specific Mailchimp error cases
      const errorTitle = responseData?.title || '';
      const errorDetail = responseData?.detail || 'Failed to subscribe';
      
      console.error('Subscribe API: Mailchimp error', {
        status: response.status,
        title: errorTitle,
        detail: errorDetail,
        email: email,
      });

      // Handle duplicate email (already subscribed)
      if (response.status === 400 && errorTitle.includes('Member Exists')) {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter.' },
          { status: 200 } // Return 200 to show success message to user
        );
      }

      // Handle invalid email format from Mailchimp
      if (response.status === 400 && errorTitle.includes('Invalid Resource')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      // Generic error response
      return NextResponse.json(
        { error: errorDetail || 'Failed to subscribe. Please try again.' },
        { status: response.status }
      );
    }

    // Successfully subscribed
    console.log('Subscribe API: Successfully subscribed email:', email);
    return NextResponse.json({ message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Subscribe API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
