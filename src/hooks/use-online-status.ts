'use client';

import * as React from 'react';

/**
 * Hook to track browser online/offline status.
 *
 * @returns Object with:
 *   - isOnline: Current online status (true when connected)
 *   - isOffline: Inverse of isOnline for convenience
 *
 * Note: Returns undefined initially during SSR/hydration,
 * then updates to actual status on client.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline: isOnline ?? true, // Default to true during SSR
    isOffline: isOnline === false,
  };
}
