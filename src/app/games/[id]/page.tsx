import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getGameById,
  getGameDrives,
  getGamePlays,
  getGameEPA,
  type Play,
  type DriveSummary,
  type GameEPA,
} from '@/lib/db';
import { GameTabs } from './game-tabs';
import { PlayListSkeleton, DriveChartSkeleton } from '@/components/game';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Format EPA value with sign prefix.
 */
function formatEPA(epa: number): string {
  const formatted = epa.toFixed(3);
  return epa > 0 ? `+${formatted}` : formatted;
}

/**
 * Get color class based on EPA comparison (offense vs defense perspective).
 * For OU offense: higher EPA is better (green)
 * For opponent offense: lower EPA is better for OU (so we invert colors)
 */
function getEPAColor(epa: number, isOpponent: boolean = false): string {
  if (isOpponent) {
    // For opponent, lower is better for OU
    if (epa < -0.1) return 'text-green-500';
    if (epa > 0.1) return 'text-red-500';
    return 'text-muted-foreground';
  }
  // For OU offense, higher is better
  if (epa > 0.1) return 'text-green-500';
  if (epa < -0.1) return 'text-red-500';
  return 'text-muted-foreground';
}

/**
 * EPA comparison card for game detail page.
 */
function GameEPACard({ epa, isOUHome }: { epa: GameEPA; isOUHome: boolean }) {
  const opponent = isOUHome ? 'Opponent' : 'Opponent';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">EPA Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* OU Offense */}
          <div className="text-center">
            <p className="text-muted-foreground mb-1 text-sm">Oklahoma Offense</p>
            <p className={`text-2xl font-bold tabular-nums ${getEPAColor(epa.ouEpaPerPlay)}`}>
              {formatEPA(epa.ouEpaPerPlay)}
            </p>
            <p className="text-muted-foreground text-xs">EPA/play ({epa.ouPlays} plays)</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Total: {formatEPA(epa.ouTotalEPA)} EPA
            </p>
          </div>

          {/* Opponent Offense */}
          <div className="text-center">
            <p className="text-muted-foreground mb-1 text-sm">{opponent} Offense</p>
            <p
              className={`text-2xl font-bold tabular-nums ${getEPAColor(epa.oppEpaPerPlay, true)}`}
            >
              {formatEPA(epa.oppEpaPerPlay)}
            </p>
            <p className="text-muted-foreground text-xs">EPA/play ({epa.oppPlays} plays)</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Total: {formatEPA(epa.oppTotalEPA)} EPA
            </p>
          </div>
        </div>

        {/* EPA Differential */}
        <div className="mt-4 border-t pt-4 text-center">
          <p className="text-muted-foreground mb-1 text-sm">EPA Differential</p>
          <p
            className={`text-xl font-bold tabular-nums ${getEPAColor(epa.ouTotalEPA - epa.oppTotalEPA)}`}
          >
            {formatEPA(epa.ouTotalEPA - epa.oppTotalEPA)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for EPA card while loading.
 */
function GameEPACardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2 text-center">
              <div className="bg-muted mx-auto h-4 w-20 animate-pulse rounded" />
              <div className="bg-muted mx-auto h-8 w-16 animate-pulse rounded" />
              <div className="bg-muted mx-auto h-3 w-24 animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t pt-4 text-center">
          <div className="bg-muted mx-auto h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted mx-auto h-6 w-16 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Async component for streaming EPA data.
 */
async function EPAData({
  gameId,
  isOUHome,
  isPrePlayByPlay,
}: {
  gameId: number;
  isOUHome: boolean;
  isPrePlayByPlay: boolean;
}) {
  // Don't fetch EPA for pre-2014 games
  if (isPrePlayByPlay) {
    return null;
  }

  const epa = await getGameEPA(gameId);

  if (!epa) {
    return null;
  }

  return <GameEPACard epa={epa} isOUHome={isOUHome} />;
}

/**
 * Check if a game is from before 2014 (play-by-play data not available).
 * Play-by-play data is only available from 2014 onwards.
 * Returns true (no data) for malformed dates as a safe default.
 */
function isPrePlayByPlayEra(gameDate: string): boolean {
  const date = new Date(gameDate);
  if (isNaN(date.getTime())) {
    return true; // Fail safe: assume no play-by-play data for invalid dates
  }
  return date.getFullYear() < 2014;
}

/**
 * Fetches plays with error handling.
 * Returns empty array if fetch fails, allowing page to degrade gracefully.
 */
async function fetchPlaysWithFallback(gameId: number): Promise<Play[]> {
  try {
    return await getGamePlays(gameId);
  } catch (error) {
    console.error(`Failed to fetch plays for game ${gameId}:`, error);
    return [];
  }
}

/**
 * Async component that streams plays data.
 * Used within Suspense boundary for progressive loading.
 */
async function PlaysData({
  gameId,
  drives,
  homeTeam,
  awayTeam,
  gameDate,
  focusTeam,
  isPrePlayByPlay,
}: {
  gameId: number;
  drives: DriveSummary[];
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  focusTeam: string;
  isPrePlayByPlay: boolean;
}) {
  // For pre-2014 games, don't fetch plays at all
  const plays = isPrePlayByPlay ? [] : await fetchPlaysWithFallback(gameId);

  return (
    <GameTabs
      drives={drives}
      plays={plays}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      gameDate={gameDate}
      focusTeam={focusTeam}
    />
  );
}

/**
 * Loading skeleton for the tabs section while plays are streaming.
 */
function TabsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab buttons skeleton */}
      <div className="bg-muted flex h-10 w-full rounded-md p-1">
        <div className="bg-background flex-1 animate-pulse rounded-sm" />
        <div className="flex-1" />
      </div>
      {/* Content skeleton */}
      <div className="space-y-6 pt-4">
        <DriveChartSkeleton />
        <PlayListSkeleton />
      </div>
    </div>
  );
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const gameId = parseInt(id, 10);

  // Validate gameId is a positive integer
  if (!Number.isFinite(gameId) || gameId <= 0) {
    notFound();
  }

  // Fetch game and drives together (required for initial render)
  const [game, drives] = await Promise.all([getGameById(gameId), getGameDrives(gameId)]);

  if (!game) {
    notFound();
  }

  const isPrePlayByPlay = isPrePlayByPlayEra(game.startDate);

  const isOUHome = game.homeTeam === 'Oklahoma';
  const ouScore = isOUHome ? game.homePoints : game.awayPoints;
  const oppScore = isOUHome ? game.awayPoints : game.homePoints;
  const result = ouScore > oppScore ? 'W' : ouScore < oppScore ? 'L' : null;

  const quarters = Math.max(game.homeLineScores.length, game.awayLineScores.length, 4);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/games"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Games
      </Link>

      {/* Game Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            {/* Away Team */}
            <div className="flex-1 text-center md:text-right">
              <div className="text-muted-foreground text-sm">
                {game.awayConference || 'Independent'}
              </div>
              <div className="text-xl font-bold">{game.awayTeam}</div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold tabular-nums">{game.awayPoints}</div>
              <div className="text-muted-foreground text-lg">@</div>
              <div className="text-4xl font-bold tabular-nums">{game.homePoints}</div>
            </div>

            {/* Home Team */}
            <div className="flex-1 text-center md:text-left">
              <div className="text-muted-foreground text-sm">
                {game.homeConference || 'Independent'}
              </div>
              <div className="text-xl font-bold">{game.homeTeam}</div>
            </div>
          </div>

          {/* Game Info */}
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span>
              {new Date(game.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>&middot;</span>
            <span>{game.venue}</span>
            {game.attendance && (
              <>
                <span>&middot;</span>
                <span>{game.attendance.toLocaleString()} attendance</span>
              </>
            )}
          </div>

          {/* Oklahoma Result Badge */}
          <div className="mt-4 flex justify-center">
            {result && (
              <Badge
                variant="secondary"
                className={`text-lg ${result === 'W' ? 'bg-green-600' : 'bg-red-600'}`}
              >
                {result === 'W' ? (
                  <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                ) : (
                  <X className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                Oklahoma {result === 'W' ? 'Win' : 'Loss'}:{' '}
                <span className="tabular-nums">
                  {ouScore}-{oppScore}
                </span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring by Quarter */}
      {game.homeLineScores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scoring by Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-[150px]">
                    Team
                  </TableHead>
                  {[...Array(quarters)].map((_, i) => (
                    <TableHead scope="col" key={i} className="w-[60px] text-center">
                      {i < 4 ? `Q${i + 1}` : `OT${i - 3}`}
                    </TableHead>
                  ))}
                  <TableHead scope="col" className="w-[80px] text-center font-bold">
                    Final
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{game.awayTeam}</TableCell>
                  {[...Array(quarters)].map((_, i) => (
                    <TableCell key={i} className="text-center tabular-nums">
                      {game.awayLineScores[i] ?? '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold tabular-nums">
                    {game.awayPoints}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{game.homeTeam}</TableCell>
                  {[...Array(quarters)].map((_, i) => (
                    <TableCell key={i} className="text-center tabular-nums">
                      {game.homeLineScores[i] ?? '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold tabular-nums">
                    {game.homePoints}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* EPA Analysis */}
      <Suspense fallback={<GameEPACardSkeleton />}>
        <EPAData gameId={gameId} isOUHome={isOUHome} isPrePlayByPlay={isPrePlayByPlay} />
      </Suspense>

      {/* Tabbed Drive and Play-by-Play Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Pre-2014 games notice */}
          {isPrePlayByPlay && (
            <div className="bg-muted/50 mb-4 flex items-center gap-2 rounded-lg border p-3">
              <AlertCircle className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">
                Play-by-play data is not available for games before 2014.
              </p>
            </div>
          )}
          <Suspense fallback={<TabsSkeleton />}>
            <PlaysData
              gameId={gameId}
              drives={drives}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              gameDate={game.startDate}
              focusTeam="Oklahoma"
              isPrePlayByPlay={isPrePlayByPlay}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Excitement Index */}
      {game.excitementIndex != null && (
        <div className="text-muted-foreground text-center text-sm">
          Game Excitement Index: {game.excitementIndex.toFixed(2)}
        </div>
      )}
    </div>
  );
}
