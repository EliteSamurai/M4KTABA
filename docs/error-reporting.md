# Error Reporting System

## Overview

M4KTABA includes a comprehensive error reporting system that automatically captures and reports errors to administrators for debugging and monitoring.

## Features

### Automatic Error Capture
- **React Errors**: Captured by ErrorBoundary components
- **JavaScript Errors**: Global error handlers for uncaught errors
- **Promise Rejections**: Unhandled promise rejections
- **API Errors**: Can be manually reported using utility functions

### Error Classification
- **Type**: `react_error`, `javascript_error`, `api_error`, `promise_rejection`
- **Severity**: `low`, `medium`, `high`, `critical`

### Data Collected
- Error message and stack trace
- Component stack (for React errors)
- URL and user agent
- User information (if authenticated)
- Timestamp
- Additional context data

## Implementation

### Error Boundary
Wraps the entire application in `app/layout.tsx` to catch React component errors.

```tsx
<ErrorBoundary>
  {/* App content */}
</ErrorBoundary>
```

### Global Error Handlers
Initialized in `ErrorReportingInitializer` component:
- `window.onerror` for JavaScript errors
- `window.onunhandledrejection` for promise rejections
- Console error interception (optional)

### API Endpoint
`/api/error-report` receives error reports and sends admin emails.

## Usage

### Manual Error Reporting

```typescript
import { reportError, reportApiError, withErrorReporting } from '@/lib/errorReporting';

// Report a custom error
reportError({
  message: 'Custom error message',
  type: 'api_error',
  severity: 'medium',
  additionalData: { userId: '123' }
});

// Report API errors
try {
  await apiCall();
} catch (error) {
  reportApiError(error, '/api/endpoint', { userId: '123' });
}

// Wrap operations with error reporting
const result = await withErrorReporting(
  () => apiCall(),
  {
    operation: 'user_signup',
    severity: 'high',
    additionalData: { email: 'user@example.com' }
  }
);
```

### Error Boundary Usage

The ErrorBoundary automatically catches React errors. For custom error boundaries:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

## Configuration

### Environment Variables
- `ADMIN_EMAIL`: Primary email for error reports
- `ALERT_EMAIL`: Fallback email for alerts
- `RESEND_API_KEY`: Required for sending emails

### Email Templates
Error reports use specialized HTML templates with:
- Clear error classification
- Formatted stack traces
- User context information
- Timestamps and URLs

## Error Report Format

```json
{
  "message": "Error message",
  "stack": "Stack trace...",
  "componentStack": "React component stack...",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "url": "https://m4ktaba.com/page",
  "userAgent": "Mozilla/5.0...",
  "type": "react_error",
  "severity": "high",
  "userId": "user123",
  "userEmail": "user@example.com",
  "additionalData": {
    "context": "additional info"
  }
}
```

## Monitoring

Error reports are sent via email to administrators. Each report includes:
- 🚨 Clear visual indicators for errors
- Detailed error information
- User context (when available)
- Environment details

## Privacy Considerations

- User emails are included only when users are authenticated
- Sensitive data is not automatically collected
- Stack traces may contain sensitive information - review before sharing

## Testing

To test error reporting:

1. Trigger a React error:
```typescript
throw new Error('Test error');
```

2. Check admin email for error report
3. Verify error details are correctly formatted

## Future Enhancements

- Integration with error monitoring services (Sentry, Bugsnag)
- Error aggregation and analytics
- User impact assessment
- Automatic error resolution suggestions
