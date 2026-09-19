/**
 * Minimal Slack notification helper for runtime alerts.
 *
 * Reuses the same SLACK_WEBHOOK_URL proven in the CI deploy pipeline. This is
 * the ONLY runtime path that posts to Slack — the legacy observability alert
 * engine (lib/observability/alerts.ts) is dead code (no worker ever starts the
 * monitor loop), so this provides the actual human-notification path for the
 * payment-safety systems.
 *
 * Every call is best-effort fire-and-forget: a failure to reach Slack (network,
 * webhook down, bad URL) is logged and swallowed — it NEVER throws, so a
 * broken notification can never break the payment flow it is attached to.
 */
export async function notifySlack(opts: {
  text: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  title?: string;
  footer?: string;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // Not configured → silent (matches deploy-step behavior)

  const color = {
    critical: '#FF0000',
    high: '#FF6600',
    medium: '#FFAA00',
    low: '#999999',
  }[opts.severity || 'medium'];

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
            title: opts.title || 'M4KTABA Payment Alert',
            text: opts.text,
            fields: [
              {
                title: 'Severity',
                value: (opts.severity || 'medium').toUpperCase(),
                short: true,
              },
            ],
            footer: opts.footer || 'M4KTABA',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    // Never propagate — a broken notification must not break the caller.
    console.error('Failed to send Slack notification:', error);
  }
}
