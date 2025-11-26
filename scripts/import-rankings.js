/**
 * CFB Analytics - Rankings Import Script
 *
 * Fetches rankings from CFBD API and imports to Supabase
 *
 * Usage:
 *   node --env-file=.env scripts/import-rankings.js [year]
 */

import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CFBD_API_URL = 'https://api.collegefootballdata.com';
const CFBD_API_KEY = process.env.VITE_CFB_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CFBD_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const TEMP_FILE = join(tmpdir(), 'rankings-import.json');

function log(message, type = 'info') {
  const prefix = type === 'error' ? 'ERROR' : type === 'success' ? 'OK' : 'INFO';
  console.log(`[${prefix}] ${message}`);
}

function cfbdGet(endpoint) {
  const url = `${CFBD_API_URL}${endpoint}`;
  const result = spawnSync('curl', [
    '-s',
    url,
    '-H', `Authorization: Bearer ${CFBD_API_KEY}`,
  ], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });

  if (result.error) {
    throw result.error;
  }
  return JSON.parse(result.stdout);
}

function supabaseInsert(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  writeFileSync(TEMP_FILE, JSON.stringify(data));

  const result = spawnSync('curl', [
    '-s',
    '-X', 'POST',
    url,
    '-H', `apikey: ${SUPABASE_KEY}`,
    '-H', `Authorization: Bearer ${SUPABASE_KEY}`,
    '-H', 'Content-Type: application/json',
    '-H', 'Prefer: resolution=merge-duplicates',
    '-d', `@${TEMP_FILE}`,
  ], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });

  try { unlinkSync(TEMP_FILE); } catch { /* ignore */ }

  if (result.error) {
    return { error: result.error.message };
  }

  const response = result.stdout;
  if (response && response.includes('"code"')) {
    try {
      const err = JSON.parse(response);
      if (err.code) return { error: `${err.code}: ${err.message}` };
    } catch { /* ignore */ }
  }
  return { error: null };
}

async function importRankingsForYear(year) {
  log(`Fetching rankings for ${year}...`);

  // Fetch all weeks for the year
  const rankingsData = cfbdGet(`/rankings?year=${year}`);

  if (!rankingsData || rankingsData.length === 0) {
    log(`No rankings found for ${year}`, 'error');
    return 0;
  }

  log(`Found ${rankingsData.length} weeks of rankings`);

  let totalImported = 0;

  for (const weekData of rankingsData) {
    const { season, week, polls } = weekData;

    const records = [];

    for (const poll of polls) {
      const pollName = poll.poll;

      for (const rank of poll.ranks) {
        records.push({
          season,
          week,
          poll_type: pollName,
          rank: rank.rank,
          school: rank.school,
          conference: rank.conference || null,
          first_place_votes: rank.firstPlaceVotes || 0,
          points: rank.points || null,
        });
      }
    }

    if (records.length > 0) {
      // Batch insert
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = supabaseInsert('rankings', batch);
        if (error) {
          log(`  Week ${week} batch error: ${error}`, 'error');
        } else {
          totalImported += batch.length;
        }
      }
      log(`  Week ${week}: ${records.length} rankings from ${polls.length} polls`);
    }
  }

  return totalImported;
}

async function main() {
  const year = parseInt(process.argv[2]) || 2024;

  log(`\n=== Importing Rankings from CFBD API ===\n`);

  // Import specified year
  const imported = await importRankingsForYear(year);
  log(`\nImported ${imported} rankings for ${year}`, 'success');

  // Also import 2023 if we're doing 2024
  if (year === 2024) {
    log('');
    const imported2023 = await importRankingsForYear(2023);
    log(`Imported ${imported2023} rankings for 2023`, 'success');
  }

  log('\n=== Rankings Import Complete ===', 'success');
}

main();
