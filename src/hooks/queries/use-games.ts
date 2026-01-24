'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { STALE_TIMES } from '@/lib/query-client';
import type { GameSummary, GameDetail, Play, DriveSummary } from '@/lib/db';

/**
 * Fetches all games, optionally filtered by season.
 */
async function fetchGames(
  season?: number,
  limit: number = 20,
  offset: number = 0
): Promise<{ games: GameSummary[]; total: number }> {
  const params = new URLSearchParams();
  if (season) params.set('season', String(season));
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const res = await fetch(`/api/games?${params}`);
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
}

/**
 * Fetches available seasons for the games filter.
 */
async function fetchAvailableSeasons(): Promise<number[]> {
  const res = await fetch('/api/games/seasons');
  if (!res.ok) throw new Error('Failed to fetch seasons');
  return res.json();
}

/**
 * Fetches detailed information for a single game.
 */
async function fetchGameDetail(gameId: number): Promise<GameDetail> {
  const res = await fetch(`/api/games/${gameId}`);
  if (!res.ok) throw new Error('Failed to fetch game detail');
  return res.json();
}

/**
 * Fetches plays for a game.
 */
async function fetchGamePlays(gameId: number): Promise<Play[]> {
  const res = await fetch(`/api/games/${gameId}/plays`);
  if (!res.ok) throw new Error('Failed to fetch plays');
  return res.json();
}

/**
 * Fetches drives for a game.
 */
async function fetchGameDrives(gameId: number): Promise<DriveSummary[]> {
  const res = await fetch(`/api/games/${gameId}/drives`);
  if (!res.ok) throw new Error('Failed to fetch drives');
  return res.json();
}

/**
 * Hook to fetch games list with pagination.
 */
export function useGames(filters: {
  season?: number;
  limit?: number;
  offset?: number;
}) {
  const { season, limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: queryKeys.games.list({ season }),
    queryFn: () => fetchGames(season, limit, offset),
    staleTime: STALE_TIMES.live,
  });
}

/**
 * Suspense-enabled hook for games list.
 * Use in components wrapped with Suspense.
 */
export function useGamesSuspense(filters: {
  season?: number;
  limit?: number;
  offset?: number;
}) {
  const { season, limit = 20, offset = 0 } = filters;

  return useSuspenseQuery({
    queryKey: queryKeys.games.list({ season }),
    queryFn: () => fetchGames(season, limit, offset),
    staleTime: STALE_TIMES.live,
  });
}

/**
 * Hook to fetch available seasons.
 */
export function useAvailableSeasons() {
  return useQuery({
    queryKey: ['seasons', 'available'],
    queryFn: fetchAvailableSeasons,
    staleTime: STALE_TIMES.static,
  });
}

/**
 * Hook to fetch game details.
 */
export function useGameDetail(gameId: number | string) {
  const id = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;

  return useQuery({
    queryKey: queryKeys.games.detail(id),
    queryFn: () => fetchGameDetail(id),
    staleTime: STALE_TIMES.historical,
    enabled: !isNaN(id),
  });
}

/**
 * Hook to fetch plays for a game.
 */
export function useGamePlays(gameId: number | string) {
  const id = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;

  return useQuery({
    queryKey: queryKeys.games.plays(id),
    queryFn: () => fetchGamePlays(id),
    staleTime: STALE_TIMES.historical,
    enabled: !isNaN(id),
  });
}

/**
 * Hook to fetch drives for a game.
 */
export function useGameDrives(gameId: number | string) {
  const id = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;

  return useQuery({
    queryKey: queryKeys.games.drives(id),
    queryFn: () => fetchGameDrives(id),
    staleTime: STALE_TIMES.historical,
    enabled: !isNaN(id),
  });
}
