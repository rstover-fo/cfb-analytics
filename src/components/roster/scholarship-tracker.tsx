import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScholarshipCount } from '@/lib/db/queries/roster';

interface ScholarshipTrackerProps {
  data: ScholarshipCount | null;
  year: number;
}

/**
 * Get progress bar color based on roster count relative to scholarship limit
 */
function getProgressColor(total: number, limit: number): string {
  if (total > limit) return 'bg-red-500'; // Over limit (shouldn't happen for scholarships)
  if (total === limit) return 'bg-yellow-500'; // At limit
  return 'bg-green-500'; // Under limit
}

/**
 * Get status text based on roster count
 */
function getStatusText(total: number, limit: number): string {
  if (total > limit) return 'Over Limit';
  if (total === limit) return 'At Limit';
  return 'Under Limit';
}

/**
 * Visual indicator of scholarship utilization.
 *
 * Features:
 * - Current count vs 85 limit (FBS max)
 * - Progress bar visualization
 * - Color coding: green (under), yellow (at), red (over)
 * - Note about CFBD limitation (no scholarship vs walk-on distinction)
 */
export function ScholarshipTracker({ data, year }: ScholarshipTrackerProps) {
  if (!data) {
    return <ScholarshipTrackerEmpty year={year} />;
  }

  const progressPercentage = Math.min((data.totalPlayers / data.scholarshipLimit) * 100, 100);
  const progressColor = getProgressColor(data.totalPlayers, data.scholarshipLimit);
  const statusText = getStatusText(data.totalPlayers, data.scholarshipLimit);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year} Roster Count
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-live="polite" aria-atomic="true">
          {/* Main count display */}
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">{data.totalPlayers}</span>
            <span className="text-muted-foreground text-sm">
              / {data.scholarshipLimit} scholarship limit
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="bg-muted h-3 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={data.totalPlayers}
            aria-valuemin={0}
            aria-valuemax={data.scholarshipLimit}
            aria-label={`Roster count: ${data.totalPlayers} out of ${data.scholarshipLimit}`}
          >
            <div
              className={cn('h-full rounded-full transition-all', progressColor)}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Status indicator */}
          <div className="mt-2 flex items-center justify-between text-sm">
            <span
              className={cn(
                'font-medium',
                data.totalPlayers > data.scholarshipLimit && 'text-red-500',
                data.totalPlayers === data.scholarshipLimit && 'text-yellow-500',
                data.totalPlayers < data.scholarshipLimit && 'text-green-500'
              )}
            >
              {statusText}
            </span>
            {data.spotsRemaining > 0 && (
              <span className="text-muted-foreground tabular-nums">
                {data.spotsRemaining} spots remaining
              </span>
            )}
          </div>

          {/* Note about data limitation */}
          <div className="border-border bg-muted/30 mt-3 flex items-start gap-2 rounded border p-2">
            <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-muted-foreground text-xs">{data.note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScholarshipTrackerEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Roster Count
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No roster data available{year ? ` for ${year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function ScholarshipTrackerSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-28 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Count skeleton */}
          <div className="flex items-baseline gap-2">
            <div className="bg-muted h-9 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          </div>

          {/* Progress bar skeleton */}
          <div className="bg-muted h-3 w-full animate-pulse rounded-full" />

          {/* Status skeleton */}
          <div className="flex items-center justify-between">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-4 w-28 animate-pulse rounded" />
          </div>

          {/* Note skeleton */}
          <div className="bg-muted h-12 w-full animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
