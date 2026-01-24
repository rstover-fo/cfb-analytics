/**
 * Recruiting Data Ingestion Script
 * Run with: npx tsx scripts/ingest-recruiting.ts
 *
 * Loads Oklahoma recruiting data from CFBD API into DuckDB.
 * Includes: recruits, team rankings, and position groups for 2014-2025.
 *
 * Rate limiting: 100ms between requests, max 100 calls per script run.
 */

import { getCFBDClient } from '../src/lib/cfbd/client';
import { getDuckDB, initDuckDBSchema, closeDuckDB } from '../src/lib/db/duckdb';

const TEAM = 'Oklahoma';
const START_YEAR = 2014;
const END_YEAR = 2025;
const MAX_CALLS_PER_RUN = 100;

interface IngestStats {
  recruitsInserted: number;
  classesInserted: number;
  positionGroupsInserted: number;
  apiCalls: number;
  errors: string[];
}

const stats: IngestStats = {
  recruitsInserted: 0,
  classesInserted: 0,
  positionGroupsInserted: 0,
  apiCalls: 0,
  errors: [],
};

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function clearExistingData() {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    log('Clearing existing recruiting data...');
    await connection.run(`DELETE FROM recruiting WHERE committed_to = '${TEAM}'`);
    await connection.run(`DELETE FROM recruiting_classes WHERE team = '${TEAM}'`);
    await connection.run(`DELETE FROM recruiting_position_groups WHERE team = '${TEAM}'`);
    log('Existing data cleared.');
  } finally {
    connection.closeSync();
  }
}

async function ingestRecruits() {
  const client = getCFBDClient();
  const db = await getDuckDB();

  log('Ingesting recruits...');

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    if (stats.apiCalls >= MAX_CALLS_PER_RUN) {
      log(`Rate limit reached (${MAX_CALLS_PER_RUN} calls). Stopping.`);
      break;
    }

    try {
      const recruits = await client.getTeamRecruits(TEAM, year);
      stats.apiCalls++;

      if (recruits.length === 0) {
        log(`  ${year}: No recruits found`);
        continue;
      }

      const connection = await db.connect();
      try {
        for (const recruit of recruits) {
          // API returns camelCase, cast to any to access actual fields
          const r = recruit as unknown as {
            id: number;
            athleteId?: number;
            recruitType?: string;
            year: number;
            name: string;
            position?: string;
            height?: number;
            weight?: number;
            school?: string;
            committedTo?: string;
            stars: number;
            rating: number;
            ranking?: number;
            city?: string;
            stateProvince?: string;
            country?: string;
          };
          await connection.run(`
            INSERT INTO recruiting (
              recruit_id, athlete_id, recruit_type, year, name, position,
              height, weight, school, committed_to, stars, rating, ranking,
              city, state_province, country
            ) VALUES (
              ${r.id},
              ${r.athleteId || 'NULL'},
              ${r.recruitType ? `'${r.recruitType.replace(/'/g, "''")}'` : 'NULL'},
              ${r.year},
              '${r.name.replace(/'/g, "''")}',
              ${r.position ? `'${r.position.replace(/'/g, "''")}'` : 'NULL'},
              ${r.height || 'NULL'},
              ${r.weight || 'NULL'},
              ${r.school ? `'${r.school.replace(/'/g, "''")}'` : 'NULL'},
              ${r.committedTo ? `'${r.committedTo.replace(/'/g, "''")}'` : 'NULL'},
              ${r.stars},
              ${r.rating},
              ${r.ranking || 'NULL'},
              ${r.city ? `'${r.city.replace(/'/g, "''")}'` : 'NULL'},
              ${r.stateProvince ? `'${r.stateProvince.replace(/'/g, "''")}'` : 'NULL'},
              ${r.country ? `'${r.country.replace(/'/g, "''")}'` : 'NULL'}
            )
            ON CONFLICT (recruit_id) DO UPDATE SET
              athlete_id = EXCLUDED.athlete_id,
              recruit_type = EXCLUDED.recruit_type,
              name = EXCLUDED.name,
              position = EXCLUDED.position,
              height = EXCLUDED.height,
              weight = EXCLUDED.weight,
              school = EXCLUDED.school,
              committed_to = EXCLUDED.committed_to,
              stars = EXCLUDED.stars,
              rating = EXCLUDED.rating,
              ranking = EXCLUDED.ranking,
              city = EXCLUDED.city,
              state_province = EXCLUDED.state_province,
              country = EXCLUDED.country
          `);
          stats.recruitsInserted++;
        }
      } finally {
        connection.closeSync();
      }

      log(`  ${year}: ${recruits.length} recruits`);
    } catch (error) {
      const msg = `Error ingesting recruits for ${year}: ${error instanceof Error ? error.message : 'Unknown'}`;
      log(`  ${msg}`);
      stats.errors.push(msg);
    }
  }
}

async function ingestTeamRankings() {
  const client = getCFBDClient();
  const db = await getDuckDB();

  log('Ingesting team recruiting rankings...');

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    if (stats.apiCalls >= MAX_CALLS_PER_RUN) {
      log(`Rate limit reached (${MAX_CALLS_PER_RUN} calls). Stopping.`);
      break;
    }

    try {
      const rankings = await client.getTeamRankings({ year });
      stats.apiCalls++;

      // Find Oklahoma's ranking
      const ouRanking = rankings.find(
        (r) => r.team.toLowerCase() === TEAM.toLowerCase()
      );

      if (!ouRanking) {
        log(`  ${year}: No ranking found for ${TEAM}`);
        continue;
      }

      const connection = await db.connect();
      try {
        await connection.run(`
          INSERT INTO recruiting_classes (id, year, team, rank, points)
          VALUES (
            ${year * 1000}, -- Generate unique ID from year
            ${ouRanking.year},
            '${ouRanking.team.replace(/'/g, "''")}',
            ${ouRanking.rank},
            ${ouRanking.points}
          )
          ON CONFLICT (year, team) DO UPDATE SET
            rank = EXCLUDED.rank,
            points = EXCLUDED.points
        `);
        stats.classesInserted++;
      } finally {
        connection.closeSync();
      }

      log(`  ${year}: Rank #${ouRanking.rank} (${ouRanking.points.toFixed(1)} points)`);
    } catch (error) {
      const msg = `Error ingesting rankings for ${year}: ${error instanceof Error ? error.message : 'Unknown'}`;
      log(`  ${msg}`);
      stats.errors.push(msg);
    }
  }
}

async function ingestPositionGroups() {
  const client = getCFBDClient();
  const db = await getDuckDB();

  log('Ingesting position group rankings...');

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    if (stats.apiCalls >= MAX_CALLS_PER_RUN) {
      log(`Rate limit reached (${MAX_CALLS_PER_RUN} calls). Stopping.`);
      break;
    }

    try {
      const groups = await client.getPositionGroups({ year, team: TEAM });
      stats.apiCalls++;

      if (groups.length === 0) {
        log(`  ${year}: No position groups found`);
        continue;
      }

      const connection = await db.connect();
      try {
        for (const group of groups) {
          await connection.run(`
            INSERT INTO recruiting_position_groups (
              id, year, team, conference, position_group,
              avg_rating, total_rating, commits, avg_stars
            ) VALUES (
              ${year * 100000 + Math.abs(group.positionGroup.charCodeAt(0) * 1000)}, -- Generate unique ID
              ${year},
              '${group.team.replace(/'/g, "''")}',
              ${group.conference ? `'${group.conference.replace(/'/g, "''")}'` : 'NULL'},
              '${group.positionGroup.replace(/'/g, "''")}',
              ${group.averageRating},
              ${group.totalRating},
              ${group.commits},
              ${group.averageStars}
            )
            ON CONFLICT (year, team, position_group) DO UPDATE SET
              conference = EXCLUDED.conference,
              avg_rating = EXCLUDED.avg_rating,
              total_rating = EXCLUDED.total_rating,
              commits = EXCLUDED.commits,
              avg_stars = EXCLUDED.avg_stars
          `);
          stats.positionGroupsInserted++;
        }
      } finally {
        connection.closeSync();
      }

      log(`  ${year}: ${groups.length} position groups`);
    } catch (error) {
      const msg = `Error ingesting position groups for ${year}: ${error instanceof Error ? error.message : 'Unknown'}`;
      log(`  ${msg}`);
      stats.errors.push(msg);
    }
  }
}

async function validateData() {
  const db = await getDuckDB();
  const connection = await db.connect();

  log('\nValidating data...');

  try {
    // Check recruit count for 2024
    const recruitResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting
      WHERE committed_to = '${TEAM}' AND year = 2024
    `);
    const recruitRows = await recruitResult.getRows();
    const recruit2024Count = Number(recruitRows[0]?.[0] || 0);

    if (recruit2024Count > 0) {
      log(`  PASS: 2024 recruits count = ${recruit2024Count}`);
    } else {
      log(`  FAIL: No 2024 recruits found`);
    }

    // Check total recruit count
    const totalResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting WHERE committed_to = '${TEAM}'
    `);
    const totalRows = await totalResult.getRows();
    const totalCount = Number(totalRows[0]?.[0] || 0);
    log(`  Total recruits loaded: ${totalCount}`);

    // Check class rankings
    const classResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting_classes WHERE team = '${TEAM}'
    `);
    const classRows = await classResult.getRows();
    const classCount = Number(classRows[0]?.[0] || 0);
    log(`  Class rankings loaded: ${classCount}`);

    // Check position groups
    const pgResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting_position_groups WHERE team = '${TEAM}'
    `);
    const pgRows = await pgResult.getRows();
    const pgCount = Number(pgRows[0]?.[0] || 0);
    log(`  Position groups loaded: ${pgCount}`);
  } finally {
    connection.closeSync();
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Recruiting Data Ingestion Script                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTeam: ${TEAM}`);
  console.log(`Years: ${START_YEAR}-${END_YEAR}`);
  console.log(`Max API calls: ${MAX_CALLS_PER_RUN}\n`);

  const startTime = Date.now();

  // Initialize schema
  log('Initializing DuckDB schema...');
  await initDuckDBSchema();

  // Clear existing data
  await clearExistingData();

  // Ingest data
  await ingestRecruits();
  await ingestTeamRankings();
  await ingestPositionGroups();

  // Validate
  await validateData();

  // Summary
  const elapsed = Date.now() - startTime;
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Recruits inserted: ${stats.recruitsInserted}`);
  console.log(`Class rankings inserted: ${stats.classesInserted}`);
  console.log(`Position groups inserted: ${stats.positionGroupsInserted}`);
  console.log(`API calls made: ${stats.apiCalls}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Execution time: ${elapsed}ms`);

  if (stats.errors.length > 0) {
    console.log('\nErrors encountered:');
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (stats.recruitsInserted === 0) {
    console.log('\n❌ INGESTION FAILED - No data loaded');
    process.exit(1);
  } else {
    console.log('\n✅ INGESTION COMPLETE');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    closeDuckDB();
  });
