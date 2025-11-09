/**
 * Observability Alerts Configuration
 * Defines alert thresholds and notification rules
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  window: string; // e.g., '1h', '5m', '24h'
  enabled: boolean;
  notificationChannels: ('slack' | 'email' | 'pagerduty')[];
}

export const ALERT_RULES: AlertRule[] = [
  // Payment Success Rate Drop
  {
    id: 'payment_success_rate_drop',
    name: 'Payment Success Rate Drop',
    description: 'Payment success rate dropped by more than 3% in 1 hour',
    severity: 'critical',
    metric: 'payment_success_rate_drop',
    condition: 'gt',
    threshold: 3, // 3% drop
    window: '1h',
    enabled: true,
    notificationChannels: ['slack', 'pagerduty'],
  },

  // Webhook Failure Rate
  {
    id: 'webhook_failure_rate_high',
    name: 'High Webhook Failure Rate',
    description: 'Webhook failure rate exceeds 1% in 5-minute window',
    severity: 'high',
    metric: 'webhook_failure_rate',
    condition: 'gt',
    threshold: 1, // 1%
    window: '5m',
    enabled: true,
    notificationChannels: ['slack', 'email'],
  },

  // Payout Failures
  {
    id: 'payout_failures_multiple_sellers',
    name: 'Multiple Payout Failures',
    description: 'Payout failures for 5 or more sellers in 1 hour',
    severity: 'critical',
    metric: 'payout_failures_count',
    condition: 'gte',
    threshold: 5,
    window: '1h',
    enabled: true,
    notificationChannels: ['slack', 'pagerduty', 'email'],
  },

  // High Refund Rate
  {
    id: 'high_refund_rate',
    name: 'High Refund Rate',
    description: 'Refund rate exceeds 5% of payments in 24 hours',
    severity: 'high',
    metric: 'refund_rate',
    condition: 'gt',
    threshold: 5, // 5%
    window: '24h',
    enabled: true,
    notificationChannels: ['slack', 'email'],
  },

  // Payout Cron Job Errors
  {
    id: 'payout_cron_errors',
    name: 'Payout Cron Job Errors',
    description: 'Errors detected in automated payout cron job',
    severity: 'critical',
    metric: 'payout_cron_error_count',
    condition: 'gt',
    threshold: 0,
    window: '1h',
    enabled: true,
    notificationChannels: ['slack', 'pagerduty'],
  },

  // High Dispute Volume Per Seller
  {
    id: 'high_dispute_volume_per_seller',
    name: 'High Dispute Volume',
    description: 'Seller has more than 3 disputes in 7 days',
    severity: 'high',
    metric: 'dispute_count_per_seller',
    condition: 'gt',
    threshold: 3,
    window: '7d',
    enabled: true,
    notificationChannels: ['slack', 'email'],
  },

  // Payment Processing Latency
  {
    id: 'payment_processing_slow',
    name: 'Slow Payment Processing',
    description: 'Payment processing time exceeds 10 seconds',
    severity: 'medium',
    metric: 'payment_processing_latency_p95',
    condition: 'gt',
    threshold: 10000, // 10 seconds in ms
    window: '5m',
    enabled: true,
    notificationChannels: ['slack'],
  },

  // Webhook Processing Backlog
  {
    id: 'webhook_backlog',
    name: 'Webhook Processing Backlog',
    description: 'Webhook queue has more than 100 pending events',
    severity: 'medium',
    metric: 'webhook_queue_size',
    condition: 'gt',
    threshold: 100,
    window: '5m',
    enabled: true,
    notificationChannels: ['slack'],
  },

  // Low Liquidity Warning
  {
    id: 'low_liquidity',
    name: 'Low Liquidity',
    description: 'Available balance is less than 10% of pending payouts',
    severity: 'medium',
    metric: 'liquidity_ratio',
    condition: 'lt',
    threshold: 0.1, // 10%
    window: '1h',
    enabled: true,
    notificationChannels: ['email'],
  },

  // High Cart Abandonment
  {
    id: 'high_cart_abandonment',
    name: 'High Cart Abandonment',
    description: 'Cart abandonment rate exceeds 80%',
    severity: 'medium',
    metric: 'cart_abandonment_rate',
    condition: 'gt',
    threshold: 80,
    window: '1h',
    enabled: true,
    notificationChannels: ['slack'],
  },
];

/**
 * Alert evaluation function
 */
export async function evaluateAlert(
  rule: AlertRule,
  currentValue: number
): Promise<boolean> {
  let triggered = false;

  switch (rule.condition) {
    case 'gt':
      triggered = currentValue > rule.threshold;
      break;
    case 'lt':
      triggered = currentValue < rule.threshold;
      break;
    case 'gte':
      triggered = currentValue >= rule.threshold;
      break;
    case 'lte':
      triggered = currentValue <= rule.threshold;
      break;
    case 'eq':
      triggered = currentValue === rule.threshold;
      break;
  }

  if (triggered) {
    await sendAlert(rule, currentValue);
  }

  return triggered;
}

/**
 * Send alert to configured channels
 */
async function sendAlert(rule: AlertRule, value: number): Promise<void> {
  const message = formatAlertMessage(rule, value);

  for (const channel of rule.notificationChannels) {
    switch (channel) {
      case 'slack':
        await sendSlackAlert(rule, message);
        break;
      case 'email':
        await sendEmailAlert(rule, message);
        break;
      case 'pagerduty':
        await sendPagerDutyAlert(rule, message);
        break;
    }
  }

  // Log alert
  console.error(`🚨 ALERT [${rule.severity.toUpperCase()}]: ${message}`);
}

/**
 * Format alert message
 */
function formatAlertMessage(rule: AlertRule, value: number): string {
  return `${rule.name}: ${rule.description}\nCurrent value: ${value}\nThreshold: ${rule.threshold}\nWindow: ${rule.window}`;
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(rule: AlertRule, message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color = {
    critical: '#FF0000',
    high: '#FF6600',
    medium: '#FFAA00',
    low: '#FFFF00',
  }[rule.severity];

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'M4KTABA Alerts',
        icon_emoji: ':rotating_light:',
        attachments: [
          {
            color,
            title: `🚨 ${rule.name}`,
            text: message,
            fields: [
              {
                title: 'Severity',
                value: rule.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Window',
                value: rule.window,
                short: true,
              },
            ],
            footer: 'M4KTABA Observability',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(rule: AlertRule, message: string): Promise<void> {
  const { sendEmail } = await import('../email');

  await sendEmail({
    to: process.env.ALERT_EMAIL || 'alerts@m4ktaba.com',
    subject: `🚨 ${rule.severity.toUpperCase()}: ${rule.name}`,
    html: `
      <h2>Alert Triggered</h2>
      <p><strong>Severity:</strong> ${rule.severity.toUpperCase()}</p>
      <p><strong>Description:</strong> ${rule.description}</p>
      <pre>${message}</pre>
      <p><em>Timestamp: ${new Date().toISOString()}</em></p>
    `,
    text: message,
  });
}

/**
 * Send PagerDuty alert
 */
async function sendPagerDutyAlert(
  rule: AlertRule,
  message: string
): Promise<void> {
  const apiKey = process.env.PAGERDUTY_API_KEY;
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;

  if (!apiKey || !routingKey) return;

  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token=${apiKey}`,
      },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        payload: {
          summary: rule.name,
          severity: rule.severity,
          source: 'M4KTABA',
          custom_details: {
            description: rule.description,
            message,
            rule_id: rule.id,
          },
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send PagerDuty alert:', error);
  }
}

/**
 * Get all enabled alerts
 */
export function getEnabledAlerts(): AlertRule[] {
  return ALERT_RULES.filter((rule) => rule.enabled);
}

/**
 * Get alert by ID
 */
export function getAlertById(id: string): AlertRule | undefined {
  return ALERT_RULES.find((rule) => rule.id === id);
}

