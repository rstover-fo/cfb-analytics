'use client';

import { BaseLineChart } from '@/components/charts';
import type { PointsTrend } from '@/lib/db/queries';

interface PPGChartProps {
  data: PointsTrend[];
  height?: number;
  className?: string;
}

/**
 * Points per game trend chart with dual lines for offense and defense.
 * Offense shown in team color (crimson), defense in contrasting color.
 *
 * Accessibility: Includes sr-only summary text and ARIA label.
 */
export function PPGChart({ data, height = 300, className }: PPGChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">No PPG data available for selected range.</p>
      </div>
    );
  }

  const avgOffense = data.reduce((sum, d) => sum + d.ppgOffense, 0) / data.length;
  const avgDefense = data.reduce((sum, d) => sum + d.ppgDefense, 0) / data.length;
  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const startYear = firstItem.season;
  const endYear = lastItem.season;

  return (
    <div className={className} role="figure" aria-label="Points per game trend chart">
      <span className="sr-only">
        Points per game from {startYear} to {endYear}: Average {avgOffense.toFixed(1)} points
        scored, {avgDefense.toFixed(1)} points allowed per game.
      </span>
      <BaseLineChart
        data={data as unknown as Record<string, unknown>[]}
        xAxisKey="season"
        height={height}
        yAxisDomain={[0, 'dataMax']}
        yAxisLabel="Points per Game"
        lines={[
          { dataKey: 'ppgOffense', name: 'Points Scored', color: 'hsl(var(--chart-1))' },
          { dataKey: 'ppgDefense', name: 'Points Allowed', color: 'hsl(var(--chart-3))' },
        ]}
        tooltipFormatter={(value, name) => {
          const formatted = typeof value === 'number' ? value.toFixed(1) : value;
          return [`${formatted} PPG`, name ?? ''];
        }}
      />
    </div>
  );
}
