import { notifySlack } from '@/lib/notify';

describe('notifySlack', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SLACK_WEBHOOK_URL;
    global.fetch = jest.fn() as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('posts the correct payload shape to SLACK_WEBHOOK_URL', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T/B/X';
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({ ok: true });

    await notifySlack({
      severity: 'critical',
      title: '⚠️ Test Alert',
      text: 'a test message',
      footer: 'Test',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/services/T/B/X');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(init.body);
    expect(body.username).toBe('M4KTABA Alerts');
    expect(body.icon_emoji).toBe(':rotating_light:');
    expect(body.attachments).toHaveLength(1);
    const att = body.attachments[0];
    expect(att.color).toBe('#FF0000'); // critical
    expect(att.title).toBe('⚠️ Test Alert');
    expect(att.text).toBe('a test message');
    expect(att.footer).toBe('Test');
    expect(att.fields).toEqual([
      { title: 'Severity', value: 'CRITICAL', short: true },
    ]);
  });

  it('uses medium severity color when none provided', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T/B/X';
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({ ok: true });

    await notifySlack({ text: 'plain message' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.attachments[0].color).toBe('#FFAA00'); // medium
    expect(body.attachments[0].fields).toEqual([
      { title: 'Severity', value: 'MEDIUM', short: true },
    ]);
  });

  it('does nothing (no fetch) when SLACK_WEBHOOK_URL is unset', async () => {
    const mockFetch = global.fetch as jest.Mock;
    await notifySlack({ text: 'no config' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('NEVER throws or propagates when the Slack POST fails (network error)', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T/B/X';
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValue(new Error('ECONNRESET: webhook down'));

    // Must resolve (not reject) — a broken notification must not break the
    // payment flow it is attached to.
    await expect(
      notifySlack({ text: 'this should not throw' })
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to send Slack notification:',
      expect.any(Error)
    );
  });
});
