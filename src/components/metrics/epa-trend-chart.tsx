'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseLineChart } from '@/components/charts/base-line-chart';
import type { EPATrend } from '@/lib/db/queries';

interface EPATrendChartProps {
  data: EPATrend[];
}

/**
 * EPA trend chart showing EPA/play over multiple seasons.
 * Uses BaseLineChart to visualize offensive efficiency trends.
 *
 * Helps identify year-over-year improvements or declines in
 * offensive performance using Expected Points Added.
 */
export function EPATrendChart({ data }: EPATrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA Trend by Season</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseLineChart
          data={data as unknown as Record<string, unknown>[]}
          xAxisKey="season"
          lines={[
            {
              dataKey: 'epaPerPlay',
              name: 'EPA/Play',
              color: 'var(--color-chart-1)',
            },
          ]}
          height={250}
          showLegend={false}
          yAxisDomain={['dataMin', 'dataMax']}
          tooltipFormatter={(value) => {
            const numValue = Number(value);
            const formatted = numValue > 0 ? `+${numValue.toFixed(3)}` : numValue.toFixed(3);
            return [formatted, 'EPA/Play'];
          }}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no EPA trend data is available.
 */
export function EPATrendChartEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA Trend by Season</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No EPA trend data available.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for EPA trend chart.
 */
export function EPATrendChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-36 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="bg-muted h-[250px] animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
