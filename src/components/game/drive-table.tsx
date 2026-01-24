'use client';

import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DriveSummary } from '@/lib/db';

export interface DriveTableProps {
  drives: DriveSummary[];
  /** The team we consider "our" team for filtering */
  focusTeam?: string;
  /** Opponent team name for CSV filename */
  opponentTeam: string;
  /** Game date for CSV filename (ISO string) */
  gameDate: string;
  className?: string;
}

type SortField = 'driveNumber' | 'plays' | 'yards' | 'time' | 'result';
type SortDirection = 'asc' | 'desc';
type TeamFilter = 'all' | 'focus' | 'opponent';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

/**
 * Drive result color mapping for badges.
 */
function getDriveResultColor(result: string): string {
  const normalized = result.toUpperCase();
  if (normalized.includes('TD') || normalized.includes('TOUCHDOWN')) return 'bg-green-600';
  if (normalized.includes('FG') || normalized.includes('FIELD GOAL')) return 'bg-yellow-600';
  if (normalized.includes('PUNT')) return 'bg-gray-500';
  if (
    normalized.includes('INT') ||
    normalized.includes('FUMBLE') ||
    normalized.includes('TURNOVER') ||
    normalized.includes('DOWNS')
  )
    return 'bg-red-600';
  return 'bg-gray-400';
}

/**
 * Format elapsed time as M:SS
 */
function formatTime(minutes: number, seconds: number): string {
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Convert elapsed time to total seconds for sorting
 */
function timeToSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}

/**
 * Sort header button component
 */
interface SortHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortHeader({ field, label, currentSort, onSort, className }: SortHeaderProps) {
  const isActive = currentSort.field === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'hover:text-foreground inline-flex items-center gap-1 transition-colors',
        isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
        className
      )}
      aria-label={`Sort by ${label}, currently ${isActive ? currentSort.direction : 'not sorted'}`}
    >
      {label}
      {isActive ? (
        currentSort.direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * DriveTable displays a sortable, filterable table of drives with CSV export.
 *
 * Features:
 * - Sortable columns: Drive #, Plays, Yards, Time, Result
 * - Team filter: All, Focus Team, Opponent
 * - Aggregate stats for filtered view
 * - CSV export with UTF-8 BOM for Excel compatibility
 */
export function DriveTable({
  drives,
  focusTeam = 'Oklahoma',
  opponentTeam,
  gameDate,
  className,
}: DriveTableProps) {
  const [sort, setSort] = useState<SortState>({ field: 'driveNumber', direction: 'asc' });
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');

  // Filter drives by team
  const filteredDrives = useMemo(() => {
    if (teamFilter === 'all') return drives;
    if (teamFilter === 'focus') return drives.filter((d) => d.offense === focusTeam);
    return drives.filter((d) => d.offense !== focusTeam);
  }, [drives, teamFilter, focusTeam]);

  // Sort filtered drives
  const sortedDrives = useMemo(() => {
    const sorted = [...filteredDrives];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'driveNumber':
          comparison = a.driveNumber - b.driveNumber;
          break;
        case 'plays':
          comparison = a.plays - b.plays;
          break;
        case 'yards':
          comparison = a.yards - b.yards;
          break;
        case 'time':
          comparison =
            timeToSeconds(a.elapsedMinutes, a.elapsedSeconds) -
            timeToSeconds(b.elapsedMinutes, b.elapsedSeconds);
          break;
        case 'result':
          comparison = a.result.localeCompare(b.result);
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredDrives, sort]);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    const totalPlays = filteredDrives.reduce((sum, d) => sum + d.plays, 0);
    const totalYards = filteredDrives.reduce((sum, d) => sum + d.yards, 0);
    const totalSeconds = filteredDrives.reduce(
      (sum, d) => sum + timeToSeconds(d.elapsedMinutes, d.elapsedSeconds),
      0
    );
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const scoringDrives = filteredDrives.filter((d) => d.scoring).length;

    return {
      driveCount: filteredDrives.length,
      totalPlays,
      totalYards,
      totalTime: formatTime(totalMinutes, remainingSeconds),
      scoringDrives,
      avgYardsPerDrive:
        filteredDrives.length > 0 ? (totalYards / filteredDrives.length).toFixed(1) : '0',
    };
  }, [filteredDrives]);

  // Toggle sort direction or change field
  const handleSort = useCallback((field: SortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  }, []);

  // Export to CSV
  const handleExport = useCallback(() => {
    const csvData = sortedDrives.map((drive) => ({
      'Drive #': drive.driveNumber,
      Team: drive.offense,
      Quarter: drive.startPeriod,
      'Start Yard Line': drive.startYardsToGoal > 0 ? `Own ${100 - drive.startYardsToGoal}` : '-',
      Plays: drive.plays,
      Yards: drive.yards,
      Time: formatTime(drive.elapsedMinutes, drive.elapsedSeconds),
      Result: drive.result,
      Scoring: drive.scoring ? 'Yes' : 'No',
    }));

    const csv = Papa.unparse(csvData);

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

    // Create filename: oklahoma-{opponent}-{date}-drives.csv
    const dateStr = new Date(gameDate).toISOString().split('T')[0];
    const sanitizedOpponent = opponentTeam.toLowerCase().replace(/\s+/g, '-');
    const filename = `oklahoma-${sanitizedOpponent}-${dateStr}-drives.csv`;

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedDrives, opponentTeam, gameDate]);

  if (drives.length === 0) {
    return (
      <div className={cn('text-muted-foreground py-8 text-center', className)}>
        No drive data available for this game.
      </div>
    );
  }

  // Determine opponent name for filter label
  const opponentName = drives.find((d) => d.offense !== focusTeam)?.offense ?? 'Opponent';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls: Team filter and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Team filter */}
        <div className="flex items-center gap-2" role="group" aria-label="Filter by team">
          <span className="text-muted-foreground text-sm">Show:</span>
          <div className="flex rounded-lg border">
            <button
              type="button"
              onClick={() => setTeamFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                teamFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              aria-pressed={teamFilter === 'all'}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTeamFilter('focus')}
              className={cn(
                'border-l px-3 py-1.5 text-sm transition-colors',
                teamFilter === 'focus' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              aria-pressed={teamFilter === 'focus'}
            >
              {focusTeam}
            </button>
            <button
              type="button"
              onClick={() => setTeamFilter('opponent')}
              className={cn(
                'border-l px-3 py-1.5 text-sm transition-colors',
                teamFilter === 'opponent' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              aria-pressed={teamFilter === 'opponent'}
            >
              {opponentName}
            </button>
          </div>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          className="hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Aggregate stats */}
      <div className="bg-muted/30 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border p-3 text-sm">
        <div>
          <span className="text-muted-foreground">Drives:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.driveCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Plays:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.totalPlays}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Yards:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.totalYards}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Avg Yards/Drive:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.avgYardsPerDrive}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Time:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.totalTime}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Scoring:</span>{' '}
          <span className="font-medium tabular-nums">{aggregateStats.scoringDrives}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[50px]">
                <SortHeader field="driveNumber" label="#" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead scope="col">Team</TableHead>
              <TableHead scope="col" className="w-[60px] text-center">
                Qtr
              </TableHead>
              <TableHead scope="col" className="w-[80px] text-center">
                Start
              </TableHead>
              <TableHead scope="col" className="w-[60px] text-center">
                <SortHeader field="plays" label="Plays" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead scope="col" className="w-[70px] text-center">
                <SortHeader field="yards" label="Yards" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead scope="col" className="w-[80px] text-center">
                <SortHeader field="time" label="Time" currentSort={sort} onSort={handleSort} />
              </TableHead>
              <TableHead scope="col" className="w-[120px]">
                <SortHeader field="result" label="Result" currentSort={sort} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDrives.map((drive) => (
              <TableRow key={drive.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {drive.driveNumber}
                </TableCell>
                <TableCell className="font-medium">{drive.offense}</TableCell>
                <TableCell className="text-center tabular-nums">{drive.startPeriod}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {drive.startYardsToGoal > 0 ? `Own ${100 - drive.startYardsToGoal}` : '-'}
                </TableCell>
                <TableCell className="text-center tabular-nums">{drive.plays}</TableCell>
                <TableCell className="text-center tabular-nums">{drive.yards}</TableCell>
                <TableCell className="text-center font-mono text-sm tabular-nums">
                  {formatTime(drive.elapsedMinutes, drive.elapsedSeconds)}
                </TableCell>
                <TableCell>
                  <Badge className={getDriveResultColor(drive.result)} variant="secondary">
                    {drive.result}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty state for filtered results */}
      {sortedDrives.length === 0 && filteredDrives.length === 0 && (
        <div className="text-muted-foreground py-4 text-center text-sm">
          No drives match the selected filter.
        </div>
      )}
    </div>
  );
}
