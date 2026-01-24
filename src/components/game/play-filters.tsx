'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Play } from '@/lib/db';

/**
 * URL param schema for play filters:
 * - quarter: 1|2|3|4|ot (default: all)
 * - down: 1|2|3|4 (default: all)
 * - type: run|pass|special (default: all)
 * - team: ou|opp (default: all)
 */

export type QuarterFilter = 'all' | '1' | '2' | '3' | '4' | 'ot';
export type DownFilter = 'all' | '1' | '2' | '3' | '4';
export type PlayTypeFilter = 'all' | 'run' | 'pass' | 'special';
export type TeamFilter = 'all' | 'ou' | 'opp';

export interface PlayFilters {
  quarter: QuarterFilter;
  down: DownFilter;
  type: PlayTypeFilter;
  team: TeamFilter;
  search: string;
}

/** Max length for search input */
const MAX_SEARCH_LENGTH = 100;

/** Debounce delay for search input (ms) */
const SEARCH_DEBOUNCE_MS = 300;

const VALID_QUARTERS: QuarterFilter[] = ['all', '1', '2', '3', '4', 'ot'];
const VALID_DOWNS: DownFilter[] = ['all', '1', '2', '3', '4'];
const VALID_TYPES: PlayTypeFilter[] = ['all', 'run', 'pass', 'special'];
const VALID_TEAMS: TeamFilter[] = ['all', 'ou', 'opp'];

/**
 * Parse and validate URL search params into filter values.
 * Invalid values default gracefully.
 */
export function parseFiltersFromParams(searchParams: URLSearchParams): PlayFilters {
  const quarterParam = searchParams.get('quarter');
  const downParam = searchParams.get('down');
  const typeParam = searchParams.get('type');
  const teamParam = searchParams.get('team');
  const searchParam = searchParams.get('search');

  return {
    quarter: VALID_QUARTERS.includes(quarterParam as QuarterFilter)
      ? (quarterParam as QuarterFilter)
      : 'all',
    down: VALID_DOWNS.includes(downParam as DownFilter) ? (downParam as DownFilter) : 'all',
    type: VALID_TYPES.includes(typeParam as PlayTypeFilter) ? (typeParam as PlayTypeFilter) : 'all',
    team: VALID_TEAMS.includes(teamParam as TeamFilter) ? (teamParam as TeamFilter) : 'all',
    search: searchParam ? searchParam.slice(0, MAX_SEARCH_LENGTH) : '',
  };
}

/**
 * Play types categorized for filtering
 */
const RUN_PLAY_TYPES = new Set(['rush', 'rushing touchdown', 'two point rush']);

const PASS_PLAY_TYPES = new Set([
  'pass',
  'pass completion',
  'pass incompletion',
  'pass reception',
  'passing touchdown',
  'sack',
  'pass interception',
  'interception',
  'interception return touchdown',
  'two point pass',
]);

const SPECIAL_TEAMS_PLAY_TYPES = new Set([
  'kickoff',
  'kickoff return (offense)',
  'kickoff return (defense)',
  'kickoff return touchdown',
  'punt',
  'punt return',
  'punt return touchdown',
  'blocked punt',
  'blocked punt touchdown',
  'field goal good',
  'field goal missed',
  'blocked field goal',
  'missed field goal return touchdown',
  'extra point good',
  'extra point missed',
  'blocked pat',
]);

/**
 * Filter plays based on current filter settings.
 * Client-side filtering is acceptable for ~200 plays per game.
 */
export function filterPlays(
  plays: Play[],
  filters: PlayFilters,
  oklahomaTeam: string = 'Oklahoma'
): Play[] {
  return plays.filter((play) => {
    // Quarter filter
    if (filters.quarter !== 'all') {
      if (filters.quarter === 'ot') {
        // Overtime is period 5+
        if (play.period < 5) return false;
      } else {
        const quarterNum = parseInt(filters.quarter, 10);
        if (play.period !== quarterNum) return false;
      }
    }

    // Down filter
    if (filters.down !== 'all') {
      const downNum = parseInt(filters.down, 10);
      if (play.down !== downNum) return false;
    }

    // Play type filter
    if (filters.type !== 'all') {
      const normalizedType = play.playType.toLowerCase();
      if (filters.type === 'run' && !RUN_PLAY_TYPES.has(normalizedType)) return false;
      if (filters.type === 'pass' && !PASS_PLAY_TYPES.has(normalizedType)) return false;
      if (filters.type === 'special' && !SPECIAL_TEAMS_PLAY_TYPES.has(normalizedType)) return false;
    }

    // Team filter (Oklahoma offense vs opponent offense)
    if (filters.team !== 'all') {
      const isOklahomaOffense = play.offense === oklahomaTeam;
      if (filters.team === 'ou' && !isOklahomaOffense) return false;
      if (filters.team === 'opp' && isOklahomaOffense) return false;
    }

    return true;
  });
}

/**
 * Debounced search input that syncs with URL params.
 * Maintains local state for immediate feedback during typing.
 */
interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

function DebouncedSearchInput({ value, onChange, onClear }: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value when external value changes (e.g., URL navigation)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, MAX_SEARCH_LENGTH);
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(newValue.trim());
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClear = () => {
    setLocalValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onClear();
  };

  return (
    <div className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        id="play-search"
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Search plays..."
        maxLength={MAX_SEARCH_LENGTH}
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:ring-ring h-8 w-[180px] rounded-md border py-1 pr-8 pl-8 text-sm',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
        )}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export interface PlayFiltersBarProps {
  className?: string;
  /** The opponent team name for display */
  opponentTeam?: string;
}

/**
 * Filter bar component for play-by-play filtering.
 * Persists filter state in URL search params.
 */
export function PlayFiltersBar({ className, opponentTeam = 'Opponent' }: PlayFiltersBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = parseFiltersFromParams(searchParams);

  const updateFilter = useCallback(
    (key: keyof PlayFilters, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'all' || value === '') {
        // Remove param when set to default/empty
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters =
    filters.quarter !== 'all' ||
    filters.down !== 'all' ||
    filters.type !== 'all' ||
    filters.team !== 'all' ||
    filters.search !== '';

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Quarter filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="quarter-filter" className="text-muted-foreground text-sm">
          Quarter
        </label>
        <Select value={filters.quarter} onValueChange={(v) => updateFilter('quarter', v)}>
          <SelectTrigger id="quarter-filter" size="sm" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
            <SelectItem value="ot">OT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Down filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="down-filter" className="text-muted-foreground text-sm">
          Down
        </label>
        <Select value={filters.down} onValueChange={(v) => updateFilter('down', v)}>
          <SelectTrigger id="down-filter" size="sm" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">1st</SelectItem>
            <SelectItem value="2">2nd</SelectItem>
            <SelectItem value="3">3rd</SelectItem>
            <SelectItem value="4">4th</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Play type filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-muted-foreground text-sm">
          Type
        </label>
        <Select value={filters.type} onValueChange={(v) => updateFilter('type', v)}>
          <SelectTrigger id="type-filter" size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="run">Run</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="special">Special Teams</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="team-filter" className="text-muted-foreground text-sm">
          Team
        </label>
        <Select value={filters.team} onValueChange={(v) => updateFilter('team', v)}>
          <SelectTrigger id="team-filter" size="sm" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Both</SelectItem>
            <SelectItem value="ou">Oklahoma Offense</SelectItem>
            <SelectItem value="opp">{opponentTeam} Offense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2">
        <label htmlFor="play-search" className="text-muted-foreground text-sm">
          Search
        </label>
        <DebouncedSearchInput
          value={filters.search}
          onChange={(value) => updateFilter('search', value)}
          onClear={() => updateFilter('search', '')}
        />
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground ml-2 text-sm underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/**
 * Hook to get current filters from URL and provide filtered plays.
 */
export function usePlayFilters(plays: Play[], oklahomaTeam: string = 'Oklahoma') {
  const searchParams = useSearchParams();
  const filters = parseFiltersFromParams(searchParams);
  const filteredPlays = filterPlays(plays, filters, oklahomaTeam);

  return {
    filters,
    filteredPlays,
    totalPlays: plays.length,
    filteredCount: filteredPlays.length,
  };
}
