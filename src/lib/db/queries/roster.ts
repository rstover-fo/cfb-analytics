/**
 * Roster queries for CFB Analytics
 *
 * Queries for roster analysis including position groups, experience breakdown, and scholarship tracking.
 * All queries are Oklahoma-focused with the hardcoded TEAM constant.
 */

import { getDuckDB } from '../duckdb';
import { logger } from '@/lib/logger';

const TEAM = 'Oklahoma';
const FBS_SCHOLARSHIP_LIMIT = 85;

// ============================================================================
// Result interfaces
// ============================================================================

export interface RosterPlayer {
  id: number;
  athleteId: number | null;
  season: number;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
  jersey: number | null;
  height: number | null;
  weight: number | null;
  classYear: number | null;
  classYearLabel: string;
  hometownCity: string | null;
  hometownState: string | null;
  hometownCountry: string | null;
}

export interface PositionRosterGroup {
  position: string;
  count: number;
  players: RosterPlayer[];
}

export interface ExperienceBreakdown {
  classYear: number;
  label: string;
  count: number;
  percentage: number;
}

export interface ScholarshipCount {
  totalPlayers: number;
  scholarshipLimit: number;
  utilizationPercentage: number;
  spotsRemaining: number;
  note: string;
}

export interface RosterSummary {
  season: number;
  totalPlayers: number;
  byPosition: { position: string; count: number }[];
  byClassYear: { classYear: string; count: number }[];
  avgHeight: number | null;
  avgWeight: number | null;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Convert numeric class year to label
 */
function getClassYearLabel(classYear: number | null): string {
  if (classYear === null) return 'Unknown';
  switch (classYear) {
    case 1:
      return 'FR';
    case 2:
      return 'SO';
    case 3:
      return 'JR';
    case 4:
      return 'SR';
    case 5:
      return 'GR';
    default:
      return classYear > 5 ? 'GR' : 'Unknown';
  }
}

// ============================================================================
// Query functions
// ============================================================================

/**
 * Get roster by position for a given year
 */
export async function getRosterByPosition(year: number): Promise<PositionRosterGroup[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        athlete_id,
        season,
        first_name,
        last_name,
        position,
        jersey,
        height,
        weight,
        class_year,
        hometown_city,
        hometown_state,
        hometown_country
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
      ORDER BY position ASC, last_name ASC
    `);

    const rows = await result.getRows();

    // Group by position
    const positionMap = new Map<string, RosterPlayer[]>();

    for (const row of rows) {
      const position = row[5] ? String(row[5]) : 'Unknown';
      const classYear = row[9] ? Number(row[9]) : null;

      const player: RosterPlayer = {
        id: Number(row[0]),
        athleteId: row[1] ? Number(row[1]) : null,
        season: Number(row[2]),
        firstName: String(row[3] || ''),
        lastName: String(row[4] || ''),
        fullName: `${row[3] || ''} ${row[4] || ''}`.trim(),
        position: row[5] ? String(row[5]) : null,
        jersey: row[6] ? Number(row[6]) : null,
        height: row[7] ? Number(row[7]) : null,
        weight: row[8] ? Number(row[8]) : null,
        classYear,
        classYearLabel: getClassYearLabel(classYear),
        hometownCity: row[10] ? String(row[10]) : null,
        hometownState: row[11] ? String(row[11]) : null,
        hometownCountry: row[12] ? String(row[12]) : null,
      };

      if (!positionMap.has(position)) {
        positionMap.set(position, []);
      }
      positionMap.get(position)!.push(player);
    }

    // Convert to array and sort by count
    const groups: PositionRosterGroup[] = Array.from(positionMap.entries())
      .map(([position, players]) => ({
        position,
        count: players.length,
        players,
      }))
      .sort((a, b) => b.count - a.count);

    return groups;
  } catch (error) {
    logger.queryError('getRosterByPosition', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get experience breakdown (class year distribution) for a given year
 */
export async function getExperienceBreakdown(year: number): Promise<ExperienceBreakdown[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      WITH total AS (
        SELECT COUNT(*) as cnt FROM roster
        WHERE season = ${validYear} AND team = '${TEAM}'
      )
      SELECT
        class_year,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / NULLIF((SELECT cnt FROM total), 0), 1) as percentage
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
      GROUP BY class_year
      ORDER BY class_year ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => {
      const classYear = row[0] ? Number(row[0]) : 0;
      return {
        classYear,
        label: getClassYearLabel(classYear),
        count: Number(row[1]),
        percentage: Number(row[2]),
      };
    });
  } catch (error) {
    logger.queryError('getExperienceBreakdown', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get scholarship count/utilization
 * Note: CFBD doesn't distinguish scholarship vs walk-on, so this shows total roster count
 */
export async function getScholarshipCount(year: number): Promise<ScholarshipCount | null> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT COUNT(*) as total
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
    `);

    const rows = await result.getRows();
    const totalPlayers = Number(rows[0]?.[0] || 0);

    if (totalPlayers === 0) {
      return null;
    }

    // Estimate: typical FBS roster is 85 scholarship + 35-45 walk-ons
    // We use 85 as the scholarship limit for display
    const utilizationPercentage = Math.min(
      Math.round((totalPlayers / FBS_SCHOLARSHIP_LIMIT) * 100),
      100
    );

    return {
      totalPlayers,
      scholarshipLimit: FBS_SCHOLARSHIP_LIMIT,
      utilizationPercentage,
      spotsRemaining: Math.max(FBS_SCHOLARSHIP_LIMIT - totalPlayers, 0),
      note: 'CFBD does not distinguish scholarship vs walk-on players. Total roster shown.',
    };
  } catch (error) {
    logger.queryError('getScholarshipCount', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get roster summary statistics
 */
export async function getRosterSummary(year: number): Promise<RosterSummary | null> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Get total count and averages
    const summaryResult = await connection.run(`
      SELECT
        COUNT(*) as total,
        AVG(height) as avg_height,
        AVG(weight) as avg_weight
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
    `);

    const summaryRows = await summaryResult.getRows();
    const summaryData = summaryRows[0];
    const totalPlayers = Number(summaryData?.[0] || 0);

    if (totalPlayers === 0) {
      return null;
    }

    // Get position breakdown
    const positionResult = await connection.run(`
      SELECT position, COUNT(*) as count
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
      GROUP BY position
      ORDER BY count DESC
    `);

    const positionRows = await positionResult.getRows();
    const byPosition = positionRows.map((row) => ({
      position: String(row[0] || 'Unknown'),
      count: Number(row[1]),
    }));

    // Get class year breakdown
    const classResult = await connection.run(`
      SELECT class_year, COUNT(*) as count
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
      GROUP BY class_year
      ORDER BY class_year ASC
    `);

    const classRows = await classResult.getRows();
    const byClassYear = classRows.map((row) => ({
      classYear: getClassYearLabel(row[0] ? Number(row[0]) : null),
      count: Number(row[1]),
    }));

    return {
      season: validYear,
      totalPlayers,
      byPosition,
      byClassYear,
      avgHeight: summaryData?.[1] ? Number(summaryData[1]) : null,
      avgWeight: summaryData?.[2] ? Number(summaryData[2]) : null,
    };
  } catch (error) {
    logger.queryError('getRosterSummary', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get all roster players for a year (flat list)
 */
export async function getAllRosterPlayers(year: number): Promise<RosterPlayer[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        athlete_id,
        season,
        first_name,
        last_name,
        position,
        jersey,
        height,
        weight,
        class_year,
        hometown_city,
        hometown_state,
        hometown_country
      FROM roster
      WHERE season = ${validYear} AND team = '${TEAM}'
      ORDER BY last_name ASC, first_name ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => {
      const classYear = row[9] ? Number(row[9]) : null;
      return {
        id: Number(row[0]),
        athleteId: row[1] ? Number(row[1]) : null,
        season: Number(row[2]),
        firstName: String(row[3] || ''),
        lastName: String(row[4] || ''),
        fullName: `${row[3] || ''} ${row[4] || ''}`.trim(),
        position: row[5] ? String(row[5]) : null,
        jersey: row[6] ? Number(row[6]) : null,
        height: row[7] ? Number(row[7]) : null,
        weight: row[8] ? Number(row[8]) : null,
        classYear,
        classYearLabel: getClassYearLabel(classYear),
        hometownCity: row[10] ? String(row[10]) : null,
        hometownState: row[11] ? String(row[11]) : null,
        hometownCountry: row[12] ? String(row[12]) : null,
      };
    });
  } catch (error) {
    logger.queryError('getAllRosterPlayers', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get available roster years
 */
export async function getAvailableRosterYears(): Promise<number[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT DISTINCT season
      FROM roster
      WHERE team = '${TEAM}'
      ORDER BY season DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => Number(row[0]));
  } catch (error) {
    logger.queryError('getAvailableRosterYears', error as Error, {});
    throw error;
  } finally {
    connection.closeSync();
  }
}
