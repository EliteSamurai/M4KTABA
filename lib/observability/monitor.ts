/**
 * Observability Monitor
 * Continuously monitors metrics and triggers alerts
 */

import {
  getEnabledAlerts,
  evaluateAlert,
  type AlertRule,
} from './alerts';
import {
  metrics,
  calculatePaymentSuccessRate,
  calculateWebhookFailureRate,
  calculateRefundRate,
  getDisputeCountPerSeller,
} from './metrics';

/**
 * Monitor class - runs alert checks
 */
class Monitor {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start monitoring
   */
  start(intervalMs = 60000): void {
    if (this.isRunning) {
      console.warn('Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Observability monitor started');

    // Run checks immediately
    this.runChecks();

    // Then run at interval
    this.interval = setInterval(() => this.runChecks(), intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('🔍 Observability monitor stopped');
  }

  /**
   * Run all alert checks
   */
  private async runChecks(): Promise<void> {
    const alerts = getEnabledAlerts();

    for (const alert of alerts) {
      try {
        const value = await this.getMetricValue(alert);
        await evaluateAlert(alert, value);
      } catch (error) {
        console.error(`Error evaluating alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Get current value for alert metric
   */
  private async getMetricValue(alert: AlertRule): Promise<number> {
    switch (alert.metric) {
      case 'payment_success_rate_drop':
        return this.calculateSuccessRateDrop(alert.window);

      case 'webhook_failure_rate':
        return calculateWebhookFailureRate(alert.window);

      case 'payout_failures_count':
        return this.countPayoutFailures(alert.window);

      case 'refund_rate':
        return calculateRefundRate(alert.window);

      case 'payout_cron_error_count':
        return this.countCronErrors(alert.window);

      case 'dispute_count_per_seller':
        return this.getMaxDisputeCountPerSeller(alert.window);

      case 'payment_processing_latency_p95':
        return this.getPaymentLatencyP95(alert.window);

      case 'webhook_queue_size':
        return this.getWebhookQueueSize();

      case 'liquidity_ratio':
        return this.getLiquidityRatio(alert.window);

      case 'cart_abandonment_rate':
        return metrics.percentage('cart_abandoned', 'cart_started', alert.window);

      default:
        console.warn(`Unknown metric: ${alert.metric}`);
        return 0;
    }
  }

  /**
   * Calculate payment success rate drop
   */
  private calculateSuccessRateDrop(window: string): number {
    const currentRate = calculatePaymentSuccessRate(window);
    
    // Compare with previous period
    const previousRate = calculatePaymentSuccessRate(
      this.getPreviousPeriod(window)
    );

    return Math.abs(previousRate - currentRate);
  }

  /**
   * Count payout failures across sellers
   */
  private countPayoutFailures(window: string): number {
    const failures = metrics.get('payout_failures', window);
    
    // Count unique sellers with failures
    const sellersWithFailures = new Set(
      failures.map((p) => p.labels?.seller_id).filter(Boolean)
    );

    return sellersWithFailures.size;
  }

  /**
   * Count cron job errors
   */
  private countCronErrors(window: string): number {
    return metrics.get('payout_cron_errors', window).length;
  }

  /**
   * Get maximum dispute count for any seller
   */
  private getMaxDisputeCountPerSeller(window: string): number {
    const disputes = metrics.get('dispute_count', window);
    
    // Group by seller
    const sellerCounts = new Map<string, number>();
    
    disputes.forEach((point) => {
      const sellerId = point.labels?.seller_id;
      if (sellerId) {
        sellerCounts.set(sellerId, (sellerCounts.get(sellerId) || 0) + 1);
      }
    });

    // Return max count
    return Math.max(...Array.from(sellerCounts.values()), 0);
  }

  /**
   * Get payment processing latency (P95)
   */
  private getPaymentLatencyP95(window: string): number {
    const agg = metrics.aggregate('payment_processing_duration_ms', window);
    return agg ? agg.p95 : 0;
  }

  /**
   * Get webhook queue size (from external queue service)
   */
  private getWebhookQueueSize(): number {
    // TODO: Query external queue (Redis, SQS, etc.)
    return 0;
  }

  /**
   * Get liquidity ratio
   */
  private getLiquidityRatio(window: string): number {
    const agg = metrics.aggregate('liquidity_ratio', window);
    return agg ? agg.avg : 1; // Default to 1 (100%)
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriod(window: string): string {
    // For "1h", return "2h" to get 1h-2h ago range
    const match = window.match(/^(\d+)(m|h|d)$/);
    if (!match) return window;

    const value = parseInt(match[1]);
    const unit = match[2];

    return `${value * 2}${unit}`;
  }
}

// Global monitor instance
export const monitor = new Monitor();

/**
 * Track payout cron errors
 */
export function trackPayoutCronError(error: Error): void {
  metrics.increment('payout_cron_errors');
  console.error('❌ Payout cron error:', error);
}

/**
 * Track payment processing
 */
export async function trackPaymentProcessing<T>(
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    metrics.timing('payment_processing', duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    metrics.timing('payment_processing', duration);
    metrics.increment('payment_processing_errors');
    
    throw error;
  }
}

/**
 * Health check endpoint data
 */
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    payments: boolean;
    webhooks: boolean;
    payouts: boolean;
    database: boolean;
  };
  metrics: {
    paymentSuccessRate: number;
    webhookFailureRate: number;
    payoutFailures: number;
  };
  timestamp: string;
}

/**
 * Get health check status
 */
export async function getHealthCheck(): Promise<HealthCheck> {
  const paymentSuccessRate = calculatePaymentSuccessRate('5m');
  const webhookFailureRate = calculateWebhookFailureRate('5m');
  const payoutFailures = metrics.get('payout_failures', '1h').length;

  const checks = {
    payments: paymentSuccessRate > 95,
    webhooks: webhookFailureRate < 1,
    payouts: payoutFailures < 5,
    database: true, // TODO: Check database connectivity
  };

  const allHealthy = Object.values(checks).every((v) => v === true);
  const anyUnhealthy = Object.values(checks).some((v) => v === false);

  return {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
    checks,
    metrics: {
      paymentSuccessRate,
      webhookFailureRate,
      payoutFailures,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Initialize observability system
 */
export function initializeObservability(): void {
  // Start monitor
  monitor.start();

  // Log startup
  console.log('✅ Observability system initialized');
  console.log(`📊 Monitoring ${getEnabledAlerts().length} alert rules`);

  // Handle shutdown
  process.on('SIGTERM', () => {
    monitor.stop();
    metrics.flush();
  });

  process.on('SIGINT', () => {
    monitor.stop();
    metrics.flush();
  });
}

