'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, Star, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopRecruit } from '@/lib/db/queries/recruiting';

interface TopRecruitsTableProps {
  data: TopRecruit[];
  year: number;
  /** Initial number of rows to display before expansion */
  initialLimit?: number;
}

type SortKey = 'rating' | 'stars' | 'ranking' | 'name';
type SortDirection = 'asc' | 'desc';

/**
 * Star rating display component
 */
function StarRating({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} star rating`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < stars ? 'fill-yellow-500 text-yellow-500' : 'fill-muted text-muted'
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Sortable table of top recruits by class year.
 *
 * Features:
 * - Sortable columns (rating, stars, ranking, name)
 * - Default: top 10, expandable to show all
 * - Star rating displayed with visual icons
 * - Mobile: horizontal scroll
 */
export function TopRecruitsTable({ data, year, initialLimit = 10 }: TopRecruitsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0) {
    return <TopRecruitsTableEmpty year={year} />;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Default to descending for numeric columns, ascending for name
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'rating':
        return (a.rating - b.rating) * modifier;
      case 'stars':
        return (a.stars - b.stars) * modifier;
      case 'ranking':
        // Handle null rankings (push to end)
        if (a.ranking === null && b.ranking === null) return 0;
        if (a.ranking === null) return 1;
        if (b.ranking === null) return -1;
        return (a.ranking - b.ranking) * modifier;
      case 'name':
        return a.name.localeCompare(b.name) * modifier;
      default:
        return 0;
    }
  });

  const displayData = expanded ? sortedData : sortedData.slice(0, initialLimit);
  const hasMore = data.length > initialLimit;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Award className="h-4 w-4" aria-hidden="true" />
          {year} Top Recruits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('ranking')}
                >
                  <span className="flex items-center gap-1">
                    #
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'ranking' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Name
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'name' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead scope="col">Pos</TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('stars')}
                >
                  <span className="flex items-center gap-1">
                    Stars
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'stars' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('rating')}
                >
                  <span className="flex items-center gap-1">
                    Rating
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'rating' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
                  Hometown
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((recruit) => (
                <TableRow key={recruit.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {recruit.ranking !== null ? recruit.ranking : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span
                      className={cn(recruit.stars === 5 && 'text-yellow-500')}
                      title={recruit.stars === 5 ? '5-star recruit' : undefined}
                    >
                      {recruit.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {recruit.position || '—'}
                  </TableCell>
                  <TableCell>
                    <StarRating stars={recruit.stars} />
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {recruit.rating.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {recruit.city && recruit.stateProvince
                      ? `${recruit.city}, ${recruit.stateProvince}`
                      : recruit.stateProvince || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Expand/Collapse button */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground mt-3 flex w-full items-center justify-center gap-1 rounded border py-2 text-sm transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                Show All {data.length} Recruits
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function TopRecruitsTableEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Award className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Top Recruits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No recruiting data available{year ? ` for ${year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function TopRecruitsTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Award className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-32 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header skeleton */}
          <div className="grid grid-cols-5 gap-2 border-b pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted h-4 animate-pulse rounded" />
            ))}
          </div>
          {/* Row skeletons */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 py-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="bg-muted h-5 animate-pulse rounded" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
