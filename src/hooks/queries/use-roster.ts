'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  RosterPlayer,
  PositionRosterGroup,
  ExperienceBreakdown,
  ScholarshipCount,
  RosterSummary,
} from '@/lib/db';

/**
 * Fetches roster summary for a season.
 */
async function fetchRosterSummary(season?: number): Promise<RosterSummary> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`/api/roster/summary${params}`);
  if (!res.ok) throw new Error('Failed to fetch roster summary');
  return res.json();
}

/**
 * Fetches all roster players for a season.
 */
async function fetchRosterPlayers(season?: number): Promise<RosterPlayer[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`/api/roster/players${params}`);
  if (!res.ok) throw new Error('Failed to fetch roster');
  return res.json();
}

/**
 * Fetches roster by position for a season.
 */
async function fetchRosterByPosition(season?: number): Promise<PositionRosterGroup[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`/api/roster/positions${params}`);
  if (!res.ok) throw new Error('Failed to fetch roster by position');
  return res.json();
}

/**
 * Fetches experience breakdown for a season.
 */
async function fetchExperienceBreakdown(season?: number): Promise<ExperienceBreakdown[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`/api/roster/experience${params}`);
  if (!res.ok) throw new Error('Failed to fetch experience breakdown');
  return res.json();
}

/**
 * Fetches scholarship count for a season.
 */
async function fetchScholarshipCount(season?: number): Promise<ScholarshipCount> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`/api/roster/scholarships${params}`);
  if (!res.ok) throw new Error('Failed to fetch scholarship count');
  return res.json();
}

/**
 * Fetches available roster years.
 */
async function fetchAvailableYears(): Promise<number[]> {
  const res = await fetch('/api/roster/years');
  if (!res.ok) throw new Error('Failed to fetch available years');
  return res.json();
}

/**
 * Hook to fetch roster summary.
 */
export function useRosterSummary(season?: number) {
  return useQuery({
    queryKey: [...queryKeys.roster.byTeam('Oklahoma', season), 'summary'],
    queryFn: () => fetchRosterSummary(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch all roster players.
 */
export function useRosterPlayers(season?: number) {
  return useQuery({
    queryKey: queryKeys.roster.byTeam('Oklahoma', season),
    queryFn: () => fetchRosterPlayers(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Suspense-enabled hook for roster players.
 */
export function useRosterPlayersSuspense(season?: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.roster.byTeam('Oklahoma', season),
    queryFn: () => fetchRosterPlayers(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch roster grouped by position.
 */
export function useRosterByPosition(season?: number) {
  return useQuery({
    queryKey: [...queryKeys.roster.byTeam('Oklahoma', season), 'byPosition'],
    queryFn: () => fetchRosterByPosition(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch experience breakdown.
 */
export function useExperienceBreakdown(season?: number) {
  return useQuery({
    queryKey: [...queryKeys.roster.byTeam('Oklahoma', season), 'experience'],
    queryFn: () => fetchExperienceBreakdown(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch scholarship count.
 */
export function useScholarshipCount(season?: number) {
  return useQuery({
    queryKey: [...queryKeys.roster.byTeam('Oklahoma', season), 'scholarships'],
    queryFn: () => fetchScholarshipCount(season),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch available roster years.
 */
export function useAvailableRosterYears() {
  return useQuery({
    queryKey: [...queryKeys.roster.all, 'years'],
    queryFn: fetchAvailableYears,
    staleTime: STALE_TIMES.static,
  });
}
