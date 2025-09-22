import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 CHECKING EMAIL CONFIGURATION...');

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const supportEmail = process.env.SUPPORT_EMAIL;

    const emailConfig = {
      hasHost: !!smtpHost,
      hasPort: !!smtpPort,
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
      hasSupportEmail: !!supportEmail,
      host: smtpHost ? smtpHost.substring(0, 10) + '...' : null,
      port: smtpPort,
      user: smtpUser ? smtpUser.substring(0, 10) + '...' : null,
      supportEmail: supportEmail,
      nodeEnv: process.env.NODE_ENV,
    };

    console.log('🔍 Email configuration:', emailConfig);

    return NextResponse.json({
      success: true,
      emailConfig,
      message:
        emailConfig.hasHost &&
        emailConfig.hasPort &&
        emailConfig.hasUser &&
        emailConfig.hasPass
          ? 'Email configuration appears complete'
          : 'Email configuration is missing required fields',
    });
  } catch (error) {
    console.error('❌ Email config check error:', error);
    return NextResponse.json(
      { error: 'Failed to check email configuration', details: error },
      { status: 500 }
    );
  }
}
