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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowUpDown, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PositionRosterGroup } from '@/lib/db/queries/roster';

interface PositionRosterTableProps {
  data: PositionRosterGroup[];
  year: number;
}

type SortKey = 'name' | 'jersey' | 'classYear' | 'height' | 'weight';
type SortDirection = 'asc' | 'desc';

/**
 * Format height from inches to feet and inches
 */
function formatHeight(inches: number | null): string {
  if (inches === null) return '—';
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

/**
 * Format weight with "lbs" suffix
 */
function formatWeight(lbs: number | null): string {
  if (lbs === null) return '—';
  return `${lbs} lbs`;
}

/**
 * Format hometown from city, state, country
 */
function formatHometown(city: string | null, state: string | null, country: string | null): string {
  if (city && state) {
    return `${city}, ${state}`;
  }
  if (state) {
    return state;
  }
  if (country && country !== 'USA') {
    return country;
  }
  return '—';
}

/**
 * Individual position group section with collapsible content
 */
function PositionGroup({
  group,
  defaultOpen = false,
}: {
  group: PositionRosterGroup;
  defaultOpen?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Default to ascending for name, descending for numeric
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedPlayers = [...group.players].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'name':
        return a.lastName.localeCompare(b.lastName) * modifier;
      case 'jersey':
        if (a.jersey === null && b.jersey === null) return 0;
        if (a.jersey === null) return 1;
        if (b.jersey === null) return -1;
        return (a.jersey - b.jersey) * modifier;
      case 'classYear':
        if (a.classYear === null && b.classYear === null) return 0;
        if (a.classYear === null) return 1;
        if (b.classYear === null) return -1;
        return (a.classYear - b.classYear) * modifier;
      case 'height':
        if (a.height === null && b.height === null) return 0;
        if (a.height === null) return 1;
        if (b.height === null) return -1;
        return (a.height - b.height) * modifier;
      case 'weight':
        if (a.weight === null && b.weight === null) return 0;
        if (a.weight === null) return 1;
        if (b.weight === null) return -1;
        return (a.weight - b.weight) * modifier;
      default:
        return 0;
    }
  });

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <button className="border-border bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{group.position}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              ({group.count} player{group.count !== 1 ? 's' : ''})
            </span>
          </div>
          <ChevronDown
            className="text-muted-foreground h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('jersey')}
                >
                  <span className="flex items-center gap-1">
                    #
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'jersey' ? 'text-foreground' : 'text-muted-foreground'
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
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSort('classYear')}
                >
                  <span className="flex items-center gap-1">
                    Class
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'classYear' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 hidden cursor-pointer sm:table-cell"
                  onClick={() => handleSort('height')}
                >
                  <span className="flex items-center gap-1">
                    Height
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'height' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </TableHead>
                <TableHead
                  scope="col"
                  className="hover:bg-muted/50 hidden cursor-pointer sm:table-cell"
                  onClick={() => handleSort('weight')}
                >
                  <span className="flex items-center gap-1">
                    Weight
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        sortKey === 'weight' ? 'text-foreground' : 'text-muted-foreground'
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
              {sortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {player.jersey !== null ? player.jersey : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{player.fullName}</TableCell>
                  <TableCell className="tabular-nums">{player.classYearLabel}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {formatHeight(player.height)}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {formatWeight(player.weight)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {formatHometown(
                      player.hometownCity,
                      player.hometownState,
                      player.hometownCountry
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Table showing current roster grouped by position.
 *
 * Features:
 * - Players grouped by position with expandable/collapsible sections
 * - Sortable columns within each position group
 * - Columns: name, jersey #, class year, height, weight, hometown
 * - Mobile responsive
 */
export function PositionRosterTable({ data, year }: PositionRosterTableProps) {
  if (data.length === 0) {
    return <PositionRosterTableEmpty year={year} />;
  }

  // Calculate total players
  const totalPlayers = data.reduce((sum, group) => sum + group.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year} Roster by Position
          <span className="text-muted-foreground font-normal">({totalPlayers} players)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((group, index) => (
            <PositionGroup
              key={group.position}
              group={group}
              // Open the first position group by default
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PositionRosterTableEmpty({ year }: { year?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          {year ? `${year} ` : ''}Roster by Position
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

export function PositionRosterTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="bg-muted h-4 w-40 animate-pulse rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Position group skeletons */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="border-border bg-card flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-3 w-20 animate-pulse rounded" />
              </div>
              <div className="bg-muted h-4 w-4 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
