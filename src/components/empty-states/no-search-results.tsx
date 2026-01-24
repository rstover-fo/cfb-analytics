'use client';

import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';

interface NoSearchResultsProps extends Omit<EmptyStateProps, 'preset'> {
  /** Callback to clear filters */
  onClearFilters?: () => void;
  /** Callback to reset search */
  onResetSearch?: () => void;
  /** The search query that produced no results */
  searchQuery?: string;
}

export function NoSearchResults({
  onClearFilters,
  onResetSearch,
  searchQuery,
  description,
  ...props
}: NoSearchResultsProps) {
  const defaultDescription = searchQuery
    ? `No results found for "${searchQuery}". Try adjusting your search or filters.`
    : 'Try adjusting your search or filter criteria.';

  return (
    <EmptyState
      preset="no-results"
      description={description ?? defaultDescription}
      action={
        onClearFilters
          ? { label: 'Clear filters', onClick: onClearFilters, variant: 'outline' }
          : undefined
      }
      secondaryAction={
        onResetSearch
          ? { label: 'Reset search', onClick: onResetSearch, variant: 'ghost' }
          : undefined
      }
      {...props}
    />
  );
}
