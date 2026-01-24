import { Suspense } from 'react';
import { Metadata } from 'next';
import {
  WinLossChart,
  PPGChart,
  ConferenceSplitsChart,
  HomeAwayChart,
  YearRangeSelector,
} from '@/components/trends';
import { EPATrendChart, EPATrendChartEmpty } from '@/components/metrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAvailableSeasons,
  getWinLossTrends,
  getPointsTrends,
  getConferenceSplits,
  getHomeAwaySplits,
  getEPATrends,
} from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Historical Trends',
  description:
    'Multi-season analysis and historical trends for Oklahoma Sooners football (2014-2024)',
};

interface PageProps {
  searchParams: Promise<{ start?: string; end?: string }>;
}

async function TrendsContent({ startYear, endYear }: { startYear: number; endYear: number }) {
  const [winLoss, points, confSplits, homeAway, epaTrends] = await Promise.all([
    getWinLossTrends(startYear, endYear),
    getPointsTrends(startYear, endYear),
    getConferenceSplits(startYear, endYear),
    getHomeAwaySplits(startYear, endYear),
    getEPATrends(startYear, endYear),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Win-Loss Record</CardTitle>
          <CardDescription>Season-by-season wins and losses since 2014</CardDescription>
        </CardHeader>
        <CardContent>
          <WinLossChart data={winLoss} height={280} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points Per Game</CardTitle>
          <CardDescription>Offensive and defensive scoring trends</CardDescription>
        </CardHeader>
        <CardContent>
          <PPGChart data={points} height={280} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conference vs Non-Conference</CardTitle>
          <CardDescription>Record breakdown by opponent type</CardDescription>
        </CardHeader>
        <CardContent>
          <ConferenceSplitsChart data={confSplits} height={280} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Home vs Away</CardTitle>
          <CardDescription>Record breakdown by venue</CardDescription>
        </CardHeader>
        <CardContent>
          <HomeAwayChart data={homeAway} height={280} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>EPA Trend</CardTitle>
          <CardDescription>Expected Points Added per play by season</CardDescription>
        </CardHeader>
        <CardContent>
          {epaTrends.length > 0 ? <EPATrendChart data={epaTrends} /> : <EPATrendChartEmpty />}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      ))}
      {/* EPA trend skeleton - spans full width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TrendsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const seasons = await getAvailableSeasons();

  // Default to full available range (fallback to 2014-2024 if no seasons)
  const minYear = seasons.length > 0 ? Math.min(...seasons) : 2014;
  const maxYear = seasons.length > 0 ? Math.max(...seasons) : 2024;
  const startYear = params.start ? parseInt(params.start, 10) : minYear;
  const endYear = params.end ? parseInt(params.end, 10) : maxYear;

  // Validate range
  const validStart = Math.max(minYear, Math.min(startYear, maxYear));
  const validEnd = Math.max(validStart, Math.min(endYear, maxYear));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historical Trends</h1>
          <p className="text-muted-foreground text-sm">
            Multi-season analysis for Oklahoma Sooners (Since 2014)
          </p>
        </div>
        <YearRangeSelector availableYears={seasons} startYear={validStart} endYear={validEnd} />
      </div>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent startYear={validStart} endYear={validEnd} />
      </Suspense>
    </div>
  );
}
