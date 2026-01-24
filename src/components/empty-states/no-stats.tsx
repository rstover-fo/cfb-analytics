'use client';

import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';

interface NoStatsProps extends Omit<EmptyStateProps, 'preset'> {
  /** Callback to select a different game/season */
  onSelectDifferent?: () => void;
  /** Type of stats that are missing */
  statsType?: string;
}

export function NoStats({ onSelectDifferent, statsType, description, ...props }: NoStatsProps) {
  const defaultDescription = statsType
    ? `${statsType} statistics are not available for this selection.`
    : 'Statistics for this selection are not yet available.';

  return (
    <EmptyState
      preset="no-stats"
      description={description ?? defaultDescription}
      action={
        onSelectDifferent
          ? { label: 'Select different game', onClick: onSelectDifferent, variant: 'outline' }
          : undefined
      }
      {...props}
    />
  );
}
