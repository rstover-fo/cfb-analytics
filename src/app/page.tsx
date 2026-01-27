import { Suspense } from 'react';
import {
  SeasonSelector,
  RecordCard,
  RecentGames,
  UpcomingGames,
  StatsCard,
} from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAvailableSeasons,
  getSeasonRecord,
  getRecentGames,
  getUpcomingGames,
  getSeasonStats,
} from '@/lib/db';

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function DashboardContent({ season }: { season: number }) {
  const [record, recentGames, upcomingGames, stats] = await Promise.all([
    getSeasonRecord(season),
    getRecentGames(season, 5),
    getUpcomingGames(season, 5),
    getSeasonStats(season),
  ]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecordCard record={record} />
        <RecentGames games={recentGames} />
        <UpcomingGames games={upcomingGames} />
      </div>
      <StatsCard stats={stats} />
    </>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <div className="bg-card rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    </>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const seasons = await getAvailableSeasons();
  const currentSeason = params.season ? parseInt(params.season, 10) : seasons[0] || 2024;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oklahoma Sooners</h1>
          <p className="text-muted-foreground text-sm">Team Dashboard</p>
        </div>
        <SeasonSelector seasons={seasons} currentSeason={currentSeason} />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent season={currentSeason} />
      </Suspense>
    </div>
  );
}
