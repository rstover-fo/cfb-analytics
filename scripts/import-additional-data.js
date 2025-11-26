/**
 * CFB Analytics - Additional Data Import Script
 *
 * Imports drives, plays, advanced_game_stats, season_stats, and conferences
 *
 * Usage:
 *   node --env-file=.env scripts/import-additional-data.js
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Supabase credentials are required');
  process.exit(1);
}

const DATA_DIR = join(__dirname, '..', 'data', 'csv');
const TEMP_FILE = join(tmpdir(), 'supabase-import.json');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? 'ERROR' : type === 'success' ? 'OK' : 'INFO';
  console.log(`${timestamp} [${prefix}] ${message}`);
}

function supabaseRequest(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  // Write data to temp file to avoid ENAMETOOLONG
  writeFileSync(TEMP_FILE, JSON.stringify(data));

  const result = spawnSync('curl', [
    '-s',
    '-X', 'POST',
    url,
    '-H', `apikey: ${SUPABASE_SERVICE_KEY}`,
    '-H', `Authorization: Bearer ${SUPABASE_SERVICE_KEY}`,
    '-H', 'Content-Type: application/json',
    '-H', 'Prefer: resolution=merge-duplicates',
    '-d', `@${TEMP_FILE}`,
  ], { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });

  // Clean up temp file
  try { unlinkSync(TEMP_FILE); } catch { /* ignore */ }

  if (result.error) {
    return { error: result.error.message };
  }

  const response = result.stdout;
  if (response && response.includes('"code"')) {
    try {
      const err = JSON.parse(response);
      if (err.code || err.message) {
        return { error: `${err.code}: ${err.message}` };
      }
    } catch { /* ignore */ }
  }
  return { error: null };
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

function parseTimeJson(timeStr) {
  if (!timeStr || timeStr === 'null') return null;
  try {
    const cleaned = timeStr.replace(/'/g, '"');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// Import Conferences
async function importConferences() {
  const filePath = join(DATA_DIR, 'conferences.csv');
  if (!existsSync(filePath)) {
    log('conferences.csv not found', 'error');
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
    log(`Error: ${error}`, 'error');
  } else {
    log(`Imported ${records.length} conferences`, 'success');
  }
}

// Import Drives (all years)
async function importDrives() {
  const drivesDir = join(DATA_DIR, 'drives');
  if (!existsSync(drivesDir)) {
    log('drives directory not found', 'error');
    return;
  }

  log('Importing drives (all years)...');
  const files = readdirSync(drivesDir).filter(f => f.endsWith('.csv')).sort();

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const year = file.match(/\d{4}/)?.[0] || 'unknown';
    const content = readFileSync(join(drivesDir, file), 'utf-8');
    const rows = parseCSV(content);

    const records = rows.map(row => ({
      cfbd_id: row.id,
      game_id: row.gameId,
      drive_number: row.driveNumber,
      offense: row.offense,
      offense_conference: row.offenseConference,
      defense: row.defense,
      defense_conference: row.defenseConference,
      scoring: row.scoring,
      start_period: row.startPeriod,
      start_yardline: row.startYardline,
      start_yards_to_goal: row.startYardsToGoal,
      start_time: parseTimeJson(row.startTime),
      end_period: row.endPeriod,
      end_yardline: row.endYardline,
      end_yards_to_goal: row.endYardsToGoal,
      end_time: parseTimeJson(row.endTime),
      plays: row.plays,
      yards: row.yards,
      drive_result: row.driveResult,
      is_home_offense: row.isHomeOffense,
      start_offense_score: row.startOffenseScore,
      start_defense_score: row.startDefenseScore,
      end_offense_score: row.endOffenseScore,
      end_defense_score: row.endDefenseScore,
    }));

    // Smaller batch size
    const batchSize = 100;
    let fileImported = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = supabaseRequest('drives', batch);
      if (error) {
        totalErrors++;
      } else {
        totalImported += batch.length;
        fileImported += batch.length;
      }
    }
    log(`  ${year}: ${fileImported}/${rows.length} drives imported`);
  }

  log(`Total: ${totalImported} drives (${totalErrors} batch errors)`, totalImported > 0 ? 'success' : 'error');
}

// Import Plays (2024)
async function importPlays() {
  const playsDir = join(DATA_DIR, 'plays', '2024');
  if (!existsSync(playsDir)) {
    log('plays/2024 directory not found', 'error');
    return;
  }

  log('Importing plays (2024)...');
  const files = readdirSync(playsDir).filter(f => f.endsWith('.csv')).sort();

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const content = readFileSync(join(playsDir, file), 'utf-8');
    const rows = parseCSV(content);

    const records = rows.map(row => ({
      cfbd_id: row.id,
      drive_id: row.driveId,
      game_id: row.gameId,
      drive_number: row.driveNumber,
      play_number: row.playNumber,
      offense: row.offense,
      offense_conference: row.offenseConference,
      offense_score: row.offenseScore,
      defense: row.defense,
      defense_conference: row.defenseConference,
      defense_score: row.defenseScore,
      home: row.home,
      away: row.away,
      period: row.period,
      clock: parseTimeJson(row.clock),
      offense_timeouts: row.offenseTimeouts,
      defense_timeouts: row.defenseTimeouts,
      yardline: row.yardline,
      yards_to_goal: row.yardsToGoal,
      down: row.down,
      distance: row.distance,
      yards_gained: row.yardsGained,
      scoring: row.scoring,
      play_type: row.playType,
      play_text: row.playText,
      ppa: row.ppa,
      wallclock: row.wallclock,
    }));

    // Smaller batch size
    const batchSize = 100;
    let fileImported = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = supabaseRequest('plays', batch);
      if (error) {
        totalErrors++;
      } else {
        totalImported += batch.length;
        fileImported += batch.length;
      }
    }
    log(`  ${file}: ${fileImported}/${rows.length} plays`);
  }

  log(`Total: ${totalImported} plays (${totalErrors} batch errors)`, totalImported > 0 ? 'success' : 'error');
}

// Import Advanced Game Stats
async function importAdvancedGameStats() {
  const statsDir = join(DATA_DIR, 'advanced_game_stats');
  if (!existsSync(statsDir)) {
    log('advanced_game_stats directory not found', 'error');
    return;
  }

  log('Importing advanced game stats...');
  const files = readdirSync(statsDir).filter(f => f.endsWith('.csv')).sort();

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const season = parseInt(file.replace('.csv', ''));
    const content = readFileSync(join(statsDir, file), 'utf-8');
    const rows = parseCSV(content);

    const records = rows.map(row => ({
      game_id: row.gameId,
      season: row.season || season,
      week: row.week,
      team: row.team,
      opponent: row.opponent,
      off_passing_explosiveness: row['offense_passingPlays_explosiveness'],
      off_passing_success_rate: row['offense_passingPlays_successRate'],
      off_passing_total_ppa: row['offense_passingPlays_totalPPA'],
      off_passing_ppa: row['offense_passingPlays_ppa'],
      off_rushing_explosiveness: row['offense_rushingPlays_explosiveness'],
      off_rushing_success_rate: row['offense_rushingPlays_successRate'],
      off_rushing_total_ppa: row['offense_rushingPlays_totalPPA'],
      off_rushing_ppa: row['offense_rushingPlays_ppa'],
      off_passing_downs_explosiveness: row['offense_passingDowns_explosiveness'],
      off_passing_downs_success_rate: row['offense_passingDowns_successRate'],
      off_passing_downs_ppa: row['offense_passingDowns_ppa'],
      off_standard_downs_explosiveness: row['offense_standardDowns_explosiveness'],
      off_standard_downs_success_rate: row['offense_standardDowns_successRate'],
      off_standard_downs_ppa: row['offense_standardDowns_ppa'],
      off_open_field_yards_total: row['offense_openFieldYardsTotal'],
      off_open_field_yards: row['offense_openFieldYards'],
      off_second_level_yards_total: row['offense_secondLevelYardsTotal'],
      off_second_level_yards: row['offense_secondLevelYards'],
      off_line_yards_total: row['offense_lineYardsTotal'],
      off_line_yards: row['offense_lineYards'],
      off_stuff_rate: row['offense_stuffRate'],
      off_power_success: row['offense_powerSuccess'],
      off_explosiveness: row['offense_explosiveness'],
      off_success_rate: row['offense_successRate'],
      off_total_ppa: row['offense_totalPPA'],
      off_ppa: row['offense_ppa'],
      off_drives: row['offense_drives'],
      off_plays: row['offense_plays'],
      def_passing_explosiveness: row['defense_passingPlays_explosiveness'],
      def_passing_success_rate: row['defense_passingPlays_successRate'],
      def_passing_total_ppa: row['defense_passingPlays_totalPPA'],
      def_passing_ppa: row['defense_passingPlays_ppa'],
      def_rushing_explosiveness: row['defense_rushingPlays_explosiveness'],
      def_rushing_success_rate: row['defense_rushingPlays_successRate'],
      def_rushing_total_ppa: row['defense_rushingPlays_totalPPA'],
      def_rushing_ppa: row['defense_rushingPlays_ppa'],
      def_passing_downs_explosiveness: row['defense_passingDowns_explosiveness'],
      def_passing_downs_success_rate: row['defense_passingDowns_successRate'],
      def_passing_downs_ppa: row['defense_passingDowns_ppa'],
      def_standard_downs_explosiveness: row['defense_standardDowns_explosiveness'],
      def_standard_downs_success_rate: row['defense_standardDowns_successRate'],
      def_standard_downs_ppa: row['defense_standardDowns_ppa'],
      def_open_field_yards_total: row['defense_openFieldYardsTotal'],
      def_open_field_yards: row['defense_openFieldYards'],
      def_second_level_yards_total: row['defense_secondLevelYardsTotal'],
      def_second_level_yards: row['defense_secondLevelYards'],
      def_line_yards_total: row['defense_lineYardsTotal'],
      def_line_yards: row['defense_lineYards'],
      def_stuff_rate: row['defense_stuffRate'],
      def_power_success: row['defense_powerSuccess'],
      def_explosiveness: row['defense_explosiveness'],
      def_success_rate: row['defense_successRate'],
      def_total_ppa: row['defense_totalPPA'],
      def_ppa: row['defense_ppa'],
      def_drives: row['defense_drives'],
      def_plays: row['defense_plays'],
    }));

    // Batch insert
    const batchSize = 50;
    let fileImported = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = supabaseRequest('advanced_game_stats', batch);
      if (error) {
        totalErrors++;
      } else {
        totalImported += batch.length;
        fileImported += batch.length;
      }
    }
    log(`  ${season}: ${fileImported}/${rows.length} records`);
  }

  log(`Total: ${totalImported} advanced game stats (${totalErrors} batch errors)`, totalImported > 0 ? 'success' : 'error');
}

// Import Season Stats
async function importSeasonStats() {
  const statsDir = join(DATA_DIR, 'season_stats');
  if (!existsSync(statsDir)) {
    log('season_stats directory not found', 'error');
    return;
  }

  log('Importing season stats...');
  const files = readdirSync(statsDir).filter(f => f.endsWith('.csv')).sort();

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const content = readFileSync(join(statsDir, file), 'utf-8');
    const rows = parseCSV(content);

    const records = rows.map(row => ({
      season: row.season,
      team: row.team,
      conference: row.conference,
      games: row.games,
      first_downs: row.firstDowns,
      first_downs_opponent: row.firstDownsOpponent,
      fourth_down_conversions: row.fourthDownConversions,
      fourth_down_conversions_opponent: row.fourthDownConversionsOpponent,
      fourth_downs: row.fourthDowns,
      fourth_downs_opponent: row.fourthDownsOpponent,
      fumbles_lost: row.fumblesLost,
      fumbles_lost_opponent: row.fumblesLostOpponent,
      fumbles_recovered: row.fumblesRecovered,
      fumbles_recovered_opponent: row.fumblesRecoveredOpponent,
      turnovers: row.turnovers,
      turnovers_opponent: row.turnoversOpponent,
      interception_tds: row.interceptionTDs,
      interception_tds_opponent: row.interceptionTDsOpponent,
      interception_yards: row.interceptionYards,
      interception_yards_opponent: row.interceptionYardsOpponent,
      interceptions: row.interceptions,
      interceptions_opponent: row.interceptionsOpponent,
      passes_intercepted: row.passesIntercepted,
      passes_intercepted_opponent: row.passesInterceptedOpponent,
      kick_return_tds: row.kickReturnTDs,
      kick_return_tds_opponent: row.kickReturnTDsOpponent,
      kick_return_yards: row.kickReturnYards,
      kick_return_yards_opponent: row.kickReturnYardsOpponent,
      kick_returns: row.kickReturns,
      kick_returns_opponent: row.kickReturnsOpponent,
      net_passing_yards: row.netPassingYards,
      net_passing_yards_opponent: row.netPassingYardsOpponent,
      pass_attempts: row.passAttempts,
      pass_attempts_opponent: row.passAttemptsOpponent,
      pass_completions: row.passCompletions,
      pass_completions_opponent: row.passCompletionsOpponent,
      passing_tds: row.passingTDs,
      passing_tds_opponent: row.passingTDsOpponent,
      penalties: row.penalties,
      penalties_opponent: row.penaltiesOpponent,
      penalty_yards: row.penaltyYards,
      penalty_yards_opponent: row.penaltyYardsOpponent,
      possession_time: row.possessionTime,
      possession_time_opponent: row.possessionTimeOpponent,
      punt_return_tds: row.puntReturnTDs,
      punt_return_tds_opponent: row.puntReturnTDsOpponent,
      punt_return_yards: row.puntReturnYards,
      punt_return_yards_opponent: row.puntReturnYardsOpponent,
      punt_returns: row.puntReturns,
      punt_returns_opponent: row.puntReturnsOpponent,
      rushing_attempts: row.rushingAttempts,
      rushing_attempts_opponent: row.rushingAttemptsOpponent,
      rushing_tds: row.rushingTDs,
      rushing_tds_opponent: row.rushingTDsOpponent,
      rushing_yards: row.rushingYards,
      rushing_yards_opponent: row.rushingYardsOpponent,
      sacks: row.sacks,
      sacks_opponent: row.sacksOpponent,
      tackles_for_loss: row.tacklesForLoss,
      tackles_for_loss_opponent: row.tacklesForLossOpponent,
      third_down_conversions: row.thirdDownConversions,
      third_down_conversions_opponent: row.thirdDownConversionsOpponent,
      third_downs: row.thirdDowns,
      third_downs_opponent: row.thirdDownsOpponent,
      total_yards: row.totalYards,
      total_yards_opponent: row.totalYardsOpponent,
    }));

    // Batch insert - small batches due to wide rows
    const batchSize = 20;
    let fileImported = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = supabaseRequest('season_stats', batch);
      if (error) {
        totalErrors++;
        if (totalErrors <= 3) {
          log(`  Batch error: ${error}`, 'error');
        }
      } else {
        totalImported += batch.length;
        fileImported += batch.length;
      }
    }
    log(`  ${file}: ${fileImported}/${records.length} records`);
  }

  if (totalErrors > 3) {
    log(`  ... and ${totalErrors - 3} more batch errors`, 'error');
  }
  log(`Total: ${totalImported} season stats`, totalImported > 0 ? 'success' : 'error');
}

async function main() {
  log('\n=== Starting Additional Data Import ===\n');

  await importConferences();
  await importDrives();
  await importPlays();
  await importAdvancedGameStats();
  await importSeasonStats();

  log('\n=== Import Complete ===', 'success');
}

main();
