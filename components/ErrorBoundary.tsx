'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className='rounded-md border bg-card p-6 text-card-foreground'>
          <h3 className='text-lg font-semibold'>Something went wrong</h3>
          <p className='mt-2 text-sm text-muted-foreground'>
            Please try again. If the problem persists, contact support.
          </p>
          <div className='mt-4'>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
