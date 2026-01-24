/**
 * React Query hooks for data fetching in CFB Analytics.
 *
 * These hooks provide client-side data fetching with caching,
 * background refetching, and optimistic updates via React Query.
 *
 * Usage:
 *   import { useGames, useClassSummary } from '@/hooks/queries';
 *
 * Stale times are configured per data type:
 *   - Historical data: 24 hours
 *   - Recruiting/roster: 1 hour
 *   - Live/schedule: 5 minutes
 *   - Static reference: 7 days
 */

// Games hooks
export {
  useGames,
  useGamesSuspense,
  useAvailableSeasons,
  useGameDetail,
  useGamePlays,
  useGameDrives,
} from './use-games';

// Recruiting hooks
export {
  useClassSummary,
  useClassSummarySuspense,
  useRecruits,
  usePositionBreakdown,
  useRankingHistory,
  useTopRecruits,
  useAvailableRecruitingYears,
} from './use-recruiting';

// Roster hooks
export {
  useRosterSummary,
  useRosterPlayers,
  useRosterPlayersSuspense,
  useRosterByPosition,
  useExperienceBreakdown,
  useScholarshipCount,
  useAvailableRosterYears,
} from './use-roster';

// Stats/metrics hooks
export {
  useSeasonStats,
  useSeasonStatsSuspense,
  useSeasonRecord,
  useWinLossTrends,
  useSeasonEPA,
  useHeadToHead,
  useOpponents,
} from './use-stats';

// Transfer portal hooks
export {
  usePortalDepartures,
  usePortalArrivals,
  usePortalArrivalsSuspense,
  usePortalImpact,
  useAvailablePortalYears,
} from './use-transfers';
