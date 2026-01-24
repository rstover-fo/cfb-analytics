'use client';

import { useState, useRef, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { DriveSummary } from '@/lib/db';

export interface DriveChartProps {
  drives: DriveSummary[];
  /** Home team name (displayed in right end zone) */
  homeTeam: string;
  /** Away team name (displayed in left end zone) */
  awayTeam: string;
  /** The team we're focused on (Oklahoma) - their drives get darker shading */
  focusTeam?: string;
  className?: string;
  /** Callback when a drive is selected (clicked or Enter pressed) */
  onDriveSelect?: (driveNumber: number) => void;
}

/**
 * Drive result color mapping.
 * Uses Tailwind colors as specified in acceptance criteria.
 */
function getDriveResultColor(result: string, isFocusTeam: boolean): string {
  const normalized = result.toUpperCase();

  // Base colors by result type
  let baseColor: string;

  if (normalized.includes('TD') || normalized.includes('TOUCHDOWN')) {
    baseColor = isFocusTeam ? 'bg-green-600' : 'bg-green-400';
  } else if (normalized.includes('FG') || normalized.includes('FIELD GOAL')) {
    baseColor = isFocusTeam ? 'bg-yellow-500' : 'bg-yellow-300';
  } else if (normalized.includes('PUNT')) {
    baseColor = isFocusTeam ? 'bg-gray-500' : 'bg-gray-400';
  } else if (
    normalized.includes('INT') ||
    normalized.includes('INTERCEPTION') ||
    normalized.includes('FUMBLE')
  ) {
    baseColor = isFocusTeam ? 'bg-red-600' : 'bg-red-400';
  } else if (normalized.includes('DOWNS')) {
    baseColor = isFocusTeam ? 'bg-orange-500' : 'bg-orange-300';
  } else if (
    normalized.includes('END OF HALF') ||
    normalized.includes('END OF GAME') ||
    normalized.includes('END HALF')
  ) {
    baseColor = isFocusTeam ? 'bg-gray-400' : 'bg-gray-300';
  } else if (normalized.includes('SAFETY')) {
    baseColor = isFocusTeam ? 'bg-purple-600' : 'bg-purple-400';
  } else {
    // Fallback for unknown results
    baseColor = isFocusTeam ? 'bg-gray-500' : 'bg-gray-400';
  }

  return baseColor;
}

/**
 * Convert yards to goal to a percentage position on the field (0-100).
 * The field is oriented with the offense's end zone on the left (100 yards to goal)
 * and the defense's end zone on the right (0 yards to goal).
 *
 * For visualization, we flip this so:
 * - 100 yards to goal = 0% (left side, near own end zone)
 * - 0 yards to goal = 100% (right side, in opponent's end zone)
 */
function yardsToGoalToPercent(yardsToGoal: number): number {
  // Clamp to 0-100 range
  const clamped = Math.max(0, Math.min(100, yardsToGoal));
  // Invert: 100 yards to goal = 0%, 0 yards to goal = 100%
  return 100 - clamped;
}

interface DriveBarProps {
  drive: DriveSummary;
  isFocusTeam: boolean;
  onHover: (drive: DriveSummary | null) => void;
  onSelect: (driveNumber: number) => void;
  isHovered: boolean;
  isFocused: boolean;
  tabIndex: number;
  onFocus: (drive: DriveSummary) => void;
}

const DriveBar = forwardRef<HTMLButtonElement, DriveBarProps>(function DriveBar(
  { drive, isFocusTeam, onHover, onSelect, isHovered, isFocused, tabIndex, onFocus },
  ref
) {
  const startPercent = yardsToGoalToPercent(drive.startYardsToGoal);
  const endPercent = yardsToGoalToPercent(drive.endYardsToGoal);

  // Calculate position and width
  const left = Math.min(startPercent, endPercent);
  const width = Math.abs(endPercent - startPercent);

  // Minimum width for visibility
  const displayWidth = Math.max(width, 1);

  const colorClass = getDriveResultColor(drive.result, isFocusTeam);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(drive.driveNumber);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'absolute h-4 cursor-pointer rounded-sm',
        // Use motion-safe for animations, respecting prefers-reduced-motion
        'motion-safe:transition-all motion-safe:duration-150',
        colorClass,
        (isHovered || isFocused) && 'ring-foreground z-10 ring-2 ring-offset-1',
        !isHovered && !isFocused && 'motion-safe:hover:brightness-110',
        'focus-visible:ring-foreground focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-1'
      )}
      style={{
        left: `${left}%`,
        width: `${displayWidth}%`,
      }}
      tabIndex={tabIndex}
      onMouseEnter={() => onHover(drive)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(drive)}
      onClick={() => onSelect(drive.driveNumber)}
      onKeyDown={handleKeyDown}
      aria-label={`Drive ${drive.driveNumber}: ${drive.offense}, ${drive.plays} plays, ${drive.yards} yards, result: ${drive.result}. Press Enter to view plays.`}
    />
  );
});

interface TooltipProps {
  drive: DriveSummary;
}

function DriveTooltip({ drive }: TooltipProps) {
  const timeDisplay = `${drive.elapsedMinutes}:${String(drive.elapsedSeconds).padStart(2, '0')}`;

  return (
    <div className="bg-popover text-popover-foreground border-border rounded-lg border p-3 shadow-lg">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-xs">Drive {drive.driveNumber}</span>
          <span className="text-xs font-medium">Q{drive.startPeriod}</span>
        </div>
        <div className="font-medium">{drive.offense}</div>
        <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground/70">Start:</span>{' '}
            <span className="tabular-nums">{100 - drive.startYardsToGoal} yd line</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">End:</span>{' '}
            <span className="tabular-nums">{100 - drive.endYardsToGoal} yd line</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Plays:</span>{' '}
            <span className="tabular-nums">{drive.plays}</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Yards:</span>{' '}
            <span className="tabular-nums">{drive.yards}</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Time:</span>{' '}
            <span className="tabular-nums">{timeDisplay}</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Result:</span>{' '}
            <span className="font-medium">{drive.result}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Yard line markers for the field visualization.
 * Shows 10, 20, 30, 40, 50, 40, 30, 20, 10 from left to right.
 */
const YARD_MARKERS = [10, 20, 30, 40, 50, 40, 30, 20, 10];

/**
 * Skeleton loader for the DriveChart component.
 * Shows animated placeholder content while drives are loading.
 */
export function DriveChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Field container */}
      <div className="relative">
        <div className="flex h-auto">
          {/* Away team end zone (left) */}
          <div className="bg-muted flex w-12 shrink-0 items-center justify-center rounded-l-lg border-y border-l p-1">
            <div className="h-16 w-3 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Main field area */}
          <div className="relative flex-1 border-y">
            {/* Yard line markers */}
            <div className="absolute inset-0 flex" aria-hidden="true">
              {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((yard, index) => {
                const position = (index + 1) * 10;
                return (
                  <div
                    key={`${yard}-${index}`}
                    className="absolute top-0 bottom-0 border-l border-dashed border-gray-300 dark:border-gray-600"
                    style={{ left: `${position}%` }}
                  >
                    <span className="text-muted-foreground/60 absolute -top-5 left-1/2 -translate-x-1/2 text-xs tabular-nums">
                      {yard}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Skeleton drive bars */}
            <div className="relative min-h-[120px] py-2">
              <div className="relative flex flex-col gap-1 px-1 py-1">
                {[
                  { left: 15, width: 35 },
                  { left: 60, width: 25 },
                  { left: 10, width: 45 },
                  { left: 55, width: 30 },
                  { left: 20, width: 20 },
                  { left: 70, width: 15 },
                ].map((bar, index) => (
                  <div key={index} className="relative h-5">
                    <div
                      className="absolute h-4 animate-pulse rounded-sm bg-gray-300 dark:bg-gray-600"
                      style={{
                        left: `${bar.left}%`,
                        width: `${bar.width}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Home team end zone (right) */}
          <div className="bg-muted flex w-12 shrink-0 items-center justify-center rounded-r-lg border-y border-r p-1">
            <div className="h-16 w-3 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          </div>
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-pulse rounded-sm bg-gray-300 dark:bg-gray-600" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DriveChart displays a horizontal visualization of all drives in a game.
 *
 * Features:
 * - 100-yard field representation with yard line markers
 * - Each drive shown as a horizontal bar from start to end position
 * - Color-coded by drive result (TD, FG, Punt, Turnover, etc.)
 * - Focus team drives shown with darker shading
 * - Hover tooltips with drive details
 * - End zone labels showing team names
 * - Keyboard navigation with arrow keys
 * - Click/Enter to select a drive
 * - Respects prefers-reduced-motion
 */
export function DriveChart({
  drives,
  homeTeam,
  awayTeam,
  focusTeam = 'Oklahoma',
  className,
  onDriveSelect,
}: DriveChartProps) {
  const [hoveredDrive, setHoveredDrive] = useState<DriveSummary | null>(null);
  // Track focused drive by ID rather than index - this handles drives array changes gracefully
  const [focusedDriveId, setFocusedDriveId] = useState<string | null>(null);
  const driveRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive focused index from drive ID
  const focusedIndex = focusedDriveId ? drives.findIndex((d) => d.id === focusedDriveId) : -1;

  // Get the focused drive for tooltip display
  const focusedDrive = focusedIndex >= 0 ? drives[focusedIndex] : null;
  // Show tooltip for either hovered or focused drive
  const tooltipDrive = hoveredDrive || focusedDrive;

  const handleDriveSelect = useCallback(
    (driveNumber: number) => {
      onDriveSelect?.(driveNumber);
    },
    [onDriveSelect]
  );

  const handleDriveFocus = useCallback((drive: DriveSummary) => {
    setFocusedDriveId(drive.id);
  }, []);

  // Handle keyboard navigation within the chart
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (drives.length === 0) return;

      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = focusedIndex < drives.length - 1 ? focusedIndex + 1 : 0;
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = focusedIndex > 0 ? focusedIndex - 1 : drives.length - 1;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = drives.length - 1;
          break;
        default:
          return;
      }

      const newDrive = drives[newIndex];
      if (newDrive) {
        setFocusedDriveId(newDrive.id);
        driveRefs.current[newIndex]?.focus();
      }
    },
    [focusedIndex, drives]
  );

  if (drives.length === 0) {
    return (
      <div className={cn('text-muted-foreground py-8 text-center', className)}>
        No drive data available for this game.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Field container */}
      <div
        ref={containerRef}
        className="relative"
        role="group"
        aria-label="Drive chart visualization. Use arrow keys to navigate between drives."
        onKeyDown={handleContainerKeyDown}
      >
        {/* End zones and field */}
        <div className="flex h-auto">
          {/* Away team end zone (left) */}
          <div className="bg-muted flex w-12 shrink-0 items-center justify-center rounded-l-lg border-y border-l p-1">
            <span
              className="text-muted-foreground origin-center -rotate-90 text-xs font-medium whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              {awayTeam}
            </span>
          </div>

          {/* Main field area */}
          <div className="relative flex-1 border-y">
            {/* Yard line markers */}
            <div className="absolute inset-0 flex" aria-hidden="true">
              {YARD_MARKERS.map((yard, index) => {
                // Position: 10 yard increments, starting at 10%
                const position = (index + 1) * 10;
                return (
                  <div
                    key={`${yard}-${index}`}
                    className="absolute top-0 bottom-0 border-l border-dashed border-gray-300 dark:border-gray-600"
                    style={{ left: `${position}%` }}
                  >
                    <span className="text-muted-foreground/60 absolute -top-5 left-1/2 -translate-x-1/2 text-xs tabular-nums">
                      {yard}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Drive bars container */}
            <div className="relative min-h-[120px] py-2">
              {/* Grid lines for drives */}
              <div className="absolute inset-0 flex flex-col" aria-hidden="true">
                {drives.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                  />
                ))}
              </div>

              {/* Drive bars */}
              <div
                className="relative flex flex-col gap-1 px-1 py-1"
                role="list"
                aria-label="Game drives"
              >
                {drives.map((drive, index) => {
                  const isFocusTeam = drive.offense === focusTeam;
                  return (
                    <div key={drive.id} className="relative h-5" role="listitem">
                      <DriveBar
                        ref={(el) => {
                          driveRefs.current[index] = el;
                        }}
                        drive={drive}
                        isFocusTeam={isFocusTeam}
                        onHover={setHoveredDrive}
                        onSelect={handleDriveSelect}
                        isHovered={hoveredDrive?.id === drive.id}
                        isFocused={focusedIndex === index}
                        tabIndex={index === 0 ? 0 : -1}
                        onFocus={handleDriveFocus}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Home team end zone (right) */}
          <div className="bg-muted flex w-12 shrink-0 items-center justify-center rounded-r-lg border-y border-r p-1">
            <span
              className="text-muted-foreground origin-center rotate-90 text-xs font-medium whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              {homeTeam}
            </span>
          </div>
        </div>

        {/* Tooltip - shows for both hover and keyboard focus */}
        {tooltipDrive && (
          <div
            className="absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2"
            role="tooltip"
            aria-live="polite"
          >
            <DriveTooltip drive={tooltipDrive} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-600" />
          <span className="text-muted-foreground">Touchdown</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-yellow-500" />
          <span className="text-muted-foreground">Field Goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-gray-500" />
          <span className="text-muted-foreground">Punt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-600" />
          <span className="text-muted-foreground">Turnover</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-orange-500" />
          <span className="text-muted-foreground">Downs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-purple-600" />
          <span className="text-muted-foreground">Safety</span>
        </div>
      </div>
    </div>
  );
}
