'use client';

import { useState } from 'react';
import { Trophy, XCircle, Home, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HeadToHeadGame } from '@/lib/db/queries';

interface MatchupsTableProps {
  games: HeadToHeadGame[];
  opponent: string;
}

type SortField = 'date' | 'score';
type SortDirection = 'asc' | 'desc';

/**
 * Table showing recent matchups against an opponent.
 * Sortable by date. Uses icons with badges for win/loss (not color-only).
 */
export function MatchupsTable({ games, opponent }: MatchupsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (games.length === 0) {
    return <p className="text-muted-foreground text-sm">No matchups found against {opponent}.</p>;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const sortedGames = [...games].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'date') {
      return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    // Sort by point differential
    const diffA = a.ouScore - a.oppScore;
    const diffB = b.ouScore - b.oppScore;
    return multiplier * (diffA - diffB);
  });

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
    );
  };

  const getAriaSort = (field: SortField): 'ascending' | 'descending' | undefined => {
    if (sortField !== field) return undefined;
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead aria-sort={getAriaSort('date')}>
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent -ml-3 h-8"
              onClick={() => handleSort('date')}
              aria-label={`Sort by date${sortField === 'date' ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            >
              Date
              {getSortIcon('date')}
            </Button>
          </TableHead>
          <TableHead>Venue</TableHead>
          <TableHead className="text-right" aria-sort={getAriaSort('score')}>
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent -mr-3 h-8"
              onClick={() => handleSort('score')}
              aria-label={`Sort by score${sortField === 'score' ? `, currently sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : ''}`}
            >
              Score
              {getSortIcon('score')}
            </Button>
          </TableHead>
          <TableHead className="text-center">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedGames.map((game) => (
          <TableRow key={game.gameId}>
            <TableCell className="tabular-nums">{formatDate(game.date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {game.isHome ? (
                  <Home className="text-muted-foreground h-4 w-4" aria-label="Home game" />
                ) : (
                  <MapPin className="text-muted-foreground h-4 w-4" aria-label="Away game" />
                )}
                <span className="text-muted-foreground text-sm">
                  {game.isHome ? 'Home' : 'Away'}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {game.ouScore} - {game.oppScore}
            </TableCell>
            <TableCell className="text-center">
              {game.result === 'W' ? (
                <Badge variant="default" className="bg-chart-2 hover:bg-chart-2/90">
                  <Trophy className="mr-1 h-3 w-3" aria-hidden="true" />
                  Win
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                  Loss
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
