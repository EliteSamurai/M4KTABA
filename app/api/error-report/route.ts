import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { notifyAdmin } from '@/lib/email';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  type: 'react_error' | 'javascript_error' | 'api_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  additionalData?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const errorReport: ErrorReport = await req.json();

    // Get user session if available
    const session = await getServerSession(authOptions);

    // Add user information if available
    if (session?.user) {
      errorReport.userId = session.user._id;
      errorReport.userEmail = session.user.email;
    }

    // Log the error for debugging
    console.error('🚨 Error Report:', {
      type: errorReport.type,
      severity: errorReport.severity,
      message: errorReport.message,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: errorReport.timestamp,
    });

    // Send admin notification
    await notifyAdmin(
      `Error: ${errorReport.type} - ${errorReport.severity}`,
      {
        error: errorReport.message,
        stack: errorReport.stack,
        componentStack: errorReport.componentStack,
        url: errorReport.url,
        userAgent: errorReport.userAgent,
        userId: errorReport.userId,
        userEmail: errorReport.userEmail,
        timestamp: errorReport.timestamp,
        type: errorReport.type,
        severity: errorReport.severity,
        additionalData: errorReport.additionalData,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully'
    });

  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
