import { Suspense } from 'react';
import { Metadata } from 'next';
import { SeasonSelector } from '@/components/dashboard/season-selector';
import {
  ClassSummaryCard,
  ClassSummaryCardSkeleton,
  PositionBreakdownChart,
  PositionBreakdownChartSkeleton,
  CommitTimeline,
  CommitTimelineSkeleton,
} from '@/components/recruiting';
import {
  getClassSummary,
  getPositionBreakdown,
  getCommitTimeline,
  getAvailableRecruitingYears,
} from '@/lib/db/queries/recruiting';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Recruiting Dashboard',
  description: 'Oklahoma Sooners recruiting class analysis and commit tracking',
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function ClassSummaryContent({ year }: { year: number }) {
  const data = await getClassSummary(year);
  return <ClassSummaryCard data={data} />;
}

async function PositionBreakdownContent({ year }: { year: number }) {
  const data = await getPositionBreakdown(year);
  return <PositionBreakdownChart data={data} year={year} />;
}

async function CommitTimelineContent({ year }: { year: number }) {
  const data = await getCommitTimeline(year);
  return <CommitTimeline data={data} year={year} />;
}

export default async function RecruitingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const availableYears = await getAvailableRecruitingYears();

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
          <h1 className="text-2xl font-bold tracking-tight">Recruiting Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Recruiting class analysis and commit tracking
          </p>
        </div>
        <SeasonSelector seasons={availableYears} currentSeason={validYear} />
      </div>

      {/* Class Summary Card */}
      <section aria-labelledby="class-summary-heading">
        <h2 id="class-summary-heading" className="sr-only">
          {validYear} Class Summary
        </h2>
        <Suspense key={`summary-${validYear}`} fallback={<ClassSummaryCardSkeleton />}>
          <ClassSummaryContent year={validYear} />
        </Suspense>
      </section>

      {/* Position Breakdown and Commit Timeline side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="position-breakdown-heading">
          <h2 id="position-breakdown-heading" className="sr-only">
            Position Breakdown
          </h2>
          <Suspense key={`position-${validYear}`} fallback={<PositionBreakdownChartSkeleton />}>
            <PositionBreakdownContent year={validYear} />
          </Suspense>
        </section>

        <section aria-labelledby="commit-timeline-heading">
          <h2 id="commit-timeline-heading" className="sr-only">
            Commit Timeline
          </h2>
          <Suspense key={`timeline-${validYear}`} fallback={<CommitTimelineSkeleton />}>
            <CommitTimelineContent year={validYear} />
          </Suspense>
        </section>
      </div>

      {/* Links to related pages */}
      <div className="text-muted-foreground border-t pt-4 text-sm">
        <p>
          View{' '}
          <a href="/recruiting/history" className="text-primary hover:underline">
            recruiting history
          </a>{' '}
          or{' '}
          <a href="/recruiting/portal" className="text-primary hover:underline">
            transfer portal activity
          </a>
          .
        </p>
      </div>
    </div>
  );
}
