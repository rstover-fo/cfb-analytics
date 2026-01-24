'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  ClassSummary,
  RecruitDetail,
  PositionBreakdown,
  ClassRankingHistory,
  TopRecruit,
} from '@/lib/db';

/**
 * Fetches recruiting class summary for a year.
 */
async function fetchClassSummary(year: number): Promise<ClassSummary | null> {
  const res = await fetch(`/api/recruiting/class/${year}`);
  if (!res.ok) throw new Error('Failed to fetch class summary');
  return res.json();
}

/**
 * Fetches all recruits for a year.
 */
async function fetchRecruits(year: number): Promise<RecruitDetail[]> {
  const res = await fetch(`/api/recruiting/recruits?year=${year}`);
  if (!res.ok) throw new Error('Failed to fetch recruits');
  return res.json();
}

/**
 * Fetches position breakdown for a year.
 */
async function fetchPositionBreakdown(year: number): Promise<PositionBreakdown[]> {
  const res = await fetch(`/api/recruiting/positions?year=${year}`);
  if (!res.ok) throw new Error('Failed to fetch position breakdown');
  return res.json();
}

/**
 * Fetches recruiting class ranking history.
 */
async function fetchRankingHistory(): Promise<ClassRankingHistory[]> {
  const res = await fetch('/api/recruiting/history');
  if (!res.ok) throw new Error('Failed to fetch ranking history');
  return res.json();
}

/**
 * Fetches top recruits across all years.
 */
async function fetchTopRecruits(limit: number = 10): Promise<TopRecruit[]> {
  const res = await fetch(`/api/recruiting/top?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch top recruits');
  return res.json();
}

/**
 * Fetches available recruiting years.
 */
async function fetchAvailableYears(): Promise<number[]> {
  const res = await fetch('/api/recruiting/years');
  if (!res.ok) throw new Error('Failed to fetch available years');
  return res.json();
}

/**
 * Hook to fetch recruiting class summary for a year.
 */
export function useClassSummary(year: number) {
  return useQuery({
    queryKey: queryKeys.recruiting.classByYear(year),
    queryFn: () => fetchClassSummary(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Suspense-enabled hook for class summary.
 */
export function useClassSummarySuspense(year: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.recruiting.classByYear(year),
    queryFn: () => fetchClassSummary(year),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch all recruits for a year.
 */
export function useRecruits(year: number) {
  return useQuery({
    queryKey: queryKeys.recruiting.byTeam('Oklahoma', { year }),
    queryFn: () => fetchRecruits(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Hook to fetch position breakdown for a year.
 */
export function usePositionBreakdown(year: number) {
  return useQuery({
    queryKey: queryKeys.recruiting.positionGroups('Oklahoma', year),
    queryFn: () => fetchPositionBreakdown(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Hook to fetch recruiting ranking history.
 */
export function useRankingHistory() {
  return useQuery({
    queryKey: queryKeys.recruiting.history('Oklahoma'),
    queryFn: fetchRankingHistory,
    staleTime: STALE_TIMES.historical,
  });
}

/**
 * Hook to fetch top recruits.
 */
export function useTopRecruits(limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.recruiting.all, 'top', limit],
    queryFn: () => fetchTopRecruits(limit),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch available recruiting years.
 */
export function useAvailableRecruitingYears() {
  return useQuery({
    queryKey: [...queryKeys.recruiting.all, 'years'],
    queryFn: fetchAvailableYears,
    staleTime: STALE_TIMES.static,
  });
}
