'use client';

import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';

interface NoRecruitsProps extends Omit<EmptyStateProps, 'preset'> {
  /** Callback to clear filters */
  onClearFilters?: () => void;
  /** Callback to view all years */
  onViewAllYears?: () => void;
  /** Current recruiting year */
  year?: number;
  /** Position filter that was applied */
  position?: string;
}

export function NoRecruits({
  onClearFilters,
  onViewAllYears,
  year,
  position,
  description,
  ...props
}: NoRecruitsProps) {
  let defaultDescription = 'No recruiting data matches your current criteria.';

  if (year && position) {
    defaultDescription = `No ${position} recruits found for the ${year} class.`;
  } else if (year) {
    defaultDescription = `No recruits found for the ${year} class with current filters.`;
  } else if (position) {
    defaultDescription = `No ${position} recruits found matching your criteria.`;
  }

  return (
    <EmptyState
      preset="no-recruits"
      description={description ?? defaultDescription}
      action={
        onClearFilters
          ? { label: 'Clear filters', onClick: onClearFilters, variant: 'outline' }
          : undefined
      }
      secondaryAction={
        onViewAllYears
          ? { label: 'View all years', onClick: onViewAllYears, variant: 'ghost' }
          : undefined
      }
      {...props}
    />
  );
}
