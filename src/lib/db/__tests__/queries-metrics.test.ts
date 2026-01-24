/**
 * Integration Tests - Advanced Metrics Query Functions (Batch 2)
 *
 * Tests for 10 analytics functions:
 * - getSeasonEPA
 * - getGameEPA
 * - getEPATrends
 * - getSuccessRateByPlayType
 * - getSuccessRateByDown
 * - getSuccessRateByDistance
 * - getSituationalSuccessRate
 * - getExplosivePlays
 * - getExplosivePlaysAllowed
 * - getTopPlays
 *
 * Focus areas:
 * - EPA edge cases: positive, negative, zero values
 * - Success rate edge cases: 0 attempts, 100% success
 * - Explosive play thresholds (20+ yards)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSeasonEPARow,
  createGameEPARow,
  createEPATrendRows,
  createSuccessRateByPlayTypeRow,
  createSuccessRateByDownRow,
  createSuccessRateByDistanceRow,
  createSituationalSuccessRateRow,
  createExplosivePlayMetricsRow,
  createTopPlayRows,
  createPositiveEPARow,
  createNegativeEPARow,
  createZeroEPARow,
  createPerfectSuccessRateRow,
  createZeroAttemptsRow,
  createNoExplosivePlaysRow,
  createHighExplosivePlaysRow,
} from './fixtures/epa';

// Track SQL queries for verification
let capturedQueries: string[] = [];

// Mock getDuckDB
vi.mock('../duckdb', () => ({
  getDuckDB: vi.fn(),
}));

import { getDuckDB } from '../duckdb';
import {
  getSeasonEPA,
  getGameEPA,
  getEPATrends,
  getSuccessRateByPlayType,
  getSuccessRateByDown,
  getSuccessRateByDistance,
  getSituationalSuccessRate,
  getExplosivePlays,
  getExplosivePlaysAllowed,
  getTopPlays,
} from '../queries';

/**
 * Creates a mock connection that returns data based on SQL patterns
 */
function createMockConnection(queryResults: Record<string, unknown[][]>) {
  return {
    run: vi.fn().mockImplementation(async (sql: string) => {
      capturedQueries.push(sql);

      for (const [pattern, results] of Object.entries(queryResults)) {
        if (sql.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            getRows: () => Promise.resolve(results),
          };
        }
      }
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

describe('Advanced Metrics Query Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueries = [];
  });

  // ==========================================================================
  // getSeasonEPA
  // ==========================================================================
  describe('getSeasonEPA', () => {
    it('returns season EPA metrics', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSeasonEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonEPA(2024);

      expect(result).toEqual({
        season: 2024,
        epaPerPlay: 0.125,
        rushEpaPerPlay: 0.08,
        passEpaPerPlay: 0.18,
        totalPlays: 850,
        rushPlays: 400,
        passPlays: 450,
      });
    });

    it('handles positive EPA values (good offense)', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createPositiveEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonEPA(2024);

      expect(result?.epaPerPlay).toBe(0.25);
      expect(result?.rushEpaPerPlay).toBe(0.18);
      expect(result?.passEpaPerPlay).toBe(0.32);
    });

    it('handles negative EPA values (struggling offense)', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createNegativeEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonEPA(2024);

      expect(result?.epaPerPlay).toBe(-0.08);
      expect(result?.rushEpaPerPlay).toBe(-0.12);
      expect(result?.passEpaPerPlay).toBe(-0.05);
    });

    it('handles zero EPA values', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createZeroEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonEPA(2024);

      expect(result?.epaPerPlay).toBe(0);
      expect(result?.rushEpaPerPlay).toBe(0);
      expect(result?.passEpaPerPlay).toBe(0);
    });

    it('returns null when no plays found', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [[2024, 0, 0, 0, 0, 0, 0]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSeasonEPA(2024);

      expect(result).toBeNull();
    });

    it('throws error for invalid season parameter', async () => {
      await expect(getSeasonEPA(NaN)).rejects.toThrow('Invalid season parameter');
    });

    it('filters to scrimmage plays only', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSeasonEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSeasonEPA(2024);

      expect(capturedQueries[0]).toContain('play_type IN');
      expect(capturedQueries[0]).toContain("'Rush'");
      expect(capturedQueries[0]).toContain("'Pass Reception'");
    });

    it('closes connection after query', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSeasonEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSeasonEPA(2024);

      expect(mockConnection.closeSync).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getGameEPA
  // ==========================================================================
  describe('getGameEPA', () => {
    it('returns EPA for both teams', async () => {
      const mockConnection = createMockConnection({
        "offense = 'oklahoma'": [createGameEPARow({ epaPerPlay: 0.2, totalEpa: 15.0, plays: 70 })],
        "defense = 'oklahoma'": [
          createGameEPARow({ epaPerPlay: -0.05, totalEpa: -3.5, plays: 65 }),
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameEPA(1001);

      expect(result?.gameId).toBe(1001);
      expect(result?.ouEpaPerPlay).toBe(0.2);
      expect(result?.oppEpaPerPlay).toBe(-0.05);
    });

    it('handles positive OU EPA and negative opponent EPA', async () => {
      const mockConnection = createMockConnection({
        "offense = 'oklahoma'": [createGameEPARow({ epaPerPlay: 0.35, totalEpa: 25.0 })],
        "defense = 'oklahoma'": [createGameEPARow({ epaPerPlay: -0.15, totalEpa: -10.0 })],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameEPA(1001);

      expect(result?.ouEpaPerPlay).toBe(0.35);
      expect(result?.ouTotalEPA).toBe(25.0);
      expect(result?.oppEpaPerPlay).toBe(-0.15);
      expect(result?.oppTotalEPA).toBe(-10.0);
    });

    it('returns null when no data found', async () => {
      const mockConnection = createMockConnection({
        "offense = 'oklahoma'": [],
        "defense = 'oklahoma'": [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getGameEPA(9999);

      expect(result).toBeNull();
    });

    it('throws error for invalid game ID', async () => {
      await expect(getGameEPA(NaN)).rejects.toThrow('Invalid game ID');
    });

    it('runs two queries - one for offense, one for defense', async () => {
      const mockConnection = createMockConnection({
        "offense = 'oklahoma'": [createGameEPARow()],
        "defense = 'oklahoma'": [createGameEPARow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getGameEPA(1001);

      expect(capturedQueries.length).toBe(2);
      expect(capturedQueries[0]).toContain("offense = 'Oklahoma'");
      expect(capturedQueries[1]).toContain("defense = 'Oklahoma'");
    });
  });

  // ==========================================================================
  // getEPATrends
  // ==========================================================================
  describe('getEPATrends', () => {
    it('returns EPA trends across seasons', async () => {
      const mockConnection = createMockConnection({
        'group by g.season': createEPATrendRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getEPATrends(2020, 2024);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ season: 2020, epaPerPlay: 0.08 });
      expect(result[4]).toEqual({ season: 2024, epaPerPlay: 0.18 });
    });

    it('returns empty array when no data', async () => {
      const mockConnection = createMockConnection({
        'group by g.season': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getEPATrends(2025, 2026);

      expect(result).toEqual([]);
    });

    it('throws error for invalid year parameters', async () => {
      await expect(getEPATrends(NaN, 2024)).rejects.toThrow('Invalid year parameters');
      await expect(getEPATrends(2020, NaN)).rejects.toThrow('Invalid year parameters');
    });

    it('filters by year range', async () => {
      const mockConnection = createMockConnection({
        'group by g.season': createEPATrendRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getEPATrends(2020, 2024);

      expect(capturedQueries[0]).toContain('season >= 2020');
      expect(capturedQueries[0]).toContain('season <= 2024');
    });

    it('orders by season ascending', async () => {
      const mockConnection = createMockConnection({
        'group by g.season': createEPATrendRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getEPATrends(2020, 2024);

      expect(capturedQueries[0]).toContain('ORDER BY g.season');
    });
  });

  // ==========================================================================
  // getSuccessRateByPlayType
  // ==========================================================================
  describe('getSuccessRateByPlayType', () => {
    it('returns success rates by play type', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByPlayTypeRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByPlayType(2024);

      expect(result).toEqual({
        season: 2024,
        rushSuccessRate: 45.5,
        passSuccessRate: 52.3,
        overallSuccessRate: 48.9,
        rushAttempts: 400,
        passAttempts: 450,
      });
    });

    it('handles 100% success rate', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createPerfectSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByPlayType(2024);

      expect(result?.rushSuccessRate).toBe(100);
      expect(result?.passSuccessRate).toBe(100);
      expect(result?.overallSuccessRate).toBe(100);
    });

    it('returns null when 0 attempts', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createZeroAttemptsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByPlayType(2024);

      expect(result).toBeNull();
    });

    it('defines success as ppa > 0', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByPlayTypeRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSuccessRateByPlayType(2024);

      expect(capturedQueries[0]).toContain('ppa > 0');
    });

    it('throws error for invalid season', async () => {
      await expect(getSuccessRateByPlayType(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getSuccessRateByDown
  // ==========================================================================
  describe('getSuccessRateByDown', () => {
    it('returns success rates for each down', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByDownRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDown(2024);

      expect(result).toEqual({
        season: 2024,
        down1: 52.1,
        down2: 48.7,
        down3: 41.2,
        down4: 55.0,
      });
    });

    it('handles varying success rates by down', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [
          createSuccessRateByDownRow({
            down1: 60.0,
            down2: 45.0,
            down3: 30.0,
            down4: 70.0,
          }),
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDown(2024);

      expect(result?.down1).toBe(60.0);
      expect(result?.down3).toBe(30.0);
      expect(result?.down4).toBe(70.0);
    });

    it('returns null when no data', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDown(2025);

      expect(result).toBeNull();
    });

    it('filters by down IS NOT NULL', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByDownRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSuccessRateByDown(2024);

      expect(capturedQueries[0]).toContain('down IS NOT NULL');
    });

    it('throws error for invalid season', async () => {
      await expect(getSuccessRateByDown(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getSuccessRateByDistance
  // ==========================================================================
  describe('getSuccessRateByDistance', () => {
    it('returns success rates by distance category', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByDistanceRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDistance(2024);

      expect(result).toEqual({
        season: 2024,
        short: 68.5,
        medium: 52.3,
        long: 38.1,
      });
    });

    it('handles high short-distance success', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [
          createSuccessRateByDistanceRow({
            short: 85.0,
            medium: 55.0,
            long: 25.0,
          }),
        ],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDistance(2024);

      expect(result?.short).toBe(85.0);
      expect(result?.long).toBe(25.0);
    });

    it('uses correct distance buckets (1-3, 4-6, 7+)', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSuccessRateByDistanceRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSuccessRateByDistance(2024);

      expect(capturedQueries[0]).toContain('BETWEEN 1 AND 3');
      expect(capturedQueries[0]).toContain('BETWEEN 4 AND 6');
      expect(capturedQueries[0]).toContain('distance >= 7');
    });

    it('returns null when no data', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSuccessRateByDistance(2025);

      expect(result).toBeNull();
    });

    it('throws error for invalid season', async () => {
      await expect(getSuccessRateByDistance(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getSituationalSuccessRate
  // ==========================================================================
  describe('getSituationalSuccessRate', () => {
    it('returns situational success rates', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSituationalSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSituationalSuccessRate(2024);

      expect(result).toEqual({
        season: 2024,
        earlyDownRate: 50.5,
        lateDownRate: 42.3,
        redZoneRate: 55.8,
        earlyDownAttempts: 550,
        lateDownAttempts: 300,
        redZoneAttempts: 120,
      });
    });

    it('defines early downs as 1st + 2nd', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSituationalSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSituationalSuccessRate(2024);

      expect(capturedQueries[0]).toContain('down IN (1, 2)');
    });

    it('defines late downs as 3rd + 4th', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSituationalSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSituationalSuccessRate(2024);

      expect(capturedQueries[0]).toContain('down IN (3, 4)');
    });

    it('defines red zone as start_yards_to_goal <= 20', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSituationalSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSituationalSuccessRate(2024);

      expect(capturedQueries[0]).toContain('start_yards_to_goal <= 20');
    });

    it('joins with drives table for red zone calculation', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createSituationalSuccessRateRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getSituationalSuccessRate(2024);

      expect(capturedQueries[0]).toContain('JOIN drives d');
    });

    it('returns null when no data', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getSituationalSuccessRate(2025);

      expect(result).toBeNull();
    });

    it('throws error for invalid season', async () => {
      await expect(getSituationalSuccessRate(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getExplosivePlays
  // ==========================================================================
  describe('getExplosivePlays', () => {
    it('returns explosive play metrics for offense', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlays(2024);

      expect(result).toEqual({
        season: 2024,
        count: 65,
        rate: 7.6,
        byRush: 20,
        byPass: 45,
        totalPlays: 850,
      });
    });

    it('uses 20+ yards threshold for explosive plays', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getExplosivePlays(2024);

      expect(capturedQueries[0]).toContain('yards_gained >= 20');
    });

    it('handles no explosive plays', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createNoExplosivePlaysRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlays(2024);

      expect(result?.count).toBe(0);
      expect(result?.rate).toBe(0);
      expect(result?.byRush).toBe(0);
      expect(result?.byPass).toBe(0);
    });

    it('handles high explosiveness', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createHighExplosivePlaysRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlays(2024);

      expect(result?.count).toBe(120);
      expect(result?.rate).toBe(15.0);
    });

    it('returns null when no total plays', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [[2024, 0, 0, 0, 0, 0]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlays(2024);

      expect(result).toBeNull();
    });

    it('filters for OU on offense', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getExplosivePlays(2024);

      expect(capturedQueries[0]).toContain("offense = 'Oklahoma'");
    });

    it('throws error for invalid season', async () => {
      await expect(getExplosivePlays(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getExplosivePlaysAllowed
  // ==========================================================================
  describe('getExplosivePlaysAllowed', () => {
    it('returns explosive plays allowed by defense', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow({ count: 40, rate: 5.2 })],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlaysAllowed(2024);

      expect(result?.count).toBe(40);
      expect(result?.rate).toBe(5.2);
    });

    it('uses 20+ yards threshold', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getExplosivePlaysAllowed(2024);

      expect(capturedQueries[0]).toContain('yards_gained >= 20');
    });

    it('filters for OU on defense', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [createExplosivePlayMetricsRow()],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getExplosivePlaysAllowed(2024);

      expect(capturedQueries[0]).toContain("defense = 'Oklahoma'");
    });

    it('returns null when no total plays', async () => {
      const mockConnection = createMockConnection({
        'from plays p': [[2024, 0, 0, 0, 0, 0]],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getExplosivePlaysAllowed(2024);

      expect(result).toBeNull();
    });

    it('throws error for invalid season', async () => {
      await expect(getExplosivePlaysAllowed(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });

  // ==========================================================================
  // getTopPlays
  // ==========================================================================
  describe('getTopPlays', () => {
    it('returns top plays by yards gained', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getTopPlays(2024);

      expect(result).toHaveLength(5);
      expect(result[0].yardsGained).toBe(75);
      expect(result[0].playType).toBe('Pass Reception');
    });

    it('orders by yards descending', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024);

      expect(capturedQueries[0]).toContain('ORDER BY p.yards_gained DESC');
    });

    it('respects limit parameter', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024, 5);

      expect(capturedQueries[0]).toContain('LIMIT 5');
    });

    it('uses default limit of 10', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024);

      expect(capturedQueries[0]).toContain('LIMIT 10');
    });

    it('caps limit at 50', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024, 100);

      expect(capturedQueries[0]).toContain('LIMIT 50');
    });

    it('enforces minimum limit of 1', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024, 0);

      expect(capturedQueries[0]).toContain('LIMIT 1');
    });

    it('filters to explosive plays (20+ yards)', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      await getTopPlays(2024);

      expect(capturedQueries[0]).toContain('yards_gained >= 20');
    });

    it('returns empty array when no plays found', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': [],
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getTopPlays(2025);

      expect(result).toEqual([]);
    });

    it('maps opponent correctly', async () => {
      const mockConnection = createMockConnection({
        'order by p.yards_gained desc': createTopPlayRows(),
      });
      vi.mocked(getDuckDB).mockResolvedValue(createMockDB(mockConnection));

      const result = await getTopPlays(2024);

      expect(result[0].opponent).toBe('Houston');
    });

    it('throws error for invalid season', async () => {
      await expect(getTopPlays(NaN)).rejects.toThrow('Invalid season parameter');
    });
  });
});
