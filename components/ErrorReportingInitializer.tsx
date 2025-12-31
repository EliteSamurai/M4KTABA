'use client';

import { useEffect } from 'react';
import { initializeErrorReporting } from '@/lib/errorReporting';

export function ErrorReportingInitializer() {
  useEffect(() => {
    initializeErrorReporting();
  }, []);

  return null; // This component doesn't render anything
}
