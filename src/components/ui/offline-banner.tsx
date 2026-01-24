'use client';

import * as React from 'react';
import { WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface OfflineBannerProps extends React.ComponentProps<'div'> {
  /** Custom message to display */
  message?: string;
}

/**
 * Non-intrusive banner that appears when the user goes offline.
 *
 * Features:
 * - Smooth slide-in/out animation
 * - aria-live for screen reader announcement
 * - Respects prefers-reduced-motion
 * - Auto-hides when back online
 */
function OfflineBanner({
  className,
  message = "You're offline. Some features may be unavailable.",
  ...props
}: OfflineBannerProps) {
  const { isOffline } = useOnlineStatus();
  const [showBanner, setShowBanner] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isOffline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Small delay before hiding to show "back online" state briefly
      timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 2000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOffline, wasOffline]);

  // Don't render anything if never went offline
  if (!showBanner && !wasOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="offline-banner"
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2',
        'flex items-center gap-2 rounded-full px-4 py-2 shadow-lg',
        'text-sm font-medium',
        'motion-safe:transition-all motion-safe:duration-300',
        isOffline
          ? 'bg-destructive text-destructive-foreground translate-y-0 opacity-100'
          : 'translate-y-0 bg-green-600 text-white opacity-100',
        !showBanner && 'pointer-events-none translate-y-4 opacity-0',
        className
      )}
      {...props}
    >
      {isOffline ? (
        <>
          <WifiOff className="size-4" aria-hidden="true" />
          <span>{message}</span>
        </>
      ) : (
        <span>Back online</span>
      )}
    </div>
  );
}

export { OfflineBanner, type OfflineBannerProps };
