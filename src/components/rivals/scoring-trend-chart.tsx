'use client';

import { BaseLineChart } from '@/components/charts';
import type { HeadToHeadScoringTrend } from '@/lib/db/queries';

interface ScoringTrendChartProps {
  data: HeadToHeadScoringTrend[];
  opponent: string;
  height?: number;
  className?: string;
}

/**
 * Line chart showing OU vs opponent scores over time.
 * Uses team color for OU (chart-1) and contrasting color for opponent (chart-3).
 *
 * Accessibility: Includes sr-only summary and ARIA label.
 */
export function ScoringTrendChart({
  data,
  opponent,
  height = 300,
  className,
}: ScoringTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">
          No scoring data available against {opponent}.
        </p>
      </div>
    );
  }

  const ouWins = data.filter((d) => d.ouScore > d.oppScore).length;
  const oppWins = data.filter((d) => d.oppScore > d.ouScore).length;
  const avgOuScore = data.reduce((sum, d) => sum + d.ouScore, 0) / data.length;
  const avgOppScore = data.reduce((sum, d) => sum + d.oppScore, 0) / data.length;
  const firstItem = data[0]!;
  const lastItem = data[data.length - 1]!;
  const startYear = firstItem.season;
  const endYear = lastItem.season;

  return (
    <div
      className={className}
      role="figure"
      aria-label={`Scoring trend chart: Oklahoma vs ${opponent}`}
    >
      <span className="sr-only">
        Oklahoma vs {opponent} from {startYear} to {endYear}: Oklahoma won {ouWins} games,{' '}
        {opponent} won {oppWins} games. Average score: Oklahoma {avgOuScore.toFixed(1)}, {opponent}{' '}
        {avgOppScore.toFixed(1)}.
      </span>
      <BaseLineChart
        data={data as unknown as Record<string, unknown>[]}
        xAxisKey="season"
        height={height}
        yAxisDomain={[0, 'dataMax']}
        yAxisLabel="Points"
        lines={[
          { dataKey: 'ouScore', name: 'Oklahoma', color: 'hsl(var(--chart-1))' },
          { dataKey: 'oppScore', name: opponent, color: 'hsl(var(--chart-3))' },
        ]}
        tooltipFormatter={(value, name) => {
          const formatted = typeof value === 'number' ? value.toString() : value;
          return [`${formatted} pts`, name ?? ''];
        }}
      />
    </div>
  );
}
