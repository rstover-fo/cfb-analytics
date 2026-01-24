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

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[120px] rounded-lg" />
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
