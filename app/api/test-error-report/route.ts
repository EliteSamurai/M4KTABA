import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { notifyAdmin } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const testData = await req.json();

    console.log('🧪 Test error report received:', testData);

    // Send a test admin notification
    await notifyAdmin(
      'Test Error Report',
      {
        message: 'This is a test error report from the API endpoint',
        timestamp: new Date().toISOString(),
        testData,
        source: 'test-endpoint'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Test error report sent successfully',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Failed to send test error report:', error);
    return NextResponse.json(
      { error: 'Failed to send test error report', details: error },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
