/**
 * Error Reporting Utilities
 * Handles reporting errors to admin for debugging
 */

interface ErrorDetails {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  type: 'react_error' | 'javascript_error' | 'api_error' | 'promise_rejection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  additionalData?: Record<string, any>;
}

/**
 * Report an error to the admin
 */
export async function reportError(details: ErrorDetails): Promise<void> {
  const userAgent =
    details.userAgent ||
    (typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown');

  if (
    !shouldReportClientError(details.message, {
      userAgent,
      stack: details.stack,
    })
  ) {
    return;
  }

  try {
    const errorReport = {
      ...details,
      timestamp: details.timestamp || new Date().toISOString(),
      url: details.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
      userAgent,
    };

    console.log('📤 Sending error report:', errorReport);

    const response = await fetch('/api/error-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });

    console.log('📥 Error report response:', response.status, response.statusText);

    if (!response.ok) {
      console.error('Failed to report error:', response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
    } else {
      console.log('✅ Error report sent successfully');
    }
  } catch (error) {
    console.error('❌ Error reporting failed:', error);
  }
}

function getUserAgent(): string {
  return typeof window !== 'undefined' ? window.navigator.userAgent : '';
}

/** Exported for client components that should skip optional fetches for bots. */
export function isCrawlerUserAgent(userAgent?: string): boolean {
  const ua = (userAgent || getUserAgent()).toLowerCase();
  return /bot|crawler|spider|bingbot|applebot|googlebot|googleother|google-inspectiontool|facebookexternalhit|linkedinbot|slackbot|twitterbot|headless|petalbot|yandexbot|duckduckbot|semrushbot|ahrefsbot|bytespider/i.test(
    ua
  );
}

function extractArgMessage(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.message;
  if (arg && typeof arg === 'object' && 'message' in arg) {
    const message = (arg as { message?: unknown }).message;
    return typeof message === 'string' ? message : '';
  }
  return '';
}

function extractConsoleErrorMessage(args: unknown[]): string {
  return args.map(extractArgMessage).filter(Boolean).join(' ');
}

function isCrossOriginScriptError(
  message: string,
  options?: { filename?: string; lineno?: number; colno?: number }
): boolean {
  const msg = (message || '').trim().toLowerCase();
  if (msg === 'script error.' || msg === 'script error') return true;
  // Browsers sanitize third-party script failures to a generic message with no source
  if (
    (msg === 'script error.' || msg === 'script error') &&
    !options?.filename &&
    (options?.lineno ?? 0) === 0 &&
    (options?.colno ?? 0) === 0
  ) {
    return true;
  }
  return false;
}

function isBenignClientError(
  message: string,
  options?: {
    userAgent?: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  }
): boolean {
  const msg = (message || '').toLowerCase();
  const ua = options?.userAgent || getUserAgent();

  if (isCrawlerUserAgent(ua)) return true;
  if (isCrossOriginScriptError(message, options)) return true;

  if (msg.includes('failed to load chunk')) return true;

  if (
    msg.includes('insertbefore') &&
    (msg.includes('not a child') || msg.includes('notfounderror'))
  ) {
    return true;
  }
  if (
    msg.includes('removechild') &&
    (msg.includes('not a child') || msg.includes('notfounderror'))
  ) {
    return true;
  }

  if (msg.includes('session has expired') || msg.includes('please sign in again')) {
    return true;
  }
  if (msg.includes('complete your stripe setup')) return true;
  if (msg.includes('stripe setup in the billing')) return true;
  if (msg.includes('please complete your stripe')) return true;
  if (msg.includes('failed to fetch')) return true;
  if (msg.includes('error reporting failed')) return true;
  if (msg.includes('error fetching view count')) return true;
  if (msg.includes('error fetching related books')) return true;
  if (msg.includes('error fetching categories')) return true;
  if (msg.includes('error tracking view')) return true;

  return false;
}

function isKnownThirdPartyNoise(message: string, source?: string): boolean {
  const msg = (message || '').toLowerCase();
  const src = (source || '').toLowerCase();
  // Instagram/iOS in-app browser and third-party script noise
  if (msg.includes('webkit.messagehandlers')) return true;
  if (src.includes('facebook.com') || src.includes('connect.facebook.net')) return true;
  if (isBenignClientError(message)) return true;
  return false;
}

function shouldReportClientError(
  message: string,
  options?: {
    userAgent?: string;
    stack?: string;
    source?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  }
): boolean {
  if (isKnownThirdPartyNoise(message, options?.source)) return false;
  if (isBenignClientError(message, options)) return false;
  return true;
}

/**
 * Initialize global error handlers
 */
export function initializeErrorReporting(): void {
  if (typeof window === 'undefined') return;
  if (isCrawlerUserAgent()) return;

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    if (
      !shouldReportClientError(event.message, {
        source: event.filename,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    ) {
      return;
    }
    reportError({
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'javascript_error',
      severity: 'high',
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const rejectionMessage = event.reason?.message || String(event.reason);
    if (
      !shouldReportClientError(rejectionMessage, {
        stack: event.reason?.stack,
      })
    ) {
      return;
    }
    reportError({
      message: rejectionMessage,
      stack: event.reason?.stack,
      type: 'promise_rejection',
      severity: 'high',
      additionalData: {
        reason: event.reason,
        reasonType: typeof event.reason,
        reasonName: event.reason?.name,
      },
    });
  });

  // Handle console errors (optional - can be noisy)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);

    if (args.length === 0) return;

    const first = args[0];
    const message = extractConsoleErrorMessage(args);

    if (!message || !message.toLowerCase().includes('error')) return;
    if (
      !shouldReportClientError(message, {
        stack: first instanceof Error ? first.stack : undefined,
      })
    ) {
      return;
    }

    reportError({
      message,
      type: 'javascript_error',
      severity: 'medium',
      additionalData: {
        consoleArgs: args.map(arg =>
          arg instanceof Error
            ? { name: arg.name, message: arg.message }
            : arg && typeof arg === 'object' && 'message' in arg
              ? {
                  name: 'name' in arg ? String((arg as { name?: unknown }).name) : 'Error',
                  message: String((arg as { message?: unknown }).message),
                }
              : arg
        ),
      },
    });
  };
}

/**
 * Report API errors
 */
export function reportApiError(error: any, endpoint: string, additionalData?: Record<string, any>): void {
  reportError({
    message: error.message || 'API Error',
    stack: error.stack,
    type: 'api_error',
    severity: 'medium',
    additionalData: {
      endpoint,
      status: error.status,
      statusText: error.statusText,
      ...additionalData,
    },
  });
}

/**
 * Create a wrapper for API calls that reports errors
 */
export async function withErrorReporting<T>(
  operation: () => Promise<T>,
  context: {
    operation: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    additionalData?: Record<string, any>;
  }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    reportError({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'api_error',
      severity: context.severity || 'medium',
      additionalData: {
        operation: context.operation,
        ...context.additionalData,
      },
    });

    throw error;
  }
}

/**
 * Report validation errors
 */
export function reportValidationError(message: string, field?: string, additionalData?: Record<string, any>): void {
  reportError({
    message,
    type: 'javascript_error',
    severity: 'low',
    additionalData: {
      field,
      validationError: true,
      ...additionalData,
    },
  });
}

/**
 * Report authentication errors
 */
export function reportAuthError(message: string, additionalData?: Record<string, any>): void {
  reportError({
    message,
    type: 'api_error',
    severity: 'medium',
    additionalData: {
      authError: true,
      ...additionalData,
    },
  });
}

/**
 * Report React component errors (used by ErrorBoundary)
 */
export function reportReactError(error: Error, errorInfo?: React.ErrorInfo): void {
  if (
    !shouldReportClientError(error.message, {
      stack: error.stack,
      userAgent: getUserAgent(),
    })
  ) {
    return;
  }

  reportError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || undefined,
    type: 'react_error',
    severity: 'high',
  });
}
