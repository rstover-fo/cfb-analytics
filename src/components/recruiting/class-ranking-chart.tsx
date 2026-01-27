'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { BaseLineChart } from '@/components/charts';
import type { ClassRankingHistory } from '@/lib/db/queries/recruiting';

interface ClassRankingChartProps {
  data: ClassRankingHistory[];
}

/**
 * Line chart showing Oklahoma's recruiting class ranking over time.
 *
 * Note: Y-axis is inverted since lower rank = better (1 is best).
 * Shows national ranking trends from 2014-2025.
 */
export function ClassRankingChart({ data }: ClassRankingChartProps) {
  if (data.length === 0) {
    return <ClassRankingChartEmpty />;
  }

  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const bestRank = Math.min(...data.map((d) => d.nationalRank));
  const worstRank = Math.max(...data.map((d) => d.nationalRank));
  const avgRank = data.reduce((sum, d) => sum + d.nationalRank, 0) / data.length;

  // Find conference transition year (Big 12 -> SEC in 2024)
  const conferenceChangeYear = 2024;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Recruiting Class Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="sr-only">
          Oklahoma recruiting class national ranking from {firstItem.year} to {lastItem.year}. Best
          rank: #{bestRank}. Worst rank: #{worstRank}. Average rank: #{Math.round(avgRank)}.
        </span>

        <BaseLineChart
          data={data as unknown as Record<string, unknown>[]}
          xAxisKey="year"
          lines={[
            {
              dataKey: 'nationalRank',
              name: 'National Rank',
              color: 'var(--color-chart-1)',
            },
          ]}
          yAxisDomain={['dataMax', 1]}
          yAxisLabel="Rank"
          tooltipFormatter={(value, name) => {
            const rank = Number(value);
            return [`#${rank}`, name ?? ''];
          }}
          height={280}
        />

        {/* Legend and context */}
        <div className="mt-4 space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Best Rank</span>
            <span className="font-semibold tabular-nums">#{bestRank}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg Rank</span>
            <span className="font-semibold tabular-nums">#{Math.round(avgRank)}</span>
          </div>
          {data.some((d) => d.year >= conferenceChangeYear) && (
            <div className="bg-muted/50 flex items-start gap-2 rounded p-2 text-xs">
              <AlertCircle
                className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">
                Note: Oklahoma moved from Big 12 to SEC in {conferenceChangeYear}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClassRankingChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Recruiting Class Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No ranking history available</p>
      </CardContent>
    </Card>
  );
}

export function ClassRankingChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-40 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart skeleton */}
          <div className="bg-muted/50 h-[280px] w-full animate-pulse rounded" />

          {/* Legend skeleton */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-3 w-8 animate-pulse rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div className="bg-muted h-3 w-14 animate-pulse rounded" />
              <div className="bg-muted h-3 w-8 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
