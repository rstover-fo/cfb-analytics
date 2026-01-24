import { QueryClient } from '@tanstack/react-query';

/**
 * Stale time configuration by data type.
 * These values determine how long data is considered "fresh" before
 * React Query will refetch it in the background.
 */
export const STALE_TIMES = {
  /** Historical game/stats data - changes rarely */
  historical: 24 * 60 * 60 * 1000, // 24 hours
  /** Recruiting data - updated periodically */
  recruiting: 60 * 60 * 1000, // 1 hour
  /** Live schedule/game data - needs to be fresh */
  live: 5 * 60 * 1000, // 5 minutes
  /** Static reference data (teams, conferences) */
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Default retry configuration with exponential backoff.
 */
function defaultRetry(failureCount: number, error: unknown): boolean {
  // Don't retry on 4xx errors (client errors)
  if (error instanceof Error && error.message.includes('4')) {
    return false;
  }
  // Retry up to 3 times on server/network errors
  return failureCount < 3;
}

/**
 * Calculate retry delay with exponential backoff.
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Create a new QueryClient with sensible defaults for CFB Analytics.
 *
 * This is called once per request on the server, and once on the client.
 * The client instance is shared across the app.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 5 minutes by default
        staleTime: STALE_TIMES.live,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests with exponential backoff
        retry: defaultRetry,
        retryDelay,
        // Don't refetch on window focus by default (noisy for data-heavy app)
        refetchOnWindowFocus: false,
        // Refetch on reconnect to ensure fresh data after offline
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Singleton QueryClient for client-side usage.
 * Ensures we don't create a new client on every render.
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get the QueryClient for the current environment.
 * On the server, creates a new client per request.
 * On the client, returns a singleton.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }
  // Browser: use singleton
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
