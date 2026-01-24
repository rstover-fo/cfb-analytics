'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query provider with devtools for development.
 *
 * This component:
 * - Provides the QueryClient to all descendant components
 * - Adds React Query Devtools in development mode
 * - Handles SSR hydration correctly
 *
 * Usage in layout.tsx:
 *   <QueryProvider>
 *     {children}
 *   </QueryProvider>
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Get the singleton client (creates new on server, reuses on client)
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
