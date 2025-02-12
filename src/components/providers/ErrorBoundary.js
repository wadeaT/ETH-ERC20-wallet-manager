// src/components/ErrorBoundary.js
'use client';


/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * This component is a critical part of handling unexpected errors in a React application.
 */


import { Component } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 bg-destructive/10 text-destructive">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={32} />
            <div>
              <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="outline"
                size="sm"
              >
                Try again
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}