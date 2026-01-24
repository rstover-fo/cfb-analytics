'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseBarChart } from '@/components/charts/base-bar-chart';
import { Users } from 'lucide-react';
import type { PositionBreakdown } from '@/lib/db/queries/recruiting';

interface PositionBreakdownChartProps {
  data: PositionBreakdown[];
  year: number;
}

/**
 * Map position to color for consistent visualization
 * Uses chart CSS variables for theme compatibility
 */
function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    // Offense
    QB: 'hsl(var(--chart-1))', // Primary
    RB: 'hsl(var(--chart-2))',
    WR: 'hsl(var(--chart-3))',
    TE: 'hsl(var(--chart-4))',
    OL: 'hsl(var(--chart-5))',
    OT: 'hsl(var(--chart-5))',
    OG: 'hsl(var(--chart-5))',
    C: 'hsl(var(--chart-5))',
    // Defense
    DL: 'hsl(210, 70%, 50%)',
    DE: 'hsl(210, 70%, 50%)',
    DT: 'hsl(210, 60%, 45%)',
    EDGE: 'hsl(210, 65%, 48%)',
    LB: 'hsl(200, 60%, 50%)',
    ILB: 'hsl(200, 60%, 50%)',
    OLB: 'hsl(200, 55%, 48%)',
    DB: 'hsl(190, 60%, 50%)',
    CB: 'hsl(190, 60%, 50%)',
    S: 'hsl(185, 55%, 48%)',
    // Special
    ATH: 'hsl(280, 60%, 55%)',
    K: 'hsl(45, 70%, 50%)',
    P: 'hsl(45, 60%, 48%)',
    LS: 'hsl(45, 50%, 45%)',
  };
  return colors[position] || 'hsl(var(--muted-foreground))';
}

export function PositionBreakdownChart({ data, year }: PositionBreakdownChartProps) {
  if (!data || data.length === 0) {
    return <PositionBreakdownChartEmpty />;
  }

  // Sort by commits descending and prepare chart data
  const chartData = data
    .filter((item) => item.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .map((item) => ({
      position: item.positionGroup,
      commits: item.commits,
      percentage: item.percentage,
      avgRating: item.avgRating,
      avgStars: item.avgStars,
      color: getPositionColor(item.positionGroup),
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year} Position Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={chartData}
          xAxisKey="position"
          bars={[
            {
              dataKey: 'commits',
              name: 'Commits',
              color: 'hsl(var(--chart-1))',
            },
          ]}
          height={250}
          showLegend={false}
          yAxisLabel="Commits"
          tooltipFormatter={(value, _name, props) => {
            const entry = (props as { payload?: (typeof chartData)[0] })?.payload;
            if (entry) {
              return [
                `${value} commits (${entry.percentage}%)`,
                `${entry.position} — Avg: ${entry.avgStars.toFixed(1)}★`,
              ];
            }
            return [`${value}`, 'Commits'];
          }}
          getBarColor={(entry) => entry.color}
        />
        {/* Position legend with percentages */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
          {chartData.slice(0, 6).map((item) => (
            <div key={item.position} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-xs">
                {item.position}:{' '}
                <span className="font-medium tabular-nums">
                  {item.commits} ({item.percentage}%)
                </span>
              </span>
            </div>
          ))}
          {chartData.length > 6 && (
            <span className="text-muted-foreground text-xs">+{chartData.length - 6} more</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PositionBreakdownChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          Position Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No position data available for this class</p>
      </CardContent>
    </Card>
  );
}

export function PositionBreakdownChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-32 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart skeleton */}
        <div className="flex h-[250px] items-end justify-around gap-2 pb-6">
          {[65, 40, 55, 30, 75, 25, 45, 35].map((height, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="bg-muted w-full animate-pulse rounded-t"
                style={{ height: `${height}%` }}
              />
              <div className="bg-muted h-3 w-6 animate-pulse rounded" />
            </div>
          ))}
        </div>
        {/* Legend skeleton */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="bg-muted h-3 w-3 animate-pulse rounded-sm" />
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
