import { NextResponse } from 'next/server';
import { getEnabledAlerts } from '@/lib/observability/alerts';

export async function GET() {
  try {
    const alerts = getEnabledAlerts();

    return NextResponse.json({
      count: alerts.length,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        name: alert.name,
        description: alert.description,
        severity: alert.severity,
        metric: alert.metric,
        threshold: alert.threshold,
        window: alert.window,
        enabled: alert.enabled,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

