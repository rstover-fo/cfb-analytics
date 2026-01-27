'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseBarChart } from '@/components/charts/base-bar-chart';
import { PieChart } from 'lucide-react';
import type { DriveOutcomeDistribution } from '@/lib/db/queries';

interface DriveOutcomesChartProps {
  data: DriveOutcomeDistribution;
}

/**
 * Outcome colors for the chart.
 */
const OUTCOME_COLORS: Record<string, string> = {
  Touchdowns: 'var(--color-chart-2)', // green
  'Field Goals': 'var(--color-chart-3)', // yellow/orange
  Punts: 'var(--color-chart-5)', // gray/neutral
  Turnovers: 'var(--color-chart-1)', // red
  Downs: 'var(--color-chart-4)', // purple
  'End of Half': 'var(--color-muted)', // muted
  Other: 'var(--color-muted)', // muted
};

/**
 * Drive outcomes distribution chart.
 * Shows how drives end: TD, FG, Punt, Turnover, etc.
 * Uses a horizontal bar chart for clear comparison.
 */
export function DriveOutcomesChart({ data }: DriveOutcomesChartProps) {
  const chartData = [
    {
      outcome: 'Touchdowns',
      count: data.touchdowns,
      pct: Math.round((100 * data.touchdowns) / data.total),
    },
    {
      outcome: 'Field Goals',
      count: data.fieldGoals,
      pct: Math.round((100 * data.fieldGoals) / data.total),
    },
    { outcome: 'Punts', count: data.punts, pct: Math.round((100 * data.punts) / data.total) },
    {
      outcome: 'Turnovers',
      count: data.turnovers,
      pct: Math.round((100 * data.turnovers) / data.total),
    },
    { outcome: 'Downs', count: data.downs, pct: Math.round((100 * data.downs) / data.total) },
    {
      outcome: 'End of Half',
      count: data.endOfHalf,
      pct: Math.round((100 * data.endOfHalf) / data.total),
    },
  ].filter((item) => item.count > 0);

  // Add "Other" if there are uncategorized outcomes
  if (data.other > 0) {
    chartData.push({
      outcome: 'Other',
      count: data.other,
      pct: Math.round((100 * data.other) / data.total),
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieChart className="h-4 w-4 text-purple-500" aria-hidden="true" />
          Drive Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={chartData as unknown as Record<string, unknown>[]}
          xAxisKey="outcome"
          bars={[
            {
              dataKey: 'count',
              name: 'Drives',
              color: 'var(--color-chart-1)',
            },
          ]}
          height={250}
          showLegend={false}
          tooltipFormatter={(value, _name, props) => {
            const payload = props as { payload?: { outcome: string; pct: number } };
            const entry = payload.payload;
            if (!entry) return [`${value} drives`, ''];
            return [`${value} drives (${entry.pct}%)`, entry.outcome];
          }}
          getBarColor={(entry) => OUTCOME_COLORS[entry.outcome as string] || 'var(--color-chart-1)'}
        />
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <span className="font-semibold text-green-500 tabular-nums">
              {Math.round((100 * (data.touchdowns + data.fieldGoals)) / data.total)}%
            </span>
            <p className="text-muted-foreground">Scoring</p>
          </div>
          <div className="text-center">
            <span className="font-semibold text-yellow-500 tabular-nums">
              {Math.round((100 * data.punts) / data.total)}%
            </span>
            <p className="text-muted-foreground">Punts</p>
          </div>
          <div className="text-center">
            <span className="font-semibold text-red-500 tabular-nums">
              {Math.round((100 * (data.turnovers + data.downs)) / data.total)}%
            </span>
            <p className="text-muted-foreground">Giveaways</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no drive outcomes data is available.
 */
export function DriveOutcomesChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PieChart className="h-4 w-4 text-purple-500" aria-hidden="true" />
          Drive Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No drive outcomes data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for drive outcomes chart.
 */
export function DriveOutcomesChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="bg-muted h-[250px] animate-pulse rounded" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted h-10 animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
