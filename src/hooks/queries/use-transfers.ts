'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  PortalDeparture,
  PortalArrival,
  PortalImpact,
} from '@/lib/db';

/**
 * Fetches portal departures for a year.
 */
async function fetchPortalDepartures(year: number): Promise<PortalDeparture[]> {
  const res = await fetch(`/api/transfers/departures?year=${year}`);
  if (!res.ok) throw new Error('Failed to fetch portal departures');
  return res.json();
}

/**
 * Fetches portal arrivals for a year.
 */
async function fetchPortalArrivals(year: number): Promise<PortalArrival[]> {
  const res = await fetch(`/api/transfers/arrivals?year=${year}`);
  if (!res.ok) throw new Error('Failed to fetch portal arrivals');
  return res.json();
}

/**
 * Fetches portal impact summary for a year.
 */
async function fetchPortalImpact(year: number): Promise<PortalImpact | null> {
  const res = await fetch(`/api/transfers/impact?year=${year}`);
  if (!res.ok) throw new Error('Failed to fetch portal impact');
  return res.json();
}

/**
 * Fetches available portal years.
 */
async function fetchAvailableYears(): Promise<number[]> {
  const res = await fetch('/api/transfers/years');
  if (!res.ok) throw new Error('Failed to fetch available years');
  return res.json();
}

/**
 * Hook to fetch portal departures.
 */
export function usePortalDepartures(year: number) {
  return useQuery({
    queryKey: queryKeys.transfers.byTeam('Oklahoma', { season: year, direction: 'out' }),
    queryFn: () => fetchPortalDepartures(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Hook to fetch portal arrivals.
 */
export function usePortalArrivals(year: number) {
  return useQuery({
    queryKey: queryKeys.transfers.byTeam('Oklahoma', { season: year, direction: 'in' }),
    queryFn: () => fetchPortalArrivals(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Suspense-enabled hook for portal arrivals.
 */
export function usePortalArrivalsSuspense(year: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.transfers.byTeam('Oklahoma', { season: year, direction: 'in' }),
    queryFn: () => fetchPortalArrivals(year),
    staleTime: STALE_TIMES.recruiting,
  });
}

/**
 * Hook to fetch portal impact summary.
 */
export function usePortalImpact(year: number) {
  return useQuery({
    queryKey: [...queryKeys.transfers.bySeason(year), 'impact'],
    queryFn: () => fetchPortalImpact(year),
    staleTime: STALE_TIMES.recruiting,
    enabled: year > 0,
  });
}

/**
 * Hook to fetch available portal years.
 */
export function useAvailablePortalYears() {
  return useQuery({
    queryKey: [...queryKeys.transfers.all, 'years'],
    queryFn: fetchAvailableYears,
    staleTime: STALE_TIMES.static,
  });
}
