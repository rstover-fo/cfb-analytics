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
import { ArrowUpDown, Star, LogOut, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalDeparture } from '@/lib/db/queries/transfers';

interface PortalDeparturesTableProps {
  data: PortalDeparture[];
  year: number;
  /** Initial number of rows to display before expansion */
  initialLimit?: number;
}

type SortKey = 'rating' | 'stars' | 'name' | 'position' | 'date';
type SortDirection = 'asc' | 'desc';

/**
 * Star rating display component
 */
function StarRating({ stars }: { stars: number | null }) {
  if (stars === null) return <span className="text-muted-foreground">—</span>;

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
 * Format transfer date for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Table showing players who entered the transfer portal from Oklahoma.
 *
 * Features:
 * - Sortable columns (rating, stars, name, position, date)
 * - Default: top 10, expandable to show all
 * - Star rating displayed with visual icons
 * - Mobile: horizontal scroll
 */
export function PortalDeparturesTable({
  data,
  year,
  initialLimit = 10,
}: PortalDeparturesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0) {
    return <PortalDeparturesTableEmpty year={year} />;
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
        // Handle null ratings (push to end)
        if (a.rating === null && b.rating === null) return 0;
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        return (a.rating - b.rating) * modifier;
      case 'stars':
        // Handle null stars (push to end)
        if (a.stars === null && b.stars === null) return 0;
        if (a.stars === null) return 1;
        if (b.stars === null) return -1;
        return (a.stars - b.stars) * modifier;
      case 'name':
        return a.fullName.localeCompare(b.fullName) * modifier;
      case 'position':
        const posA = a.position || '';
        const posB = b.position || '';
        return posA.localeCompare(posB) * modifier;
      case 'date':
        const dateA = a.transferDate || '';
        const dateB = b.transferDate || '';
        return dateA.localeCompare(dateB) * modifier;
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
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {year} Portal Departures
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
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('position')}
                >
                  <span className="flex items-center gap-1">
                    Pos
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'position' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
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
                  Destination
                </TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 hidden cursor-pointer lg:table-cell"
                  onClick={() => handleSort('date')}
                >
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Date
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'date' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.fullName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {player.position || '—'}
                  </TableCell>
                  <TableCell>
                    <StarRating stars={player.stars} />
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {player.rating !== null ? player.rating.toFixed(4) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {player.destination || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                    {formatDate(player.transferDate)}
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
                Show All {data.length} Departures
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function PortalDeparturesTableEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Portal Departures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No portal departures{year ? ` for ${year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function PortalDeparturesTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-32 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header skeleton */}
          <div className="grid grid-cols-4 gap-2 border-b pb-2 md:grid-cols-5 lg:grid-cols-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-4 animate-pulse rounded" />
            ))}
            <div className="bg-muted hidden h-4 animate-pulse rounded md:block" />
            <div className="bg-muted hidden h-4 animate-pulse rounded lg:block" />
          </div>
          {/* Row skeletons */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 py-2 md:grid-cols-5 lg:grid-cols-6">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="bg-muted h-5 animate-pulse rounded" />
              ))}
              <div className="bg-muted hidden h-5 animate-pulse rounded md:block" />
              <div className="bg-muted hidden h-5 animate-pulse rounded lg:block" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
