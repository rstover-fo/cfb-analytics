import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveSuccessRate } from '@/lib/db/queries';

interface DriveSuccessCardProps {
  data: DriveSuccessRate;
}

/**
 * Get color class based on drive success rate.
 * >50% = green (good), 35-50% = yellow (average), <35% = red (poor)
 */
function getSuccessRateColor(rate: number): string {
  if (rate > 50) return 'text-green-500';
  if (rate >= 35) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get icon based on drive success rate.
 */
function getSuccessRateIcon(rate: number) {
  if (rate > 50) return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
  if (rate >= 35) return <Minus className="h-4 w-4" aria-hidden="true" />;
  return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
}

/**
 * Drive success rate card showing scoring drive percentage.
 * Success = drive resulting in points (TD or FG).
 *
 * Color bands:
 * - >50% green (good)
 * - 35-50% yellow (average)
 * - <35% red (poor)
 */
export function DriveSuccessCard({ data }: DriveSuccessCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Drive Success Rate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Scoring Drives</span>
          <div className={cn('flex items-center gap-1', getSuccessRateColor(data.successRate))}>
            {getSuccessRateIcon(data.successRate)}
            <span className="text-2xl font-semibold tabular-nums">
              {data.successRate.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Scoring</span>
            <p className="font-semibold tabular-nums">{data.scoringDrives}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total</span>
            <p className="font-semibold tabular-nums">{data.totalDrives}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {data.scoringDrives} of {data.totalDrives} drives resulted in points
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no drive success data is available.
 */
export function DriveSuccessCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Drive Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No drive success data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for drive success card.
 */
export function DriveSuccessCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted h-12 animate-pulse rounded" />
          <div className="bg-muted h-12 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
