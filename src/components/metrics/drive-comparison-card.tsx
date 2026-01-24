import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DriveComparison } from '@/lib/db/queries';

interface DriveComparisonCardProps {
  data: DriveComparison;
}

/**
 * Get color class based on comparison (higher is better for offense metrics).
 */
function getComparisonColor(
  ouValue: number,
  oppValue: number,
  higherIsBetter: boolean = true
): string {
  const diff = higherIsBetter ? ouValue - oppValue : oppValue - ouValue;
  if (diff > 2) return 'text-green-500';
  if (diff < -2) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * Drive comparison card showing OU offense vs opponent offense.
 * Helps assess both offensive efficiency and defensive performance.
 */
export function DriveComparisonCard({ data }: DriveComparisonCardProps) {
  const ouTimeDisplay = `${Math.floor(data.ou.avgTimeMinutes)}:${String(Math.round((data.ou.avgTimeMinutes % 1) * 60)).padStart(2, '0')}`;
  const oppTimeDisplay = `${Math.floor(data.opponent.avgTimeMinutes)}:${String(Math.round((data.opponent.avgTimeMinutes % 1) * 60)).padStart(2, '0')}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Swords className="h-4 w-4 text-orange-500" aria-hidden="true" />
          Drive Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header row */}
        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-b pb-2 text-xs">
          <div></div>
          <div className="text-center font-medium">OU Offense</div>
          <div className="flex items-center justify-center gap-1 text-center font-medium">
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span>OU Defense</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Success Rate</span>
          <div className="text-center">
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                getComparisonColor(data.ou.successRate, data.opponent.successRate)
              )}
            >
              {data.ou.successRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-center">
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                getComparisonColor(data.opponent.successRate, data.ou.successRate, false)
              )}
            >
              {data.opponent.successRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Total Drives */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Total Drives</span>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{data.ou.totalDrives}</span>
          </div>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{data.opponent.totalDrives}</span>
          </div>
        </div>

        {/* Scoring Drives */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Scoring Drives</span>
          <div className="text-center">
            <span
              className={cn(
                'font-semibold tabular-nums',
                getComparisonColor(data.ou.scoringDrives, data.opponent.scoringDrives)
              )}
            >
              {data.ou.scoringDrives}
            </span>
          </div>
          <div className="text-center">
            <span
              className={cn(
                'font-semibold tabular-nums',
                getComparisonColor(data.opponent.scoringDrives, data.ou.scoringDrives, false)
              )}
            >
              {data.opponent.scoringDrives}
            </span>
          </div>
        </div>

        {/* Avg Plays */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Avg Plays</span>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{data.ou.avgPlays}</span>
          </div>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{data.opponent.avgPlays}</span>
          </div>
        </div>

        {/* Avg Yards */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Avg Yards</span>
          <div className="text-center">
            <span
              className={cn(
                'font-semibold tabular-nums',
                getComparisonColor(data.ou.avgYards, data.opponent.avgYards)
              )}
            >
              {data.ou.avgYards}
            </span>
          </div>
          <div className="text-center">
            <span
              className={cn(
                'font-semibold tabular-nums',
                getComparisonColor(data.opponent.avgYards, data.ou.avgYards, false)
              )}
            >
              {data.opponent.avgYards}
            </span>
          </div>
        </div>

        {/* Avg Time */}
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="text-sm">Avg Time</span>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{ouTimeDisplay}</span>
          </div>
          <div className="text-center">
            <span className="font-semibold tabular-nums">{oppTimeDisplay}</span>
          </div>
        </div>

        <p className="text-muted-foreground border-t pt-2 text-xs">
          OU Defense column shows opponent performance (lower is better)
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no drive comparison data is available.
 */
export function DriveComparisonCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Swords className="h-4 w-4 text-orange-500" aria-hidden="true" />
          Drive Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No drive comparison data available for this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for drive comparison card.
 */
export function DriveComparisonCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 border-b pb-2">
          <div />
          <div className="bg-muted h-4 animate-pulse rounded" />
          <div className="bg-muted h-4 animate-pulse rounded" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div className="bg-muted h-5 animate-pulse rounded" />
            <div className="bg-muted h-5 animate-pulse rounded" />
            <div className="bg-muted h-5 animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
