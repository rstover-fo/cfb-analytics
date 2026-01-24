'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { STALE_TIMES } from '@/lib/query-client';

// Stats interfaces (imported from lib/db/queries in real usage)
interface SeasonStats {
  season: number;
  ppgOffense: number;
  ppgDefense: number;
  totalYards: number;
  yardsPerPlay: number;
  thirdDownPct: number;
}

interface SeasonRecord {
  season: number;
  games: number;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface WinLossTrend {
  season: number;
  wins: number;
  losses: number;
  winPct: number;
}

interface SeasonEPA {
  season: number;
  offenseEPA: number;
  defenseEPA: number;
  netEPA: number;
  passEPA: number;
  rushEPA: number;
}

interface HeadToHeadRecord {
  opponent: string;
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  lastMeeting: string;
}

/**
 * Fetches season stats (PPG, yards, etc).
 */
async function fetchSeasonStats(season: number): Promise<SeasonStats | null> {
  const res = await fetch(`/api/stats/season/${season}`);
  if (!res.ok) throw new Error('Failed to fetch season stats');
  return res.json();
}

/**
 * Fetches season record (W-L, points).
 */
async function fetchSeasonRecord(season: number): Promise<SeasonRecord | null> {
  const res = await fetch(`/api/stats/record/${season}`);
  if (!res.ok) throw new Error('Failed to fetch season record');
  return res.json();
}

/**
 * Fetches win/loss trends across seasons.
 */
async function fetchWinLossTrends(startYear: number, endYear: number): Promise<WinLossTrend[]> {
  const res = await fetch(`/api/stats/trends/wins?start=${startYear}&end=${endYear}`);
  if (!res.ok) throw new Error('Failed to fetch win/loss trends');
  return res.json();
}

/**
 * Fetches EPA metrics for a season.
 */
async function fetchSeasonEPA(season: number): Promise<SeasonEPA | null> {
  const res = await fetch(`/api/stats/epa/${season}`);
  if (!res.ok) throw new Error('Failed to fetch EPA');
  return res.json();
}

/**
 * Fetches head-to-head record against an opponent.
 */
async function fetchHeadToHead(opponent: string): Promise<HeadToHeadRecord | null> {
  const res = await fetch(`/api/stats/rivals/${encodeURIComponent(opponent)}`);
  if (!res.ok) throw new Error('Failed to fetch head-to-head');
  return res.json();
}

/**
 * Fetches list of all opponents.
 */
async function fetchOpponents(): Promise<string[]> {
  const res = await fetch('/api/stats/opponents');
  if (!res.ok) throw new Error('Failed to fetch opponents');
  return res.json();
}

/**
 * Hook to fetch season stats.
 */
export function useSeasonStats(season: number) {
  return useQuery({
    queryKey: queryKeys.stats.team('Oklahoma', season),
    queryFn: () => fetchSeasonStats(season),
    staleTime: STALE_TIMES.historical,
    enabled: season > 0,
  });
}

/**
 * Suspense-enabled hook for season stats.
 */
export function useSeasonStatsSuspense(season: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.stats.team('Oklahoma', season),
    queryFn: () => fetchSeasonStats(season),
    staleTime: STALE_TIMES.historical,
  });
}

/**
 * Hook to fetch season record.
 */
export function useSeasonRecord(season: number) {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'record', season],
    queryFn: () => fetchSeasonRecord(season),
    staleTime: STALE_TIMES.historical,
    enabled: season > 0,
  });
}

/**
 * Hook to fetch win/loss trends.
 */
export function useWinLossTrends(startYear: number, endYear: number) {
  return useQuery({
    queryKey: queryKeys.stats.trends('Oklahoma', { startYear, endYear }),
    queryFn: () => fetchWinLossTrends(startYear, endYear),
    staleTime: STALE_TIMES.historical,
    enabled: startYear > 0 && endYear >= startYear,
  });
}

/**
 * Hook to fetch EPA metrics for a season.
 */
export function useSeasonEPA(season: number) {
  return useQuery({
    queryKey: queryKeys.stats.epa('Oklahoma', season),
    queryFn: () => fetchSeasonEPA(season),
    staleTime: STALE_TIMES.historical,
    enabled: season > 0,
  });
}

/**
 * Hook to fetch head-to-head record.
 */
export function useHeadToHead(opponent: string) {
  return useQuery({
    queryKey: queryKeys.stats.rivals('Oklahoma', opponent),
    queryFn: () => fetchHeadToHead(opponent),
    staleTime: STALE_TIMES.historical,
    enabled: opponent.length > 0,
  });
}

/**
 * Hook to fetch all opponents.
 */
export function useOpponents() {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'opponents'],
    queryFn: fetchOpponents,
    staleTime: STALE_TIMES.static,
  });
}
