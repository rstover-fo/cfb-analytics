import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SeasonSelector } from '@/components/dashboard/season-selector';
import {
  PositionRosterTable,
  PositionRosterTableSkeleton,
  ExperienceBreakdownChart,
  ExperienceBreakdownChartSkeleton,
  ScholarshipTracker,
  ScholarshipTrackerSkeleton,
} from '@/components/roster';
import {
  getRosterByPosition,
  getExperienceBreakdown,
  getScholarshipCount,
  getAvailableRosterYears,
} from '@/lib/db/queries/roster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Roster Analysis',
  description:
    'Current roster analysis by position, experience breakdown, and scholarship tracking',
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function RosterByPositionContent({ year }: { year: number }) {
  const data = await getRosterByPosition(year);
  return <PositionRosterTable data={data} year={year} />;
}

async function ExperienceBreakdownContent({ year }: { year: number }) {
  const data = await getExperienceBreakdown(year);
  return <ExperienceBreakdownChart data={data} year={year} />;
}

async function ScholarshipTrackerContent({ year }: { year: number }) {
  const data = await getScholarshipCount(year);
  return <ScholarshipTracker data={data} year={year} />;
}

export default async function RosterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const availableYears = await getAvailableRosterYears();

  // Default to most recent year
  const defaultYear = availableYears[0] || 2024;
  const requestedYear = params.season ? parseInt(params.season, 10) : defaultYear;

  // Validate year selection
  const validYear = availableYears.includes(requestedYear) ? requestedYear : defaultYear;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roster Analysis</h1>
          <p className="text-muted-foreground text-sm">
            Current roster by position, experience breakdown, and scholarship tracking
          </p>
        </div>
        <SeasonSelector seasons={availableYears} currentSeason={validYear} />
      </div>

      {/* Top row: Experience breakdown and scholarship tracker */}
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="experience-heading">
          <h2 id="experience-heading" className="sr-only">
            {validYear} Experience Breakdown
          </h2>
          <Suspense key={`exp-${validYear}`} fallback={<ExperienceBreakdownChartSkeleton />}>
            <ExperienceBreakdownContent year={validYear} />
          </Suspense>
        </section>

        <section aria-labelledby="scholarship-heading">
          <h2 id="scholarship-heading" className="sr-only">
            {validYear} Scholarship Tracker
          </h2>
          <Suspense key={`sch-${validYear}`} fallback={<ScholarshipTrackerSkeleton />}>
            <ScholarshipTrackerContent year={validYear} />
          </Suspense>
        </section>
      </div>

      {/* Roster by position table */}
      <section aria-labelledby="roster-heading">
        <h2 id="roster-heading" className="sr-only">
          {validYear} Roster by Position
        </h2>
        <Suspense key={`roster-${validYear}`} fallback={<PositionRosterTableSkeleton />}>
          <RosterByPositionContent year={validYear} />
        </Suspense>
      </section>

      {/* Depth chart coming soon placeholder */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Construction className="h-4 w-4" aria-hidden="true" />
            Depth Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Depth chart visualization coming in a future sprint. The CFBD API does not currently
            provide depth chart data.
          </p>
        </CardContent>
      </Card>

      {/* Navigation links */}
      <div className="text-muted-foreground border-t pt-4 text-sm">
        <p>
          View{' '}
          <Link href="/recruiting" className="text-primary hover:underline">
            recruiting dashboard
          </Link>{' '}
          or{' '}
          <Link href="/recruiting/portal" className="text-primary hover:underline">
            transfer portal activity
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
