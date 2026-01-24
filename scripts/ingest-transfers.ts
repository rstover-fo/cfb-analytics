/**
 * Transfer Portal Data Ingestion Script
 * Run with: npx tsx scripts/ingest-transfers.ts
 *
 * Loads Oklahoma-related transfer portal data from CFBD API into DuckDB.
 * Portal data available from 2021 onward.
 *
 * Rate limiting: 100ms between requests, max 20 calls per script run.
 */

import { getCFBDClient } from '../src/lib/cfbd/client';
import { getDuckDB, initDuckDBSchema, closeDuckDB } from '../src/lib/db/duckdb';

const TEAM = 'Oklahoma';
const START_YEAR = 2021; // Portal data starts in 2021
const END_YEAR = 2025;
const MAX_CALLS_PER_RUN = 20;

interface IngestStats {
  transfersInserted: number;
  apiCalls: number;
  errors: string[];
}

const stats: IngestStats = {
  transfersInserted: 0,
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
    log('Clearing existing transfer data for Oklahoma...');
    await connection.run(`
      DELETE FROM transfers
      WHERE origin = '${TEAM}' OR destination = '${TEAM}'
    `);
    log('Existing data cleared.');
  } finally {
    connection.closeSync();
  }
}

async function ingestTransfers() {
  const client = getCFBDClient();
  const db = await getDuckDB();

  log('Ingesting transfer portal data...');

  let idCounter = 1;

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    if (stats.apiCalls >= MAX_CALLS_PER_RUN) {
      log(`Rate limit reached (${MAX_CALLS_PER_RUN} calls). Stopping.`);
      break;
    }

    try {
      const transfers = await client.getTransferPortal(year);
      stats.apiCalls++;

      // Filter to Oklahoma-related transfers (handle null/undefined values)
      const ouTransfers = transfers.filter(
        (t) =>
          (t.origin && t.origin.toLowerCase() === TEAM.toLowerCase()) ||
          (t.destination && t.destination.toLowerCase() === TEAM.toLowerCase())
      );

      if (ouTransfers.length === 0) {
        log(`  ${year}: No Oklahoma-related transfers found`);
        continue;
      }

      const connection = await db.connect();
      try {
        for (const transfer of ouTransfers) {
          const id = idCounter++;
          const firstName = transfer.first_name || 'Unknown';
          const lastName = transfer.last_name || 'Unknown';
          const origin = transfer.origin || 'Unknown';
          await connection.run(`
            INSERT INTO transfers (
              id, season, first_name, last_name, position,
              origin, destination, transfer_date, rating, stars, eligibility
            ) VALUES (
              ${id},
              ${transfer.season},
              '${firstName.replace(/'/g, "''")}',
              '${lastName.replace(/'/g, "''")}',
              ${transfer.position ? `'${transfer.position.replace(/'/g, "''")}'` : 'NULL'},
              '${origin.replace(/'/g, "''")}',
              ${transfer.destination ? `'${transfer.destination.replace(/'/g, "''")}'` : 'NULL'},
              ${transfer.transfer_date ? `'${transfer.transfer_date}'` : 'NULL'},
              ${transfer.rating ?? 'NULL'},
              ${transfer.stars ?? 'NULL'},
              ${transfer.eligibility ? `'${transfer.eligibility.replace(/'/g, "''")}'` : 'NULL'}
            )
          `);
          stats.transfersInserted++;
        }
      } finally {
        connection.closeSync();
      }

      // Count departures and arrivals
      const departures = ouTransfers.filter(
        (t) => t.origin && t.origin.toLowerCase() === TEAM.toLowerCase()
      ).length;
      const arrivals = ouTransfers.filter(
        (t) => t.destination && t.destination.toLowerCase() === TEAM.toLowerCase()
      ).length;

      log(`  ${year}: ${departures} departures, ${arrivals} arrivals`);
    } catch (error) {
      const msg = `Error ingesting transfers for ${year}: ${error instanceof Error ? error.message : 'Unknown'}`;
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
    // Check 2024 data
    const result2024 = await connection.run(`
      SELECT
        SUM(CASE WHEN origin = '${TEAM}' THEN 1 ELSE 0 END) as departures,
        SUM(CASE WHEN destination = '${TEAM}' THEN 1 ELSE 0 END) as arrivals
      FROM transfers
      WHERE season = 2024
    `);
    const rows2024 = await result2024.getRows();
    const departures2024 = Number(rows2024[0]?.[0] || 0);
    const arrivals2024 = Number(rows2024[0]?.[1] || 0);

    if (departures2024 > 0 || arrivals2024 > 0) {
      log(`  PASS: 2024 departures = ${departures2024}, arrivals = ${arrivals2024}`);
    } else {
      log(`  WARN: No 2024 transfer data found`);
    }

    // Check total counts
    const totalResult = await connection.run(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN origin = '${TEAM}' THEN 1 ELSE 0 END) as all_departures,
        SUM(CASE WHEN destination = '${TEAM}' THEN 1 ELSE 0 END) as all_arrivals
      FROM transfers
      WHERE origin = '${TEAM}' OR destination = '${TEAM}'
    `);
    const totalRows = await totalResult.getRows();
    log(`  Total transfers: ${totalRows[0]?.[0] || 0}`);
    log(`  Total departures: ${totalRows[0]?.[1] || 0}`);
    log(`  Total arrivals: ${totalRows[0]?.[2] || 0}`);

    // List years with data
    const yearsResult = await connection.run(`
      SELECT DISTINCT season
      FROM transfers
      WHERE origin = '${TEAM}' OR destination = '${TEAM}'
      ORDER BY season
    `);
    const yearsRows = await yearsResult.getRows();
    const years = yearsRows.map((r) => r[0]);
    log(`  Years with data: ${years.join(', ')}`);
  } finally {
    connection.closeSync();
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Transfer Portal Data Ingestion Script              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTeam: ${TEAM}`);
  console.log(`Years: ${START_YEAR}-${END_YEAR} (Portal data available from 2021)`);
  console.log(`Max API calls: ${MAX_CALLS_PER_RUN}\n`);

  const startTime = Date.now();

  // Initialize schema
  log('Initializing DuckDB schema...');
  await initDuckDBSchema();

  // Clear existing data
  await clearExistingData();

  // Ingest data
  await ingestTransfers();

  // Validate
  await validateData();

  // Summary
  const elapsed = Date.now() - startTime;
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Transfers inserted: ${stats.transfersInserted}`);
  console.log(`API calls made: ${stats.apiCalls}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Execution time: ${elapsed}ms`);

  if (stats.errors.length > 0) {
    console.log('\nErrors encountered:');
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log('\n✅ INGESTION COMPLETE');
  process.exit(0);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    closeDuckDB();
  });
