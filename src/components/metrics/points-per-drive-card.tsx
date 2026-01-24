import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PointsPerDriveByPosition } from '@/lib/db/queries';

interface PointsPerDriveCardProps {
  data: PointsPerDriveByPosition;
}

/**
 * Field position bucket configuration.
 */
const BUCKETS = [
  { key: 'redZone' as const, label: 'Red Zone', sublabel: '0-20 yds', color: 'bg-red-500' },
  { key: 'opponent' as const, label: 'Opp Terr', sublabel: '21-40 yds', color: 'bg-orange-500' },
  { key: 'midfield' as const, label: 'Midfield', sublabel: '41-60 yds', color: 'bg-yellow-500' },
  { key: 'ownHalf' as const, label: 'Own Half', sublabel: '61+ yds', color: 'bg-blue-500' },
] as const;

/**
 * Get color class based on PPD value.
 * Higher PPD = better efficiency from that field position.
 */
function getPPDColor(ppd: number): string {
  if (ppd >= 4) return 'text-green-500';
  if (ppd >= 2) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Points per drive by field position card.
 * Shows scoring efficiency based on where drives start.
 *
 * Field position buckets:
 * - Red Zone (0-20 yards to goal): Should have highest PPD
 * - Opponent Territory (21-40): Good field position
 * - Midfield (41-60): Neutral position
 * - Own Half (61+): Long field to score
 */
export function PointsPerDriveCard({ data }: PointsPerDriveCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-blue-500" aria-hidden="true" />
          Points Per Drive by Field Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall PPD */}
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-sm font-medium">Overall PPD</span>
          <span className={cn('text-xl font-semibold tabular-nums', getPPDColor(data.overall.ppd))}>
            {data.overall.ppd.toFixed(2)}
          </span>
        </div>

        {/* Field position breakdown */}
        <div className="space-y-3">
          {BUCKETS.map((bucket) => {
            const bucketData = data[bucket.key];
            return (
              <div key={bucket.key} className="flex items-center gap-3">
                <div className={cn('h-8 w-2 rounded-full', bucket.color)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">{bucket.label}</span>
                    <span
                      className={cn(
                        'text-lg font-semibold tabular-nums',
                        getPPDColor(bucketData.ppd)
                      )}
                    >
                      {bucketData.ppd.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>{bucket.sublabel}</span>
                    <span className="tabular-nums">
                      {bucketData.drives} drives, {bucketData.points} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground border-t pt-2 text-xs">
          {data.overall.points} total points from {data.overall.drives} drives
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no points per drive data is available.
 */
export function PointsPerDriveCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-blue-500" aria-hidden="true" />
          Points Per Drive by Field Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No points per drive data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for points per drive card.
 */
export function PointsPerDriveCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          <div className="bg-muted h-6 w-12 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-muted h-8 w-2 animate-pulse rounded-full" />
              <div className="flex-1">
                <div className="bg-muted mb-1 h-5 w-full animate-pulse rounded" />
                <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
