import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trophy, Users } from 'lucide-react';
import type { ClassSummary } from '@/lib/db/queries/recruiting';

interface ClassSummaryCardProps {
  data: ClassSummary | null;
}

/**
 * Star rating display component
 * Shows filled and empty stars based on the rating
 */
function StarRating({ stars, maxStars = 5 }: { stars: number; maxStars?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} star rating`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < stars ? 'fill-yellow-500 text-yellow-500' : 'fill-muted text-muted'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Star breakdown item showing count for a specific star rating
 */
function StarBreakdownItem({ stars, count }: { stars: number; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <StarRating stars={stars} />
      <span className="text-sm font-medium tabular-nums">{count}</span>
    </div>
  );
}

export function ClassSummaryCard({ data }: ClassSummaryCardProps) {
  if (!data) {
    return <ClassSummaryCardEmpty />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          {data.year} Recruiting Class
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-live="polite" aria-atomic="true">
          {/* Primary metrics */}
          <div className="mb-4 flex items-baseline gap-3">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-5 w-5" aria-hidden="true" />
              <span className="text-3xl font-bold tabular-nums">{data.totalCommits}</span>
              <span className="text-muted-foreground text-sm">commits</span>
            </div>
          </div>

          {/* Ratings */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-xs">Avg Rating</div>
              <div className="text-lg font-semibold tabular-nums">{data.avgRating.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Avg Stars</div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold tabular-nums">
                  {data.avgStars.toFixed(2)}
                </span>
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Star breakdown */}
          <div className="mb-4 space-y-1.5 border-t pt-3">
            <div className="text-muted-foreground mb-2 text-xs font-medium">Star Breakdown</div>
            <StarBreakdownItem stars={5} count={data.fiveStars} />
            <StarBreakdownItem stars={4} count={data.fourStars} />
            <StarBreakdownItem stars={3} count={data.threeStars} />
            {data.twoStars > 0 && <StarBreakdownItem stars={2} count={data.twoStars} />}
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            <div>
              <div className="text-muted-foreground text-xs">National Rank</div>
              <div className="text-lg font-semibold tabular-nums">
                {data.nationalRank !== null ? `#${data.nationalRank}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Conference Rank</div>
              <div className="text-lg font-semibold tabular-nums">
                {data.conferenceRank !== null ? `#${data.conferenceRank}` : '—'}
              </div>
            </div>
          </div>

          {/* Points */}
          {data.points !== null && (
            <div className="mt-3 border-t pt-3">
              <div className="text-muted-foreground text-xs">Total Points</div>
              <div className="text-lg font-semibold tabular-nums">{data.points.toFixed(2)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClassSummaryCardEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Recruiting Class
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">No commits yet for this class</p>
      </CardContent>
    </Card>
  );
}

export function ClassSummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-32 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary metric skeleton */}
          <div className="flex items-baseline gap-3">
            <div className="bg-muted h-9 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
          </div>

          {/* Ratings skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            </div>
            <div className="space-y-1">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-16 animate-pulse rounded" />
            </div>
          </div>

          {/* Star breakdown skeleton */}
          <div className="space-y-2 border-t pt-3">
            <div className="bg-muted h-3 w-24 animate-pulse rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                <div className="bg-muted h-4 w-6 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Rankings skeleton */}
          <div className="grid grid-cols-2 gap-4 border-t pt-3">
            <div className="space-y-1">
              <div className="bg-muted h-3 w-20 animate-pulse rounded" />
              <div className="bg-muted h-6 w-10 animate-pulse rounded" />
            </div>
            <div className="space-y-1">
              <div className="bg-muted h-3 w-24 animate-pulse rounded" />
              <div className="bg-muted h-6 w-10 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
