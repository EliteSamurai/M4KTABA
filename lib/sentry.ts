type ErrorContext = Record<string, unknown>;

const isProd =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

export function reportError(error: unknown, context?: ErrorContext) {
  if (!isProd) {
    if (process.env?.SENTRY_DEBUG === '1') {
      console.error('[error]', error, context);
    }
    return;
  }
  try {
    (
      (window as unknown as Record<string, unknown>)?.Sentry as any
    )?.captureException?.(error, {
      extra: context || {},
    });
  } catch {
    // swallow
  }
}
