'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { BaseBarChart } from '@/components/charts/base-bar-chart';
import type { ExperienceBreakdown } from '@/lib/db/queries/roster';

interface ExperienceBreakdownChartProps {
  data: ExperienceBreakdown[];
  year: number;
}

/**
 * Color mapping for class years
 */
const CLASS_COLORS: Record<string, string> = {
  FR: 'var(--chart-1)',
  SO: 'var(--chart-2)',
  JR: 'var(--chart-3)',
  SR: 'var(--chart-4)',
  GR: 'var(--chart-5)',
  Unknown: 'var(--muted)',
};

/**
 * Chart showing roster composition by class year.
 *
 * Features:
 * - Bar chart showing FR, SO, JR, SR, GR distribution
 * - Count and percentage for each class
 * - Hover tooltip with details
 * - Respects prefers-reduced-motion (via BaseBarChart)
 */
export function ExperienceBreakdownChart({ data, year }: ExperienceBreakdownChartProps) {
  if (data.length === 0) {
    return <ExperienceBreakdownChartEmpty year={year} />;
  }

  // Calculate total for display
  const totalPlayers = data.reduce((sum, d) => sum + d.count, 0);

  // Transform data for chart with color info
  const chartData = data.map((d) => ({
    label: d.label,
    count: d.count,
    percentage: d.percentage,
  }));

  // Get bar color based on class year label
  const getBarColor = (entry: Record<string, unknown>) => {
    const label = entry.label as string;
    return CLASS_COLORS[label] || 'var(--muted)';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          {year} Experience Breakdown
          <span className="text-muted-foreground font-normal">({totalPlayers} players)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-live="polite" aria-atomic="true">
          {/* Bar chart */}
          <BaseBarChart
            data={chartData}
            xAxisKey="label"
            bars={[{ dataKey: 'count', name: 'Players', color: 'var(--chart-1)' }]}
            height={200}
            showLegend={false}
            showGrid={false}
            getBarColor={getBarColor}
            tooltipFormatter={(value, _name, props) => {
              const payload = props as { payload?: { label: string; percentage: number } };
              const label = payload?.payload?.label || '';
              const percentage = payload?.payload?.percentage || 0;
              return [`${value} players (${percentage}%)`, label];
            }}
          />

          {/* Legend with counts and percentages */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.map((d) => (
              <div
                key={d.label}
                className="border-border flex items-center gap-2 rounded border px-2 py-1.5"
              >
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: CLASS_COLORS[d.label] || 'var(--muted)' }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{d.label}</div>
                  <div className="text-muted-foreground text-xs tabular-nums">
                    {d.count} ({d.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExperienceBreakdownChartEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Experience Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No roster data available{year ? ` for ${year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function ExperienceBreakdownChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-40 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart skeleton */}
          <div className="bg-muted h-[200px] animate-pulse rounded" />

          {/* Legend skeleton */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="border-border flex items-center gap-2 rounded border px-2 py-1.5"
              >
                <div className="bg-muted h-3 w-3 animate-pulse rounded-sm" />
                <div className="flex-1 space-y-1">
                  <div className="bg-muted h-3 w-6 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-12 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
