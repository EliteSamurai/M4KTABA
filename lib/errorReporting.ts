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
  try {
    const errorReport = {
      ...details,
      timestamp: details.timestamp || new Date().toISOString(),
      url: details.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
      userAgent: details.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'),
    };

    const response = await fetch('/api/error-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });

    if (!response.ok) {
      console.error('Failed to report error:', response.statusText);
    }
  } catch (error) {
    console.error('Error reporting failed:', error);
  }
}

/**
 * Initialize global error handlers
 */
export function initializeErrorReporting(): void {
  if (typeof window === 'undefined') return;

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
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
    reportError({
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      type: 'promise_rejection',
      severity: 'high',
      additionalData: {
        reason: event.reason,
      },
    });
  });

  // Handle console errors (optional - can be noisy)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);

    // Report critical console errors
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Error')) {
      reportError({
        message: args.join(' '),
        type: 'javascript_error',
        severity: 'medium',
        additionalData: {
          consoleArgs: args,
        },
      });
    }
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
  reportError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || undefined,
    type: 'react_error',
    severity: 'high',
  });
}
