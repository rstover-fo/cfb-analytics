'use client';

import { BaseBarChart } from '@/components/charts';
import type { HomeAwaySplit } from '@/lib/db/queries';

interface HomeAwayChartProps {
  data: HomeAwaySplit[];
  height?: number;
  className?: string;
}

/**
 * Home vs away win-loss splits as a grouped bar chart.
 * Shows four bars per season: home wins, home losses, away wins, away losses.
 *
 * Accessibility: Includes sr-only summary text and ARIA label.
 */
export function HomeAwayChart({ data, height = 300, className }: HomeAwayChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">
          No home/away data available for selected range.
        </p>
      </div>
    );
  }

  const totalHomeWins = data.reduce((sum, d) => sum + d.homeWins, 0);
  const totalHomeLosses = data.reduce((sum, d) => sum + d.homeLosses, 0);
  const totalAwayWins = data.reduce((sum, d) => sum + d.awayWins, 0);
  const totalAwayLosses = data.reduce((sum, d) => sum + d.awayLosses, 0);
  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const startYear = firstItem.season;
  const endYear = lastItem.season;

  return (
    <div className={className} role="figure" aria-label="Home vs away splits chart">
      <span className="sr-only">
        Home and away record from {startYear} to {endYear}: {totalHomeWins}-{totalHomeLosses} at
        home, {totalAwayWins}-{totalAwayLosses} on the road.
      </span>
      <BaseBarChart
        data={data as unknown as Record<string, unknown>[]}
        xAxisKey="season"
        height={height}
        yAxisDomain={[0, 'dataMax']}
        yAxisLabel="Games"
        bars={[
          { dataKey: 'homeWins', name: 'Home Wins', color: 'hsl(var(--chart-1))' },
          { dataKey: 'homeLosses', name: 'Home Losses', color: 'hsl(var(--chart-3))' },
          { dataKey: 'awayWins', name: 'Away Wins', color: 'hsl(var(--chart-2))' },
          { dataKey: 'awayLosses', name: 'Away Losses', color: 'hsl(var(--chart-5))' },
        ]}
        tooltipFormatter={(value, name) => {
          return [`${value}`, name ?? ''];
        }}
        barSize={12}
      />
    </div>
  );
}
