import { NextRequest, NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/observability/metrics';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const window = searchParams.get('window') || '1h';

  try {
    const dashboardMetrics = await getDashboardMetrics(window);

    return NextResponse.json({
      window,
      metrics: dashboardMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

