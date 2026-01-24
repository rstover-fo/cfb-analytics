/**
 * Recruiting queries for CFB Analytics
 *
 * Queries for recruiting class data, individual recruits, and position groups.
 * All queries are Oklahoma-focused with the hardcoded TEAM constant.
 */

import { getDuckDB } from '../duckdb';
import { logger } from '@/lib/logger';

const TEAM = 'Oklahoma';

// ============================================================================
// Result interfaces
// ============================================================================

export interface ClassSummary {
  year: number;
  totalCommits: number;
  avgRating: number;
  avgStars: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  nationalRank: number | null;
  conferenceRank: number | null;
  points: number | null;
}

export interface RecruitDetail {
  id: number;
  athleteId: number | null;
  recruitType: string | null;
  year: number;
  name: string;
  position: string | null;
  height: number | null;
  weight: number | null;
  school: string | null;
  stars: number;
  rating: number;
  ranking: number | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
}

export interface PositionBreakdown {
  positionGroup: string;
  commits: number;
  avgRating: number;
  avgStars: number;
  percentage: number;
}

export interface CommitTimelineEntry {
  id: number;
  name: string;
  position: string | null;
  stars: number;
  rating: number;
  city: string | null;
  stateProvince: string | null;
}

export interface ClassRankingHistory {
  year: number;
  nationalRank: number;
  points: number;
  conferenceRank: number | null;
}

export interface TopRecruit {
  id: number;
  year: number;
  name: string;
  position: string | null;
  stars: number;
  rating: number;
  ranking: number | null;
  city: string | null;
  stateProvince: string | null;
}

export interface PositionTrend {
  year: number;
  positionGroup: string;
  commits: number;
  avgRating: number;
}

export interface ConferencePeerComparison {
  team: string;
  rank: number;
  points: number;
  totalCommits: number | null;
  avgRating: number | null;
}

// ============================================================================
// Query functions
// ============================================================================

/**
 * Get recruiting class summary for a specific year
 */
export async function getClassSummary(year: number): Promise<ClassSummary | null> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Get recruit stats
    const recruitResult = await connection.run(`
      SELECT
        COUNT(*) as total_commits,
        COALESCE(AVG(rating), 0) as avg_rating,
        COALESCE(AVG(stars), 0) as avg_stars,
        SUM(CASE WHEN stars = 5 THEN 1 ELSE 0 END) as five_stars,
        SUM(CASE WHEN stars = 4 THEN 1 ELSE 0 END) as four_stars,
        SUM(CASE WHEN stars = 3 THEN 1 ELSE 0 END) as three_stars,
        SUM(CASE WHEN stars <= 2 THEN 1 ELSE 0 END) as two_stars
      FROM recruiting
      WHERE year = ${validYear} AND committed_to = '${TEAM}'
    `);

    const recruitRows = await recruitResult.getRows();
    const recruitData = recruitRows[0];

    if (!recruitData || Number(recruitData[0]) === 0) {
      return null;
    }

    // Get class ranking
    const rankResult = await connection.run(`
      SELECT rank, points
      FROM recruiting_classes
      WHERE year = ${validYear} AND team = '${TEAM}'
    `);

    const rankRows = await rankResult.getRows();
    const rankData = rankRows[0];

    // Get conference rank (count teams with higher points in same conference)
    // For simplicity, we'll calculate this from recruiting_classes
    let conferenceRank: number | null = null;
    try {
      const confRankResult = await connection.run(`
        WITH team_conf AS (
          SELECT DISTINCT conference FROM recruiting_position_groups
          WHERE year = ${validYear} AND team = '${TEAM}'
        )
        SELECT COUNT(*) + 1 as conf_rank
        FROM recruiting_classes rc
        JOIN recruiting_position_groups rpg ON rc.year = rpg.year AND rc.team = rpg.team
        WHERE rc.year = ${validYear}
          AND rpg.conference = (SELECT conference FROM team_conf LIMIT 1)
          AND rc.points > (
            SELECT points FROM recruiting_classes
            WHERE year = ${validYear} AND team = '${TEAM}'
          )
      `);
      const confRankRows = await confRankResult.getRows();
      if (confRankRows[0]) {
        conferenceRank = Number(confRankRows[0][0]);
      }
    } catch {
      // Conference rank calculation failed, leave as null
    }

    return {
      year: validYear,
      totalCommits: Number(recruitData[0]),
      avgRating: Number(recruitData[1]),
      avgStars: Number(recruitData[2]),
      fiveStars: Number(recruitData[3]),
      fourStars: Number(recruitData[4]),
      threeStars: Number(recruitData[5]),
      twoStars: Number(recruitData[6]),
      nationalRank: rankData ? Number(rankData[0]) : null,
      conferenceRank,
      points: rankData ? Number(rankData[1]) : null,
    };
  } catch (error) {
    logger.queryError('getClassSummary', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get position breakdown for a recruiting class
 */
export async function getPositionBreakdown(year: number): Promise<PositionBreakdown[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      WITH total AS (
        SELECT COUNT(*) as cnt FROM recruiting
        WHERE year = ${validYear} AND committed_to = '${TEAM}'
      )
      SELECT
        position as position_group,
        COUNT(*) as commits,
        AVG(rating) as avg_rating,
        AVG(stars) as avg_stars,
        ROUND(100.0 * COUNT(*) / NULLIF((SELECT cnt FROM total), 0), 1) as percentage
      FROM recruiting
      WHERE year = ${validYear} AND committed_to = '${TEAM}'
      GROUP BY position
      ORDER BY commits DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      positionGroup: String(row[0] || 'Unknown'),
      commits: Number(row[1]),
      avgRating: Number(row[2]),
      avgStars: Number(row[3]),
      percentage: Number(row[4]),
    }));
  } catch (error) {
    logger.queryError('getPositionBreakdown', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get commit timeline for a recruiting class (ordered by ranking as proxy for commit order)
 */
export async function getCommitTimeline(year: number): Promise<CommitTimelineEntry[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        recruit_id,
        name,
        position,
        stars,
        rating,
        city,
        state_province
      FROM recruiting
      WHERE year = ${validYear} AND committed_to = '${TEAM}'
      ORDER BY ranking ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: Number(row[0]),
      name: String(row[1]),
      position: row[2] ? String(row[2]) : null,
      stars: Number(row[3]),
      rating: Number(row[4]),
      city: row[5] ? String(row[5]) : null,
      stateProvince: row[6] ? String(row[6]) : null,
    }));
  } catch (error) {
    logger.queryError('getCommitTimeline', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get class ranking history for Oklahoma
 */
export async function getClassRankingHistory(
  startYear: number = 2014,
  endYear: number = 2025
): Promise<ClassRankingHistory[]> {
  const validStart = parseInt(String(startYear), 10);
  const validEnd = parseInt(String(endYear), 10);
  if (isNaN(validStart) || isNaN(validEnd)) throw new Error('Invalid year range');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        year,
        rank as national_rank,
        points
      FROM recruiting_classes
      WHERE team = '${TEAM}'
        AND year >= ${validStart}
        AND year <= ${validEnd}
      ORDER BY year ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      year: Number(row[0]),
      nationalRank: Number(row[1]),
      points: Number(row[2]),
      conferenceRank: null, // Would require additional query
    }));
  } catch (error) {
    logger.queryError('getClassRankingHistory', error as Error, {
      startYear: validStart,
      endYear: validEnd,
    });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get top recruits for a year
 */
export async function getTopRecruits(year: number, limit: number = 10): Promise<TopRecruit[]> {
  const validYear = parseInt(String(year), 10);
  const validLimit = parseInt(String(limit), 10);
  if (isNaN(validYear) || isNaN(validLimit)) throw new Error('Invalid parameters');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        recruit_id,
        year,
        name,
        position,
        stars,
        rating,
        ranking,
        city,
        state_province
      FROM recruiting
      WHERE year = ${validYear} AND committed_to = '${TEAM}'
      ORDER BY rating DESC
      LIMIT ${validLimit}
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: Number(row[0]),
      year: Number(row[1]),
      name: String(row[2]),
      position: row[3] ? String(row[3]) : null,
      stars: Number(row[4]),
      rating: Number(row[5]),
      ranking: row[6] ? Number(row[6]) : null,
      city: row[7] ? String(row[7]) : null,
      stateProvince: row[8] ? String(row[8]) : null,
    }));
  } catch (error) {
    logger.queryError('getTopRecruits', error as Error, { year: validYear, limit: validLimit });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get position group trends over time
 */
export async function getPositionTrends(
  startYear: number = 2014,
  endYear: number = 2025
): Promise<PositionTrend[]> {
  const validStart = parseInt(String(startYear), 10);
  const validEnd = parseInt(String(endYear), 10);
  if (isNaN(validStart) || isNaN(validEnd)) throw new Error('Invalid year range');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        year,
        position as position_group,
        COUNT(*) as commits,
        AVG(rating) as avg_rating
      FROM recruiting
      WHERE committed_to = '${TEAM}'
        AND year >= ${validStart}
        AND year <= ${validEnd}
      GROUP BY year, position
      ORDER BY year ASC, commits DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      year: Number(row[0]),
      positionGroup: String(row[1] || 'Unknown'),
      commits: Number(row[2]),
      avgRating: Number(row[3]),
    }));
  } catch (error) {
    logger.queryError('getPositionTrends', error as Error, {
      startYear: validStart,
      endYear: validEnd,
    });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get conference peer comparison for a year
 * Compares Oklahoma to SEC peers (or Big 12 pre-2024)
 */
export async function getConferencePeerComparison(
  year: number,
  peers: string[] = ['Texas', 'Georgia', 'Alabama', 'LSU', 'Texas A&M']
): Promise<ConferencePeerComparison[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  // Validate peer teams (alphanumeric and spaces only)
  const validPeers = peers.filter((p) => typeof p === 'string' && /^[a-zA-Z0-9\s&]+$/.test(p));

  // Always include Oklahoma
  const allTeams = ['Oklahoma', ...validPeers];
  const teamList = allTeams.map((t) => `'${t}'`).join(', ');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        rc.team,
        rc.rank,
        rc.points,
        r.total_commits,
        r.avg_rating
      FROM recruiting_classes rc
      LEFT JOIN (
        SELECT
          committed_to,
          COUNT(*) as total_commits,
          AVG(rating) as avg_rating
        FROM recruiting
        WHERE year = ${validYear}
        GROUP BY committed_to
      ) r ON rc.team = r.committed_to
      WHERE rc.year = ${validYear}
        AND rc.team IN (${teamList})
      ORDER BY rc.rank ASC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      team: String(row[0]),
      rank: Number(row[1]),
      points: Number(row[2]),
      totalCommits: row[3] ? Number(row[3]) : null,
      avgRating: row[4] ? Number(row[4]) : null,
    }));
  } catch (error) {
    logger.queryError('getConferencePeerComparison', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get all recruits for a year (unfiltered except for team)
 */
export async function getRecruitsByYear(year: number): Promise<RecruitDetail[]> {
  const validYear = parseInt(String(year), 10);
  if (isNaN(validYear)) throw new Error('Invalid year');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT
        recruit_id,
        athlete_id,
        recruit_type,
        year,
        name,
        position,
        height,
        weight,
        school,
        stars,
        rating,
        ranking,
        city,
        state_province,
        country
      FROM recruiting
      WHERE year = ${validYear} AND committed_to = '${TEAM}'
      ORDER BY rating DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => ({
      id: Number(row[0]),
      athleteId: row[1] ? Number(row[1]) : null,
      recruitType: row[2] ? String(row[2]) : null,
      year: Number(row[3]),
      name: String(row[4]),
      position: row[5] ? String(row[5]) : null,
      height: row[6] ? Number(row[6]) : null,
      weight: row[7] ? Number(row[7]) : null,
      school: row[8] ? String(row[8]) : null,
      stars: Number(row[9]),
      rating: Number(row[10]),
      ranking: row[11] ? Number(row[11]) : null,
      city: row[12] ? String(row[12]) : null,
      stateProvince: row[13] ? String(row[13]) : null,
      country: row[14] ? String(row[14]) : null,
    }));
  } catch (error) {
    logger.queryError('getRecruitsByYear', error as Error, { year: validYear });
    throw error;
  } finally {
    connection.closeSync();
  }
}

/**
 * Get available recruiting class years for Oklahoma
 */
export async function getAvailableRecruitingYears(): Promise<number[]> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    const result = await connection.run(`
      SELECT DISTINCT year
      FROM recruiting
      WHERE committed_to = '${TEAM}'
      ORDER BY year DESC
    `);

    const rows = await result.getRows();
    return rows.map((row) => Number(row[0]));
  } catch (error) {
    logger.queryError('getAvailableRecruitingYears', error as Error, {});
    throw error;
  } finally {
    connection.closeSync();
  }
}
