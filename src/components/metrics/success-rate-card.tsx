import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuccessRateByPlayType } from '@/lib/db/queries';

interface SuccessRateCardProps {
  data: SuccessRateByPlayType;
}

/**
 * Get color class based on success rate percentage.
 * >50% = green (good), 40-50% = yellow (average), <40% = red (poor)
 */
function getSuccessRateColor(rate: number): string {
  if (rate > 50) return 'text-green-500';
  if (rate >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get icon component based on success rate percentage.
 * >50% = check (good), <40% = X (poor), otherwise no icon
 */
function SuccessIcon({ rate }: { rate: number }) {
  if (rate > 50) {
    return <Check className="h-4 w-4 text-green-500" aria-hidden="true" />;
  }
  if (rate < 40) {
    return <X className="h-4 w-4 text-red-500" aria-hidden="true" />;
  }
  return null;
}

/**
 * Success rate display card.
 * Shows overall, rush, and pass success rates with color coding and icons.
 *
 * Color bands:
 * - >50% green + check icon (good)
 * - 40-50% yellow (average)
 * - <40% red + X icon (poor)
 */
export function SuccessRateCard({ data }: SuccessRateCardProps) {
  const metrics = [
    {
      label: 'Overall',
      value: data.overallSuccessRate,
      attempts: data.rushAttempts + data.passAttempts,
    },
    {
      label: 'Rush',
      value: data.rushSuccessRate,
      attempts: data.rushAttempts,
    },
    {
      label: 'Pass',
      value: data.passSuccessRate,
      attempts: data.passAttempts,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SuccessIcon rate={metric.value} />
                <span className="text-muted-foreground text-sm">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    getSuccessRateColor(metric.value)
                  )}
                >
                  {metric.value.toFixed(1)}%
                </span>
                <span className="text-muted-foreground text-xs">
                  ({metric.attempts.toLocaleString()} plays)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no success rate data is available.
 */
export function SuccessRateCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No success rate data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for success rate card.
 */
export function SuccessRateCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
