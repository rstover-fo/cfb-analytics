'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ComparisonHeader } from '@/components/comparison';

interface ComparePageClientProps {
  seasons: number[];
  initialSeason1: number;
  initialSeason2: number;
}

/**
 * Client component for the compare page that handles season selection state
 * and URL parameter updates.
 */
export function ComparePageClient({
  seasons,
  initialSeason1,
  initialSeason2,
}: ComparePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current values from URL or use initial values
  const season1 = searchParams.get('s1') ? parseInt(searchParams.get('s1')!, 10) : initialSeason1;
  const season2 = searchParams.get('s2') ? parseInt(searchParams.get('s2')!, 10) : initialSeason2;

  const updateUrl = useCallback(
    (s1: number, s2: number) => {
      const params = new URLSearchParams();
      params.set('s1', String(s1));
      params.set('s2', String(s2));
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  const handleSeason1Change = useCallback(
    (newSeason1: number) => {
      updateUrl(newSeason1, season2);
    },
    [season2, updateUrl]
  );

  const handleSeason2Change = useCallback(
    (newSeason2: number) => {
      updateUrl(season1, newSeason2);
    },
    [season1, updateUrl]
  );

  const handleSwap = useCallback(() => {
    updateUrl(season2, season1);
  }, [season1, season2, updateUrl]);

  return (
    <ComparisonHeader
      seasons={seasons}
      season1={season1}
      season2={season2}
      onSeason1Change={handleSeason1Change}
      onSeason2Change={handleSeason2Change}
      onSwap={handleSwap}
    />
  );
}
