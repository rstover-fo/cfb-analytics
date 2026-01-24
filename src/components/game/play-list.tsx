'use client';

import { useState, useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayBadge, PPAIndicator } from './play-badge';
import type { Play } from '@/lib/db';

export interface PlayListProps {
  plays: Play[];
  className?: string;
  /** Search term to highlight in play text */
  searchTerm?: string;
}

/** Imperative handle for controlling the PlayList from parent components */
export interface PlayListHandle {
  /** Expand a drive and scroll it into view */
  scrollToDrive: (driveNumber: number) => void;
}

interface DriveGroup {
  driveNumber: number;
  plays: Play[];
  offense: string;
  defense: string;
  startPeriod: number;
  /** First play's clock for display */
  startClock: { minutes: number; seconds: number };
}

/**
 * Format clock display as "Q{period} {min}:{sec}"
 */
function formatClock(period: number, minutes: number, seconds: number): string {
  const periodLabel = period <= 4 ? `Q${period}` : `OT${period - 4}`;
  const secStr = String(seconds).padStart(2, '0');
  return `${periodLabel} ${minutes}:${secStr}`;
}

/**
 * Format down and distance (e.g., "1st & 10")
 */
function formatDownDistance(down: number | null, distance: number | null): string {
  if (down === null || distance === null) {
    return '';
  }
  const downSuffix = down === 1 ? 'st' : down === 2 ? 'nd' : down === 3 ? 'rd' : 'th';
  return `${down}${downSuffix} & ${distance}`;
}

/**
 * Format yards gained with sign
 */
function formatYards(yards: number): string {
  if (yards === 0) return '0';
  return yards > 0 ? `+${yards}` : String(yards);
}

/**
 * Highlight matching text in a string.
 * Returns an array of React elements with matches wrapped in <mark> tags.
 */
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || !searchTerm.trim()) {
    return text;
  }

  // Escape special regex characters in search term
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark key={index} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Group plays by drive number
 */
function groupPlaysByDrive(plays: Play[]): DriveGroup[] {
  const driveMap = new Map<number, Play[]>();

  for (const play of plays) {
    const existing = driveMap.get(play.driveNumber);
    if (existing) {
      existing.push(play);
    } else {
      driveMap.set(play.driveNumber, [play]);
    }
  }

  const groups: DriveGroup[] = [];
  for (const [driveNumber, drivePlays] of driveMap) {
    const firstPlay = drivePlays[0];
    // drivePlays is guaranteed to have at least one item since we only add to the map with [play]
    if (!firstPlay) continue;
    groups.push({
      driveNumber,
      plays: drivePlays,
      offense: firstPlay.offense,
      defense: firstPlay.defense,
      startPeriod: firstPlay.period,
      startClock: {
        minutes: firstPlay.clockMinutes,
        seconds: firstPlay.clockSeconds,
      },
    });
  }

  // Sort by drive number
  groups.sort((a, b) => a.driveNumber - b.driveNumber);
  return groups;
}

interface DriveHeaderProps {
  drive: DriveGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

function DriveHeader({ drive, isExpanded, onToggle }: DriveHeaderProps) {
  const clockDisplay = formatClock(
    drive.startPeriod,
    drive.startClock.minutes,
    drive.startClock.seconds
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        'hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        isExpanded && 'bg-muted/30'
      )}
      aria-expanded={isExpanded}
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="text-muted-foreground text-sm tabular-nums">Drive {drive.driveNumber}</span>
      <span className="font-medium">{drive.offense}</span>
      <span className="text-muted-foreground text-sm">vs</span>
      <span className="text-muted-foreground text-sm">{drive.defense}</span>
      <span className="text-muted-foreground ml-auto text-sm tabular-nums">{clockDisplay}</span>
      <span className="text-muted-foreground text-sm tabular-nums">
        ({drive.plays.length} {drive.plays.length === 1 ? 'play' : 'plays'})
      </span>
    </button>
  );
}

interface PlayRowProps {
  play: Play;
  searchTerm?: string;
}

function PlayRow({ play, searchTerm }: PlayRowProps) {
  const clockDisplay = formatClock(play.period, play.clockMinutes, play.clockSeconds);
  const downDistance = formatDownDistance(play.down, play.distance);
  const yardsDisplay = formatYards(play.yardsGained);

  return (
    <div
      className={cn(
        'grid grid-cols-[80px_100px_1fr_60px_80px] items-start gap-3 border-b px-3 py-2 last:border-b-0',
        'hover:bg-muted/20',
        play.scoring && 'bg-green-50 dark:bg-green-950/20'
      )}
    >
      {/* Clock */}
      <div className="text-muted-foreground text-sm tabular-nums">{clockDisplay}</div>

      {/* Down & Distance */}
      <div className="text-sm tabular-nums">
        {downDistance || <span className="text-muted-foreground">—</span>}
      </div>

      {/* Play description and badge */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <PlayBadge playType={play.playType} />
          {play.scoring && <span className="text-xs font-semibold text-green-600">SCORING</span>}
        </div>
        <p className="text-muted-foreground truncate text-sm" title={play.playText}>
          {highlightText(play.playText, searchTerm || '')}
        </p>
      </div>

      {/* Yards */}
      <div
        className={cn(
          'text-sm font-medium tabular-nums',
          play.yardsGained > 0 && 'text-green-600',
          play.yardsGained < 0 && 'text-red-600'
        )}
      >
        {yardsDisplay}
      </div>

      {/* PPA */}
      <div className="text-right">
        <PPAIndicator ppa={play.ppa} />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the PlayList component.
 * Shows animated placeholder content while plays are loading.
 */
export function PlayListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Expand/Collapse controls placeholder */}
      <div className="mb-4 flex justify-end gap-2">
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <span className="text-muted-foreground">/</span>
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
      </div>

      {/* Skeleton drive groups */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border">
          {/* Drive header skeleton */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="bg-muted h-4 w-4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-8 animate-pulse rounded" />
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted ml-auto h-4 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-14 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * PlayList displays plays grouped by drive with collapsible sections.
 *
 * Features:
 * - Plays grouped by drive number
 * - Collapsible drive headers
 * - Play type badges with icons
 * - Clock formatted as "Q{period} {min}:{sec}"
 * - Yards gained with color coding
 * - PPA indicator for each play
 * - Search term highlighting
 * - Imperative handle for external control (scrollToDrive)
 */
export const PlayList = forwardRef<PlayListHandle, PlayListProps>(function PlayList(
  { plays, className, searchTerm },
  ref
) {
  // Track which drives are expanded (default: all collapsed except first)
  const [expandedDrives, setExpandedDrives] = useState<Set<number>>(() => {
    const firstDrive = plays[0]?.driveNumber;
    return firstDrive !== undefined ? new Set([firstDrive]) : new Set();
  });

  // Refs for each drive container for scrolling
  const driveRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const driveGroups = useMemo(() => groupPlaysByDrive(plays), [plays]);

  const toggleDrive = useCallback((driveNumber: number) => {
    setExpandedDrives((prev) => {
      const next = new Set(prev);
      if (next.has(driveNumber)) {
        next.delete(driveNumber);
      } else {
        next.add(driveNumber);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedDrives(new Set(driveGroups.map((d) => d.driveNumber)));
  }, [driveGroups]);

  const collapseAll = useCallback(() => {
    setExpandedDrives(new Set());
  }, []);

  // Expose imperative handle for parent components
  useImperativeHandle(
    ref,
    () => ({
      scrollToDrive: (driveNumber: number) => {
        // Expand the drive if not already expanded
        setExpandedDrives((prev) => {
          if (prev.has(driveNumber)) return prev;
          const next = new Set(prev);
          next.add(driveNumber);
          return next;
        });

        // Scroll to the drive after a brief delay to allow expansion
        requestAnimationFrame(() => {
          const driveElement = driveRefs.current.get(driveNumber);
          if (driveElement) {
            driveElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus the drive header for accessibility
            const header = driveElement.querySelector('button');
            header?.focus();
          }
        });
      },
    }),
    []
  );

  if (plays.length === 0) {
    return (
      <div className={cn('text-muted-foreground py-8 text-center', className)}>
        No plays available for this game.
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Expand/Collapse controls */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Expand all
        </button>
        <span className="text-muted-foreground">/</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Collapse all
        </button>
      </div>

      {/* Drive groups */}
      {driveGroups.map((drive) => {
        const isExpanded = expandedDrives.has(drive.driveNumber);

        return (
          <div
            key={drive.driveNumber}
            ref={(el) => {
              if (el) {
                driveRefs.current.set(drive.driveNumber, el);
              } else {
                driveRefs.current.delete(drive.driveNumber);
              }
            }}
            className="rounded-lg border"
          >
            <DriveHeader
              drive={drive}
              isExpanded={isExpanded}
              onToggle={() => toggleDrive(drive.driveNumber)}
            />
            {isExpanded && (
              <div className="border-t">
                {/* Column headers */}
                <div className="text-muted-foreground bg-muted/30 grid grid-cols-[80px_100px_1fr_60px_80px] gap-3 border-b px-3 py-1.5 text-xs font-medium">
                  <div>Clock</div>
                  <div>Down</div>
                  <div>Play</div>
                  <div>Yards</div>
                  <div className="text-right">PPA</div>
                </div>
                {/* Plays */}
                {drive.plays.map((play) => (
                  <PlayRow key={play.id} play={play} searchTerm={searchTerm} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
