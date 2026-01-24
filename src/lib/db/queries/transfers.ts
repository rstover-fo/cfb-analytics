/**
 * Transfer Portal queries for CFB Analytics
 *
 * Queries for transfer portal data including departures, arrivals, and impact analysis.
 * Portal data available from 2021 onward.
 * All queries are Oklahoma-focused with the hardcoded TEAM constant.
 */

import { getDuckDB } from '../duckdb';
import { logger } from '@/lib/logger';

const TEAM = 'Oklahoma';
const PORTAL_START_YEAR = 2021;

// ============================================================================
// Result interfaces
// ============================================================================

export interface PortalDeparture {
  id: number;
  season: number;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
  destination: string | null;
  transferDate: string | null;
  rating: number | null;
  stars: number | null;
  eligibility: string | null;
}

export interface PortalArrival {
  id: number;
  season: number;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
  origin: string;
  transferDate: string | null;
  rating: number | null;
  stars: number | null;
  eligibility: string | null;
}

export interface PortalImpact {
  season: number;
  departureCount: number;
  arrivalCount: number;
  netChange: number;
  departureRatingSum: number;
  arrivalRatingSum: number;
  netRatingChange: number;
  positionsLost: PositionCount[];
  positionsGained: PositionCount[];
}

export interface PositionCount {
  position: string;
  count: number;
}

export interface PortalSummary {
  season: number;
  departures: number;
  arrivals: number;
  netChange: number;
  avgDepartureRating: number | null;
  avgArrivalRating: number | null;
}

// ============================================================================
// Query functions
// ============================================================================

/**
 * Get portal departures for Oklahoma for a given year
 */
export async function getPortalDepartures(year: number): Promise<PortalDeparture[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');
  if (validYear < PORTAL_START_YEAR) {
    return []; // Portal data not available before 2021
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        season,
        first_name,
        last_name,
        position,
        destination,
        transfer_date,
        rating,
        stars,
        eligibility
      FROM transfers
      WHERE season = ${validYear} AND origin = '${TEAM}'
      ORDER BY rating DESC NULLS LAST, last_name ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: Number(row[0]),
      season: Number(row[1]),
      firstName: String(row[2] || ''),
      lastName: String(row[3] || ''),
      fullName: `${row[2] || ''} ${row[3] || ''}`.trim(),
      position: row[4] ? String(row[4]) : null,
      destination: row[5] ? String(row[5]) : null,
      transferDate: row[6] ? String(row[6]) : null,
      rating: row[7] ? Number(row[7]) : null,
      stars: row[8] ? Number(row[8]) : null,
      eligibility: row[9] ? String(row[9]) : null,
    }));
  } catch (error) {
    logger.queryError('getPortalDepartures', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get portal arrivals for Oklahoma for a given year
 */
export async function getPortalArrivals(year: number): Promise<PortalArrival[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');
  if (validYear < PORTAL_START_YEAR) {
    return []; // Portal data not available before 2021
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        id,
        season,
        first_name,
        last_name,
        position,
        origin,
        transfer_date,
        rating,
        stars,
        eligibility
      FROM transfers
      WHERE season = ${validYear} AND destination = '${TEAM}'
      ORDER BY rating DESC NULLS LAST, last_name ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: Number(row[0]),
      season: Number(row[1]),
      firstName: String(row[2] || ''),
      lastName: String(row[3] || ''),
      fullName: `${row[2] || ''} ${row[3] || ''}`.trim(),
      position: row[4] ? String(row[4]) : null,
      origin: String(row[5]),
      transferDate: row[6] ? String(row[6]) : null,
      rating: row[7] ? Number(row[7]) : null,
      stars: row[8] ? Number(row[8]) : null,
      eligibility: row[9] ? String(row[9]) : null,
    }));
  } catch (error) {
    logger.queryError('getPortalArrivals', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get portal impact summary for Oklahoma for a given year
 */
export async function getPortalImpact(year: number): Promise<PortalImpact | null> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');
  if (validYear < PORTAL_START_YEAR) {
    return null; // Portal data not available before 2021
  }

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Get departure stats
    const departureResult = await connection.run(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(rating), 0) as rating_sum
      FROM transfers
      WHERE season = ${validYear} AND origin = '${TEAM}'
    `);

    const departureRows = await departureResult.getRows();
    const departureData = departureRows[0];
    const departureCount = Number(departureData?.[0] || 0);
    const departureRatingSum = Number(departureData?.[1] || 0);

    // Get arrival stats
    const arrivalResult = await connection.run(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(rating), 0) as rating_sum
      FROM transfers
      WHERE season = ${validYear} AND destination = '${TEAM}'
    `);

    const arrivalRows = await arrivalResult.getRows();
    const arrivalData = arrivalRows[0];
    const arrivalCount = Number(arrivalData?.[0] || 0);
    const arrivalRatingSum = Number(arrivalData?.[1] || 0);

    // Get positions lost
    const posLostResult = await connection.run(`
      SELECT position, COUNT(*) as count
      FROM transfers
      WHERE season = ${validYear} AND origin = '${TEAM}' AND position IS NOT NULL
      GROUP BY position
      ORDER BY count DESC
    `);

    const posLostRows = await posLostResult.getRows();
    const positionsLost: PositionCount[] = posLostRows.map((row) => ({
      position: String(row[0]),
      count: Number(row[1]),
    }));

    // Get positions gained
    const posGainedResult = await connection.run(`
      SELECT position, COUNT(*) as count
      FROM transfers
      WHERE season = ${validYear} AND destination = '${TEAM}' AND position IS NOT NULL
      GROUP BY position
      ORDER BY count DESC
    `);

    const posGainedRows = await posGainedResult.getRows();
    const positionsGained: PositionCount[] = posGainedRows.map((row) => ({
      position: String(row[0]),
      count: Number(row[1]),
    }));

    return {
      season: validYear,
      departureCount,
      arrivalCount,
      netChange: arrivalCount - departureCount,
      departureRatingSum,
      arrivalRatingSum,
      netRatingChange: arrivalRatingSum - departureRatingSum,
      positionsLost,
      positionsGained,
    };
  } catch (error) {
    logger.queryError('getPortalImpact', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get portal summary history for Oklahoma
 */
export async function getPortalHistory(
  startYear: number = PORTAL_START_YEAR,
  endYear: number = 2025
): Promise<PortalSummary[]> {
  const validStart = Math.max(parseInt(String(startYear), 10), PORTAL_START_YEAR);
  const validEnd = parseInt(String(endYear), 10);
  if (isNaN(validStart) || isNaN(validEnd)) throw new Error('Invalid year range');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      WITH departures AS (
        SELECT
          season,
          COUNT(*) as departure_count,
          AVG(rating) as avg_departure_rating
        FROM transfers
        WHERE origin = '${TEAM}' AND season >= ${validStart} AND season <= ${validEnd}
        GROUP BY season
      ),
      arrivals AS (
        SELECT
          season,
          COUNT(*) as arrival_count,
          AVG(rating) as avg_arrival_rating
        FROM transfers
        WHERE destination = '${TEAM}' AND season >= ${validStart} AND season <= ${validEnd}
        GROUP BY season
      )
      SELECT
        COALESCE(d.season, a.season) as season,
        COALESCE(d.departure_count, 0) as departures,
        COALESCE(a.arrival_count, 0) as arrivals,
        COALESCE(a.arrival_count, 0) - COALESCE(d.departure_count, 0) as net_change,
        d.avg_departure_rating,
        a.avg_arrival_rating
      FROM departures d
      FULL OUTER JOIN arrivals a ON d.season = a.season
      ORDER BY season ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      season: Number(row[0]),
      departures: Number(row[1]),
      arrivals: Number(row[2]),
      netChange: Number(row[3]),
      avgDepartureRating: row[4] ? Number(row[4]) : null,
      avgArrivalRating: row[5] ? Number(row[5]) : null,
    }));
  } catch (error) {
    logger.queryError('getPortalHistory', error as Error, {
      startYear: validStart,
      endYear: validEnd,
    });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get available portal years (2021+)
 */
export async function getAvailablePortalYears(): Promise<number[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT DISTINCT season
      FROM transfers
      WHERE origin = '${TEAM}' OR destination = '${TEAM}'
      ORDER BY season DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => Number(row[0]));
  } catch (error) {
    logger.queryError('getAvailablePortalYears', error as Error, {});
    throw error;
  } finally {
    connection.closeSync();
  }
}
