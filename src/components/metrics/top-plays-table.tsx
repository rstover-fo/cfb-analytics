'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopPlay } from '@/lib/db/queries';

interface TopPlaysTableProps {
  plays: TopPlay[];
}

type SortKey = 'yardsGained' | 'date';
type SortDirection = 'asc' | 'desc';

/**
 * Format date string to readable format.
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate play text for display.
 */
function truncatePlayText(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Top plays leaderboard table.
 * Shows biggest plays by yards gained with opponent, date, and description.
 *
 * Features:
 * - Sortable by yards (default: descending)
 * - Rows link to game detail page
 * - Mobile: horizontal scroll
 * - Play descriptions truncated with ellipsis
 */
export function TopPlaysTable({ plays }: TopPlaysTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('yardsGained');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedPlays = [...plays].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortKey === 'yardsGained') {
      return (a.yardsGained - b.yardsGained) * modifier;
    }
    return (new Date(a.date).getTime() - new Date(b.date).getTime()) * modifier;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Top Plays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSort('yardsGained')}
              >
                <span className="flex items-center gap-1">
                  Yards
                  <ArrowUpDown
                    className={cn(
                      'h-3 w-3',
                      sortKey === 'yardsGained' ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                </span>
              </TableHead>
              <TableHead scope="col">Opponent</TableHead>
              <TableHead
                scope="col"
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <span className="flex items-center gap-1">
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
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">
                Description
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlays.map((play, index) => (
              <TableRow key={`${play.gameId}-${play.yardsGained}-${index}`}>
                <TableCell className="font-semibold text-green-500 tabular-nums">
                  +{play.yardsGained}
                </TableCell>
                <TableCell>
                  <Link href={`/games/${play.gameId}`} className="text-primary hover:underline">
                    {play.opponent}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(play.date)}
                </TableCell>
                <TableCell className="text-sm">{play.playType}</TableCell>
                <TableCell
                  className="text-muted-foreground hidden max-w-xs text-sm md:table-cell"
                  title={play.playText}
                >
                  {truncatePlayText(play.playText)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no explosive plays exist.
 */
export function TopPlaysTableEmpty() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Top Plays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No explosive plays (20+ yards) recorded this season.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loading state for top plays table.
 */
export function TopPlaysTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header skeleton */}
          <div className="grid grid-cols-4 gap-2 border-b pb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-4 animate-pulse rounded" />
            ))}
          </div>
          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 py-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="bg-muted h-5 animate-pulse rounded" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
