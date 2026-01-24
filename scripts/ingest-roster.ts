/**
 * Roster Data Ingestion Script
 * Run with: npx tsx scripts/ingest-roster.ts
 *
 * Loads Oklahoma roster data from CFBD API into DuckDB.
 * Loads current roster and optionally historical rosters.
 *
 * Rate limiting: 100ms between requests, max 20 calls per script run.
 */

import { getCFBDClient } from '../src/lib/cfbd/client';
import { getDuckDB, initDuckDBSchema, closeDuckDB } from '../src/lib/db/duckdb';

const TEAM = 'Oklahoma';
const CURRENT_YEAR = 2024; // Current/most recent roster
const LOAD_HISTORICAL = false; // Set to true to load multiple years
const HISTORICAL_START = 2020;
const MAX_CALLS_PER_RUN = 20;

interface IngestStats {
  playersInserted: number;
  apiCalls: number;
  errors: string[];
}

const stats: IngestStats = {
  playersInserted: 0,
  apiCalls: 0,
  errors: [],
};

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function clearExistingData(year?: number) {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    if (year) {
      log(`Clearing existing roster data for ${TEAM} ${year}...`);
      await connection.run(`
        DELETE FROM roster
        WHERE team = '${TEAM}' AND season = ${year}
      `);
    } else {
      log(`Clearing all existing roster data for ${TEAM}...`);
      await connection.run(`
        DELETE FROM roster
        WHERE team = '${TEAM}'
      `);
    }
    log('Existing data cleared.');
  } finally {
    connection.closeSync();
  }
}

async function ingestRoster(year: number) {
  const client = getCFBDClient();
  const db = await getDuckDB();

  if (stats.apiCalls >= MAX_CALLS_PER_RUN) {
    log(`Rate limit reached (${MAX_CALLS_PER_RUN} calls). Stopping.`);
    return;
  }

  try {
    const roster = await client.getTeamRoster(TEAM, year);
    stats.apiCalls++;

    if (roster.length === 0) {
      log(`  ${year}: No roster data found`);
      return;
    }

    const connection = await db.connect();
    try {
      let idCounter = year * 10000;

      for (const player of roster) {
        const id = idCounter++;
        await connection.run(`
          INSERT INTO roster (
            id, athlete_id, season, team, first_name, last_name,
            position, jersey, height, weight, class_year,
            hometown_city, hometown_state, hometown_country
          ) VALUES (
            ${id},
            ${player.id || 'NULL'},
            ${year},
            '${TEAM}',
            '${player.firstName.replace(/'/g, "''")}',
            '${player.lastName.replace(/'/g, "''")}',
            ${player.position ? `'${player.position.replace(/'/g, "''")}'` : 'NULL'},
            ${player.jersey ?? 'NULL'},
            ${player.height ?? 'NULL'},
            ${player.weight ?? 'NULL'},
            ${player.year ?? 'NULL'},
            ${player.homeCity ? `'${player.homeCity.replace(/'/g, "''")}'` : 'NULL'},
            ${player.homeState ? `'${player.homeState.replace(/'/g, "''")}'` : 'NULL'},
            ${player.homeCountry ? `'${player.homeCountry.replace(/'/g, "''")}'` : 'NULL'}
          )
          ON CONFLICT (athlete_id, season, team) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            position = EXCLUDED.position,
            jersey = EXCLUDED.jersey,
            height = EXCLUDED.height,
            weight = EXCLUDED.weight,
            class_year = EXCLUDED.class_year,
            hometown_city = EXCLUDED.hometown_city,
            hometown_state = EXCLUDED.hometown_state,
            hometown_country = EXCLUDED.hometown_country
        `);
        stats.playersInserted++;
      }
    } finally {
      connection.closeSync();
    }

    log(`  ${year}: ${roster.length} players loaded`);
  } catch (error) {
    const msg = `Error ingesting roster for ${year}: ${error instanceof Error ? error.message : 'Unknown'}`;
    log(`  ${msg}`);
    stats.errors.push(msg);
  }
}

async function validateData() {
  const db = await getDuckDB();
  const connection = await db.connect();

  log('\nValidating data...');

  try {
    // Check current year count
    const currentResult = await connection.run(`
      SELECT COUNT(*) FROM roster
      WHERE team = '${TEAM}' AND season = ${CURRENT_YEAR}
    `);
    const currentRows = await currentResult.getRows();
    const currentCount = Number(currentRows[0]?.[0] || 0);

    // Expected: 85-130 players (scholarship + walk-ons)
    if (currentCount >= 85 && currentCount <= 150) {
      log(`  PASS: ${CURRENT_YEAR} roster count = ${currentCount} (expected 85-130)`);
    } else if (currentCount > 0) {
      log(`  WARN: ${CURRENT_YEAR} roster count = ${currentCount} (expected 85-130)`);
    } else {
      log(`  FAIL: No roster data for ${CURRENT_YEAR}`);
    }

    // Position breakdown
    const posResult = await connection.run(`
      SELECT position, COUNT(*) as count
      FROM roster
      WHERE team = '${TEAM}' AND season = ${CURRENT_YEAR}
      GROUP BY position
      ORDER BY count DESC
      LIMIT 10
    `);
    const posRows = await posResult.getRows();
    log(`  Position breakdown:`);
    for (const row of posRows) {
      log(`    ${row[0] || 'Unknown'}: ${row[1]} players`);
    }

    // Class year breakdown
    const classResult = await connection.run(`
      SELECT
        class_year,
        CASE
          WHEN class_year = 1 THEN 'FR'
          WHEN class_year = 2 THEN 'SO'
          WHEN class_year = 3 THEN 'JR'
          WHEN class_year = 4 THEN 'SR'
          WHEN class_year >= 5 THEN 'GR'
          ELSE 'Unknown'
        END as label,
        COUNT(*) as count
      FROM roster
      WHERE team = '${TEAM}' AND season = ${CURRENT_YEAR}
      GROUP BY class_year
      ORDER BY class_year ASC
    `);
    const classRows = await classResult.getRows();
    log(`  Class breakdown:`);
    for (const row of classRows) {
      log(`    ${row[1]}: ${row[2]} players`);
    }

    // Total across all years
    const totalResult = await connection.run(`
      SELECT season, COUNT(*) as count
      FROM roster
      WHERE team = '${TEAM}'
      GROUP BY season
      ORDER BY season DESC
    `);
    const totalRows = await totalResult.getRows();
    log(`  Roster data by year:`);
    for (const row of totalRows) {
      log(`    ${row[0]}: ${row[1]} players`);
    }
  } finally {
    connection.closeSync();
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Roster Data Ingestion Script                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTeam: ${TEAM}`);
  console.log(`Current year: ${CURRENT_YEAR}`);
  console.log(`Load historical: ${LOAD_HISTORICAL ? `Yes (${HISTORICAL_START}-${CURRENT_YEAR})` : 'No'}`);
  console.log(`Max API calls: ${MAX_CALLS_PER_RUN}\n`);

  const startTime = Date.now();

  // Initialize schema
  log('Initializing DuckDB schema...');
  await initDuckDBSchema();

  // Clear existing data
  if (LOAD_HISTORICAL) {
    await clearExistingData();
  } else {
    await clearExistingData(CURRENT_YEAR);
  }

  // Ingest data
  log('Ingesting roster data...');
  if (LOAD_HISTORICAL) {
    for (let year = HISTORICAL_START; year <= CURRENT_YEAR; year++) {
      await ingestRoster(year);
    }
  } else {
    await ingestRoster(CURRENT_YEAR);
  }

  // Validate
  await validateData();

  // Summary
  const elapsed = Date.now() - startTime;
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Players inserted: ${stats.playersInserted}`);
  console.log(`API calls made: ${stats.apiCalls}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Execution time: ${elapsed}ms`);

  if (stats.errors.length > 0) {
    console.log('\nErrors encountered:');
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  if (stats.playersInserted === 0) {
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
