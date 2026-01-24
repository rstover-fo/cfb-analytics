'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary that catches errors in the root layout.
 *
 * This component must render its own <html> and <body> tags because
 * it replaces the entire document when the root layout fails.
 *
 * Styling is inline because the global CSS may not load if the
 * root layout itself has errored.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error
    console.error('Global error caught:', error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '1.5rem',
            margin: '1rem',
            backgroundColor: '#171717',
            borderRadius: '0.5rem',
            border: '1px solid #262626',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1rem',
                backgroundColor: '#450a0a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '0 0 0.5rem',
                color: '#ef4444',
              }}
            >
              Application Error
            </h1>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {isDev ? (
              <>
                <div
                  style={{
                    backgroundColor: '#450a0a',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: '#ef4444',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {error.name}: {error.message}
                  </p>
                </div>
                {error.stack && (
                  <details style={{ fontSize: '0.875rem' }}>
                    <summary
                      style={{
                        color: '#a3a3a3',
                        cursor: 'pointer',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Stack trace
                    </summary>
                    <pre
                      style={{
                        backgroundColor: '#262626',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: '12rem',
                        margin: 0,
                      }}
                    >
                      {error.stack}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <>
                <p style={{ color: '#a3a3a3', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                  A critical error occurred while loading the application. Please try refreshing the
                  page.
                </p>
                {error.digest && (
                  <p style={{ color: '#737373', fontSize: '0.75rem', margin: 0 }}>
                    Error ID:{' '}
                    <code
                      style={{
                        backgroundColor: '#262626',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      {error.digest}
                    </code>
                  </p>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                backgroundColor: '#fafafa',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Try again
            </button>
            <button
              onClick={handleGoHome}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#fafafa',
                border: '1px solid #404040',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
