'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseBarChart } from '@/components/charts/base-bar-chart';
import type { SeasonEPA } from '@/lib/db/queries';

interface EPABreakdownChartProps {
  data: SeasonEPA;
}

/**
 * Get bar color based on EPA value.
 */
function getEPABarColor(epa: number): string {
  if (epa > 0.1) return 'var(--color-chart-2)'; // green-ish
  if (epa < -0.1) return 'var(--color-chart-3)'; // red-ish
  return 'var(--color-chart-4)'; // neutral
}

/**
 * EPA breakdown chart showing rush vs pass EPA as grouped bars.
 * Uses BaseBarChart with horizontal layout for easy comparison.
 *
 * Visualizes the difference between rushing and passing efficiency
 * to identify offensive strengths and weaknesses.
 */
export function EPABreakdownChart({ data }: EPABreakdownChartProps) {
  const chartData = [
    {
      type: 'Rush',
      epa: data.rushEpaPerPlay,
      plays: data.rushPlays,
    },
    {
      type: 'Pass',
      epa: data.passEpaPerPlay,
      plays: data.passPlays,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA by Play Type</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={chartData as unknown as Record<string, unknown>[]}
          xAxisKey="type"
          bars={[
            {
              dataKey: 'epa',
              name: 'EPA/Play',
              color: 'var(--color-chart-1)',
            },
          ]}
          height={200}
          showLegend={false}
          yAxisDomain={['dataMin', 'dataMax']}
          tooltipFormatter={(value) => {
            const numValue = Number(value);
            const formatted = numValue > 0 ? `+${numValue.toFixed(3)}` : numValue.toFixed(3);
            return [formatted, 'EPA/Play'];
          }}
          getBarColor={(entry) => getEPABarColor(entry.epa as number)}
        />
        <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Rush Plays</p>
            <p className="font-semibold tabular-nums">{data.rushPlays.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pass Plays</p>
            <p className="font-semibold tabular-nums">{data.passPlays.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no EPA breakdown data is available.
 */
export function EPABreakdownChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA by Play Type</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No EPA breakdown data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for EPA breakdown chart.
 */
export function EPABreakdownChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="bg-muted h-[200px] animate-pulse rounded" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-muted h-10 animate-pulse rounded" />
          <div className="bg-muted h-10 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
