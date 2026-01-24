/**
 * Integration Tests - Core Query Functions (Batch 1)
 *
 * Tests for 8 foundational query functions:
 * - getAvailableSeasons
 * - getSeasonRecord
 * - getRecentGames
 * - getUpcomingGames
 * - getAllGames
 * - getGameById
 * - getGameDrives
 * - getGamePlays
 *
 * Uses mock DuckDB connection with fixture data to test query logic
 * without requiring a real database connection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheClear } from '@/lib/cache';

// Track SQL queries for snapshot testing
let capturedQueries: string[] = [];

// Mock getDuckDB to return our controlled mock
vi.mock('../duckdb', () => ({
  getDuckDB: vi.fn(),
}));

// Import after mocking
import { getDuckDB } from '../duckdb';
import {
  getAvailableSeasons,
  getSeasonRecord,
  getRecentGames,
  getUpcomingGames,
  getAllGames,
  getGameById,
  getGameDrives,
  getGamePlays,
} from '../queries';

/**
 * Creates a mock connection that returns data based on SQL patterns
 */
function createMockConnection(queryResults: Record<string, unknown[][]>) {
  return {
    run: vi.fn().mockImplementation(async (sql: string) => {
      capturedQueries.push(sql);

      // Find matching result based on SQL pattern
      for (const [pattern, results] of Object.entries(queryResults)) {
        if (sql.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            getRows: () => Promise.resolve(results),
          };
        }
      }
      // Default empty result
      return {
        getRows: () => Promise.resolve([]),
      };
    }),
    closeSync: vi.fn(),
  };
}

function createMockDB(connection: ReturnType<typeof createMockConnection>) {
  return {
    connect: vi.fn().mockResolvedValue(connection),
  };
}

describe('Core Query Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueries = [];
    cacheClear(); // Clear cache between tests to ensure isolation
  });

  // ==========================================================================
  // getAvailableSeasons
  // ==========================================================================
  describe('getAvailableSeasons', () => {
    it('returns seasons in descending order', async () => {
      const mockConnection = createMockConnection({
        'select distinct season': [[2024], [2023], [2022], [2021], [2020]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getAvailableSeasons();

      expect(result).toEqual([2024, 2023, 2022, 2021, 2020]);
    });

    it('returns empty array when no seasons found', async () => {
      const mockConnection = createMockConnection({
        'select distinct season': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getAvailableSeasons();

      expect(result).toEqual([]);
    });

    it('filters by Oklahoma team', async () => {
      const mockConnection = createMockConnection({
        'select distinct season': [[2024]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAvailableSeasons();

      expect(capturedQueries[0]).toContain("home_team = 'Oklahoma'");
      expect(capturedQueries[0]).toContain("away_team = 'Oklahoma'");
    });

    it('closes connection after query', async () => {
      const mockConnection = createMockConnection({
        'select distinct season': [[2024]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAvailableSeasons();

      expect(mockConnection.closeSync).toHaveBeenCalled();
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'select distinct season': [[2024]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAvailableSeasons();

      expect(capturedQueries[0]).toMatchSnapshot('getAvailableSeasons-sql');
    });
  });

  // ==========================================================================
  // getSeasonRecord
  // ==========================================================================
  describe('getSeasonRecord', () => {
    it('returns season record with wins and losses', async () => {
      // Mock row: season, games, wins, losses, conf_wins, conf_losses, points_for, points_against
      const mockConnection = createMockConnection({
        'group by season': [[2024, 12, 10, 2, 7, 1, 420, 210]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonRecord(2024);

      expect(result).toEqual({
        season: 2024,
        games: 12,
        wins: 10,
        losses: 2,
        confWins: 7,
        confLosses: 1,
        pointsFor: 420,
        pointsAgainst: 210,
      });
    });

    it('returns null when season has no games', async () => {
      const mockConnection = createMockConnection({
        'group by season': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonRecord(2025);

      expect(result).toBeNull();
    });

    it('calculates conference record separately', async () => {
      const mockConnection = createMockConnection({
        'group by season': [[2024, 12, 10, 2, 5, 3, 420, 210]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonRecord(2024);

      expect(result?.confWins).toBe(5);
      expect(result?.confLosses).toBe(3);
    });

    it('filters by season parameter', async () => {
      const mockConnection = createMockConnection({
        'group by season': [[2023, 11, 8, 3, 5, 3, 350, 200]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSeasonRecord(2023);

      expect(capturedQueries[0]).toContain('season = 2023');
    });

    it('only counts completed games', async () => {
      const mockConnection = createMockConnection({
        'group by season': [[2024, 10, 8, 2, 5, 2, 350, 200]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSeasonRecord(2024);

      expect(capturedQueries[0]).toContain('completed = true');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'group by season': [[2024, 12, 10, 2, 7, 1, 420, 210]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSeasonRecord(2024);

      expect(capturedQueries[0]).toMatchSnapshot('getSeasonRecord-sql');
    });
  });

  // ==========================================================================
  // getRecentGames
  // ==========================================================================
  describe('getRecentGames', () => {
    it('returns completed games with result', async () => {
      // Row: id, season, week, season_type, start_date, venue, home_team, home_points, away_team, away_points
      const mockConnection = createMockConnection({
        'completed = true': [
          [
            1001,
            2024,
            1,
            'regular',
            '2024-09-01T19:00:00.000Z',
            'Memorial Stadium',
            'Oklahoma',
            35,
            'Houston',
            14,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getRecentGames(2024, 5);

      expect(result).toHaveLength(1);
      expect(result[0].result).toBe('W');
      expect(result[0].isHome).toBe(true);
      expect(result[0].opponent).toBe('Houston');
    });

    it('calculates loss when opponent scores more', async () => {
      const mockConnection = createMockConnection({
        'completed = true': [
          [
            1005,
            2024,
            5,
            'regular',
            '2024-09-28T19:00:00.000Z',
            'Jordan-Hare Stadium',
            'Auburn',
            21,
            'Oklahoma',
            14,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getRecentGames(2024, 5);

      expect(result[0].result).toBe('L');
      expect(result[0].isHome).toBe(false);
      expect(result[0].opponent).toBe('Auburn');
    });

    it('respects limit parameter', async () => {
      const mockConnection = createMockConnection({
        'completed = true': [
          [1001, 2024, 1, 'regular', '2024-09-01', 'Stadium', 'Oklahoma', 35, 'Houston', 14],
          [1002, 2024, 2, 'regular', '2024-09-07', 'Stadium', 'Oklahoma', 42, 'Temple', 10],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getRecentGames(2024, 2);

      expect(capturedQueries[0]).toContain('LIMIT 2');
    });

    it('orders by start_date descending', async () => {
      const mockConnection = createMockConnection({
        'completed = true': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getRecentGames(2024);

      expect(capturedQueries[0]).toContain('ORDER BY start_date DESC');
    });

    it('uses default limit of 5', async () => {
      const mockConnection = createMockConnection({
        'completed = true': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getRecentGames(2024);

      expect(capturedQueries[0]).toContain('LIMIT 5');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'completed = true': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getRecentGames(2024, 5);

      expect(capturedQueries[0]).toMatchSnapshot('getRecentGames-sql');
    });
  });

  // ==========================================================================
  // getUpcomingGames
  // ==========================================================================
  describe('getUpcomingGames', () => {
    it('returns incomplete games', async () => {
      const mockConnection = createMockConnection({
        'completed = false': [
          [
            2003,
            2024,
            3,
            'regular',
            '2024-09-14T19:00:00.000Z',
            'Memorial Stadium',
            'Oklahoma',
            0,
            'Tulane',
            0,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getUpcomingGames(2024, 5);

      expect(result).toHaveLength(1);
      expect(result[0].result).toBeNull();
      expect(result[0].ouScore).toBe(0);
      expect(result[0].oppScore).toBe(0);
    });

    it('orders by start_date ascending (soonest first)', async () => {
      const mockConnection = createMockConnection({
        'completed = false': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getUpcomingGames(2024, 5);

      expect(capturedQueries[0]).toContain('ORDER BY start_date ASC');
    });

    it('identifies home vs away games correctly', async () => {
      const mockConnection = createMockConnection({
        'completed = false': [
          [2005, 2024, 5, 'regular', '2024-09-28', 'Auburn Arena', 'Auburn', 0, 'Oklahoma', 0],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getUpcomingGames(2024, 5);

      expect(result[0].isHome).toBe(false);
      expect(result[0].opponent).toBe('Auburn');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'completed = false': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getUpcomingGames(2024, 5);

      expect(capturedQueries[0]).toMatchSnapshot('getUpcomingGames-sql');
    });
  });

  // ==========================================================================
  // getAllGames
  // ==========================================================================
  describe('getAllGames', () => {
    it('returns games with total count', async () => {
      const mockConnection = createMockConnection({
        'select count': [[12]],
        'order by start_date': [
          [1001, 2024, 1, 'regular', '2024-09-01', 'Stadium', 'Oklahoma', 35, 'Houston', 14, true],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getAllGames(2024);

      expect(result.total).toBe(12);
      expect(result.games).toHaveLength(1);
    });

    it('supports pagination with limit and offset', async () => {
      const mockConnection = createMockConnection({
        'select count': [[100]],
        'order by start_date': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAllGames(2024, 10, 20);

      expect(capturedQueries[1]).toContain('LIMIT 10');
      expect(capturedQueries[1]).toContain('OFFSET 20');
    });

    it('filters by season when provided', async () => {
      const mockConnection = createMockConnection({
        'select count': [[12]],
        'order by start_date': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAllGames(2023);

      expect(capturedQueries[0]).toContain('season = 2023');
    });

    it('returns all seasons when season parameter omitted', async () => {
      const mockConnection = createMockConnection({
        'select count': [[150]],
        'order by start_date': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAllGames(undefined, 50, 0);

      expect(capturedQueries[0]).not.toContain('season =');
    });

    it('handles completed game results correctly', async () => {
      const mockConnection = createMockConnection({
        'select count': [[1]],
        'order by start_date': [
          [1001, 2024, 1, 'regular', '2024-09-01', 'Stadium', 'Oklahoma', 35, 'Houston', 14, true],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getAllGames(2024);

      expect(result.games[0].result).toBe('W');
    });

    it('returns null result for incomplete games', async () => {
      const mockConnection = createMockConnection({
        'select count': [[1]],
        'order by start_date': [
          [2003, 2024, 3, 'regular', '2024-09-14', 'Stadium', 'Oklahoma', 0, 'Tulane', 0, false],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getAllGames(2024);

      expect(result.games[0].result).toBeNull();
    });

    it('uses default limit of 50', async () => {
      const mockConnection = createMockConnection({
        'select count': [[100]],
        'order by start_date': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAllGames(2024);

      expect(capturedQueries[1]).toContain('LIMIT 50');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'select count': [[12]],
        'order by start_date': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getAllGames(2024, 10, 20);

      expect(capturedQueries[0]).toMatchSnapshot('getAllGames-count-sql');
      expect(capturedQueries[1]).toMatchSnapshot('getAllGames-select-sql');
    });
  });

  // ==========================================================================
  // getGameById
  // ==========================================================================
  describe('getGameById', () => {
    it('returns game details with line scores', async () => {
      const mockConnection = createMockConnection({
        'from games\n      where id =': [
          [
            1001,
            2024,
            1,
            'regular',
            '2024-09-01',
            'Memorial Stadium',
            85000,
            'Oklahoma',
            35,
            'SEC',
            'Houston',
            14,
            'Big 12',
            5.5,
          ],
        ],
        games__home_line_scores: [[7], [14], [7], [7]],
        games__away_line_scores: [[0], [7], [0], [7]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameById(1001);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1001);
      expect(result?.homeTeam).toBe('Oklahoma');
      expect(result?.homeLineScores).toEqual([7, 14, 7, 7]);
      expect(result?.awayLineScores).toEqual([0, 7, 0, 7]);
    });

    it('returns null when game not found', async () => {
      const mockConnection = createMockConnection({
        'from games\n      where id =': [],
        games__home_line_scores: [],
        games__away_line_scores: [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameById(9999);

      expect(result).toBeNull();
    });

    it('handles null attendance and excitement index', async () => {
      const mockConnection = createMockConnection({
        'from games\n      where id =': [
          [
            1001,
            2024,
            1,
            'regular',
            '2024-09-01',
            'Memorial Stadium',
            null,
            'Oklahoma',
            35,
            null,
            'Houston',
            14,
            null,
            null,
          ],
        ],
        games__home_line_scores: [],
        games__away_line_scores: [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameById(1001);

      expect(result?.attendance).toBeNull();
      expect(result?.excitementIndex).toBeNull();
      expect(result?.homeConference).toBeNull();
    });

    it('returns empty line scores when not available', async () => {
      const mockConnection = createMockConnection({
        'from games\n      where id =': [
          [
            1001,
            2024,
            1,
            'regular',
            '2024-09-01',
            'Memorial Stadium',
            85000,
            'Oklahoma',
            35,
            'SEC',
            'Houston',
            14,
            'Big 12',
            5.5,
          ],
        ],
        games__home_line_scores: [],
        games__away_line_scores: [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameById(1001);

      expect(result?.homeLineScores).toEqual([]);
      expect(result?.awayLineScores).toEqual([]);
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'from games\n      where id =': [],
        games__home_line_scores: [],
        games__away_line_scores: [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGameById(1001);

      expect(capturedQueries[0]).toMatchSnapshot('getGameById-main-sql');
      expect(capturedQueries[1]).toMatchSnapshot('getGameById-homeLineScores-sql');
      expect(capturedQueries[2]).toMatchSnapshot('getGameById-awayLineScores-sql');
    });
  });

  // ==========================================================================
  // getGameDrives
  // ==========================================================================
  describe('getGameDrives', () => {
    it('returns drives ordered by drive_number', async () => {
      const mockConnection = createMockConnection({
        'from drives': [
          ['drive-1', 1, 'Oklahoma', 'Houston', 1, 75, 0, 8, 75, 'TD', true, 4, 30],
          ['drive-2', 2, 'Houston', 'Oklahoma', 1, 75, 35, 5, 40, 'PUNT', false, 3, 15],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameDrives(1001);

      expect(result).toHaveLength(2);
      expect(result[0].driveNumber).toBe(1);
      expect(result[1].driveNumber).toBe(2);
    });

    it('maps drive properties correctly', async () => {
      const mockConnection = createMockConnection({
        'from drives': [['drive-1', 1, 'Oklahoma', 'Houston', 1, 75, 0, 8, 75, 'TD', true, 4, 30]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameDrives(1001);

      expect(result[0]).toEqual({
        id: 'drive-1',
        driveNumber: 1,
        offense: 'Oklahoma',
        defense: 'Houston',
        startPeriod: 1,
        startYardsToGoal: 75,
        endYardsToGoal: 0,
        plays: 8,
        yards: 75,
        result: 'TD',
        scoring: true,
        elapsedMinutes: 4,
        elapsedSeconds: 30,
      });
    });

    it('returns empty array when no drives found', async () => {
      const mockConnection = createMockConnection({
        'from drives': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameDrives(9999);

      expect(result).toEqual([]);
    });

    it('handles non-scoring drives', async () => {
      const mockConnection = createMockConnection({
        'from drives': [
          ['drive-2', 2, 'Houston', 'Oklahoma', 1, 75, 35, 5, 40, 'PUNT', false, 3, 15],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameDrives(1001);

      expect(result[0].scoring).toBe(false);
      expect(result[0].result).toBe('PUNT');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure', async () => {
      const mockConnection = createMockConnection({
        'from drives': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGameDrives(1001);

      expect(capturedQueries[0]).toMatchSnapshot('getGameDrives-sql');
    });
  });

  // ==========================================================================
  // getGamePlays
  // ==========================================================================
  describe('getGamePlays', () => {
    it('returns plays ordered by drive_number and play_number', async () => {
      const mockConnection = createMockConnection({
        'from plays': [
          [
            'play-1',
            1001,
            'drive-1',
            1,
            1,
            1,
            15,
            0,
            'Oklahoma',
            'Houston',
            0,
            0,
            1,
            10,
            8,
            'Rush',
            'Jackson rushes for 8 yards',
            0.15,
            false,
          ],
          [
            'play-2',
            1001,
            'drive-1',
            1,
            2,
            1,
            14,
            30,
            'Oklahoma',
            'Houston',
            0,
            0,
            2,
            2,
            15,
            'Pass Reception',
            'Pass complete for 15 yards',
            0.25,
            false,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGamePlays(1001);

      expect(result).toHaveLength(2);
      expect(result[0].playNumber).toBe(1);
      expect(result[1].playNumber).toBe(2);
    });

    it('handles search filter with escaping', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGamePlays(1001, { search: 'touchdown' });

      expect(capturedQueries[0]).toContain('ILIKE');
      expect(capturedQueries[0]).toContain('%touchdown%');
    });

    it('escapes special characters in search', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGamePlays(1001, { search: '100%' });

      expect(capturedQueries[0]).toContain('100\\%');
    });

    it('truncates search to 100 characters', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const longSearch = 'a'.repeat(150);
      await getGamePlays(1001, { search: longSearch });

      // Should be truncated to 100 chars
      expect(capturedQueries[0]).toContain('a'.repeat(100));
      expect(capturedQueries[0]).not.toContain('a'.repeat(101));
    });

    it('maps play properties correctly', async () => {
      const mockConnection = createMockConnection({
        'from plays': [
          [
            'play-1',
            1001,
            'drive-1',
            1,
            1,
            1,
            15,
            0,
            'Oklahoma',
            'Houston',
            0,
            0,
            1,
            10,
            8,
            'Rush',
            'Jackson rushes for 8 yards',
            0.15,
            false,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGamePlays(1001);

      expect(result[0]).toMatchObject({
        id: 'play-1',
        gameId: 1001,
        driveId: 'drive-1',
        driveNumber: 1,
        playNumber: 1,
        period: 1,
        clockMinutes: 15,
        clockSeconds: 0,
        offense: 'Oklahoma',
        defense: 'Houston',
        down: 1,
        distance: 10,
        yardsGained: 8,
        playType: 'Rush',
        ppa: 0.15,
        scoring: false,
      });
    });

    it('handles null down and distance', async () => {
      const mockConnection = createMockConnection({
        'from plays': [
          [
            'play-1',
            1001,
            'drive-1',
            1,
            1,
            1,
            15,
            0,
            'Oklahoma',
            'Houston',
            0,
            0,
            null,
            null,
            0,
            'Kickoff',
            'Kickoff',
            null,
            false,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGamePlays(1001);

      expect(result[0].down).toBeNull();
      expect(result[0].distance).toBeNull();
      expect(result[0].ppa).toBeNull();
    });

    it('caps clock_seconds at 59', async () => {
      const mockConnection = createMockConnection({
        'from plays': [
          [
            'play-1',
            1001,
            'drive-1',
            1,
            1,
            1,
            15,
            75,
            'Oklahoma',
            'Houston',
            0,
            0,
            1,
            10,
            8,
            'Rush',
            'Rush',
            0.15,
            false,
          ],
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGamePlays(1001);

      expect(result[0].clockSeconds).toBe(59);
    });

    it('throws error for invalid game ID', async () => {
      await expect(getGamePlays(NaN)).rejects.toThrow('Invalid game ID');
    });

    it('returns empty array when no plays found', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGamePlays(9999);

      expect(result).toEqual([]);
    });

    it('skips search filter for empty search string', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGamePlays(1001, { search: '   ' });

      expect(capturedQueries[0]).not.toContain('ILIKE');
    });

    // SQL Snapshot test
    it('generates expected SQL query structure without filter', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGamePlays(1001);

      expect(capturedQueries[0]).toMatchSnapshot('getGamePlays-nofilter-sql');
    });

    it('generates expected SQL query structure with search filter', async () => {
      const mockConnection = createMockConnection({
        'from plays': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGamePlays(1001, { search: 'touchdown' });

      expect(capturedQueries[0]).toMatchSnapshot('getGamePlays-search-sql');
    });
  });
});
