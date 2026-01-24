'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { BaseLineChart } from '@/components/charts';
import type { PositionTrend } from '@/lib/db/queries/recruiting';

interface PositionTrendsChartProps {
  data: PositionTrend[];
}

/**
 * Position group color mapping - same colors used in position-breakdown-chart
 */
const POSITION_COLORS: Record<string, string> = {
  // Offense (warm colors)
  QB: 'hsl(var(--chart-1))',
  RB: 'hsl(25, 85%, 55%)',
  WR: 'hsl(35, 85%, 55%)',
  TE: 'hsl(45, 85%, 55%)',
  OL: 'hsl(55, 75%, 50%)',
  OT: 'hsl(55, 75%, 50%)',
  OG: 'hsl(55, 75%, 50%)',
  OC: 'hsl(55, 75%, 50%)',

  // Defense (cool colors)
  DL: 'hsl(200, 70%, 55%)',
  DE: 'hsl(200, 70%, 55%)',
  DT: 'hsl(210, 70%, 55%)',
  LB: 'hsl(220, 70%, 60%)',
  ILB: 'hsl(220, 70%, 60%)',
  OLB: 'hsl(230, 70%, 60%)',
  DB: 'hsl(240, 65%, 65%)',
  CB: 'hsl(240, 65%, 65%)',
  S: 'hsl(250, 65%, 65%)',
  EDGE: 'hsl(195, 70%, 55%)',

  // Special teams (accent colors)
  ATH: 'hsl(280, 60%, 60%)',
  K: 'hsl(300, 50%, 60%)',
  P: 'hsl(320, 50%, 60%)',
  LS: 'hsl(340, 50%, 60%)',

  // Fallback
  Unknown: 'hsl(var(--muted-foreground))',
};

const DEFAULT_COLOR = 'hsl(var(--muted-foreground))';

/**
 * Get color for a position group
 */
function getPositionColor(position: string): string {
  return POSITION_COLORS[position] ?? DEFAULT_COLOR;
}

/**
 * Transform raw position trend data into chart-ready format
 * Pivots from (year, position, commits) rows to (year, QB, RB, WR, ...) columns
 */
function transformDataForChart(
  data: PositionTrend[],
  positions: string[]
): Record<string, unknown>[] {
  const yearMap = new Map<number, Record<string, unknown>>();

  // Get all unique years
  const years = [...new Set(data.map((d) => d.year))].sort();

  // Initialize all years with 0 for all positions
  for (const year of years) {
    const row: Record<string, unknown> = { year };
    for (const pos of positions) {
      row[pos] = 0;
    }
    yearMap.set(year, row);
  }

  // Fill in actual data
  for (const item of data) {
    const row = yearMap.get(item.year);
    if (row) {
      row[item.positionGroup] = item.commits;
    }
  }

  return Array.from(yearMap.values());
}

/**
 * Chart showing position group recruiting emphasis over time.
 *
 * Features:
 * - Multi-line chart showing commits by position group over years
 * - Position groups colored by offensive/defensive grouping
 * - Toggle to show/hide specific position groups
 * - Respects prefers-reduced-motion
 */
export function PositionTrendsChart({ data }: PositionTrendsChartProps) {
  // Get unique positions sorted by total commits (most recruited first)
  const positionTotals = data.reduce(
    (acc, d) => {
      acc[d.positionGroup] = (acc[d.positionGroup] || 0) + d.commits;
      return acc;
    },
    {} as Record<string, number>
  );

  const allPositions = Object.entries(positionTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([pos]) => pos);

  // Default to top 5 positions by total commits
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
    () => new Set(allPositions.slice(0, 5))
  );
  const [showSelector, setShowSelector] = useState(false);

  if (data.length === 0) {
    return <PositionTrendsChartEmpty />;
  }

  const chartData = transformDataForChart(data, Array.from(selectedPositions));
  const years = chartData.map((d) => d.year as number);
  const startYear = Math.min(...years);
  const endYear = Math.max(...years);

  const togglePosition = (position: string) => {
    const newSet = new Set(selectedPositions);
    if (newSet.has(position)) {
      if (newSet.size > 1) {
        newSet.delete(position);
      }
    } else {
      newSet.add(position);
    }
    setSelectedPositions(newSet);
  };

  const lines = Array.from(selectedPositions).map((position, index) => ({
    dataKey: position,
    name: position,
    color: getPositionColor(position),
    strokeDasharray: index > 0 ? ['8 4', '2 2', '8 4 2 4', '12 4'][index % 4] : undefined,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Position Recruiting Trends
          </CardTitle>
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
            aria-expanded={showSelector}
            aria-controls="position-selector"
          >
            Positions
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showSelector ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <span className="sr-only">
          Position recruiting trends from {startYear} to {endYear} showing commits by position group
          over time.
        </span>

        {/* Position selector */}
        {showSelector && (
          <div
            id="position-selector"
            className="border-border bg-muted/30 mb-4 flex flex-wrap gap-1.5 rounded border p-2"
          >
            {allPositions.map((position) => {
              const isSelected = selectedPositions.has(position);
              return (
                <button
                  key={position}
                  onClick={() => togglePosition(position)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                  aria-pressed={isSelected}
                >
                  {position}
                </button>
              );
            })}
          </div>
        )}

        <BaseLineChart
          data={chartData}
          xAxisKey="year"
          lines={lines}
          yAxisDomain={[0, 'dataMax']}
          yAxisLabel="Commits"
          tooltipFormatter={(value, name) => {
            return [`${value} commits`, name ?? ''];
          }}
          height={280}
        />

        {/* Legend with colors */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
          {Array.from(selectedPositions).map((position) => (
            <div key={position} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getPositionColor(position) }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{position}</span>
              <span className="font-medium tabular-nums">{positionTotals[position]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PositionTrendsChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Position Recruiting Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No position trend data available</p>
      </CardContent>
    </Card>
  );
}

export function PositionTrendsChartSkeleton() {
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
          <div className="flex flex-wrap gap-3 border-t pt-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="bg-muted h-2.5 w-2.5 animate-pulse rounded-full" />
                <div className="bg-muted h-3 w-8 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
