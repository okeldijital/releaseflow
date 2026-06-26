'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@releaseflow/ui';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-lg font-semibold text-text-900 mb-2">Something went wrong</p>
          <p className="text-sm text-text-500 mb-4">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>Try Again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
