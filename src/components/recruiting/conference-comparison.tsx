'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, AlertCircle, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConferencePeerComparison } from '@/lib/db/queries/recruiting';

interface ConferenceComparisonProps {
  data: ConferencePeerComparison[];
  year: number;
}

/**
 * Format large numbers compactly (e.g., 248.57 -> 248.6)
 */
function formatPoints(points: number): string {
  return points.toFixed(1);
}

/**
 * Get rank display with trophy for Oklahoma
 */
function RankIndicator({ rank, isOklahoma }: { rank: number; isOklahoma: boolean }) {
  if (isOklahoma) {
    return (
      <span className="text-primary inline-flex items-center gap-1 font-semibold">
        <Trophy className="h-3 w-3" aria-hidden="true" />#{rank}
      </span>
    );
  }

  return <span className="tabular-nums">#{rank}</span>;
}

/**
 * Conference peer comparison table/chart.
 *
 * Compares Oklahoma's recruiting against SEC peers (or Big 12 pre-2024).
 * Shows: Team, National Rank, Points, Total Commits, Avg Rating
 *
 * Features:
 * - Oklahoma row highlighted
 * - Visual bar showing relative points
 * - Conference context note
 */
export function ConferenceComparison({ data, year }: ConferenceComparisonProps) {
  if (data.length === 0) {
    return <ConferenceComparisonEmpty year={year} />;
  }

  // Find max points for relative bar sizing
  const maxPoints = Math.max(...data.map((d) => d.points));

  // Sort by rank
  const sortedData = [...data].sort((a, b) => a.rank - b.rank);

  // Determine conference based on year
  const conference = year >= 2024 ? 'SEC' : 'Big 12';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year} Conference Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Conference context note */}
        <div className="bg-muted/50 mb-4 flex items-start gap-2 rounded p-2 text-xs">
          <AlertCircle
            className="text-muted-foreground mt-0.5 h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-muted-foreground">
            Comparing Oklahoma vs {conference} peers for {year} recruiting class
            {year === 2024 && ' (first year in SEC)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-12">
                  Rank
                </TableHead>
                <TableHead scope="col">Team</TableHead>
                <TableHead scope="col" className="text-right">
                  Points
                </TableHead>
                <TableHead scope="col" className="hidden text-right sm:table-cell">
                  Commits
                </TableHead>
                <TableHead scope="col" className="hidden text-right md:table-cell">
                  Avg Rating
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((team) => {
                const isOklahoma = team.team === 'Oklahoma';
                const pointsPercentage = (team.points / maxPoints) * 100;

                return (
                  <TableRow
                    key={team.team}
                    className={cn(isOklahoma && 'bg-primary/10 hover:bg-primary/15')}
                  >
                    <TableCell>
                      <RankIndicator rank={team.rank} isOklahoma={isOklahoma} />
                    </TableCell>
                    <TableCell className={cn('font-medium', isOklahoma && 'text-primary')}>
                      {team.team}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden w-16 sm:block">
                          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isOklahoma ? 'bg-primary' : 'bg-muted-foreground/50'
                              )}
                              style={{ width: `${pointsPercentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {formatPoints(team.points)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {team.totalCommits ?? '—'}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {team.avgRating ? team.avgRating.toFixed(4) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-3 text-center">
          <div>
            <div className="text-muted-foreground text-xs">Oklahoma Rank</div>
            <div className="text-lg font-semibold tabular-nums">
              #{sortedData.find((t) => t.team === 'Oklahoma')?.rank ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">vs Peers</div>
            <div className="text-lg font-semibold">
              {(() => {
                const okRank = sortedData.find((t) => t.team === 'Oklahoma')?.rank;
                if (!okRank) return '—';
                const position = sortedData.findIndex((t) => t.team === 'Oklahoma') + 1;
                const total = sortedData.length;
                if (position <= Math.ceil(total / 3)) {
                  return (
                    <span className="flex items-center justify-center gap-1 text-green-500">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      Top Third
                    </span>
                  );
                }
                if (position > Math.ceil((total * 2) / 3)) {
                  return (
                    <span className="flex items-center justify-center gap-1 text-red-500">
                      <TrendingDown className="h-4 w-4" aria-hidden="true" />
                      Bottom Third
                    </span>
                  );
                }
                return (
                  <span className="flex items-center justify-center gap-1 text-yellow-500">
                    <Minus className="h-4 w-4" aria-hidden="true" />
                    Middle
                  </span>
                );
              })()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Teams Shown</div>
            <div className="text-lg font-semibold tabular-nums">{sortedData.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConferenceComparisonEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Conference Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          No conference comparison data available{year ? ` for ${year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export function ConferenceComparisonSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-40 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Note skeleton */}
        <div className="bg-muted/50 mb-4 h-8 w-full animate-pulse rounded" />

        {/* Table skeleton */}
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 border-b pb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-4 animate-pulse rounded" />
            ))}
          </div>
          {/* Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 py-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="bg-muted h-5 animate-pulse rounded" />
              ))}
            </div>
          ))}
        </div>

        {/* Summary skeleton */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-10 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
