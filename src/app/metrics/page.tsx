import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeasonSelector } from '@/components/dashboard/season-selector';
import {
  MetricsGrid,
  MetricsGridSkeleton,
  EPACard,
  EPACardEmpty,
  EPACardSkeleton,
  EPABreakdownChart,
  EPABreakdownChartEmpty,
  EPABreakdownChartSkeleton,
  SuccessRateCard,
  SuccessRateCardEmpty,
  SuccessRateCardSkeleton,
  SuccessRateByDownTable,
  SuccessRateByDownEmpty,
  SuccessRateByDownSkeleton,
  SuccessRateByDistanceCard,
  SuccessRateMatrixSkeleton,
  ExplosivenessCard,
  ExplosivenessCardEmpty,
  ExplosivenessCardSkeleton,
  TopPlaysTable,
  TopPlaysTableEmpty,
  TopPlaysTableSkeleton,
  // Drive Analytics components (Task 5.5)
  DriveSuccessCard,
  DriveSuccessCardEmpty,
  DriveSuccessCardSkeleton,
  AverageDriveCard,
  AverageDriveCardEmpty,
  AverageDriveCardSkeleton,
  PointsPerDriveCard,
  PointsPerDriveCardEmpty,
  PointsPerDriveCardSkeleton,
  DriveOutcomesChart,
  DriveOutcomesChartEmpty,
  DriveOutcomesChartSkeleton,
  DriveComparisonCard,
  DriveComparisonCardEmpty,
  DriveComparisonCardSkeleton,
} from '@/components/metrics';
import {
  getAvailableSeasons,
  getDetailedSeasonMetrics,
  getSeasonEPA,
  getSuccessRateByPlayType,
  getSuccessRateByDown,
  getSuccessRateByDistance,
  getExplosivePlays,
  getExplosivePlaysAllowed,
  getTopPlays,
  // Drive Analytics queries (Task 5.5)
  getPointsPerDriveByPosition,
  getDriveSuccessRate,
  getAverageDriveMetrics,
  getDriveOutcomeDistribution,
  getDriveComparison,
} from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Season Metrics',
  description: 'Detailed offensive, defensive, and situational statistics by season',
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function MetricsContent({ season }: { season: number }) {
  const metrics = await getDetailedSeasonMetrics(season);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No metrics data available for the {season} season.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {metrics.season} Season — {metrics.gamesPlayed} Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsGrid metrics={metrics} />
        </CardContent>
      </Card>
    </div>
  );
}

async function EPAContent({ season }: { season: number }) {
  const epaData = await getSeasonEPA(season);

  if (!epaData) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <EPACardEmpty />
        <EPABreakdownChartEmpty />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EPACard data={epaData} />
      <EPABreakdownChart data={epaData} />
    </div>
  );
}

function EPASkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EPACardSkeleton />
      <EPABreakdownChartSkeleton />
    </div>
  );
}

async function SuccessRateContent({ season }: { season: number }) {
  const [byPlayType, byDown, byDistance] = await Promise.all([
    getSuccessRateByPlayType(season),
    getSuccessRateByDown(season),
    getSuccessRateByDistance(season),
  ]);

  // If no data at all, show empty state
  if (!byPlayType && !byDown && !byDistance) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SuccessRateCardEmpty />
        <SuccessRateByDownEmpty />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {byPlayType ? <SuccessRateCard data={byPlayType} /> : <SuccessRateCardEmpty />}
      {byDown ? <SuccessRateByDownTable data={byDown} /> : <SuccessRateByDownEmpty />}
      {byDistance ? (
        <SuccessRateByDistanceCard data={byDistance} />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate by Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No distance data available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuccessRateSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SuccessRateCardSkeleton />
      <SuccessRateByDownSkeleton />
      <SuccessRateMatrixSkeleton />
    </div>
  );
}

async function ExplosivenessContent({ season }: { season: number }) {
  const [offense, defense, topPlays] = await Promise.all([
    getExplosivePlays(season),
    getExplosivePlaysAllowed(season),
    getTopPlays(season, 10),
  ]);

  // If no offensive explosiveness data, show empty state
  if (!offense) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ExplosivenessCardEmpty />
        <TopPlaysTableEmpty />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ExplosivenessCard offense={offense} defense={defense} />
      {topPlays.length > 0 ? <TopPlaysTable plays={topPlays} /> : <TopPlaysTableEmpty />}
    </div>
  );
}

function ExplosivenessSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ExplosivenessCardSkeleton />
      <TopPlaysTableSkeleton />
    </div>
  );
}

async function DriveAnalyticsContent({ season }: { season: number }) {
  const [ppd, successRate, avgMetrics, outcomes, comparison] = await Promise.all([
    getPointsPerDriveByPosition(season),
    getDriveSuccessRate(season),
    getAverageDriveMetrics(season),
    getDriveOutcomeDistribution(season),
    getDriveComparison(season),
  ]);

  // If no data at all, show empty state
  if (!ppd && !successRate && !avgMetrics && !outcomes && !comparison) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DriveSuccessCardEmpty />
        <AverageDriveCardEmpty />
        <PointsPerDriveCardEmpty />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top row: Success Rate, Average Drive, Outcomes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {successRate ? <DriveSuccessCard data={successRate} /> : <DriveSuccessCardEmpty />}
        {avgMetrics ? <AverageDriveCard data={avgMetrics} /> : <AverageDriveCardEmpty />}
        {outcomes ? <DriveOutcomesChart data={outcomes} /> : <DriveOutcomesChartEmpty />}
      </div>
      {/* Bottom row: Points Per Drive, Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {ppd ? <PointsPerDriveCard data={ppd} /> : <PointsPerDriveCardEmpty />}
        {comparison ? <DriveComparisonCard data={comparison} /> : <DriveComparisonCardEmpty />}
      </div>
    </div>
  );
}

function DriveAnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DriveSuccessCardSkeleton />
        <AverageDriveCardSkeleton />
        <DriveOutcomesChartSkeleton />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PointsPerDriveCardSkeleton />
        <DriveComparisonCardSkeleton />
      </div>
    </div>
  );
}

export default async function MetricsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const seasons = await getAvailableSeasons();

  // Default to most recent season
  const defaultSeason = seasons[0] || 2024;
  const requestedSeason = params.season ? parseInt(params.season, 10) : defaultSeason;

  // Validate season selection
  const validSeason = seasons.includes(requestedSeason) ? requestedSeason : defaultSeason;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Season Metrics</h1>
          <p className="text-muted-foreground text-sm">
            Detailed offensive, defensive, and situational statistics
          </p>
        </div>
        <SeasonSelector seasons={seasons} currentSeason={validSeason} />
      </div>

      <Suspense key={validSeason} fallback={<MetricsGridSkeleton />}>
        <MetricsContent season={validSeason} />
      </Suspense>

      {/* EPA Analysis Section */}
      <section aria-labelledby="epa-heading">
        <h2 id="epa-heading" className="mb-4 text-lg font-semibold">
          EPA Analysis
        </h2>
        <Suspense key={`epa-${validSeason}`} fallback={<EPASkeleton />}>
          <EPAContent season={validSeason} />
        </Suspense>
      </section>

      {/* Success Rate Section */}
      <section aria-labelledby="success-rate-heading">
        <h2 id="success-rate-heading" className="mb-4 text-lg font-semibold">
          Success Rate Analysis
        </h2>
        <Suspense key={`success-${validSeason}`} fallback={<SuccessRateSkeleton />}>
          <SuccessRateContent season={validSeason} />
        </Suspense>
      </section>

      {/* Explosiveness Section */}
      <section aria-labelledby="explosiveness-heading">
        <h2 id="explosiveness-heading" className="mb-4 text-lg font-semibold">
          Explosiveness
        </h2>
        <Suspense key={`explosive-${validSeason}`} fallback={<ExplosivenessSkeleton />}>
          <ExplosivenessContent season={validSeason} />
        </Suspense>
      </section>

      {/* Drive Analytics Section (Task 5.5) */}
      <section aria-labelledby="drives-heading">
        <h2 id="drives-heading" className="mb-4 text-lg font-semibold">
          Drive Analytics
        </h2>
        <Suspense key={`drives-${validSeason}`} fallback={<DriveAnalyticsSkeleton />}>
          <DriveAnalyticsContent season={validSeason} />
        </Suspense>
      </section>
    </div>
  );
}
