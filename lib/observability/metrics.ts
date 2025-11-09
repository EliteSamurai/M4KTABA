/**
 * Metrics Collection and Tracking
 * Business metrics for observability and analytics
 */

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface AggregatedMetric {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Metrics collector class
 */
class MetricsCollector {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush metrics every 60 seconds
    this.flushInterval = setInterval(() => this.flush(), 60000);
  }

  /**
   * Record a metric value
   */
  record(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value,
      labels,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(dataPoint);

    // Keep only last 1000 data points per metric
    const points = this.metrics.get(name)!;
    if (points.length > 1000) {
      points.shift();
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, labels?: Record<string, string>): void {
    this.record(name, 1, labels);
  }

  /**
   * Record a timing/duration
   */
  timing(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.record(`${name}_duration_ms`, durationMs, labels);
  }

  /**
   * Get metric data points
   */
  get(name: string, window?: string): MetricDataPoint[] {
    const points = this.metrics.get(name) || [];
    
    if (!window) return points;

    const windowMs = parseWindow(window);
    const cutoff = Date.now() - windowMs;

    return points.filter((p) => p.timestamp >= cutoff);
  }

  /**
   * Calculate aggregated metrics
   */
  aggregate(name: string, window?: string): AggregatedMetric | null {
    const points = this.get(name, window);

    if (points.length === 0) return null;

    const values = points.map((p) => p.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: percentile(values, 50),
      p95: percentile(values, 95),
      p99: percentile(values, 99),
    };
  }

  /**
   * Calculate rate (per second)
   */
  rate(name: string, window: string): number {
    const points = this.get(name, window);
    const windowMs = parseWindow(window);

    return (points.length / windowMs) * 1000;
  }

  /**
   * Calculate percentage
   */
  percentage(numerator: string, denominator: string, window?: string): number {
    const numPoints = this.get(numerator, window);
    const denomPoints = this.get(denominator, window);

    if (denomPoints.length === 0) return 0;

    return (numPoints.length / denomPoints.length) * 100;
  }

  /**
   * Flush metrics to external service
   */
  async flush(): Promise<void> {
    // TODO: Send metrics to external service (Datadog, CloudWatch, etc.)
    console.log(`📊 Metrics flushed: ${this.metrics.size} metric types`);
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

/**
 * Business Metrics Tracking Functions
 */

// GMV (Gross Merchandise Value)
export function trackGMV(
  amount: number,
  currency: string,
  region: string
): void {
  metrics.record('gmv', amount, { currency, region });
  metrics.record(`gmv_${currency}`, amount, { region });
  metrics.record(`gmv_${region}`, amount, { currency });
}

// Conversion by Payment Method
export function trackConversion(
  paymentMethod: 'stripe' | 'paypal',
  succeeded: boolean
): void {
  metrics.increment('checkout_attempts', { payment_method: paymentMethod });

  if (succeeded) {
    metrics.increment('checkout_success', { payment_method: paymentMethod });
  } else {
    metrics.increment('checkout_failure', { payment_method: paymentMethod });
  }
}

// Payment Success Rate
export function calculatePaymentSuccessRate(window: string): number {
  return metrics.percentage('checkout_success', 'checkout_attempts', window);
}

// Payout Latency
export function trackPayoutLatency(latencyMs: number, sellerId: string): void {
  metrics.timing('payout_latency', latencyMs, { seller_id: sellerId });
}

// Average Payout Latency
export function getAveragePayoutLatency(window: string): number | null {
  const agg = metrics.aggregate('payout_latency_duration_ms', window);
  return agg ? agg.avg : null;
}

// Liquidity Tracking
export function trackLiquidity(
  availableBalance: number,
  pendingBalance: number,
  sellerId?: string
): void {
  const labels = sellerId ? { seller_id: sellerId } : undefined;

  metrics.record('liquidity_available', availableBalance, labels);
  metrics.record('liquidity_pending', pendingBalance, labels);

  const total = availableBalance + pendingBalance;
  if (total > 0) {
    const ratio = availableBalance / total;
    metrics.record('liquidity_ratio', ratio, labels);
  }
}

// Webhook Metrics
export function trackWebhook(
  provider: 'stripe' | 'paypal',
  eventType: string,
  success: boolean
): void {
  metrics.increment('webhook_received', { provider, event_type: eventType });

  if (success) {
    metrics.increment('webhook_success', { provider, event_type: eventType });
  } else {
    metrics.increment('webhook_failure', { provider, event_type: eventType });
  }
}

// Webhook Failure Rate
export function calculateWebhookFailureRate(window: string): number {
  return metrics.percentage('webhook_failure', 'webhook_received', window);
}

// Refund Metrics
export function trackRefund(amount: number, orderId: string): void {
  metrics.increment('refund_count');
  metrics.record('refund_amount', amount, { order_id: orderId });
}

// Refund Rate
export function calculateRefundRate(window: string): number {
  return metrics.percentage('refund_count', 'checkout_success', window);
}

// Payout Metrics
export function trackPayoutFailure(sellerId: string, reason?: string): void {
  metrics.increment('payout_failures', { 
    seller_id: sellerId,
    reason: reason || 'unknown'
  });
}

// Dispute Metrics
export function trackDispute(
  sellerId: string,
  amount: number,
  type: string
): void {
  metrics.increment('dispute_count', { seller_id: sellerId, type });
  metrics.record('dispute_amount', amount, { seller_id: sellerId });
}

// Get Dispute Count Per Seller
export function getDisputeCountPerSeller(
  sellerId: string,
  window: string
): number {
  const points = metrics.get('dispute_count', window);
  return points.filter((p) => p.labels?.seller_id === sellerId).length;
}

// Cart Abandonment
export function trackCartAbandonment(abandoned: boolean): void {
  metrics.increment('cart_started');

  if (abandoned) {
    metrics.increment('cart_abandoned');
  } else {
    metrics.increment('cart_completed');
  }
}

// Cart Abandonment Rate
export function calculateCartAbandonmentRate(window: string): number {
  return metrics.percentage('cart_abandoned', 'cart_started', window);
}

// Search Metrics
export function trackSearch(
  query: string,
  resultsCount: number,
  latencyMs: number
): void {
  metrics.increment('search_queries');
  metrics.record('search_results_count', resultsCount);
  metrics.timing('search_latency', latencyMs);
}

// Multi-Seller Metrics
export function trackMultiSellerOrder(sellerCount: number): void {
  metrics.record('order_seller_count', sellerCount);
  
  if (sellerCount > 1) {
    metrics.increment('multi_seller_orders');
  } else {
    metrics.increment('single_seller_orders');
  }
}

// Tax Metrics
export function trackTax(
  amount: number,
  region: string,
  taxType: string
): void {
  metrics.record('tax_amount', amount, { region, tax_type: taxType });
  metrics.increment('tax_calculations', { region, tax_type: taxType });
}

/**
 * Helper Functions
 */

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(m|h|d)$/);
  if (!match) throw new Error(`Invalid window format: ${window}`);

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid window unit: ${unit}`);
  }
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

/**
 * Dashboard Metrics Query
 */
export interface DashboardMetrics {
  // Payment Metrics
  paymentSuccessRate: number;
  paymentVolume: number;
  averageOrderValue: number;

  // GMV
  gmvTotal: number;
  gmvByRegion: Record<string, number>;
  gmvByCurrency: Record<string, number>;

  // Conversion
  conversionByMethod: Record<string, number>;

  // Refunds
  refundRate: number;
  refundCount: number;

  // Payouts
  averagePayoutLatency: number;
  payoutFailures: number;

  // Liquidity
  liquidityRatio: number;
  availableBalance: number;
  pendingBalance: number;

  // Webhooks
  webhookFailureRate: number;

  // Disputes
  disputeCount: number;
}

export async function getDashboardMetrics(
  window: string
): Promise<DashboardMetrics> {
  const paymentSuccesses = metrics.get('checkout_success', window);

  return {
    paymentSuccessRate: calculatePaymentSuccessRate(window),
    paymentVolume: paymentSuccesses.length,
    averageOrderValue:
      paymentSuccesses.reduce((sum, p) => sum + p.value, 0) /
        paymentSuccesses.length || 0,

    gmvTotal:
      metrics.get('gmv', window).reduce((sum, p) => sum + p.value, 0),
    gmvByRegion: aggregateByLabel('gmv', 'region', window),
    gmvByCurrency: aggregateByLabel('gmv', 'currency', window),

    conversionByMethod: {
      stripe: calculateConversionRate('stripe', window),
      paypal: calculateConversionRate('paypal', window),
    },

    refundRate: calculateRefundRate(window),
    refundCount: metrics.get('refund_count', window).length,

    averagePayoutLatency: getAveragePayoutLatency(window) || 0,
    payoutFailures: metrics.get('payout_failures', window).length,

    liquidityRatio:
      metrics.aggregate('liquidity_ratio', window)?.avg || 0,
    availableBalance:
      metrics.aggregate('liquidity_available', window)?.sum || 0,
    pendingBalance:
      metrics.aggregate('liquidity_pending', window)?.sum || 0,

    webhookFailureRate: calculateWebhookFailureRate(window),

    disputeCount: metrics.get('dispute_count', window).length,
  };
}

function aggregateByLabel(
  metricName: string,
  labelKey: string,
  window: string
): Record<string, number> {
  const points = metrics.get(metricName, window);
  const result: Record<string, number> = {};

  points.forEach((point) => {
    const labelValue = point.labels?.[labelKey];
    if (labelValue) {
      result[labelValue] = (result[labelValue] || 0) + point.value;
    }
  });

  return result;
}

function calculateConversionRate(
  paymentMethod: string,
  window: string
): number {
  const attempts = metrics
    .get('checkout_attempts', window)
    .filter((p) => p.labels?.payment_method === paymentMethod);

  const successes = metrics
    .get('checkout_success', window)
    .filter((p) => p.labels?.payment_method === paymentMethod);

  if (attempts.length === 0) return 0;

  return (successes.length / attempts.length) * 100;
}

