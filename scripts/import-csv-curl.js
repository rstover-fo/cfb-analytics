/**
 * CFB Analytics - CSV Import Script (curl version)
 *
 * Imports the CFBD Starter Pack CSV data into Supabase using curl
 * (bypasses Node.js fetch restrictions in some environments)
 *
 * Usage:
 *   node --env-file=.env scripts/import-csv-curl.js
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Supabase credentials are required');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const DATA_DIR = join(__dirname, '..', 'data', 'csv');

// Helpers
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? 'ERROR' : type === 'success' ? 'OK' : 'INFO';
  console.log(`${timestamp} [${prefix}] ${message}`);
}

function supabaseRequest(table, data, method = 'POST') {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const headers = [
    '-H', `apikey: ${SUPABASE_SERVICE_KEY}`,
    '-H', `Authorization: Bearer ${SUPABASE_SERVICE_KEY}`,
    '-H', 'Content-Type: application/json',
    '-H', 'Prefer: resolution=merge-duplicates',
  ];

  const result = spawnSync('curl', [
    '-s',
    '-X', method,
    url,
    ...headers,
    '-d', JSON.stringify(data),
  ], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });

  if (result.error) {
    throw result.error;
  }

  const response = result.stdout;
  if (response && response.includes('"error"')) {
    try {
      const err = JSON.parse(response);
      if (err.error || err.message) {
        return { error: err.error || err.message };
      }
    } catch {
      // Not JSON error
    }
  }

  return { data: response, error: null };
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        let value = values[index];
        if (value === '' || value === 'NA' || value === 'NaN') {
          value = null;
        } else if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        } else if (value === 'True' || value === 'true') {
          value = true;
        } else if (value === 'False' || value === 'false') {
          value = false;
        }
        row[header] = value;
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Import functions
async function importConferences() {
  const filePath = join(DATA_DIR, 'conferences.csv');
  if (!existsSync(filePath)) {
    log('conferences.csv not found, skipping', 'error');
    return;
  }

  log('Importing conferences...');
  const content = readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  const records = rows.map(row => ({
    name: row.name,
    abbreviation: row.abbreviation,
    classification: row.division || 'fbs',
  }));

  const { error } = supabaseRequest('conferences', records);
  if (error) {
    log(`Error inserting conferences: ${error}`, 'error');
  } else {
    log(`Imported ${records.length} conferences`, 'success');
  }
}

async function importTeams() {
  const filePath = join(DATA_DIR, 'teams.csv');
  if (!existsSync(filePath)) {
    log('teams.csv not found, skipping', 'error');
    return;
  }

  log('Importing teams...');
  const content = readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  const records = rows.map(row => ({
    school: row.school,
    mascot: row.mascot || row.nickname,
    abbreviation: row.abbreviation,
    conference: row.conference,
    division: row.conference_division,
    color: null,
    alt_color: null,
    logo_url: null,
  }));

  // Batch insert
  const batchSize = 100;
  let imported = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = supabaseRequest('teams', batch);
    if (error) {
      log(`Error inserting teams batch ${i}: ${error}`, 'error');
    } else {
      imported += batch.length;
    }
  }
  log(`Imported ${imported} teams`, 'success');
}

async function importGames() {
  const filePath = join(DATA_DIR, 'games.csv');
  if (!existsSync(filePath)) {
    log('games.csv not found, skipping', 'error');
    return;
  }

  log('Importing games (this may take a while)...');
  const content = readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  // Filter to reasonable date range (2000+)
  const filteredRows = rows.filter(row => row.season >= 2000);
  log(`Found ${filteredRows.length} games from 2000 onwards`);

  const records = filteredRows.map(row => {
    let homeLineScores = null;
    let awayLineScores = null;

    try {
      if (row.home_line_scores && typeof row.home_line_scores === 'string') {
        homeLineScores = JSON.parse(row.home_line_scores.replace(/'/g, '"'));
      }
      if (row.away_line_scores && typeof row.away_line_scores === 'string') {
        awayLineScores = JSON.parse(row.away_line_scores.replace(/'/g, '"'));
      }
    } catch {
      // Ignore parse errors
    }

    return {
      cfbd_id: row.id,
      season: row.season,
      week: row.week,
      season_type: row.season_type || 'regular',
      start_date: row.start_date,
      neutral_site: row.neutral_site || false,
      conference_game: row.conference_game || false,
      attendance: row.attendance,
      venue: row.venue_id ? `Venue ${row.venue_id}` : null,
      venue_id: row.venue_id,
      home_team: row.home_team,
      home_conference: row.home_conference,
      home_points: row.home_points,
      home_line_scores: homeLineScores,
      away_team: row.away_team,
      away_conference: row.away_conference,
      away_points: row.away_points,
      away_line_scores: awayLineScores,
      excitement_index: row.excitement,
    };
  });

  // Batch insert with smaller batches
  const batchSize = 200;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = supabaseRequest('games', batch);
    if (error) {
      errors++;
      if (errors <= 3) {
        log(`Error inserting games batch ${i}: ${error}`, 'error');
      }
    } else {
      imported += batch.length;
    }

    if ((i + batchSize) % 5000 === 0 || i + batchSize >= records.length) {
      log(`Progress: ${Math.min(i + batchSize, records.length)}/${records.length} games processed`);
    }
  }

  if (errors > 3) {
    log(`... and ${errors - 3} more errors`, 'error');
  }
  log(`Imported ${imported} games (${errors} batches failed)`, imported > 0 ? 'success' : 'error');
}

async function importAdvancedStats() {
  const statsDir = join(DATA_DIR, 'advanced_season_stats');
  if (!existsSync(statsDir)) {
    log('advanced_season_stats directory not found, skipping', 'error');
    return;
  }

  log('Importing advanced season stats...');
  const files = readdirSync(statsDir).filter(f => f.endsWith('.csv'));

  let totalImported = 0;
  for (const file of files) {
    const season = parseInt(file.replace('.csv', ''));
    if (isNaN(season)) continue;

    const content = readFileSync(join(statsDir, file), 'utf-8');
    const rows = parseCSV(content);

    const records = rows.map(row => ({
      season: row.season || season,
      team: row.team,
      conference: row.conference,
      off_plays: row['offense_plays'],
      off_drives: row['offense_drives'],
      off_ppa: row['offense_ppa'],
      off_total_ppa: row['offense_totalPPA'],
      off_success_rate: row['offense_successRate'],
      off_explosiveness: row['offense_explosiveness'],
      off_power_success: row['offense_powerSuccess'],
      off_stuff_rate: row['offense_stuffRate'],
      off_line_yards: row['offense_lineYards'],
      off_second_level_yards: row['offense_secondLevelYards'],
      off_open_field_yards: row['offense_openFieldYards'],
      def_plays: row['defense_plays'],
      def_drives: row['defense_drives'],
      def_ppa: row['defense_ppa'],
      def_total_ppa: row['defense_totalPPA'],
      def_success_rate: row['defense_successRate'],
      def_explosiveness: row['defense_explosiveness'],
      def_power_success: row['defense_powerSuccess'],
      def_stuff_rate: row['defense_stuffRate'],
      def_line_yards: row['defense_lineYards'],
      def_second_level_yards: row['defense_secondLevelYards'],
      def_open_field_yards: row['defense_openFieldYards'],
    }));

    const { error } = supabaseRequest('advanced_stats', records);
    if (error) {
      log(`Error inserting advanced stats for ${season}: ${error}`, 'error');
    } else {
      totalImported += records.length;
    }
  }
  log(`Imported ${totalImported} advanced stats records`, 'success');
}

async function main() {
  log('\n=== Starting CSV import to Supabase (curl version) ===\n');

  try {
    await importConferences();
    await importTeams();
    await importGames();
    await importAdvancedStats();

    log('\n=== CSV import completed! ===', 'success');
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
