'use client';

import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';

interface NoGamesProps extends Omit<EmptyStateProps, 'preset'> {
  /** Callback to view all seasons */
  onViewAllSeasons?: () => void;
  /** Callback to clear filters */
  onClearFilters?: () => void;
  /** Current season being viewed */
  season?: number;
}

export function NoGames({
  onViewAllSeasons,
  onClearFilters,
  season,
  description,
  ...props
}: NoGamesProps) {
  const defaultDescription = season
    ? `No games found for the ${season} season with current filters.`
    : 'There are no games matching your current filters.';

  return (
    <EmptyState
      preset="no-games"
      description={description ?? defaultDescription}
      action={
        onClearFilters
          ? { label: 'Clear filters', onClick: onClearFilters, variant: 'outline' }
          : undefined
      }
      secondaryAction={
        onViewAllSeasons
          ? { label: 'View all seasons', onClick: onViewAllSeasons, variant: 'ghost' }
          : undefined
      }
      {...props}
    />
  );
}
