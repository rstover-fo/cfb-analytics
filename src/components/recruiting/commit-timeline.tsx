import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Star, User } from 'lucide-react';
import type { CommitTimelineEntry } from '@/lib/db/queries/recruiting';

interface CommitTimelineProps {
  data: CommitTimelineEntry[];
  year: number;
}

/**
 * Star rating display with filled stars
 */
function StarRating({ stars }: { stars: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${stars} star rating`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => (
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
 * Individual timeline entry for a recruit
 */
function TimelineEntry({ recruit, isLast }: { recruit: CommitTimelineEntry; isLast: boolean }) {
  const hometown =
    recruit.city && recruit.stateProvince
      ? `${recruit.city}, ${recruit.stateProvince}`
      : recruit.city || recruit.stateProvince || null;

  return (
    <li className="relative pb-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="bg-border absolute top-6 left-3 h-full w-px" aria-hidden="true" />
      )}

      <div className="flex gap-3">
        {/* Timeline dot */}
        <div
          className={`bg-primary mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            recruit.stars === 5 ? 'ring-offset-background ring-2 ring-yellow-500 ring-offset-2' : ''
          }`}
          aria-hidden="true"
        >
          <User className="text-primary-foreground h-3 w-3" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{recruit.name}</span>
            {recruit.position && (
              <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                {recruit.position}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StarRating stars={recruit.stars} />
            <span className="text-muted-foreground text-xs tabular-nums">
              {recruit.rating.toFixed(4)}
            </span>
          </div>

          {hometown && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {hometown}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommitTimeline({ data, year }: CommitTimelineProps) {
  if (!data || data.length === 0) {
    return <CommitTimelineEmpty year={year} />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {year} Commits ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <ol className="space-y-0" role="list" aria-label={`${year} recruiting class commits`}>
            {data.map((recruit, index) => (
              <TimelineEntry
                key={recruit.id}
                recruit={recruit}
                isLast={index === data.length - 1}
              />
            ))}
          </ol>
        </div>

        {/* NSD milestone note */}
        <div className="text-muted-foreground mt-4 border-t pt-3 text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>Early Signing Period: December • National Signing Day: February</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CommitTimelineEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} Commits` : 'Commits'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No commits yet{year ? ` for the ${year} class` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function CommitTimelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-28 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              {/* Timeline dot skeleton */}
              <div className="bg-muted mt-1.5 h-6 w-6 shrink-0 animate-pulse rounded-full" />

              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-4 w-28 animate-pulse rounded" />
                  <div className="bg-muted h-5 w-8 animate-pulse rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-12 animate-pulse rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-muted h-3 w-3 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
