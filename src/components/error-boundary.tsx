'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * React Error Boundary for client-side error handling.
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 *
 * Note: This only catches client-side errors. Server component
 * errors are handled by error.tsx files at route boundaries.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for support reference
    const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with context for debugging
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    } else {
      // In production, log structured error for monitoring
      console.error(
        JSON.stringify({
          type: 'client_error',
          errorId: this.state.errorId,
          message: error.message,
          name: error.name,
          timestamp: new Date().toISOString(),
          // Don't include stack in production logs
        })
      );
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDev ? (
                // Development: Show full error details
                <>
                  <div className="bg-destructive/10 rounded-md p-3">
                    <p className="text-destructive font-mono text-sm">
                      {this.state.error?.name}: {this.state.error?.message}
                    </p>
                  </div>
                  {this.state.error?.stack && (
                    <details className="text-sm">
                      <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="bg-muted mt-2 max-h-48 overflow-auto rounded-md p-2 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </>
              ) : (
                // Production: User-friendly message
                <>
                  <p className="text-muted-foreground">
                    We encountered an unexpected error. Please try again, or return to the home
                    page.
                  </p>
                  {this.state.errorId && (
                    <p className="text-muted-foreground text-xs">
                      Error ID: <code className="bg-muted rounded px-1">{this.state.errorId}</code>
                    </p>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
