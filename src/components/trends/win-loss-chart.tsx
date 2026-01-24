'use client';

import { BaseLineChart } from '@/components/charts';
import type { WinLossTrend } from '@/lib/db/queries';

interface WinLossChartProps {
  data: WinLossTrend[];
  height?: number;
  className?: string;
}

/**
 * Win-loss trend chart showing wins and losses by season.
 * Uses a line chart to visualize the 10-year trend.
 *
 * Accessibility: Includes sr-only summary text and ARIA label.
 */
export function WinLossChart({ data, height = 300, className }: WinLossChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">
          No win-loss data available for selected range.
        </p>
      </div>
    );
  }

  const totalWins = data.reduce((sum, d) => sum + d.wins, 0);
  const totalLosses = data.reduce((sum, d) => sum + d.losses, 0);
  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const startYear = firstItem.season;
  const endYear = lastItem.season;

  return (
    <div className={className} role="figure" aria-label="Win-loss trend chart">
      <span className="sr-only">
        Win-loss record from {startYear} to {endYear}: {totalWins} wins, {totalLosses} losses total.
      </span>
      <BaseLineChart
        data={data as unknown as Record<string, unknown>[]}
        xAxisKey="season"
        height={height}
        yAxisDomain={[0, 'dataMax']}
        yAxisLabel="Games"
        lines={[
          { dataKey: 'wins', name: 'Wins', color: 'hsl(var(--chart-1))' },
          { dataKey: 'losses', name: 'Losses', color: 'hsl(var(--chart-3))' },
        ]}
        tooltipFormatter={(value, name) => {
          return [`${value}`, name ?? ''];
        }}
      />
    </div>
  );
}
