import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplosivePlayMetrics } from '@/lib/db/queries';

interface ExplosivenessCardProps {
  offense: ExplosivePlayMetrics;
  defense: ExplosivePlayMetrics | null;
}

/**
 * Get color class based on explosive play rate.
 * >10% = green (good), 5-10% = gray (average), <5% = red (poor)
 */
function getExplosiveRateColor(rate: number, isDefense: boolean = false): string {
  // For defense, lower is better (invert the logic)
  if (isDefense) {
    if (rate < 5) return 'text-green-500';
    if (rate <= 10) return 'text-muted-foreground';
    return 'text-red-500';
  }
  // For offense, higher is better
  if (rate > 10) return 'text-green-500';
  if (rate >= 5) return 'text-muted-foreground';
  return 'text-red-500';
}

/**
 * Explosive play summary card.
 * Shows count, rate, and rush/pass split for offense.
 * Optionally shows comparison vs opponent explosiveness allowed (defense).
 *
 * Color bands (offense):
 * - >10% green (good)
 * - 5-10% gray (average)
 * - <5% red (poor)
 *
 * For defense, the bands are inverted (lower is better).
 */
export function ExplosivenessCard({ offense, defense }: ExplosivenessCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Explosiveness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offense Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Offense</span>
            <span
              className={cn(
                'text-xl font-semibold tabular-nums',
                getExplosiveRateColor(offense.rate)
              )}
            >
              {offense.rate.toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total</span>
              <p className="font-medium tabular-nums">{offense.count}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Rush</span>
              <p className="font-medium tabular-nums">{offense.byRush}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pass</span>
              <p className="font-medium tabular-nums">{offense.byPass}</p>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            {offense.count} of {offense.totalPlays.toLocaleString()} plays (20+ yards)
          </p>
        </div>

        {/* Defense Section */}
        {defense && (
          <>
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  Defense Allowed
                </span>
                <span
                  className={cn(
                    'text-xl font-semibold tabular-nums',
                    getExplosiveRateColor(defense.rate, true)
                  )}
                >
                  {defense.rate.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total</span>
                  <p className="font-medium tabular-nums">{defense.count}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rush</span>
                  <p className="font-medium tabular-nums">{defense.byRush}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pass</span>
                  <p className="font-medium tabular-nums">{defense.byPass}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no explosiveness data is available.
 */
export function ExplosivenessCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Explosiveness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No explosiveness data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for explosiveness card.
 */
export function ExplosivenessCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            <div className="bg-muted h-6 w-14 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded" />
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-6 w-14 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
