'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error page for handling server component errors.
 *
 * This catches errors in server components that the React
 * ErrorBoundary cannot catch. It provides the same UX as
 * the client-side error boundary.
 *
 * The `digest` property is a hash of the error that can be
 * used to look up the error in server logs.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error for monitoring
    if (isDev) {
      console.error('Server error caught by error.tsx:', error);
    } else {
      console.error(
        JSON.stringify({
          type: 'server_error',
          digest: error.digest,
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [error, isDev]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

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
                  {error.name}: {error.message}
                </p>
              </div>
              {error.stack && (
                <details className="text-sm">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
                    Stack trace
                  </summary>
                  <pre className="bg-muted mt-2 max-h-48 overflow-auto rounded-md p-2 text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </>
          ) : (
            // Production: User-friendly message
            <>
              <p className="text-muted-foreground">
                We encountered an unexpected error while loading this page. Please try again, or
                return to the home page.
              </p>
              {error.digest && (
                <p className="text-muted-foreground text-xs">
                  Error ID: <code className="bg-muted rounded px-1">{error.digest}</code>
                </p>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
