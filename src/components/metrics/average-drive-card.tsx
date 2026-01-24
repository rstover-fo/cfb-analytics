import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Route, ListOrdered } from 'lucide-react';
import type { AverageDriveMetrics } from '@/lib/db/queries';

interface AverageDriveCardProps {
  data: AverageDriveMetrics;
}

/**
 * Average drive metrics card showing plays, yards, and time per drive.
 * Provides insight into drive efficiency and tempo.
 */
export function AverageDriveCard({ data }: AverageDriveCardProps) {
  const timeDisplay = `${data.avgTimeMinutes}:${String(data.avgTimeSeconds).padStart(2, '0')}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Average Drive</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <ListOrdered className="h-3 w-3" aria-hidden="true" />
              <span className="text-xs">Plays</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{data.avgPlays}</p>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Route className="h-3 w-3" aria-hidden="true" />
              <span className="text-xs">Yards</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{data.avgYards}</p>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span className="text-xs">Time</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">{timeDisplay}</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          Based on {data.totalDrives} total drives
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no average drive data is available.
 */
export function AverageDriveCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Average Drive</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No drive data available for this season.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for average drive card.
 */
export function AverageDriveCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="bg-muted h-3 w-12 animate-pulse rounded" />
              <div className="bg-muted h-6 w-10 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
