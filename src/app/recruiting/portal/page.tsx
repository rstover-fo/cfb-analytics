import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SeasonSelector } from '@/components/dashboard/season-selector';
import {
  PortalImpactCard,
  PortalImpactCardSkeleton,
  PortalDeparturesTable,
  PortalDeparturesTableSkeleton,
  PortalArrivalsTable,
  PortalArrivalsTableSkeleton,
} from '@/components/recruiting';
import {
  getPortalImpact,
  getPortalDepartures,
  getPortalArrivals,
  getAvailablePortalYears,
} from '@/lib/db/queries/transfers';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners - Transfer Portal',
  description: 'Transfer portal departures, arrivals, and impact analysis for Oklahoma Sooners',
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

async function PortalImpactContent({ year }: { year: number }) {
  const data = await getPortalImpact(year);
  return <PortalImpactCard data={data} />;
}

async function DeparturesContent({ year }: { year: number }) {
  const data = await getPortalDepartures(year);
  return <PortalDeparturesTable data={data} year={year} />;
}

async function ArrivalsContent({ year }: { year: number }) {
  const data = await getPortalArrivals(year);
  return <PortalArrivalsTable data={data} year={year} />;
}

export default async function PortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const availableYears = await getAvailablePortalYears();

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
              Back to Recruiting
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Portal</h1>
          <p className="text-muted-foreground text-sm">
            Portal departures, arrivals, and impact analysis (2021-2025)
          </p>
        </div>
        <SeasonSelector seasons={availableYears} currentSeason={validYear} />
      </div>

      {/* Impact card - full width */}
      <section aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="sr-only">
          {validYear} Portal Impact
        </h2>
        <Suspense key={`impact-${validYear}`} fallback={<PortalImpactCardSkeleton />}>
          <PortalImpactContent year={validYear} />
        </Suspense>
      </section>

      {/* Tables side-by-side on desktop, stacked on mobile */}
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="departures-heading">
          <h2 id="departures-heading" className="sr-only">
            {validYear} Portal Departures
          </h2>
          <Suspense key={`dep-${validYear}`} fallback={<PortalDeparturesTableSkeleton />}>
            <DeparturesContent year={validYear} />
          </Suspense>
        </section>

        <section aria-labelledby="arrivals-heading">
          <h2 id="arrivals-heading" className="sr-only">
            {validYear} Portal Arrivals
          </h2>
          <Suspense key={`arr-${validYear}`} fallback={<PortalArrivalsTableSkeleton />}>
            <ArrivalsContent year={validYear} />
          </Suspense>
        </section>
      </div>

      {/* Navigation links */}
      <div className="text-muted-foreground border-t pt-4 text-sm">
        <p>
          View{' '}
          <Link href="/recruiting" className="text-primary hover:underline">
            recruiting dashboard
          </Link>{' '}
          or{' '}
          <Link href="/recruiting/history" className="text-primary hover:underline">
            recruiting history
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
