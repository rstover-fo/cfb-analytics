'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseBarChart } from '@/components/charts/base-bar-chart';
import { Check, Minus, X } from 'lucide-react';
import type { SuccessRateByDown } from '@/lib/db/queries';

interface SuccessRateByDownProps {
  data: SuccessRateByDown;
}

/**
 * Get bar color based on success rate percentage.
 * >50% = green (good), 40-50% = yellow (average), <40% = red (poor)
 */
function getBarColor(rate: number): string {
  if (rate > 50) return 'hsl(142, 76%, 36%)'; // green-600
  if (rate >= 40) return 'hsl(45, 93%, 47%)'; // yellow-500
  return 'hsl(0, 72%, 51%)'; // red-500
}

/**
 * Bar chart showing success rate by down (1st through 4th).
 * Uses horizontal bars with color coding based on rate.
 *
 * Color bands:
 * - >50% green (good)
 * - 40-50% yellow (average)
 * - <40% red (poor)
 */
export function SuccessRateByDownChart({ data }: SuccessRateByDownProps) {
  const chartData = [
    { down: '1st', rate: data.down1 },
    { down: '2nd', rate: data.down2 },
    { down: '3rd', rate: data.down3 },
    { down: '4th', rate: data.down4 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate by Down</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseBarChart
          data={chartData}
          xAxisKey="down"
          bars={[{ dataKey: 'rate', name: 'Success Rate', color: 'var(--chart-1)' }]}
          height={200}
          layout="vertical"
          showLegend={false}
          yAxisDomain={[0, 100]}
          tooltipFormatter={(value) => [`${Number(value).toFixed(1)}%`, 'Success Rate']}
          getBarColor={(entry) => getBarColor(entry.rate as number)}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Get performance icon based on success rate.
 * Provides visual indicator beyond color for accessibility.
 */
function PerformanceIcon({ rate }: { rate: number }) {
  if (rate > 50) {
    return <Check className="h-4 w-4 text-green-500" aria-hidden="true" />;
  }
  if (rate >= 40) {
    return <Minus className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
  }
  return <X className="h-4 w-4 text-red-500" aria-hidden="true" />;
}

/**
 * Get performance label for screen readers.
 */
function getPerformanceLabel(rate: number): string {
  if (rate > 50) return 'good';
  if (rate >= 40) return 'average';
  return 'poor';
}

/**
 * Simplified table view of success rate by down.
 * Alternative to the chart for tighter layouts.
 * Includes icons alongside colors for colorblind accessibility.
 */
export function SuccessRateByDownTable({ data }: SuccessRateByDownProps) {
  const downs = [
    { label: '1st Down', value: data.down1 },
    { label: '2nd Down', value: data.down2 },
    { label: '3rd Down', value: data.down3 },
    { label: '4th Down', value: data.down4 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate by Down</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {downs.map((down) => {
            const colorClass =
              down.value > 50 ? 'bg-green-500' : down.value >= 40 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={down.label} className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 text-sm">{down.label}</span>
                <div className="bg-muted h-4 flex-1 overflow-hidden rounded">
                  <div
                    className={`h-full ${colorClass} transition-all`}
                    style={{ width: `${Math.min(down.value, 100)}%` }}
                    role="meter"
                    aria-valuenow={down.value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${down.label} success rate: ${down.value.toFixed(1)}% (${getPerformanceLabel(down.value)})`}
                  />
                </div>
                <PerformanceIcon rate={down.value} />
                <span className="w-14 text-right text-sm font-medium tabular-nums">
                  {down.value.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no success rate by down data is available.
 */
export function SuccessRateByDownEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate by Down</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No down-by-down data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for success rate by down.
 */
export function SuccessRateByDownSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-36 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-muted h-4 w-20 animate-pulse rounded" />
              <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
              <div className="bg-muted h-4 w-14 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
