import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparePageClient } from './compare-page-client';
import { SeasonComparisonSkeleton } from '@/components/comparison';
import { getAvailableSeasons, compareSeasons } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Season Comparison',
  description: 'Compare Oklahoma Sooners statistics between two seasons',
};

interface PageProps {
  searchParams: Promise<{ s1?: string; s2?: string }>;
}

async function CompareContent({ season1, season2 }: { season1: number; season2: number }) {
  const comparison = await compareSeasons(season1, season2);

  if (!comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Unable to compare seasons. One or both seasons may have missing data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Import dynamically to avoid issues with the server component
  const { SeasonComparison } = await import('@/components/comparison');

  return <SeasonComparison comparison={comparison} />;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const seasons = await getAvailableSeasons();

  // Default to most recent two seasons
  const defaultSeason1 = seasons[1] || 2023; // Previous year
  const defaultSeason2 = seasons[0] || 2024; // Current year

  const requestedSeason1 = params.s1 ? parseInt(params.s1, 10) : defaultSeason1;
  const requestedSeason2 = params.s2 ? parseInt(params.s2, 10) : defaultSeason2;

  // Validate season selections
  const validSeason1 = seasons.includes(requestedSeason1) ? requestedSeason1 : defaultSeason1;
  const validSeason2 = seasons.includes(requestedSeason2) ? requestedSeason2 : defaultSeason2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Season Comparison</h1>
          <p className="text-muted-foreground text-sm">Compare statistics between two seasons</p>
        </div>
        <ComparePageClient
          seasons={seasons}
          initialSeason1={validSeason1}
          initialSeason2={validSeason2}
        />
      </div>

      <Suspense key={`${validSeason1}-${validSeason2}`} fallback={<SeasonComparisonSkeleton />}>
        <CompareContent season1={validSeason1} season2={validSeason2} />
      </Suspense>
    </div>
  );
}
