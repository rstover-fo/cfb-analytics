/**
 * Database queries for CFB Analytics
 *
 * ============================================================================
 * QUERY SECURITY CONVENTIONS
 * ============================================================================
 *
 * All queries in this file MUST follow these patterns to prevent SQL injection:
 *
 * 1. NUMERIC PARAMETERS
 *    - Always validate via parseInt() before interpolation
 *    - Example: const gameId = parseInt(String(rawGameId), 10);
 *    - Check for NaN: if (isNaN(gameId)) throw new Error('Invalid game ID');
 *
 * 2. STRING PARAMETERS
 *    - NEVER interpolate raw user-provided strings directly
 *    - Option A: Validate against a known enum/whitelist
 *    - Option B: Use parameterized queries (prepared statements)
 *    - Option C: Escape with LIKE pattern escaping for search
 *
 * 3. TEAM NAME (CONSTANT)
 *    - The TEAM constant is hardcoded and safe to interpolate
 *    - Never accept team names from user input without validation
 *
 * 4. SEARCH FILTERS
 *    - Use SQL ILIKE with escaped wildcards: ILIKE '%' || ? || '%'
 *    - Escape special characters: %, _, \
 *    - Limit input length (100 chars max)
 *
 * 5. ENUM-STYLE FILTERS
 *    - Quarter: validate against [1, 2, 3, 4, 5, 6, 7, 8] (includes OT)
 *    - Down: validate against [1, 2, 3, 4]
 *    - Play type category: validate against known categories
 *
 * ============================================================================
 * CLOCK SEMANTICS
 * ============================================================================
 *
 * clock_minutes and clock_seconds represent TIME REMAINING in the quarter:
 * - Q1 starts at 15:00 (clock_minutes=15, clock_seconds=0)
 * - A play at 12:45 means 12:45 left, NOT 2:15 elapsed
 * - Handle edge case: clock_seconds > 59 → cap at 59 (bad API data)
 *
 * ============================================================================
 */

import { getDuckDB } from './duckdb';
import { logger } from '@/lib/logger';
import { wrapError } from './errors';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';

const TEAM = 'Oklahoma';

export interface SeasonRecord {
  season: number;
  games: number;
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface GameSummary {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  startDate: string;
  venue: string;
  homeTeam: string;
  homePoints: number;
  awayTeam: string;
  awayPoints: number;
  isHome: boolean;
  opponent: string;
  result: 'W' | 'L' | null;
  ouScore: number;
  oppScore: number;
}

export interface SeasonStats {
  season: number;
  ppgOffense: number;
  ppgDefense: number;
  totalYards: number;
  yardsPerPlay: number;
  thirdDownPct: number;
}

export interface GameDetail {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  startDate: string;
  venue: string;
  attendance: number | null;
  homeTeam: string;
  homePoints: number;
  homeConference: string | null;
  awayTeam: string;
  awayPoints: number;
  awayConference: string | null;
  excitementIndex: number | null;
  homeLineScores: number[];
  awayLineScores: number[];
}

export interface DriveSummary {
  id: string;
  driveNumber: number;
  offense: string;
  defense: string;
  startPeriod: number;
  startYardsToGoal: number;
  endYardsToGoal: number;
  plays: number;
  yards: number;
  result: string;
  scoring: boolean;
  elapsedMinutes: number;
  elapsedSeconds: number;
}

/**
 * Play-by-play data for a single play.
 *
 * Note: clockMinutes/clockSeconds represent TIME REMAINING in the quarter,
 * not elapsed time. Q1 starts at 15:00 and counts down.
 */
export interface Play {
  id: string;
  gameId: number;
  driveId: string;
  driveNumber: number;
  playNumber: number;
  /** Quarter (1-4 for regulation, 5+ for overtime) */
  period: number;
  /** Minutes remaining in quarter (0-15) */
  clockMinutes: number;
  /** Seconds remaining in minute (0-59, capped from API data) */
  clockSeconds: number;
  offense: string;
  defense: string;
  offenseScore: number;
  defenseScore: number;
  /** Down (1-4), or null for non-scrimmage plays */
  down: number | null;
  /** Yards to first down */
  distance: number | null;
  yardsGained: number;
  playType: string;
  playText: string;
  /** Predicted Points Added (EPA equivalent), null if not calculated */
  ppa: number | null;
  scoring: boolean;
}

export async function getAvailableSeasons(): Promise<number[]> {
  // Check cache first (1-hour TTL for static data)
  const cached = cacheGet<number[]>(CACHE_KEYS.AVAILABLE_SEASONS);
  if (cached) {
    return cached;
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT DISTINCT season
      FROM games
      WHERE home_team = '${TEAM}' OR away_team = '${TEAM}'
      ORDER BY season DESC
    `);

    const rows = await result.getRows();
    const seasons = rows.map((row) => Number(row[0]));

    // Cache for 1 hour (static data that changes once per year)
    cacheSet(CACHE_KEYS.AVAILABLE_SEASONS, seasons, CACHE_TTL.STATIC);

    return seasons;
  } finally {
    connection.closeSync();
  }
}

export async function getSeasonRecord(season: number): Promise<SeasonRecord | null> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        COUNT(*) as games,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          THEN 1 ELSE 0
        END) as wins,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          THEN 1 ELSE 0
        END) as losses,
        SUM(CASE
          WHEN conference_game = true AND (
            (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          )
          THEN 1 ELSE 0
        END) as conf_wins,
        SUM(CASE
          WHEN conference_game = true AND (
            (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          )
          THEN 1 ELSE 0
        END) as conf_losses,
        SUM(CASE WHEN home_team = '${TEAM}' THEN home_points ELSE away_points END) as points_for,
        SUM(CASE WHEN home_team = '${TEAM}' THEN away_points ELSE home_points END) as points_against
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season = ${season}
        AND completed = true
      GROUP BY season
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) return null;

    return {
      season: Number(row[0]),
      games: Number(row[1]),
      wins: Number(row[2]),
      losses: Number(row[3]),
      confWins: Number(row[4]),
      confLosses: Number(row[5]),
      pointsFor: Number(row[6]),
      pointsAgainst: Number(row[7]),
    };
  } finally {
    connection.closeSync();
  }
}

export async function getRecentGames(season: number, limit: number = 5): Promise<GameSummary[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        season,
        week,
        season_type,
        start_date,
        venue,
        home_team,
        home_points,
        away_team,
        away_points
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season = ${season}
        AND completed = true
      ORDER BY start_date DESC
      LIMIT ${limit}
    `);

    const rows = await result.getRows();
    return rows.map((row) => {
      const homeTeam = String(row[6]);
      const isHome = homeTeam === TEAM;
      const homePoints = Number(row[7]);
      const awayPoints = Number(row[9]);
      const ouScore = isHome ? homePoints : awayPoints;
      const oppScore = isHome ? awayPoints : homePoints;

      return {
        id: Number(row[0]),
        season: Number(row[1]),
        week: Number(row[2]),
        seasonType: String(row[3]),
        startDate: String(row[4]),
        venue: String(row[5]),
        homeTeam,
        homePoints,
        awayTeam: String(row[8]),
        awayPoints,
        isHome,
        opponent: isHome ? String(row[8]) : homeTeam,
        result: ouScore > oppScore ? 'W' : ouScore < oppScore ? 'L' : null,
        ouScore,
        oppScore,
      };
    });
  } finally {
    connection.closeSync();
  }
}

export async function getUpcomingGames(season: number, limit: number = 5): Promise<GameSummary[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        season,
        week,
        season_type,
        start_date,
        venue,
        home_team,
        home_points,
        away_team,
        away_points
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season = ${season}
        AND (completed = false OR completed IS NULL)
      ORDER BY start_date ASC
      LIMIT ${limit}
    `);

    const rows = await result.getRows();
    return rows.map((row) => {
      const homeTeam = String(row[6]);
      const isHome = homeTeam === TEAM;

      return {
        id: Number(row[0]),
        season: Number(row[1]),
        week: Number(row[2]),
        seasonType: String(row[3]),
        startDate: String(row[4]),
        venue: String(row[5]),
        homeTeam,
        homePoints: Number(row[7]),
        awayTeam: String(row[8]),
        awayPoints: Number(row[9]),
        isHome,
        opponent: isHome ? String(row[8]) : homeTeam,
        result: null,
        ouScore: 0,
        oppScore: 0,
      };
    });
  } finally {
    connection.closeSync();
  }
}

export async function getAllGames(
  season?: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ games: GameSummary[]; total: number }> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const whereClause = season
      ? `WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}') AND season = ${season}`
      : `WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')`;

    // Get total count
    const countResult = await connection.run(`
      SELECT COUNT(*) as total FROM games ${whereClause}
    `);
    const countRows = await countResult.getRows();
    const total = countRows[0]?.[0] != null ? Number(countRows[0][0]) : 0;

    // Get games
    const result = await connection.run(`
      SELECT
        id,
        season,
        week,
        season_type,
        start_date,
        venue,
        home_team,
        home_points,
        away_team,
        away_points,
        completed
      FROM games
      ${whereClause}
      ORDER BY start_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const rows = await result.getRows();
    const games = rows.map((row) => {
      const homeTeam = String(row[6]);
      const isHome = homeTeam === TEAM;
      const homePoints = Number(row[7]);
      const awayPoints = Number(row[9]);
      const completed = row[10];
      const ouScore = isHome ? homePoints : awayPoints;
      const oppScore = isHome ? awayPoints : homePoints;

      return {
        id: Number(row[0]),
        season: Number(row[1]),
        week: Number(row[2]),
        seasonType: String(row[3]),
        startDate: String(row[4]),
        venue: String(row[5]),
        homeTeam,
        homePoints,
        awayTeam: String(row[8]),
        awayPoints,
        isHome,
        opponent: isHome ? String(row[8]) : homeTeam,
        result: completed
          ? ouScore > oppScore
            ? ('W' as const)
            : ouScore < oppScore
              ? ('L' as const)
              : null
          : null,
        ouScore,
        oppScore,
      };
    });

    return { games, total };
  } finally {
    connection.closeSync();
  }
}

export async function getSeasonStats(season: number): Promise<SeasonStats | null> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Points per game
    const ppgResult = await connection.run(`
      SELECT
        ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN home_points ELSE away_points END), 1) as ppg_offense,
        ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN away_points ELSE home_points END), 1) as ppg_defense
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season = ${season}
        AND completed = true
    `);

    const ppgRows = await ppgResult.getRows();
    const ppgRow = ppgRows[0];
    if (!ppgRow) return null;

    const ppgOffense = Number(ppgRow[0]);
    const ppgDefense = Number(ppgRow[1]);

    // Total yards and yards per play from plays table
    const yardsResult = await connection.run(`
      SELECT
        SUM(yards_gained) as total_yards,
        ROUND(AVG(yards_gained), 2) as yards_per_play
      FROM plays
      WHERE offense = '${TEAM}'
        AND game_id IN (SELECT id FROM games WHERE season = ${season})
        AND play_type NOT IN ('Kickoff', 'Punt', 'Penalty', 'Timeout')
    `);

    const yardsRows = await yardsResult.getRows();
    const yardsRow = yardsRows[0];
    const totalYards = yardsRow ? Number(yardsRow[0]) || 0 : 0;
    const yardsPerPlay = yardsRow ? Number(yardsRow[1]) || 0 : 0;

    // Third down conversion rate
    const thirdDownResult = await connection.run(`
      SELECT
        ROUND(100.0 * SUM(CASE WHEN yards_gained >= distance THEN 1 ELSE 0 END) / COUNT(*), 1) as conversion_pct
      FROM plays
      WHERE offense = '${TEAM}'
        AND down = 3
        AND game_id IN (SELECT id FROM games WHERE season = ${season})
        AND play_type NOT IN ('Penalty', 'Timeout')
    `);

    const thirdDownRows = await thirdDownResult.getRows();
    const thirdDownRow = thirdDownRows[0];
    const thirdDownPct = thirdDownRow ? Number(thirdDownRow[0]) || 0 : 0;

    return {
      season,
      ppgOffense,
      ppgDefense,
      totalYards,
      yardsPerPlay,
      thirdDownPct,
    };
  } finally {
    connection.closeSync();
  }
}

export async function getGameById(gameId: number): Promise<GameDetail | null> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        season,
        week,
        season_type,
        start_date,
        venue,
        attendance,
        home_team,
        home_points,
        home_conference,
        away_team,
        away_points,
        away_conference,
        excitement_index
      FROM games
      WHERE id = ${gameId}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) return null;

    // Get line scores
    const homeLineResult = await connection.run(`
      SELECT value FROM games__home_line_scores
      WHERE _dlt_parent_id = (SELECT _dlt_id FROM games WHERE id = ${gameId})
      ORDER BY _dlt_list_idx
    `);
    const homeLineRows = await homeLineResult.getRows();
    const homeLineScores = homeLineRows.map((r) => Number(r[0]));

    const awayLineResult = await connection.run(`
      SELECT value FROM games__away_line_scores
      WHERE _dlt_parent_id = (SELECT _dlt_id FROM games WHERE id = ${gameId})
      ORDER BY _dlt_list_idx
    `);
    const awayLineRows = await awayLineResult.getRows();
    const awayLineScores = awayLineRows.map((r) => Number(r[0]));

    return {
      id: Number(row[0]),
      season: Number(row[1]),
      week: Number(row[2]),
      seasonType: String(row[3]),
      startDate: String(row[4]),
      venue: String(row[5]),
      attendance: row[6] != null ? Number(row[6]) : null,
      homeTeam: String(row[7]),
      homePoints: Number(row[8]),
      homeConference: row[9] != null ? String(row[9]) : null,
      awayTeam: String(row[10]),
      awayPoints: Number(row[11]),
      awayConference: row[12] != null ? String(row[12]) : null,
      excitementIndex: row[13] != null ? Number(row[13]) : null,
      homeLineScores,
      awayLineScores,
    };
  } finally {
    connection.closeSync();
  }
}

export async function getGameDrives(gameId: number): Promise<DriveSummary[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        drive_number,
        offense,
        defense,
        start_period,
        start_yards_to_goal,
        end_yards_to_goal,
        plays,
        yards,
        drive_result,
        scoring,
        elapsed_minutes,
        elapsed_seconds
      FROM drives
      WHERE game_id = ${gameId}
      ORDER BY drive_number
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: String(row[0]),
      driveNumber: Number(row[1]),
      offense: String(row[2]),
      defense: String(row[3]),
      startPeriod: Number(row[4]),
      startYardsToGoal: Number(row[5]),
      endYardsToGoal: Number(row[6]) || 0,
      plays: Number(row[7]),
      yards: Number(row[8]),
      result: String(row[9]),
      scoring: Boolean(row[10]),
      elapsedMinutes: Number(row[11]) || 0,
      elapsedSeconds: Number(row[12]) || 0,
    }));
  } finally {
    connection.closeSync();
  }
}

/**
 * Escape special characters for SQL LIKE/ILIKE patterns.
 * Escapes: %, _, \
 */
/**
 * Escapes special characters for SQL LIKE patterns.
 * Handles %, _, and \ which have special meaning in LIKE clauses.
 * @param input - Raw user input string
 * @returns Escaped string safe for LIKE pattern matching
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export interface PlayFiltersQuery {
  /** Search term to filter play_text (max 100 chars, uses ILIKE) */
  search?: string;
}

// =============================================================================
// SEASON TREND INTERFACES (Task 4.1a)
// Records are "since 2014" — the earliest year in the dataset
// =============================================================================

export interface WinLossTrend {
  season: number;
  wins: number;
  losses: number;
}

export interface PointsTrend {
  season: number;
  ppgOffense: number;
  ppgDefense: number;
}

export interface ConferenceSplit {
  season: number;
  confWins: number;
  confLosses: number;
  nonConfWins: number;
  nonConfLosses: number;
}

export interface HomeAwaySplit {
  season: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
}

/**
 * Get all plays for a game, ordered by drive_number and play_number.
 *
 * Uses idx_plays_game_id index for fast lookups.
 * Handles overtime periods (5, 6, 8 observed in data).
 *
 * @param gameId - The game ID (validated numeric)
 * @param filters - Optional filters including search text
 * @returns Array of plays ordered chronologically within the game
 */
export async function getGamePlays(gameId: number, filters?: PlayFiltersQuery): Promise<Play[]> {
  // Validate gameId is a number to prevent SQL injection
  const validatedGameId = parseInt(String(gameId), 10);
  if (isNaN(validatedGameId)) {
    throw new Error('Invalid game ID');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Build WHERE clause
    let whereClause = `game_id = ${validatedGameId}`;

    // Handle search filter - server-side ILIKE with escaped pattern
    if (filters?.search && filters.search.trim().length > 0) {
      // Limit search input to 100 characters
      const searchTerm = filters.search.trim().slice(0, 100);
      const escapedSearch = escapeLikePattern(searchTerm);
      // Use single quotes for the string literal, escape any single quotes in input
      const sanitizedSearch = escapedSearch.replace(/'/g, "''");
      whereClause += ` AND play_text ILIKE '%${sanitizedSearch}%' ESCAPE '\\'`;
    }

    const result = await connection.run(`
      SELECT
        id,
        game_id,
        drive_id,
        drive_number,
        play_number,
        period,
        clock_minutes,
        clock_seconds,
        offense,
        defense,
        offense_score,
        defense_score,
        down,
        distance,
        yards_gained,
        play_type,
        play_text,
        ppa,
        scoring
      FROM plays
      WHERE ${whereClause}
      ORDER BY drive_number, play_number
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: String(row[0]),
      gameId: Number(row[1]),
      driveId: String(row[2]),
      driveNumber: Number(row[3]),
      playNumber: Number(row[4]),
      period: Number(row[5]),
      // Cap clock_seconds at 59 to handle bad API data
      clockMinutes: Number(row[6]) || 0,
      clockSeconds: Math.min(Number(row[7]) || 0, 59),
      offense: String(row[8]),
      defense: String(row[9]),
      offenseScore: Number(row[10]) || 0,
      defenseScore: Number(row[11]) || 0,
      down: row[12] != null ? Number(row[12]) : null,
      distance: row[13] != null ? Number(row[13]) : null,
      yardsGained: Number(row[14]) || 0,
      playType: String(row[15]),
      playText: String(row[16] ?? ''),
      ppa: row[17] != null ? Number(row[17]) : null,
      scoring: Boolean(row[18]),
    }));
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// SEASON TREND QUERIES (Task 4.1a)
// All trend data is "since 2014" — the earliest year in the dataset
// =============================================================================

/**
 * Get win-loss record by season for a year range.
 * Returns one row per season with total wins and losses.
 *
 * @param startYear - First season to include (e.g., 2014)
 * @param endYear - Last season to include (e.g., 2024)
 */
export async function getWinLossTrends(
  startYear: number,
  endYear: number
): Promise<WinLossTrend[]> {
  const validatedStart = parseInt(String(startYear), 10);
  const validatedEnd = parseInt(String(endYear), 10);
  if (isNaN(validatedStart) || isNaN(validatedEnd)) {
    throw new Error('Invalid year parameters');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          THEN 1 ELSE 0
        END) as wins,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          THEN 1 ELSE 0
        END) as losses
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season >= ${validatedStart}
        AND season <= ${validatedEnd}
        AND completed = true
      GROUP BY season
      ORDER BY season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      wins: Number(row[1]),
      losses: Number(row[2]),
    }));
  } catch (error) {
    logger.queryError(
      'getWinLossTrends',
      error instanceof Error ? error : new Error(String(error)),
      { startYear, endYear }
    );
    throw wrapError(error, 'getWinLossTrends', { startYear, endYear });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get points per game trends by season.
 * Returns offensive and defensive PPG for each season.
 *
 * @param startYear - First season to include
 * @param endYear - Last season to include
 */
export async function getPointsTrends(startYear: number, endYear: number): Promise<PointsTrend[]> {
  const validatedStart = parseInt(String(startYear), 10);
  const validatedEnd = parseInt(String(endYear), 10);
  if (isNaN(validatedStart) || isNaN(validatedEnd)) {
    throw new Error('Invalid year parameters');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN home_points ELSE away_points END), 1) as ppg_offense,
        ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN away_points ELSE home_points END), 1) as ppg_defense
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season >= ${validatedStart}
        AND season <= ${validatedEnd}
        AND completed = true
      GROUP BY season
      ORDER BY season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      ppgOffense: Number(row[1]),
      ppgDefense: Number(row[2]),
    }));
  } catch (error) {
    logger.queryError(
      'getPointsTrends',
      error instanceof Error ? error : new Error(String(error)),
      { startYear, endYear }
    );
    throw wrapError(error, 'getPointsTrends', { startYear, endYear });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get conference vs non-conference win-loss splits by season.
 * Uses the conference_game boolean flag from the games table.
 *
 * @param startYear - First season to include
 * @param endYear - Last season to include
 */
export async function getConferenceSplits(
  startYear: number,
  endYear: number
): Promise<ConferenceSplit[]> {
  const validatedStart = parseInt(String(startYear), 10);
  const validatedEnd = parseInt(String(endYear), 10);
  if (isNaN(validatedStart) || isNaN(validatedEnd)) {
    throw new Error('Invalid year parameters');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        SUM(CASE
          WHEN conference_game = true AND (
            (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          )
          THEN 1 ELSE 0
        END) as conf_wins,
        SUM(CASE
          WHEN conference_game = true AND (
            (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          )
          THEN 1 ELSE 0
        END) as conf_losses,
        SUM(CASE
          WHEN (conference_game = false OR conference_game IS NULL) AND (
            (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          )
          THEN 1 ELSE 0
        END) as non_conf_wins,
        SUM(CASE
          WHEN (conference_game = false OR conference_game IS NULL) AND (
            (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          )
          THEN 1 ELSE 0
        END) as non_conf_losses
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season >= ${validatedStart}
        AND season <= ${validatedEnd}
        AND completed = true
      GROUP BY season
      ORDER BY season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      confWins: Number(row[1]),
      confLosses: Number(row[2]),
      nonConfWins: Number(row[3]),
      nonConfLosses: Number(row[4]),
    }));
  } catch (error) {
    logger.queryError(
      'getConferenceSplits',
      error instanceof Error ? error : new Error(String(error)),
      { startYear, endYear }
    );
    throw wrapError(error, 'getConferenceSplits', { startYear, endYear });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get home vs away win-loss splits by season.
 * Home games: Oklahoma is home_team. Away games: Oklahoma is away_team.
 *
 * @param startYear - First season to include
 * @param endYear - Last season to include
 */
export async function getHomeAwaySplits(
  startYear: number,
  endYear: number
): Promise<HomeAwaySplit[]> {
  const validatedStart = parseInt(String(startYear), 10);
  const validatedEnd = parseInt(String(endYear), 10);
  if (isNaN(validatedStart) || isNaN(validatedEnd)) {
    throw new Error('Invalid year parameters');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        SUM(CASE
          WHEN home_team = '${TEAM}' AND home_points > away_points
          THEN 1 ELSE 0
        END) as home_wins,
        SUM(CASE
          WHEN home_team = '${TEAM}' AND home_points < away_points
          THEN 1 ELSE 0
        END) as home_losses,
        SUM(CASE
          WHEN away_team = '${TEAM}' AND away_points > home_points
          THEN 1 ELSE 0
        END) as away_wins,
        SUM(CASE
          WHEN away_team = '${TEAM}' AND away_points < home_points
          THEN 1 ELSE 0
        END) as away_losses
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND season >= ${validatedStart}
        AND season <= ${validatedEnd}
        AND completed = true
      GROUP BY season
      ORDER BY season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      homeWins: Number(row[1]),
      homeLosses: Number(row[2]),
      awayWins: Number(row[3]),
      awayLosses: Number(row[4]),
    }));
  } catch (error) {
    logger.queryError(
      'getHomeAwaySplits',
      error instanceof Error ? error : new Error(String(error)),
      { startYear, endYear }
    );
    throw wrapError(error, 'getHomeAwaySplits', { startYear, endYear });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// HEAD-TO-HEAD INTERFACES (Task 4.2a)
// Records are "since 2014" — the earliest year in the dataset
// =============================================================================

export interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  totalGames: number;
}

export interface HeadToHeadGame {
  gameId: number;
  season: number;
  date: string;
  venue: string;
  isHome: boolean;
  ouScore: number;
  oppScore: number;
  result: 'W' | 'L';
}

export interface HeadToHeadScoringTrend {
  season: number;
  ouScore: number;
  oppScore: number;
}

// =============================================================================
// HEAD-TO-HEAD QUERIES (Task 4.2a)
// All head-to-head data is "since 2014" — the earliest year in the dataset
// =============================================================================

/**
 * Get overall head-to-head record against a specific opponent.
 * Returns wins, losses, and total games played since 2014.
 *
 * @param opponent - Opponent team name (case-insensitive matching via ILIKE)
 */
export async function getHeadToHeadRecord(opponent: string): Promise<HeadToHeadRecord | null> {
  // Validate and sanitize opponent name
  if (!opponent || opponent.trim().length === 0) {
    return null;
  }

  const sanitizedOpponent = opponent.trim().slice(0, 100);
  const escapedOpponent = escapeLikePattern(sanitizedOpponent).replace(/'/g, "''");

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        CASE WHEN home_team = '${TEAM}' THEN away_team ELSE home_team END as opponent,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points > away_points)
            OR (away_team = '${TEAM}' AND away_points > home_points)
          THEN 1 ELSE 0
        END) as wins,
        SUM(CASE
          WHEN (home_team = '${TEAM}' AND home_points < away_points)
            OR (away_team = '${TEAM}' AND away_points < home_points)
          THEN 1 ELSE 0
        END) as losses,
        COUNT(*) as total_games
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND (
          (home_team = '${TEAM}' AND away_team ILIKE '${escapedOpponent}')
          OR (away_team = '${TEAM}' AND home_team ILIKE '${escapedOpponent}')
        )
        AND completed = true
      GROUP BY opponent
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) return null;

    return {
      opponent: String(row[0]),
      wins: Number(row[1]),
      losses: Number(row[2]),
      totalGames: Number(row[3]),
    };
  } catch (error) {
    logger.queryError(
      'getHeadToHeadRecord',
      error instanceof Error ? error : new Error(String(error)),
      { opponent }
    );
    throw wrapError(error, 'getHeadToHeadRecord', { opponent });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get recent matchups against a specific opponent.
 * Returns game details with scores, dates, and venues.
 *
 * @param opponent - Opponent team name (case-insensitive matching via ILIKE)
 * @param limit - Maximum number of games to return (default: all)
 */
export async function getHeadToHeadGames(
  opponent: string,
  limit?: number
): Promise<HeadToHeadGame[]> {
  // Validate and sanitize opponent name
  if (!opponent || opponent.trim().length === 0) {
    return [];
  }

  const sanitizedOpponent = opponent.trim().slice(0, 100);
  const escapedOpponent = escapeLikePattern(sanitizedOpponent).replace(/'/g, "''");

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const limitClause = limit ? `LIMIT ${parseInt(String(limit), 10)}` : '';

    const result = await connection.run(`
      SELECT
        id,
        season,
        start_date,
        venue,
        home_team,
        home_points,
        away_points
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND (
          (home_team = '${TEAM}' AND away_team ILIKE '${escapedOpponent}')
          OR (away_team = '${TEAM}' AND home_team ILIKE '${escapedOpponent}')
        )
        AND completed = true
      ORDER BY start_date DESC
      ${limitClause}
    `);

    const rows = await result.getRows();
    return rows.map((row) => {
      const homeTeam = String(row[4]);
      const isHome = homeTeam === TEAM;
      const homePoints = Number(row[5]);
      const awayPoints = Number(row[6]);
      const ouScore = isHome ? homePoints : awayPoints;
      const oppScore = isHome ? awayPoints : homePoints;

      return {
        gameId: Number(row[0]),
        season: Number(row[1]),
        date: String(row[2]),
        venue: String(row[3]) || 'Unknown',
        isHome,
        ouScore,
        oppScore,
        result: ouScore > oppScore ? 'W' : 'L',
      };
    });
  } catch (error) {
    logger.queryError(
      'getHeadToHeadGames',
      error instanceof Error ? error : new Error(String(error)),
      { opponent, limit }
    );
    throw wrapError(error, 'getHeadToHeadGames', { opponent, limit });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get scoring trend against a specific opponent by season.
 * Returns OU and opponent scores for each season they played.
 *
 * @param opponent - Opponent team name (case-insensitive matching via ILIKE)
 */
export async function getHeadToHeadScoringTrend(
  opponent: string
): Promise<HeadToHeadScoringTrend[]> {
  // Validate and sanitize opponent name
  if (!opponent || opponent.trim().length === 0) {
    return [];
  }

  const sanitizedOpponent = opponent.trim().slice(0, 100);
  const escapedOpponent = escapeLikePattern(sanitizedOpponent).replace(/'/g, "''");

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        season,
        CASE WHEN home_team = '${TEAM}' THEN home_points ELSE away_points END as ou_score,
        CASE WHEN home_team = '${TEAM}' THEN away_points ELSE home_points END as opp_score
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND (
          (home_team = '${TEAM}' AND away_team ILIKE '${escapedOpponent}')
          OR (away_team = '${TEAM}' AND home_team ILIKE '${escapedOpponent}')
        )
        AND completed = true
      ORDER BY season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      ouScore: Number(row[1]),
      oppScore: Number(row[2]),
    }));
  } catch (error) {
    logger.queryError(
      'getHeadToHeadScoringTrend',
      error instanceof Error ? error : new Error(String(error)),
      { opponent }
    );
    throw wrapError(error, 'getHeadToHeadScoringTrend', { opponent });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// DETAILED METRICS INTERFACE (Task 4.3a)
// Comprehensive season statistics for the metrics dashboard
// =============================================================================

export interface DetailedMetrics {
  season: number;
  gamesPlayed: number;

  // Offensive metrics
  ppgOffense: number;
  totalYardsOffense: number;
  ypgOffense: number;
  yardsPerPlay: number;
  thirdDownPct: number;

  // Defensive metrics
  ppgDefense: number;
  totalYardsDefense: number;
  ypgDefense: number;

  // Situational metrics
  turnoverMargin: number;
  turnoversGained: number;
  turnoversLost: number;
  redZoneTdPct: number;
  redZoneAttempts: number;
}

/**
 * Get detailed metrics for a single season.
 * Includes offensive, defensive, and situational statistics.
 *
 * Red zone definition: Drives where start_yards_to_goal <= 20
 * Turnover detection: Uses play_type containing 'Interception', 'Fumble Recovery'
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getDetailedSeasonMetrics(season: number): Promise<DetailedMetrics | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Single CTE-based query consolidating 8 sequential queries into 1 round-trip
    const result = await connection.run(`
      WITH season_games AS (
        -- Base CTE: All Oklahoma games for the season
        SELECT id, home_team, away_team, home_points, away_points
        FROM games
        WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
          AND season = ${validatedSeason}
          AND completed = true
      ),
      games_summary AS (
        -- Games played and PPG
        SELECT
          COUNT(*) as games_played,
          ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN home_points ELSE away_points END), 1) as ppg_offense,
          ROUND(AVG(CASE WHEN home_team = '${TEAM}' THEN away_points ELSE home_points END), 1) as ppg_defense
        FROM season_games
      ),
      offense_yards AS (
        -- Offensive yards (Oklahoma on offense)
        SELECT
          COALESCE(SUM(yards_gained), 0) as total_yards,
          COALESCE(ROUND(AVG(yards_gained), 2), 0) as yards_per_play
        FROM plays
        WHERE offense = '${TEAM}'
          AND game_id IN (SELECT id FROM season_games)
          AND play_type NOT IN ('Kickoff', 'Punt', 'Penalty', 'Timeout')
      ),
      defense_yards AS (
        -- Defensive yards allowed (Oklahoma on defense)
        SELECT COALESCE(SUM(yards_gained), 0) as total_yards
        FROM plays
        WHERE defense = '${TEAM}'
          AND game_id IN (SELECT id FROM season_games)
          AND play_type NOT IN ('Kickoff', 'Punt', 'Penalty', 'Timeout')
      ),
      third_down AS (
        -- Third down conversion rate
        SELECT
          COALESCE(ROUND(100.0 * SUM(CASE WHEN yards_gained >= distance THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1), 0) as conversion_pct
        FROM plays
        WHERE offense = '${TEAM}'
          AND down = 3
          AND game_id IN (SELECT id FROM season_games)
          AND play_type NOT IN ('Penalty', 'Timeout')
      ),
      turnovers_gained AS (
        -- Turnovers gained by defense (interceptions + fumble recoveries)
        SELECT COUNT(*) as count
        FROM plays
        WHERE defense = '${TEAM}'
          AND game_id IN (SELECT id FROM season_games)
          AND (play_type ILIKE '%Interception%' OR play_type ILIKE '%Fumble Recovery%')
      ),
      turnovers_lost AS (
        -- Turnovers lost by offense
        SELECT COUNT(*) as count
        FROM plays
        WHERE offense = '${TEAM}'
          AND game_id IN (SELECT id FROM season_games)
          AND (play_type ILIKE '%Interception%' OR play_type ILIKE '%Fumble Recovery%')
      ),
      red_zone AS (
        -- Red zone efficiency (drives starting inside 20)
        SELECT
          COUNT(*) as attempts,
          SUM(CASE WHEN drive_result = 'TD' THEN 1 ELSE 0 END) as tds
        FROM drives
        WHERE offense = '${TEAM}'
          AND game_id IN (SELECT id FROM season_games)
          AND start_yards_to_goal <= 20
      )
      SELECT
        gs.games_played,
        gs.ppg_offense,
        gs.ppg_defense,
        oy.total_yards as total_yards_offense,
        oy.yards_per_play,
        dy.total_yards as total_yards_defense,
        td.conversion_pct as third_down_pct,
        tg.count as turnovers_gained,
        tl.count as turnovers_lost,
        rz.attempts as red_zone_attempts,
        rz.tds as red_zone_tds
      FROM games_summary gs
      CROSS JOIN offense_yards oy
      CROSS JOIN defense_yards dy
      CROSS JOIN third_down td
      CROSS JOIN turnovers_gained tg
      CROSS JOIN turnovers_lost tl
      CROSS JOIN red_zone rz
    `);

    const rows = await result.getRows();
    const row = rows[0];

    if (!row || Number(row[0]) === 0) {
      return null;
    }

    const gamesPlayed = Number(row[0]);
    const ppgOffense = Number(row[1]) || 0;
    const ppgDefense = Number(row[2]) || 0;
    const totalYardsOffense = Number(row[3]) || 0;
    const yardsPerPlay = Number(row[4]) || 0;
    const totalYardsDefense = Number(row[5]) || 0;
    const thirdDownPct = Number(row[6]) || 0;
    const turnoversGained = Number(row[7]) || 0;
    const turnoversLost = Number(row[8]) || 0;
    const redZoneAttempts = Number(row[9]) || 0;
    const redZoneTds = Number(row[10]) || 0;

    // Calculate derived metrics
    const ypgOffense =
      gamesPlayed > 0 ? Math.round((totalYardsOffense / gamesPlayed) * 10) / 10 : 0;
    const ypgDefense =
      gamesPlayed > 0 ? Math.round((totalYardsDefense / gamesPlayed) * 10) / 10 : 0;
    const turnoverMargin = turnoversGained - turnoversLost;
    const redZoneTdPct =
      redZoneAttempts > 0 ? Math.round((redZoneTds / redZoneAttempts) * 1000) / 10 : 0;

    return {
      season: validatedSeason,
      gamesPlayed,
      ppgOffense,
      totalYardsOffense,
      ypgOffense,
      yardsPerPlay,
      thirdDownPct,
      ppgDefense,
      totalYardsDefense,
      ypgDefense,
      turnoverMargin,
      turnoversGained,
      turnoversLost,
      redZoneTdPct,
      redZoneAttempts,
    };
  } catch (error) {
    logger.queryError(
      'getDetailedSeasonMetrics',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getDetailedSeasonMetrics', { season });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// SEASON COMPARISON INTERFACES (Task 4.4a)
// Compare two seasons with calculated deltas for improvement/decline tracking
// =============================================================================

export interface DeltaValue {
  absolute: number;
  percentage: number;
  direction: 'improvement' | 'decline' | 'unchanged';
}

export interface MetricDeltas {
  ppgOffense: DeltaValue;
  ppgDefense: DeltaValue;
  ypgOffense: DeltaValue;
  ypgDefense: DeltaValue;
  thirdDownPct: DeltaValue;
  turnoverMargin: DeltaValue;
  redZoneTdPct: DeltaValue;
}

export interface SeasonComparison {
  season1: DetailedMetrics;
  season2: DetailedMetrics;
  deltas: MetricDeltas;
}

/**
 * Calculate delta between two values with direction semantics.
 * For offensive metrics: higher is better (improvement when season2 > season1)
 * For defensive metrics: lower is better (improvement when season2 < season1)
 *
 * @param value1 - Value from season 1
 * @param value2 - Value from season 2
 * @param lowerIsBetter - True for defensive metrics where lower values are better
 */
export function calculateDelta(
  value1: number,
  value2: number,
  lowerIsBetter: boolean = false
): DeltaValue {
  const absoluteDiff = value2 - value1;
  const percentageChange =
    value1 !== 0 ? Math.round(((value2 - value1) / Math.abs(value1)) * 1000) / 10 : 0;

  let direction: 'improvement' | 'decline' | 'unchanged';
  if (absoluteDiff === 0) {
    direction = 'unchanged';
  } else if (lowerIsBetter) {
    direction = absoluteDiff < 0 ? 'improvement' : 'decline';
  } else {
    direction = absoluteDiff > 0 ? 'improvement' : 'decline';
  }

  return {
    absolute: Math.round(absoluteDiff * 10) / 10,
    percentage: percentageChange,
    direction,
  };
}

/**
 * Compare two seasons and calculate deltas for key metrics.
 * Returns both seasons' full metrics plus calculated improvement/decline indicators.
 *
 * Delta direction semantics:
 * - Offensive metrics (ppgOffense, ypgOffense, thirdDownPct, redZoneTdPct): higher = improvement
 * - Defensive metrics (ppgDefense, ypgDefense): lower = improvement
 * - Turnover margin: higher = improvement (more turnovers gained than lost)
 *
 * @param season1 - First season (typically older)
 * @param season2 - Second season (typically newer)
 * @returns SeasonComparison with both seasons' data and deltas, or null if either season has no data
 */
export async function compareSeasons(
  season1: number,
  season2: number
): Promise<SeasonComparison | null> {
  const validatedSeason1 = parseInt(String(season1), 10);
  const validatedSeason2 = parseInt(String(season2), 10);
  if (isNaN(validatedSeason1) || isNaN(validatedSeason2)) {
    throw new Error('Invalid season parameters');
  }

  // Fetch metrics for both seasons
  const [metrics1, metrics2] = await Promise.all([
    getDetailedSeasonMetrics(validatedSeason1),
    getDetailedSeasonMetrics(validatedSeason2),
  ]);

  // Return null if either season has no data
  if (!metrics1 || !metrics2) {
    return null;
  }

  // Calculate deltas for key metrics
  const deltas: MetricDeltas = {
    // Offensive: higher is better
    ppgOffense: calculateDelta(metrics1.ppgOffense, metrics2.ppgOffense, false),
    ypgOffense: calculateDelta(metrics1.ypgOffense, metrics2.ypgOffense, false),
    thirdDownPct: calculateDelta(metrics1.thirdDownPct, metrics2.thirdDownPct, false),
    redZoneTdPct: calculateDelta(metrics1.redZoneTdPct, metrics2.redZoneTdPct, false),

    // Defensive: lower is better
    ppgDefense: calculateDelta(metrics1.ppgDefense, metrics2.ppgDefense, true),
    ypgDefense: calculateDelta(metrics1.ypgDefense, metrics2.ypgDefense, true),

    // Turnover margin: higher is better
    turnoverMargin: calculateDelta(metrics1.turnoverMargin, metrics2.turnoverMargin, false),
  };

  return {
    season1: metrics1,
    season2: metrics2,
    deltas,
  };
}

/**
 * Get list of all opponents Oklahoma has played since 2014.
 * Useful for populating opponent selector dropdowns.
 */
export async function getAllOpponents(): Promise<string[]> {
  // Check cache first (1-hour TTL for static data)
  const cached = cacheGet<string[]>(CACHE_KEYS.ALL_OPPONENTS);
  if (cached) {
    return cached;
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT DISTINCT
        CASE WHEN home_team = '${TEAM}' THEN away_team ELSE home_team END as opponent
      FROM games
      WHERE (home_team = '${TEAM}' OR away_team = '${TEAM}')
        AND completed = true
      ORDER BY opponent
    `);

    const rows = await result.getRows();
    const opponents = rows.map((row) => String(row[0]));

    // Cache for 1 hour (static data that rarely changes)
    cacheSet(CACHE_KEYS.ALL_OPPONENTS, opponents, CACHE_TTL.STATIC);

    return opponents;
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// EPA (EXPECTED POINTS ADDED) INTERFACES (Task 5.1b)
// Uses PPA column from CFBD data, surfaced as "EPA" in the UI
// =============================================================================

/**
 * Season-level EPA aggregates for Oklahoma.
 * EPA is calculated from the `ppa` column (CFBD's Predicted Points Added).
 */
export interface SeasonEPA {
  season: number;
  /** EPA per play (all scrimmage plays) */
  epaPerPlay: number;
  /** EPA per rush play */
  rushEpaPerPlay: number;
  /** EPA per pass play */
  passEpaPerPlay: number;
  /** Total scrimmage plays */
  totalPlays: number;
  /** Total rush plays */
  rushPlays: number;
  /** Total pass plays */
  passPlays: number;
}

/**
 * Game-level EPA comparison between Oklahoma and opponent.
 */
export interface GameEPA {
  gameId: number;
  /** Oklahoma's EPA per play */
  ouEpaPerPlay: number;
  /** Opponent's EPA per play */
  oppEpaPerPlay: number;
  /** Oklahoma's total EPA for the game */
  ouTotalEPA: number;
  /** Opponent's total EPA for the game */
  oppTotalEPA: number;
  /** Oklahoma's total scrimmage plays */
  ouPlays: number;
  /** Opponent's total scrimmage plays */
  oppPlays: number;
}

/**
 * EPA trend data point for multi-season analysis.
 */
export interface EPATrend {
  season: number;
  /** EPA per play for the season */
  epaPerPlay: number;
}

// =============================================================================
// EPA QUERIES (Task 5.1b)
// All EPA queries filter to scrimmage plays only and use the ppa column
// =============================================================================

/**
 * SQL fragment for scrimmage play types.
 * Based on play-type-mapping.ts SCRIMMAGE_PLAY_TYPES_SQL
 */
const SCRIMMAGE_PLAY_TYPES = `(
  'Rush', 'Rushing Touchdown', 'Two Point Rush',
  'Pass Reception', 'Pass Completion', 'Pass', 'Pass Incompletion',
  'Passing Touchdown', 'Sack', 'Pass Interception', 'Pass Interception Return',
  'Interception', 'Two Point Pass'
)`;

/**
 * SQL fragment for rush play types.
 */
const RUSH_PLAY_TYPES = `('Rush', 'Rushing Touchdown', 'Two Point Rush')`;

/**
 * SQL fragment for pass play types.
 */
const PASS_PLAY_TYPES = `(
  'Pass Reception', 'Pass Completion', 'Pass', 'Pass Incompletion',
  'Passing Touchdown', 'Sack', 'Pass Interception', 'Pass Interception Return',
  'Interception', 'Two Point Pass'
)`;

/**
 * Get EPA metrics for a season.
 * Returns overall EPA/play, rush EPA/play, and pass EPA/play for Oklahoma.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getSeasonEPA(season: number): Promise<SeasonEPA | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        ROUND(AVG(ppa), 3) as epa_per_play,
        ROUND(AVG(CASE WHEN play_type IN ${RUSH_PLAY_TYPES} THEN ppa END), 3) as rush_epa,
        ROUND(AVG(CASE WHEN play_type IN ${PASS_PLAY_TYPES} THEN ppa END), 3) as pass_epa,
        COUNT(*) as total_plays,
        COUNT(CASE WHEN play_type IN ${RUSH_PLAY_TYPES} THEN 1 END) as rush_plays,
        COUNT(CASE WHEN play_type IN ${PASS_PLAY_TYPES} THEN 1 END) as pass_plays
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[4]) === 0) {
      return null;
    }

    return {
      season: validatedSeason,
      epaPerPlay: Number(row[1]) || 0,
      rushEpaPerPlay: Number(row[2]) || 0,
      passEpaPerPlay: Number(row[3]) || 0,
      totalPlays: Number(row[4]) || 0,
      rushPlays: Number(row[5]) || 0,
      passPlays: Number(row[6]) || 0,
    };
  } catch (error) {
    logger.queryError('getSeasonEPA', error instanceof Error ? error : new Error(String(error)), {
      season,
    });
    throw wrapError(error, 'getSeasonEPA', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get EPA metrics for a specific game.
 * Returns EPA/play and total EPA for both Oklahoma and the opponent.
 *
 * @param gameId - The game ID
 */
export async function getGameEPA(gameId: number): Promise<GameEPA | null> {
  const validatedGameId = parseInt(String(gameId), 10);
  if (isNaN(validatedGameId)) {
    throw new Error('Invalid game ID');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Get OU offensive EPA
    const ouResult = await connection.run(`
      SELECT
        ROUND(AVG(ppa), 3) as epa_per_play,
        ROUND(SUM(ppa), 2) as total_epa,
        COUNT(*) as plays
      FROM plays
      WHERE game_id = ${validatedGameId}
        AND offense = '${TEAM}'
        AND play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND ppa IS NOT NULL
    `);

    // Get opponent offensive EPA (OU on defense)
    const oppResult = await connection.run(`
      SELECT
        ROUND(AVG(ppa), 3) as epa_per_play,
        ROUND(SUM(ppa), 2) as total_epa,
        COUNT(*) as plays
      FROM plays
      WHERE game_id = ${validatedGameId}
        AND defense = '${TEAM}'
        AND play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND ppa IS NOT NULL
    `);

    const ouRows = await ouResult.getRows();
    const oppRows = await oppResult.getRows();
    const ouRow = ouRows[0];
    const oppRow = oppRows[0];

    if (!ouRow || !oppRow) {
      return null;
    }

    return {
      gameId: validatedGameId,
      ouEpaPerPlay: Number(ouRow[0]) || 0,
      oppEpaPerPlay: Number(oppRow[0]) || 0,
      ouTotalEPA: Number(ouRow[1]) || 0,
      oppTotalEPA: Number(oppRow[1]) || 0,
      ouPlays: Number(ouRow[2]) || 0,
      oppPlays: Number(oppRow[2]) || 0,
    };
  } catch (error) {
    logger.queryError('getGameEPA', error instanceof Error ? error : new Error(String(error)), {
      gameId,
    });
    throw wrapError(error, 'getGameEPA', { gameId });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get EPA per play trends across multiple seasons.
 * Returns one data point per season for charting.
 *
 * @param startYear - First season to include
 * @param endYear - Last season to include
 */
export async function getEPATrends(startYear: number, endYear: number): Promise<EPATrend[]> {
  const validatedStart = parseInt(String(startYear), 10);
  const validatedEnd = parseInt(String(endYear), 10);
  if (isNaN(validatedStart) || isNaN(validatedEnd)) {
    throw new Error('Invalid year parameters');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        g.season,
        ROUND(AVG(p.ppa), 3) as epa_per_play
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season >= ${validatedStart}
        AND g.season <= ${validatedEnd}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
      GROUP BY g.season
      ORDER BY g.season
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      epaPerPlay: Number(row[1]) || 0,
    }));
  } catch (error) {
    logger.queryError('getEPATrends', error instanceof Error ? error : new Error(String(error)), {
      startYear,
      endYear,
    });
    throw wrapError(error, 'getEPATrends', { startYear, endYear });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// SUCCESS RATE INTERFACES (Task 5.2a)
// Success is defined as: ppa > 0 (since CFBD's success column is not present)
// All success rate queries filter to scrimmage plays only
// =============================================================================

/**
 * Success rate breakdown by play type (rush vs pass).
 * Success is defined as ppa > 0 for scrimmage plays.
 */
export interface SuccessRateByPlayType {
  season: number;
  /** Rush success rate as percentage (0-100) */
  rushSuccessRate: number;
  /** Pass success rate as percentage (0-100) */
  passSuccessRate: number;
  /** Overall success rate as percentage (0-100) */
  overallSuccessRate: number;
  /** Total rush attempts */
  rushAttempts: number;
  /** Total pass attempts */
  passAttempts: number;
}

/**
 * Success rate breakdown by down (1st through 4th).
 * All values are percentages (0-100).
 */
export interface SuccessRateByDown {
  season: number;
  /** 1st down success rate */
  down1: number;
  /** 2nd down success rate */
  down2: number;
  /** 3rd down success rate */
  down3: number;
  /** 4th down success rate */
  down4: number;
}

/**
 * Success rate breakdown by distance to first down.
 * - short: 1-3 yards
 * - medium: 4-6 yards
 * - long: 7+ yards
 */
export interface SuccessRateByDistance {
  season: number;
  /** Short distance (1-3 yards) success rate */
  short: number;
  /** Medium distance (4-6 yards) success rate */
  medium: number;
  /** Long distance (7+ yards) success rate */
  long: number;
}

/**
 * Situational success rate (early/late downs, red zone).
 */
export interface SituationalSuccessRate {
  season: number;
  /** 1st + 2nd down combined success rate */
  earlyDownRate: number;
  /** 3rd + 4th down combined success rate */
  lateDownRate: number;
  /** Success rate when yards_to_goal <= 20 */
  redZoneRate: number;
  /** Total early down attempts */
  earlyDownAttempts: number;
  /** Total late down attempts */
  lateDownAttempts: number;
  /** Total red zone attempts */
  redZoneAttempts: number;
}

// =============================================================================
// SUCCESS RATE QUERIES (Task 5.2a)
// Success Definition: ppa > 0 (based on Task 5.0 data audit - no success column)
// Excludes special teams and penalties
// =============================================================================

/**
 * Get success rate by play type (rush vs pass) for a season.
 * Success is defined as ppa > 0 for scrimmage plays.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getSuccessRateByPlayType(
  season: number
): Promise<SuccessRateByPlayType | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        -- Rush success rate
        ROUND(100.0 * SUM(CASE WHEN play_type IN ${RUSH_PLAY_TYPES} AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN play_type IN ${RUSH_PLAY_TYPES} THEN 1 ELSE 0 END), 0), 1) as rush_success_rate,
        -- Pass success rate
        ROUND(100.0 * SUM(CASE WHEN play_type IN ${PASS_PLAY_TYPES} AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN play_type IN ${PASS_PLAY_TYPES} THEN 1 ELSE 0 END), 0), 1) as pass_success_rate,
        -- Overall success rate
        ROUND(100.0 * SUM(CASE WHEN ppa > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as overall_success_rate,
        -- Attempt counts
        SUM(CASE WHEN play_type IN ${RUSH_PLAY_TYPES} THEN 1 ELSE 0 END) as rush_attempts,
        SUM(CASE WHEN play_type IN ${PASS_PLAY_TYPES} THEN 1 ELSE 0 END) as pass_attempts
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || (Number(row[4]) === 0 && Number(row[5]) === 0)) {
      return null;
    }

    return {
      season: validatedSeason,
      rushSuccessRate: Number(row[1]) || 0,
      passSuccessRate: Number(row[2]) || 0,
      overallSuccessRate: Number(row[3]) || 0,
      rushAttempts: Number(row[4]) || 0,
      passAttempts: Number(row[5]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getSuccessRateByPlayType',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getSuccessRateByPlayType', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get success rate by down (1st through 4th) for a season.
 * Success is defined as ppa > 0 for scrimmage plays.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getSuccessRateByDown(season: number): Promise<SuccessRateByDown | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        ROUND(100.0 * SUM(CASE WHEN down = 1 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN down = 1 THEN 1 ELSE 0 END), 0), 1) as down1,
        ROUND(100.0 * SUM(CASE WHEN down = 2 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN down = 2 THEN 1 ELSE 0 END), 0), 1) as down2,
        ROUND(100.0 * SUM(CASE WHEN down = 3 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN down = 3 THEN 1 ELSE 0 END), 0), 1) as down3,
        ROUND(100.0 * SUM(CASE WHEN down = 4 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN down = 4 THEN 1 ELSE 0 END), 0), 1) as down4
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
        AND p.down IS NOT NULL
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      season: validatedSeason,
      down1: Number(row[1]) || 0,
      down2: Number(row[2]) || 0,
      down3: Number(row[3]) || 0,
      down4: Number(row[4]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getSuccessRateByDown',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getSuccessRateByDown', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get success rate by distance category for a season.
 * - short: 1-3 yards to first down
 * - medium: 4-6 yards to first down
 * - long: 7+ yards to first down
 *
 * Success is defined as ppa > 0 for scrimmage plays.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getSuccessRateByDistance(
  season: number
): Promise<SuccessRateByDistance | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        -- Short (1-3 yards)
        ROUND(100.0 * SUM(CASE WHEN distance BETWEEN 1 AND 3 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN distance BETWEEN 1 AND 3 THEN 1 ELSE 0 END), 0), 1) as short_rate,
        -- Medium (4-6 yards)
        ROUND(100.0 * SUM(CASE WHEN distance BETWEEN 4 AND 6 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN distance BETWEEN 4 AND 6 THEN 1 ELSE 0 END), 0), 1) as medium_rate,
        -- Long (7+ yards)
        ROUND(100.0 * SUM(CASE WHEN distance >= 7 AND ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN distance >= 7 THEN 1 ELSE 0 END), 0), 1) as long_rate
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
        AND p.distance IS NOT NULL
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      season: validatedSeason,
      short: Number(row[1]) || 0,
      medium: Number(row[2]) || 0,
      long: Number(row[3]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getSuccessRateByDistance',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getSuccessRateByDistance', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get situational success rates for a season.
 * Includes early down (1st+2nd), late down (3rd+4th), and red zone metrics.
 *
 * Success is defined as ppa > 0 for scrimmage plays.
 * Red zone is defined as drive starting with start_yards_to_goal <= 20.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getSituationalSuccessRate(
  season: number
): Promise<SituationalSuccessRate | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        -- Early downs (1st + 2nd)
        ROUND(100.0 * SUM(CASE WHEN p.down IN (1, 2) AND p.ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN p.down IN (1, 2) THEN 1 ELSE 0 END), 0), 1) as early_down_rate,
        -- Late downs (3rd + 4th)
        ROUND(100.0 * SUM(CASE WHEN p.down IN (3, 4) AND p.ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN p.down IN (3, 4) THEN 1 ELSE 0 END), 0), 1) as late_down_rate,
        -- Red zone (drive start_yards_to_goal <= 20)
        ROUND(100.0 * SUM(CASE WHEN d.start_yards_to_goal <= 20 AND p.ppa > 0 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN d.start_yards_to_goal <= 20 THEN 1 ELSE 0 END), 0), 1) as red_zone_rate,
        -- Attempt counts
        SUM(CASE WHEN p.down IN (1, 2) THEN 1 ELSE 0 END) as early_down_attempts,
        SUM(CASE WHEN p.down IN (3, 4) THEN 1 ELSE 0 END) as late_down_attempts,
        SUM(CASE WHEN d.start_yards_to_goal <= 20 THEN 1 ELSE 0 END) as red_zone_attempts
      FROM plays p
      JOIN games g ON p.game_id = g.id
      JOIN drives d ON p.drive_id = d.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.ppa IS NOT NULL
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      season: validatedSeason,
      earlyDownRate: Number(row[1]) || 0,
      lateDownRate: Number(row[2]) || 0,
      redZoneRate: Number(row[3]) || 0,
      earlyDownAttempts: Number(row[4]) || 0,
      lateDownAttempts: Number(row[5]) || 0,
      redZoneAttempts: Number(row[6]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getSituationalSuccessRate',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getSituationalSuccessRate', { season });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// EXPLOSIVENESS INTERFACES (Task 5.3a)
// Explosive play defined as: yards_gained >= 20
// All explosiveness queries filter to scrimmage plays only
// =============================================================================

/** Threshold for explosive plays (yards gained) */
const EXPLOSIVE_PLAY_THRESHOLD = 20;

/**
 * Explosive play metrics for a season.
 * Explosive play = yards_gained >= 20.
 */
export interface ExplosivePlayMetrics {
  season: number;
  /** Total explosive plays */
  count: number;
  /** Explosive play rate as percentage (0-100) */
  rate: number;
  /** Explosive rush plays */
  byRush: number;
  /** Explosive pass plays */
  byPass: number;
  /** Total scrimmage plays */
  totalPlays: number;
}

/**
 * Individual big play record for leaderboard.
 */
export interface TopPlay {
  gameId: number;
  season: number;
  opponent: string;
  date: string;
  yardsGained: number;
  playType: string;
  playText: string;
}

// =============================================================================
// EXPLOSIVENESS QUERIES (Task 5.3a)
// Explosive play = yards_gained >= 20
// Excludes special teams and penalties
// =============================================================================

/**
 * Get explosive play metrics for Oklahoma offense in a season.
 * Explosive plays are defined as plays with yards_gained >= 20.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getExplosivePlays(season: number): Promise<ExplosivePlayMetrics | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        -- Total explosive plays
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} THEN 1 ELSE 0 END) as explosive_count,
        -- Explosive play rate
        ROUND(100.0 * SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} THEN 1 ELSE 0 END) /
          NULLIF(COUNT(*), 0), 1) as explosive_rate,
        -- Explosive by rush
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} AND play_type IN ${RUSH_PLAY_TYPES} THEN 1 ELSE 0 END) as explosive_rush,
        -- Explosive by pass
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} AND play_type IN ${PASS_PLAY_TYPES} THEN 1 ELSE 0 END) as explosive_pass,
        -- Total plays
        COUNT(*) as total_plays
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[5]) === 0) {
      return null;
    }

    return {
      season: validatedSeason,
      count: Number(row[1]) || 0,
      rate: Number(row[2]) || 0,
      byRush: Number(row[3]) || 0,
      byPass: Number(row[4]) || 0,
      totalPlays: Number(row[5]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getExplosivePlays',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getExplosivePlays', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get explosive plays allowed by Oklahoma defense in a season.
 * Measures opponent explosiveness when OU is on defense.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getExplosivePlaysAllowed(
  season: number
): Promise<ExplosivePlayMetrics | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ${validatedSeason} as season,
        -- Total explosive plays allowed
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} THEN 1 ELSE 0 END) as explosive_count,
        -- Explosive play rate allowed
        ROUND(100.0 * SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} THEN 1 ELSE 0 END) /
          NULLIF(COUNT(*), 0), 1) as explosive_rate,
        -- Explosive by rush allowed
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} AND play_type IN ${RUSH_PLAY_TYPES} THEN 1 ELSE 0 END) as explosive_rush,
        -- Explosive by pass allowed
        SUM(CASE WHEN yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD} AND play_type IN ${PASS_PLAY_TYPES} THEN 1 ELSE 0 END) as explosive_pass,
        -- Total plays faced
        COUNT(*) as total_plays
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.defense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[5]) === 0) {
      return null;
    }

    return {
      season: validatedSeason,
      count: Number(row[1]) || 0,
      rate: Number(row[2]) || 0,
      byRush: Number(row[3]) || 0,
      byPass: Number(row[4]) || 0,
      totalPlays: Number(row[5]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getExplosivePlaysAllowed',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getExplosivePlaysAllowed', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Get top plays by yards gained for Oklahoma offense in a season.
 * Returns the biggest plays sorted by yards descending.
 *
 * @param season - The season year (e.g., 2024)
 * @param limit - Maximum number of plays to return (default: 10)
 */
export async function getTopPlays(season: number, limit: number = 10): Promise<TopPlay[]> {
  const validatedSeason = parseInt(String(season), 10);
  const validatedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        p.game_id,
        g.season,
        CASE WHEN g.home_team = '${TEAM}' THEN g.away_team ELSE g.home_team END as opponent,
        g.start_date,
        p.yards_gained,
        p.play_type,
        p.play_text
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE p.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
        AND p.play_type IN ${SCRIMMAGE_PLAY_TYPES}
        AND p.yards_gained >= ${EXPLOSIVE_PLAY_THRESHOLD}
      ORDER BY p.yards_gained DESC
      LIMIT ${validatedLimit}
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      gameId: Number(row[0]),
      season: Number(row[1]),
      opponent: String(row[2]),
      date: String(row[3]),
      yardsGained: Number(row[4]),
      playType: String(row[5]),
      playText: String(row[6] ?? ''),
    }));
  } catch (error) {
    logger.queryError('getTopPlays', error instanceof Error ? error : new Error(String(error)), {
      season,
      limit,
    });
    throw wrapError(error, 'getTopPlays', { season, limit });
  } finally {
    connection.closeSync();
  }
}

// =============================================================================
// DRIVE ANALYTICS (Task 5.5)
// =============================================================================
// Points per drive by field position, drive success rate, average drive metrics,
// drive outcome distribution, and OU vs opponent comparison.
// =============================================================================

/**
 * Field position bucket for drive analysis.
 * Buckets based on yards to goal at drive start.
 */
export type FieldPositionBucket = 'redZone' | 'opponent' | 'midfield' | 'ownHalf';

/**
 * Drive outcome categories for distribution analysis.
 */
export type DriveOutcome =
  | 'touchdown'
  | 'fieldGoal'
  | 'punt'
  | 'turnover'
  | 'downs'
  | 'endOfHalf'
  | 'other';

/**
 * Categorize a drive result into a standard outcome.
 * @param result - Raw drive_result from database
 */
export function categorizeDriveResult(result: string | null): DriveOutcome {
  if (!result) return 'other';
  const upper = result.toUpperCase();

  // Touchdowns (any scoring TD)
  if (upper.includes('TD') || upper === 'TOUCHDOWN') {
    return 'touchdown';
  }

  // Field goals (successful)
  if (upper === 'FG' || upper === 'FG GOOD' || upper === 'MADE FG') {
    return 'fieldGoal';
  }

  // Punts
  if (upper === 'PUNT' || upper === 'BLOCKED PUNT') {
    return 'punt';
  }

  // Turnovers (interceptions, fumbles)
  if (upper === 'INT' || upper === 'FUMBLE' || upper.includes('TURNOVER')) {
    return 'turnover';
  }

  // Failed on downs (not a turnover, just failed to convert)
  if (upper === 'DOWNS' || upper === 'POSS. ON DOWNS') {
    return 'downs';
  }

  // End of half/game
  if (upper.includes('END OF')) {
    return 'endOfHalf';
  }

  // Missed field goals, safeties, other
  return 'other';
}

/**
 * Points per drive by field position bucket for Oklahoma offense.
 */
export interface PointsPerDriveByPosition {
  season: number;
  /** Red zone: 0-20 yards to goal */
  redZone: { drives: number; points: number; ppd: number };
  /** Opponent territory: 21-40 yards to goal */
  opponent: { drives: number; points: number; ppd: number };
  /** Midfield: 41-60 yards to goal */
  midfield: { drives: number; points: number; ppd: number };
  /** Own half: 61+ yards to goal */
  ownHalf: { drives: number; points: number; ppd: number };
  /** Overall points per drive */
  overall: { drives: number; points: number; ppd: number };
}

/**
 * Get points per drive by field position bucket for Oklahoma offense.
 * Points are estimated: TD = 7, FG = 3.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getPointsPerDriveByPosition(
  season: number
): Promise<PointsPerDriveByPosition | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        -- Red Zone (0-20 yards to goal)
        SUM(CASE WHEN start_yards_to_goal <= 20 THEN 1 ELSE 0 END) as rz_drives,
        SUM(CASE WHEN start_yards_to_goal <= 20 THEN
          CASE
            WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 7
            WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 3
            ELSE 0
          END ELSE 0 END) as rz_points,
        -- Opponent territory (21-40)
        SUM(CASE WHEN start_yards_to_goal BETWEEN 21 AND 40 THEN 1 ELSE 0 END) as opp_drives,
        SUM(CASE WHEN start_yards_to_goal BETWEEN 21 AND 40 THEN
          CASE
            WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 7
            WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 3
            ELSE 0
          END ELSE 0 END) as opp_points,
        -- Midfield (41-60)
        SUM(CASE WHEN start_yards_to_goal BETWEEN 41 AND 60 THEN 1 ELSE 0 END) as mid_drives,
        SUM(CASE WHEN start_yards_to_goal BETWEEN 41 AND 60 THEN
          CASE
            WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 7
            WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 3
            ELSE 0
          END ELSE 0 END) as mid_points,
        -- Own half (61+)
        SUM(CASE WHEN start_yards_to_goal > 60 THEN 1 ELSE 0 END) as own_drives,
        SUM(CASE WHEN start_yards_to_goal > 60 THEN
          CASE
            WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 7
            WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 3
            ELSE 0
          END ELSE 0 END) as own_points,
        -- Overall
        COUNT(*) as total_drives,
        SUM(CASE
          WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 7
          WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 3
          ELSE 0
        END) as total_points
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[8]) === 0) {
      return null;
    }

    const safeDivide = (num: number, denom: number) =>
      denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;

    const rzDrives = Number(row[0]) || 0;
    const rzPoints = Number(row[1]) || 0;
    const oppDrives = Number(row[2]) || 0;
    const oppPoints = Number(row[3]) || 0;
    const midDrives = Number(row[4]) || 0;
    const midPoints = Number(row[5]) || 0;
    const ownDrives = Number(row[6]) || 0;
    const ownPoints = Number(row[7]) || 0;
    const totalDrives = Number(row[8]) || 0;
    const totalPoints = Number(row[9]) || 0;

    return {
      season: validatedSeason,
      redZone: { drives: rzDrives, points: rzPoints, ppd: safeDivide(rzPoints, rzDrives) },
      opponent: { drives: oppDrives, points: oppPoints, ppd: safeDivide(oppPoints, oppDrives) },
      midfield: { drives: midDrives, points: midPoints, ppd: safeDivide(midPoints, midDrives) },
      ownHalf: { drives: ownDrives, points: ownPoints, ppd: safeDivide(ownPoints, ownDrives) },
      overall: {
        drives: totalDrives,
        points: totalPoints,
        ppd: safeDivide(totalPoints, totalDrives),
      },
    };
  } catch (error) {
    logger.queryError(
      'getPointsPerDriveByPosition',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getPointsPerDriveByPosition', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Drive success rate metrics for a season.
 */
export interface DriveSuccessRate {
  season: number;
  totalDrives: number;
  scoringDrives: number;
  successRate: number;
}

/**
 * Get drive success rate for Oklahoma offense.
 * Success = scoring drive (TD or FG).
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getDriveSuccessRate(season: number): Promise<DriveSuccessRate | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        COUNT(*) as total_drives,
        SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) as scoring_drives,
        ROUND(100.0 * SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) /
          NULLIF(COUNT(*), 0), 1) as success_rate
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[0]) === 0) {
      return null;
    }

    return {
      season: validatedSeason,
      totalDrives: Number(row[0]) || 0,
      scoringDrives: Number(row[1]) || 0,
      successRate: Number(row[2]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getDriveSuccessRate',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getDriveSuccessRate', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Average drive metrics (length in plays, yards, time).
 */
export interface AverageDriveMetrics {
  season: number;
  avgPlays: number;
  avgYards: number;
  avgTimeMinutes: number;
  avgTimeSeconds: number;
  totalDrives: number;
}

/**
 * Get average drive metrics for Oklahoma offense.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getAverageDriveMetrics(season: number): Promise<AverageDriveMetrics | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        ROUND(AVG(plays), 1) as avg_plays,
        ROUND(AVG(yards), 1) as avg_yards,
        ROUND(AVG(elapsed_minutes + elapsed_seconds / 60.0), 2) as avg_time_total,
        COUNT(*) as total_drives
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[3]) === 0) {
      return null;
    }

    const avgTimeTotal = Number(row[2]) || 0;
    const avgTimeMinutes = Math.floor(avgTimeTotal);
    const avgTimeSeconds = Math.round((avgTimeTotal - avgTimeMinutes) * 60);

    return {
      season: validatedSeason,
      avgPlays: Number(row[0]) || 0,
      avgYards: Number(row[1]) || 0,
      avgTimeMinutes,
      avgTimeSeconds,
      totalDrives: Number(row[3]) || 0,
    };
  } catch (error) {
    logger.queryError(
      'getAverageDriveMetrics',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getAverageDriveMetrics', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Drive outcome distribution for a season.
 */
export interface DriveOutcomeDistribution {
  season: number;
  touchdowns: number;
  fieldGoals: number;
  punts: number;
  turnovers: number;
  downs: number;
  endOfHalf: number;
  other: number;
  total: number;
}

/**
 * Get drive outcome distribution for Oklahoma offense.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getDriveOutcomeDistribution(
  season: number
): Promise<DriveOutcomeDistribution | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        -- Touchdowns
        SUM(CASE WHEN UPPER(drive_result) LIKE '%TD%' OR UPPER(drive_result) = 'TOUCHDOWN' THEN 1 ELSE 0 END) as tds,
        -- Field goals (successful only)
        SUM(CASE WHEN UPPER(drive_result) IN ('FG', 'FG GOOD', 'MADE FG') THEN 1 ELSE 0 END) as fgs,
        -- Punts
        SUM(CASE WHEN UPPER(drive_result) = 'PUNT' OR UPPER(drive_result) = 'BLOCKED PUNT' THEN 1 ELSE 0 END) as punts,
        -- Turnovers (INT, fumble)
        SUM(CASE WHEN UPPER(drive_result) IN ('INT', 'FUMBLE') OR UPPER(drive_result) LIKE '%TURNOVER%' THEN 1 ELSE 0 END) as turnovers,
        -- Downs (failed to convert)
        SUM(CASE WHEN UPPER(drive_result) IN ('DOWNS', 'POSS. ON DOWNS') THEN 1 ELSE 0 END) as downs,
        -- End of half/game
        SUM(CASE WHEN UPPER(drive_result) LIKE 'END OF%' THEN 1 ELSE 0 END) as end_of_half,
        -- Total
        COUNT(*) as total
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    const rows = await result.getRows();
    const row = rows[0];
    if (!row || Number(row[6]) === 0) {
      return null;
    }

    const tds = Number(row[0]) || 0;
    const fgs = Number(row[1]) || 0;
    const punts = Number(row[2]) || 0;
    const turnovers = Number(row[3]) || 0;
    const downs = Number(row[4]) || 0;
    const endOfHalf = Number(row[5]) || 0;
    const total = Number(row[6]) || 0;
    const other = total - tds - fgs - punts - turnovers - downs - endOfHalf;

    return {
      season: validatedSeason,
      touchdowns: tds,
      fieldGoals: fgs,
      punts,
      turnovers,
      downs,
      endOfHalf,
      other: Math.max(0, other),
      total,
    };
  } catch (error) {
    logger.queryError(
      'getDriveOutcomeDistribution',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getDriveOutcomeDistribution', { season });
  } finally {
    connection.closeSync();
  }
}

/**
 * Comparison of OU offense vs opponent offense drive metrics.
 */
export interface DriveComparison {
  season: number;
  ou: {
    totalDrives: number;
    scoringDrives: number;
    successRate: number;
    avgPlays: number;
    avgYards: number;
    avgTimeMinutes: number;
  };
  opponent: {
    totalDrives: number;
    scoringDrives: number;
    successRate: number;
    avgPlays: number;
    avgYards: number;
    avgTimeMinutes: number;
  };
}

/**
 * Get drive comparison between Oklahoma offense and opponent offense.
 * Opponent metrics represent how opposing teams performed against OU defense.
 *
 * @param season - The season year (e.g., 2024)
 */
export async function getDriveComparison(season: number): Promise<DriveComparison | null> {
  const validatedSeason = parseInt(String(season), 10);
  if (isNaN(validatedSeason)) {
    throw new Error('Invalid season parameter');
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // OU offense drives
    const ouResult = await connection.run(`
      SELECT
        COUNT(*) as total_drives,
        SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) as scoring_drives,
        ROUND(100.0 * SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as success_rate,
        ROUND(AVG(plays), 1) as avg_plays,
        ROUND(AVG(yards), 1) as avg_yards,
        ROUND(AVG(elapsed_minutes + elapsed_seconds / 60.0), 1) as avg_time
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    // Opponent offense drives (OU defense)
    const oppResult = await connection.run(`
      SELECT
        COUNT(*) as total_drives,
        SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) as scoring_drives,
        ROUND(100.0 * SUM(CASE WHEN scoring = true THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as success_rate,
        ROUND(AVG(plays), 1) as avg_plays,
        ROUND(AVG(yards), 1) as avg_yards,
        ROUND(AVG(elapsed_minutes + elapsed_seconds / 60.0), 1) as avg_time
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.defense = '${TEAM}'
        AND g.season = ${validatedSeason}
    `);

    const ouRows = await ouResult.getRows();
    const oppRows = await oppResult.getRows();
    const ouRow = ouRows[0];
    const oppRow = oppRows[0];

    if (!ouRow || !oppRow || Number(ouRow[0]) === 0) {
      return null;
    }

    return {
      season: validatedSeason,
      ou: {
        totalDrives: Number(ouRow[0]) || 0,
        scoringDrives: Number(ouRow[1]) || 0,
        successRate: Number(ouRow[2]) || 0,
        avgPlays: Number(ouRow[3]) || 0,
        avgYards: Number(ouRow[4]) || 0,
        avgTimeMinutes: Number(ouRow[5]) || 0,
      },
      opponent: {
        totalDrives: Number(oppRow[0]) || 0,
        scoringDrives: Number(oppRow[1]) || 0,
        successRate: Number(oppRow[2]) || 0,
        avgPlays: Number(oppRow[3]) || 0,
        avgYards: Number(oppRow[4]) || 0,
        avgTimeMinutes: Number(oppRow[5]) || 0,
      },
    };
  } catch (error) {
    logger.queryError(
      'getDriveComparison',
      error instanceof Error ? error : new Error(String(error)),
      { season }
    );
    throw wrapError(error, 'getDriveComparison', { season });
  } finally {
    connection.closeSync();
  }
}
