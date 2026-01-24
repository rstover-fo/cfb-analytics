/**
 * Contextual empty state components for common scenarios.
 *
 * These are convenience wrappers around the base EmptyState component
 * with preset configurations and relevant CTAs.
 */

export { NoSearchResults } from './no-search-results';
export { NoGames } from './no-games';
export { NoStats } from './no-stats';
export { NoRecruits } from './no-recruits';

// Re-export base component for custom use cases
export { EmptyState } from '@/components/ui/empty-state';
export type {
  EmptyStateProps,
  EmptyStatePreset,
  EmptyStateAction,
} from '@/components/ui/empty-state';
