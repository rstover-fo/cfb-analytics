/**
 * CFB Analytics - CSV Import Script
 *
 * Imports the CFBD Starter Pack CSV data into Supabase
 *
 * Usage:
 *   node scripts/import-csv.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const DATA_DIR = join(__dirname, '..', 'data', 'csv');

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
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
        // Convert empty strings to null
        if (value === '' || value === 'NA' || value === 'NaN') {
          value = null;
        }
        // Try to parse numbers
        else if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        // Parse booleans
        else if (value === 'True' || value === 'true') {
          value = true;
        }
        else if (value === 'False' || value === 'false') {
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

  // Batch insert
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('conferences').upsert(batch, {
      onConflict: 'name',
    });
    if (error) {
      log(`Error inserting conferences: ${error.message}`, 'error');
    }
  }
  log(`Imported ${records.length} conferences`, 'success');
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
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('teams').upsert(batch, {
      onConflict: 'school',
    });
    if (error) {
      log(`Error inserting teams: ${error.message}`, 'error');
    }
  }
  log(`Imported ${records.length} teams`, 'success');
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

  // Filter to reasonable date range (2000+) to reduce data size
  const filteredRows = rows.filter(row => row.season >= 2000);
  log(`Found ${filteredRows.length} games from 2000 onwards`);

  const records = filteredRows.map(row => ({
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
    home_line_scores: row.home_line_scores ? JSON.parse(row.home_line_scores.replace(/'/g, '"')) : null,
    away_team: row.away_team,
    away_conference: row.away_conference,
    away_points: row.away_points,
    away_line_scores: row.away_line_scores ? JSON.parse(row.away_line_scores.replace(/'/g, '"')) : null,
    excitement_index: row.excitement,
  }));

  // Batch insert with smaller batches for large dataset
  const batchSize = 500;
  let imported = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('games').upsert(batch, {
      onConflict: 'cfbd_id',
    });
    if (error) {
      log(`Error inserting games batch ${i}: ${error.message}`, 'error');
    } else {
      imported += batch.length;
      if (imported % 5000 === 0) {
        log(`Imported ${imported}/${records.length} games...`);
      }
    }
    await sleep(100); // Rate limiting
  }
  log(`Imported ${imported} games`, 'success');
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
      // Offensive stats
      off_plays: row['offense_plays'],
      off_drives: row['offense_drives'],
      off_ppa: row['offense_ppa'],
      off_total_ppa: row['offense_totalPPA'],
      off_success_rate: row['offense_successRate'],
      off_explosiveness: row['offense_explosiveness'],
      off_power_success: row['offense_powerSuccess'],
      off_stuff_rate: row['offense_stuffRate'],
      off_line_yards: row['offense_lineYards'],
      off_line_yards_total: row['offense_lineYardsTotal'],
      off_second_level_yards: row['offense_secondLevelYards'],
      off_second_level_yards_total: row['offense_secondLevelYardsTotal'],
      off_open_field_yards: row['offense_openFieldYards'],
      off_open_field_yards_total: row['offense_openFieldYardsTotal'],
      off_standard_downs_ppa: row['offense_standardDowns_ppa'],
      off_standard_downs_success_rate: row['offense_standardDowns_successRate'],
      off_standard_downs_explosiveness: row['offense_standardDowns_explosiveness'],
      off_passing_downs_ppa: row['offense_passingDowns_ppa'],
      off_passing_downs_success_rate: row['offense_passingDowns_successRate'],
      off_passing_downs_explosiveness: row['offense_passingDowns_explosiveness'],
      off_rushing_ppa: row['offense_rushingPlays_ppa'],
      off_rushing_total_ppa: row['offense_rushingPlays_totalPPA'],
      off_rushing_success_rate: row['offense_rushingPlays_successRate'],
      off_rushing_explosiveness: row['offense_rushingPlays_explosiveness'],
      off_passing_ppa: row['offense_passingPlays_ppa'],
      off_passing_total_ppa: row['offense_passingPlays_totalPPA'],
      off_passing_success_rate: row['offense_passingPlays_successRate'],
      off_passing_explosiveness: row['offense_passingPlays_explosiveness'],
      // Defensive stats
      def_plays: row['defense_plays'],
      def_drives: row['defense_drives'],
      def_ppa: row['defense_ppa'],
      def_total_ppa: row['defense_totalPPA'],
      def_success_rate: row['defense_successRate'],
      def_explosiveness: row['defense_explosiveness'],
      def_power_success: row['defense_powerSuccess'],
      def_stuff_rate: row['defense_stuffRate'],
      def_line_yards: row['defense_lineYards'],
      def_line_yards_total: row['defense_lineYardsTotal'],
      def_second_level_yards: row['defense_secondLevelYards'],
      def_second_level_yards_total: row['defense_secondLevelYardsTotal'],
      def_open_field_yards: row['defense_openFieldYards'],
      def_open_field_yards_total: row['defense_openFieldYardsTotal'],
      def_standard_downs_ppa: row['defense_standardDowns_ppa'],
      def_standard_downs_success_rate: row['defense_standardDowns_successRate'],
      def_standard_downs_explosiveness: row['defense_standardDowns_explosiveness'],
      def_passing_downs_ppa: row['defense_passingDowns_ppa'],
      def_passing_downs_success_rate: row['defense_passingDowns_successRate'],
      def_passing_downs_explosiveness: row['defense_passingDowns_explosiveness'],
      def_rushing_ppa: row['defense_rushingPlays_ppa'],
      def_rushing_total_ppa: row['defense_rushingPlays_totalPPA'],
      def_rushing_success_rate: row['defense_rushingPlays_successRate'],
      def_rushing_explosiveness: row['defense_rushingPlays_explosiveness'],
      def_passing_ppa: row['defense_passingPlays_ppa'],
      def_passing_total_ppa: row['defense_passingPlays_totalPPA'],
      def_passing_success_rate: row['defense_passingPlays_successRate'],
      def_passing_explosiveness: row['defense_passingPlays_explosiveness'],
    }));

    const { error } = await supabase.from('advanced_stats').upsert(records, {
      onConflict: 'season,team',
    });

    if (error) {
      log(`Error inserting advanced stats for ${season}: ${error.message}`, 'error');
    } else {
      totalImported += records.length;
    }
    await sleep(100);
  }
  log(`Imported ${totalImported} advanced stats records`, 'success');
}

async function deriveTeamRecords() {
  log('Deriving team records from games data...');

  // Get all seasons from games
  const { data: seasons } = await supabase
    .from('games')
    .select('season')
    .gte('season', 2000)
    .order('season', { ascending: true });

  const uniqueSeasons = [...new Set(seasons?.map(s => s.season) || [])];
  log(`Found ${uniqueSeasons.length} seasons to process`);

  let totalRecords = 0;
  for (const season of uniqueSeasons) {
    // Get all games for this season
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('season', season)
      .eq('season_type', 'regular')
      .not('home_points', 'is', null)
      .not('away_points', 'is', null);

    if (!games || games.length === 0) continue;

    // Calculate records for each team
    const teamRecords = {};

    games.forEach(game => {
      // Initialize team records
      [game.home_team, game.away_team].forEach(team => {
        if (!teamRecords[team]) {
          teamRecords[team] = {
            season,
            team,
            conference: team === game.home_team ? game.home_conference : game.away_conference,
            total_wins: 0,
            total_losses: 0,
            total_ties: 0,
            conference_wins: 0,
            conference_losses: 0,
            conference_ties: 0,
            home_wins: 0,
            home_losses: 0,
            away_wins: 0,
            away_losses: 0,
          };
        }
      });

      const homeWon = game.home_points > game.away_points;
      const awayWon = game.away_points > game.home_points;
      const tie = game.home_points === game.away_points;

      // Update home team
      if (homeWon) {
        teamRecords[game.home_team].total_wins++;
        teamRecords[game.home_team].home_wins++;
      } else if (awayWon) {
        teamRecords[game.home_team].total_losses++;
        teamRecords[game.home_team].home_losses++;
      } else if (tie) {
        teamRecords[game.home_team].total_ties++;
      }

      // Update away team
      if (awayWon) {
        teamRecords[game.away_team].total_wins++;
        teamRecords[game.away_team].away_wins++;
      } else if (homeWon) {
        teamRecords[game.away_team].total_losses++;
        teamRecords[game.away_team].away_losses++;
      } else if (tie) {
        teamRecords[game.away_team].total_ties++;
      }

      // Conference games
      if (game.conference_game) {
        if (homeWon) {
          teamRecords[game.home_team].conference_wins++;
          teamRecords[game.away_team].conference_losses++;
        } else if (awayWon) {
          teamRecords[game.away_team].conference_wins++;
          teamRecords[game.home_team].conference_losses++;
        } else if (tie) {
          teamRecords[game.home_team].conference_ties++;
          teamRecords[game.away_team].conference_ties++;
        }
      }
    });

    const records = Object.values(teamRecords);
    const { error } = await supabase.from('team_records').upsert(records, {
      onConflict: 'season,team',
    });

    if (error) {
      log(`Error inserting team records for ${season}: ${error.message}`, 'error');
    } else {
      totalRecords += records.length;
    }

    if (season % 5 === 0) {
      log(`Processed through ${season}...`);
    }
    await sleep(50);
  }

  log(`Derived ${totalRecords} team records`, 'success');
}

async function main() {
  log('\n🏈 Starting CSV import to Supabase...\n');

  try {
    await importConferences();
    await importTeams();
    await importGames();
    await importAdvancedStats();
    await deriveTeamRecords();

    // Log sync completion
    await supabase.from('data_sync_log').insert({
      sync_type: 'csv_import',
      table_name: 'all',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    log('\n🎉 CSV import completed successfully!', 'success');
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
