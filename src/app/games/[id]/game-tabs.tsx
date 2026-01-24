'use client';

import { useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DriveChart,
  DriveTable,
  PlayList,
  PlayFiltersBar,
  filterPlays,
  parseFiltersFromParams,
  type PlayListHandle,
} from '@/components/game';
import type { DriveSummary, Play } from '@/lib/db';

export interface GameTabsProps {
  drives: DriveSummary[];
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  focusTeam?: string;
}

/**
 * Client component that handles the tabbed interface for drives and play-by-play.
 * Manages interaction between DriveChart (clicking a drive) and PlayList (scrolling to drive).
 */
export function GameTabs({
  drives,
  plays,
  homeTeam,
  awayTeam,
  gameDate,
  focusTeam = 'Oklahoma',
}: GameTabsProps) {
  const searchParams = useSearchParams();
  const playListRef = useRef<PlayListHandle>(null);
  const [activeTab, setActiveTab] = useState<string>('drives');

  // Parse filters from URL
  const filters = parseFiltersFromParams(searchParams);

  // Filter plays based on current filters
  const filteredPlays = filterPlays(plays, filters, focusTeam);

  // Handle drive selection from chart - switch to play-by-play tab and scroll to drive
  const handleDriveSelect = useCallback((driveNumber: number) => {
    setActiveTab('plays');
    // Use requestAnimationFrame to ensure tab switch completes before scrolling
    requestAnimationFrame(() => {
      playListRef.current?.scrollToDrive(driveNumber);
    });
  }, []);

  // Determine opponent team name
  const opponentTeam = homeTeam === focusTeam ? awayTeam : homeTeam;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="drives">Drives</TabsTrigger>
        <TabsTrigger value="plays">Play-by-Play</TabsTrigger>
      </TabsList>

      <TabsContent value="drives" className="space-y-6">
        {/* Drive Chart */}
        {drives.length > 0 && (
          <div className="pt-4">
            <DriveChart
              drives={drives}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              focusTeam={focusTeam}
              onDriveSelect={handleDriveSelect}
            />
          </div>
        )}

        {/* Drive Table */}
        {drives.length > 0 && (
          <DriveTable
            drives={drives}
            focusTeam={focusTeam}
            opponentTeam={opponentTeam}
            gameDate={gameDate}
          />
        )}

        {drives.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            No drive data available for this game.
          </div>
        )}
      </TabsContent>

      <TabsContent value="plays" className="space-y-4">
        {/* Play Filters */}
        {plays.length > 0 && <PlayFiltersBar opponentTeam={opponentTeam} />}

        {/* Play List */}
        {plays.length > 0 ? (
          <PlayList ref={playListRef} plays={filteredPlays} searchTerm={filters.search} />
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            No play-by-play data available for this game.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
