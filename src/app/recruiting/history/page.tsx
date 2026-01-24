import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SeasonSelector } from '@/components/dashboard/season-selector';
import {
  ClassRankingChart,
  ClassRankingChartSkeleton,
  TopRecruitsTable,
  TopRecruitsTableSkeleton,
  PositionTrendsChart,
  PositionTrendsChartSkeleton,
  ConferenceComparison,
  ConferenceComparisonSkeleton,
} from '@/components/recruiting';
import {
  getClassRankingHistory,
  getTopRecruits,
  getPositionTrends,
  getConferencePeerComparison,
  getAvailableRecruitingYears,
} from '@/lib/db/queries/recruiting';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Recruiting History',
  description:
    'Historical recruiting class rankings, top recruits, and position trends for Oklahoma Sooners',
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function ClassRankingContent() {
  const data = await getClassRankingHistory(2014, 2025);
  return <ClassRankingChart data={data} />;
}

async function TopRecruitsContent({ year }: { year: number }) {
  // Get all recruits for this year (not just top 10)
  const data = await getTopRecruits(year, 100);
  return <TopRecruitsTable data={data} year={year} />;
}

async function PositionTrendsContent() {
  const data = await getPositionTrends(2014, 2025);
  return <PositionTrendsChart data={data} />;
}

async function ConferenceComparisonContent({ year }: { year: number }) {
  // SEC peers for 2024+, Big 12 peers for earlier years
  const peers =
    year >= 2024
      ? ['Texas', 'Georgia', 'Alabama', 'LSU', 'Texas A&M', 'Florida', 'Auburn', 'Tennessee']
      : ['Texas', 'Baylor', 'Oklahoma State', 'TCU', 'Kansas State', 'Iowa State', 'Texas Tech'];
  const data = await getConferencePeerComparison(year, peers);
  return <ConferenceComparison data={data} year={year} />;
}

export default async function RecruitingHistoryPage({ searchParams }: PageProps) {
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
          <div className="mb-1">
            <Link
              href="/recruiting"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recruiting History</h1>
          <p className="text-muted-foreground text-sm">
            Historical recruiting rankings, top recruits, and position trends (2014-2025)
          </p>
        </div>
        <SeasonSelector seasons={availableYears} currentSeason={validYear} />
      </div>

      {/* Class Rankings Chart - shows all years */}
      <section aria-labelledby="rankings-heading">
        <h2 id="rankings-heading" className="sr-only">
          Class Rankings Over Time
        </h2>
        <Suspense fallback={<ClassRankingChartSkeleton />}>
          <ClassRankingContent />
        </Suspense>
      </section>

      {/* Top Recruits Table - filtered by selected year */}
      <section aria-labelledby="top-recruits-heading">
        <h2 id="top-recruits-heading" className="sr-only">
          {validYear} Top Recruits
        </h2>
        <Suspense key={`recruits-${validYear}`} fallback={<TopRecruitsTableSkeleton />}>
          <TopRecruitsContent year={validYear} />
        </Suspense>
      </section>

      {/* Collapsible sections for lower-priority views */}
      <div className="space-y-4">
        {/* Position Trends - collapsible */}
        <Collapsible defaultOpen={false}>
          <section aria-labelledby="position-trends-heading">
            <CollapsibleTrigger asChild>
              <button className="border-border bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors">
                <div>
                  <h2 id="position-trends-heading" className="text-sm font-medium">
                    Position Recruiting Trends
                  </h2>
                  <p className="text-muted-foreground text-xs">Position group emphasis over time</p>
                </div>
                <ChevronDown
                  className="text-muted-foreground h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180"
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Suspense fallback={<PositionTrendsChartSkeleton />}>
                <PositionTrendsContent />
              </Suspense>
            </CollapsibleContent>
          </section>
        </Collapsible>

        {/* Conference Comparison - collapsible */}
        <Collapsible defaultOpen={false}>
          <section aria-labelledby="conference-comparison-heading">
            <CollapsibleTrigger asChild>
              <button className="border-border bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors">
                <div>
                  <h2 id="conference-comparison-heading" className="text-sm font-medium">
                    Conference Peer Comparison
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Oklahoma vs {validYear >= 2024 ? 'SEC' : 'Big 12'} peers for {validYear}
                  </p>
                </div>
                <ChevronDown
                  className="text-muted-foreground h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180"
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Suspense key={`conference-${validYear}`} fallback={<ConferenceComparisonSkeleton />}>
                <ConferenceComparisonContent year={validYear} />
              </Suspense>
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>

      {/* Navigation links */}
      <div className="text-muted-foreground border-t pt-4 text-sm">
        <p>
          View{' '}
          <Link href="/recruiting" className="text-primary hover:underline">
            current class dashboard
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
