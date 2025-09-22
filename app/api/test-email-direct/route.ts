import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST() {
  try {
    console.log('📧 Testing direct email sending...');

    const testEmail = {
      to: 'abdisick@hotmail.com',
      subject: 'Test Email - Shipping Notification',
      html: `
        <html>
          <body>
            <h1>Test Shipping Email</h1>
            <p>This is a test email to verify the email system is working.</p>
            <p>If you receive this email, the SMTP configuration is correct.</p>
          </body>
        </html>
      `,
    };

    console.log('📧 Sending test email to:', testEmail.to);

    await sendEmail(testEmail);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('❌ Direct email test error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
}
