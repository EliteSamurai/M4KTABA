import { NextResponse } from 'next/server';
import { getHealthCheck } from '@/lib/observability/monitor';

export async function GET() {
  try {
    const health = await getHealthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Failed to generate observability health response', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to check health',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

