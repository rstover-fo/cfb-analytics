import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, ArrowRightLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalImpact } from '@/lib/db/queries/transfers';

interface PortalImpactCardProps {
  data: PortalImpact | null;
}

/**
 * Trend indicator with icon and color
 */
function TrendIndicator({
  value,
  label,
  format = 'number',
}: {
  value: number;
  label: string;
  format?: 'number' | 'rating';
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const formattedValue =
    format === 'rating'
      ? `${isPositive ? '+' : ''}${value.toFixed(2)}`
      : `${isPositive ? '+' : ''}${value}`;

  return (
    <div className="flex items-center gap-2">
      {isPositive && <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />}
      {isNegative && <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />}
      {isNeutral && <Minus className="text-muted-foreground h-4 w-4" aria-hidden="true" />}
      <div>
        <div className="text-muted-foreground text-xs">{label}</div>
        <div
          className={cn(
            'text-lg font-semibold tabular-nums',
            isPositive && 'text-green-500',
            isNegative && 'text-red-500',
            isNeutral && 'text-muted-foreground'
          )}
        >
          {formattedValue}
        </div>
      </div>
    </div>
  );
}

/**
 * Position count display
 */
function PositionList({
  positions,
  label,
  direction,
}: {
  positions: { position: string; count: number }[];
  label: string;
  direction: 'lost' | 'gained';
}) {
  if (positions.length === 0) {
    return (
      <div>
        <div className="text-muted-foreground mb-1 text-xs">{label}</div>
        <p className="text-muted-foreground text-sm">None</p>
      </div>
    );
  }

  // Show top 5 positions
  const topPositions = positions.slice(0, 5);

  return (
    <div>
      <div className="text-muted-foreground mb-1 text-xs">{label}</div>
      <div className="flex flex-wrap gap-1">
        {topPositions.map(({ position, count }) => (
          <span
            key={position}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
              direction === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            )}
          >
            {position}
            {count > 1 && <span className="tabular-nums">({count})</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Summary card showing net portal impact.
 *
 * Features:
 * - Net player change (+/- count)
 * - Net rating impact (sum of arrivals - sum of departures)
 * - Positions gained/lost breakdown
 * - Color coding: green for net positive, red for net negative
 * - Icons supplement color (not color-only)
 */
export function PortalImpactCard({ data }: PortalImpactCardProps) {
  if (!data) {
    return <PortalImpactCardEmpty />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          {data.season} Transfer Portal Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-live="polite" aria-atomic="true">
          {/* Primary metrics */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Departures */}
            <div>
              <div className="text-muted-foreground text-xs">Departures</div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-red-500 tabular-nums">
                  {data.departureCount}
                </span>
              </div>
            </div>

            {/* Arrivals */}
            <div>
              <div className="text-muted-foreground text-xs">Arrivals</div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-green-500 tabular-nums">
                  {data.arrivalCount}
                </span>
              </div>
            </div>

            {/* Net Player Change */}
            <TrendIndicator value={data.netChange} label="Net Player Change" />

            {/* Net Rating Change */}
            <TrendIndicator
              value={data.netRatingChange}
              label="Net Rating Impact"
              format="rating"
            />
          </div>

          {/* Rating sums */}
          <div className="mb-4 grid grid-cols-2 gap-4 border-t pt-3">
            <div>
              <div className="text-muted-foreground text-xs">Total Rating Lost</div>
              <div className="text-lg font-semibold tabular-nums">
                {data.departureRatingSum > 0 ? data.departureRatingSum.toFixed(2) : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Total Rating Gained</div>
              <div className="text-lg font-semibold tabular-nums">
                {data.arrivalRatingSum > 0 ? data.arrivalRatingSum.toFixed(2) : '—'}
              </div>
            </div>
          </div>

          {/* Position breakdown */}
          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            <PositionList positions={data.positionsLost} label="Positions Lost" direction="lost" />
            <PositionList
              positions={data.positionsGained}
              label="Positions Gained"
              direction="gained"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortalImpactCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          Transfer Portal Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" aria-hidden="true" />
          <p className="text-sm">No portal data available for this year</p>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Transfer portal data is available from 2021 onward.
        </p>
      </CardContent>
    </Card>
  );
}

export function PortalImpactCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-48 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary metrics skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                <div className="bg-muted h-8 w-12 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Rating sums skeleton */}
          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                <div className="bg-muted h-6 w-16 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Position breakdown skeleton */}
          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                <div className="flex gap-1">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="bg-muted h-5 w-10 animate-pulse rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
