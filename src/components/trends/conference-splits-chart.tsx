'use client';

import { BaseBarChart } from '@/components/charts';
import type { ConferenceSplit } from '@/lib/db/queries';

interface ConferenceSplitsChartProps {
  data: ConferenceSplit[];
  height?: number;
  className?: string;
}

/**
 * Conference vs non-conference win-loss splits as a grouped bar chart.
 * Shows four bars per season: conf wins, conf losses, non-conf wins, non-conf losses.
 *
 * Accessibility: Includes sr-only summary text and ARIA label.
 */
export function ConferenceSplitsChart({
  data,
  height = 300,
  className,
}: ConferenceSplitsChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">
          No conference split data available for selected range.
        </p>
      </div>
    );
  }

  const totalConfWins = data.reduce((sum, d) => sum + d.confWins, 0);
  const totalConfLosses = data.reduce((sum, d) => sum + d.confLosses, 0);
  const totalNonConfWins = data.reduce((sum, d) => sum + d.nonConfWins, 0);
  const totalNonConfLosses = data.reduce((sum, d) => sum + d.nonConfLosses, 0);
  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const startYear = firstItem.season;
  const endYear = lastItem.season;

  return (
    <div className={className} role="figure" aria-label="Conference vs non-conference splits chart">
      <span className="sr-only">
        Conference record from {startYear} to {endYear}: {totalConfWins}-{totalConfLosses} in
        conference, {totalNonConfWins}-{totalNonConfLosses} non-conference.
      </span>
      <BaseBarChart
        data={data as unknown as Record<string, unknown>[]}
        xAxisKey="season"
        height={height}
        yAxisDomain={[0, 'dataMax']}
        yAxisLabel="Games"
        bars={[
          { dataKey: 'confWins', name: 'Conf. Wins', color: 'var(--color-chart-1)' },
          { dataKey: 'confLosses', name: 'Conf. Losses', color: 'var(--color-chart-3)' },
          { dataKey: 'nonConfWins', name: 'Non-Conf. Wins', color: 'var(--color-chart-2)' },
          { dataKey: 'nonConfLosses', name: 'Non-Conf. Losses', color: 'var(--color-chart-5)' },
        ]}
        tooltipFormatter={(value, name) => {
          return [`${value}`, name ?? ''];
        }}
        barSize={12}
      />
    </div>
  );
}
