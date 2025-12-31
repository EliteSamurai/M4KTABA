'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportError, reportApiError } from '@/lib/errorReporting';

export default function TestErrorPage() {
  const [isLoading, setIsLoading] = useState(false);

  const triggerReactError = () => {
    setIsLoading(true);
    // This will be caught by ErrorBoundary
    setTimeout(() => {
      throw new Error('Test React Error - triggered manually for testing');
    }, 100);
  };

  const triggerJavaScriptError = () => {
    try {
      // This will be caught by global error handler
      setTimeout(() => {
        // @ts-ignore - intentional error
        nonExistentFunction();
      }, 100);
    } catch (error) {
      console.log('Caught synchronously:', error);
    }
  };

  const triggerPromiseRejection = () => {
    // This will be caught by unhandledrejection handler
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Test Promise Rejection - triggered manually for testing'));
      }, 100);
    });
  };

  const triggerApiError = async () => {
    try {
      // This will report an API error
      const response = await fetch('/api/non-existent-endpoint');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      reportApiError(error, '/api/non-existent-endpoint', {
        testType: 'manual_api_error_test',
        timestamp: new Date().toISOString()
      });
    }
  };

  const triggerCustomError = () => {
    reportError({
      message: 'Custom Test Error - manually reported',
      type: 'javascript_error',
      severity: 'low',
      additionalData: {
        testType: 'custom_error_test',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  };

  const testApiDirectly = async () => {
    try {
      const response = await fetch('/api/test-error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Direct API test - should send email',
          timestamp: new Date().toISOString(),
          testType: 'direct_api_test'
        }),
      });

      const result = await response.json();
      console.log('API Test Result:', result);

      if (response.ok) {
        alert('API test successful! Check your email.');
      } else {
        alert('API test failed: ' + result.error);
      }
    } catch (error) {
      console.error('API test failed:', error);
      alert('API test failed: ' + error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Error Reporting Test Page</CardTitle>
          <CardDescription>
            Test the error reporting system. Each button will trigger a different type of error
            and send a report to the admin email. Use this to verify the system is working.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={triggerReactError}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              🚨 Trigger React Error (ErrorBoundary)
            </Button>

            <Button
              onClick={triggerJavaScriptError}
              variant="destructive"
              className="w-full"
            >
              🐛 Trigger JavaScript Error (Global Handler)
            </Button>

            <Button
              onClick={triggerPromiseRejection}
              variant="destructive"
              className="w-full"
            >
              ⏰ Trigger Promise Rejection (Global Handler)
            </Button>

            <Button
              onClick={triggerApiError}
              variant="destructive"
              className="w-full"
            >
              🌐 Trigger API Error (Manual Report)
            </Button>

            <Button
              onClick={triggerCustomError}
              variant="secondary"
              className="w-full"
            >
              📝 Trigger Custom Error Report
            </Button>

            <Button
              onClick={testApiDirectly}
              variant="outline"
              className="w-full"
            >
              🔗 Test API Directly (Bypass Error Handler)
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">📧 What to Expect</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Each button click should send an error report to your admin email</li>
              <li>• Reports include error details, stack traces, and user context</li>
              <li>• React errors will also show the error boundary UI</li>
              <li>• Check your email (configured in ADMIN_EMAIL) for notifications</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">⚠️ Important</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This is a test page. Remove <code>/app/test-error/page.tsx</code> from production after testing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
