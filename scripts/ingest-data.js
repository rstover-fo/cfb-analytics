/**
 * CFB Analytics - Data Ingestion Script
 *
 * This script pulls data from the College Football Data API
 * and populates the Supabase database.
 *
 * Usage:
 *   node scripts/ingest-data.js --full          # Full historical import (2015-2024)
 *   node scripts/ingest-data.js --season 2024   # Import specific season
 *   node scripts/ingest-data.js --weekly        # Weekly update (current season)
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Configuration
const CFBD_API_URL = 'https://apinext.collegefootballdata.com';
const CFBD_API_KEY = process.env.VITE_CFB_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// Validate environment variables
if (!CFBD_API_KEY) {
  console.error('Error: VITE_CFB_API_KEY is required');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Supabase credentials are required');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const cfbdApi = axios.create({
  baseURL: CFBD_API_URL,
  headers: {
    Authorization: `Bearer ${CFBD_API_KEY}`,
    Accept: 'application/json',
  },
});

// Rate limiting helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Logging helper
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

// =====================
// Data Fetching Functions
// =====================

async function fetchConferences() {
  log('Fetching conferences...');
  const { data } = await cfbdApi.get('/conferences');
  return data;
}

async function fetchTeams() {
  log('Fetching teams...');
  const { data } = await cfbdApi.get('/teams');
  return data;
}

async function fetchGames(season) {
  log(`Fetching games for ${season}...`);
  const { data } = await cfbdApi.get('/games', {
    params: { year: season },
  });
  return data;
}

async function fetchTeamRecords(season) {
  log(`Fetching team records for ${season}...`);
  const { data } = await cfbdApi.get('/records', {
    params: { year: season },
  });
  return data;
}

async function fetchRankings(season) {
  log(`Fetching rankings for ${season}...`);
  const { data } = await cfbdApi.get('/rankings', {
    params: { year: season },
  });
  return data;
}

async function fetchPlayerStats(season, category) {
  log(`Fetching player stats for ${season} - ${category}...`);
  const { data } = await cfbdApi.get('/stats/player/season', {
    params: { year: season, category },
  });
  return data;
}

async function fetchAdvancedStats(season) {
  log(`Fetching advanced stats for ${season}...`);
  const { data } = await cfbdApi.get('/stats/season/advanced', {
    params: { year: season },
  });
  return data;
}

// =====================
// Data Insertion Functions
// =====================

async function upsertConferences(conferences) {
  log(`Inserting ${conferences.length} conferences...`);

  const records = conferences.map((c) => ({
    name: c.name,
    short_name: c.short_name,
    abbreviation: c.abbreviation,
    classification: c.classification,
  }));

  const { error } = await supabase.from('conferences').upsert(records, {
    onConflict: 'name',
  });

  if (error) throw error;
  log(`Inserted ${conferences.length} conferences`, 'success');
}

async function upsertTeams(teams) {
  log(`Inserting ${teams.length} teams...`);

  const records = teams
    .filter((t) => t.school) // Filter out invalid entries
    .map((t) => ({
      school: t.school,
      mascot: t.mascot,
      abbreviation: t.abbreviation,
      conference: t.conference,
      division: t.division,
      color: t.color,
      alt_color: t.alt_color,
      logo_url: t.logos?.[0] || null,
    }));

  // Batch insert to avoid timeouts
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('teams').upsert(batch, {
      onConflict: 'school',
    });
    if (error) throw error;
  }

  log(`Inserted ${teams.length} teams`, 'success');
}

async function upsertGames(games, season) {
  log(`Inserting ${games.length} games for ${season}...`);

  const records = games.map((g) => ({
    cfbd_id: g.id,
    season: g.season,
    week: g.week,
    season_type: g.season_type,
    start_date: g.start_date,
    neutral_site: g.neutral_site,
    conference_game: g.conference_game,
    attendance: g.attendance,
    venue: g.venue,
    venue_id: g.venue_id,
    home_team: g.home_team,
    home_conference: g.home_conference,
    home_points: g.home_points,
    home_line_scores: g.home_line_scores,
    away_team: g.away_team,
    away_conference: g.away_conference,
    away_points: g.away_points,
    away_line_scores: g.away_line_scores,
    excitement_index: g.excitement_index,
  }));

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('games').upsert(batch, {
      onConflict: 'cfbd_id',
    });
    if (error) throw error;
    await sleep(100); // Rate limiting
  }

  log(`Inserted ${games.length} games for ${season}`, 'success');
}

async function upsertTeamRecords(records, season) {
  log(`Inserting ${records.length} team records for ${season}...`);

  const data = records.map((r) => ({
    season: season,
    team: r.team,
    conference: r.conference,
    division: r.division,
    total_wins: r.total?.wins || 0,
    total_losses: r.total?.losses || 0,
    total_ties: r.total?.ties || 0,
    conference_wins: r.conferenceGames?.wins || 0,
    conference_losses: r.conferenceGames?.losses || 0,
    conference_ties: r.conferenceGames?.ties || 0,
    home_wins: r.homeGames?.wins || 0,
    home_losses: r.homeGames?.losses || 0,
    away_wins: r.awayGames?.wins || 0,
    away_losses: r.awayGames?.losses || 0,
    expected_wins: r.expectedWins,
  }));

  const { error } = await supabase.from('team_records').upsert(data, {
    onConflict: 'season,team',
  });

  if (error) throw error;
  log(`Inserted ${records.length} team records for ${season}`, 'success');
}

async function upsertRankings(rankingsData, season) {
  const allRankings = [];

  for (const weekData of rankingsData) {
    for (const poll of weekData.polls || []) {
      for (const rank of poll.ranks || []) {
        allRankings.push({
          season: season,
          week: weekData.week,
          poll_type: poll.poll,
          rank: rank.rank,
          school: rank.school,
          conference: rank.conference,
          first_place_votes: rank.firstPlaceVotes || 0,
          points: rank.points,
        });
      }
    }
  }

  log(`Inserting ${allRankings.length} rankings for ${season}...`);

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < allRankings.length; i += batchSize) {
    const batch = allRankings.slice(i, i + batchSize);
    const { error } = await supabase.from('rankings').upsert(batch, {
      onConflict: 'season,week,poll_type,school',
    });
    if (error) throw error;
  }

  log(`Inserted ${allRankings.length} rankings for ${season}`, 'success');
}

async function upsertPlayerStats(stats, season, category) {
  log(`Inserting ${stats.length} player stats for ${season} - ${category}...`);

  const records = stats.map((s) => ({
    season: season,
    player_name: s.player,
    team: s.team,
    conference: s.conference,
    category: s.category,
    stat_type: s.statType,
    stat_value: parseFloat(s.stat) || 0,
  }));

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('player_stats').upsert(batch, {
      onConflict: 'season,player_name,team,category,stat_type',
    });
    if (error) throw error;
  }

  log(`Inserted ${stats.length} player stats for ${season} - ${category}`, 'success');
}

async function upsertAdvancedStats(stats, season) {
  log(`Inserting ${stats.length} advanced stats for ${season}...`);

  const records = stats.map((s) => ({
    season: season,
    team: s.team,
    conference: s.conference,
    off_plays: s.offense?.plays,
    off_drives: s.offense?.drives,
    off_ppa: s.offense?.ppa,
    off_total_ppa: s.offense?.totalPPA,
    off_success_rate: s.offense?.successRate,
    off_explosiveness: s.offense?.explosiveness,
    off_power_success: s.offense?.powerSuccess,
    off_stuff_rate: s.offense?.stuffRate,
    off_line_yards: s.offense?.lineYards,
    off_line_yards_total: s.offense?.lineYardsTotal,
    off_second_level_yards: s.offense?.secondLevelYards,
    off_second_level_yards_total: s.offense?.secondLevelYardsTotal,
    off_open_field_yards: s.offense?.openFieldYards,
    off_open_field_yards_total: s.offense?.openFieldYardsTotal,
    off_standard_downs_ppa: s.offense?.standardDowns?.ppa,
    off_standard_downs_success_rate: s.offense?.standardDowns?.successRate,
    off_standard_downs_explosiveness: s.offense?.standardDowns?.explosiveness,
    off_passing_downs_ppa: s.offense?.passingDowns?.ppa,
    off_passing_downs_success_rate: s.offense?.passingDowns?.successRate,
    off_passing_downs_explosiveness: s.offense?.passingDowns?.explosiveness,
    off_rushing_ppa: s.offense?.rushingPlays?.ppa,
    off_rushing_total_ppa: s.offense?.rushingPlays?.totalPPA,
    off_rushing_success_rate: s.offense?.rushingPlays?.successRate,
    off_rushing_explosiveness: s.offense?.rushingPlays?.explosiveness,
    off_passing_ppa: s.offense?.passingPlays?.ppa,
    off_passing_total_ppa: s.offense?.passingPlays?.totalPPA,
    off_passing_success_rate: s.offense?.passingPlays?.successRate,
    off_passing_explosiveness: s.offense?.passingPlays?.explosiveness,
    def_plays: s.defense?.plays,
    def_drives: s.defense?.drives,
    def_ppa: s.defense?.ppa,
    def_total_ppa: s.defense?.totalPPA,
    def_success_rate: s.defense?.successRate,
    def_explosiveness: s.defense?.explosiveness,
    def_power_success: s.defense?.powerSuccess,
    def_stuff_rate: s.defense?.stuffRate,
    def_line_yards: s.defense?.lineYards,
    def_line_yards_total: s.defense?.lineYardsTotal,
    def_second_level_yards: s.defense?.secondLevelYards,
    def_second_level_yards_total: s.defense?.secondLevelYardsTotal,
    def_open_field_yards: s.defense?.openFieldYards,
    def_open_field_yards_total: s.defense?.openFieldYardsTotal,
    def_standard_downs_ppa: s.defense?.standardDowns?.ppa,
    def_standard_downs_success_rate: s.defense?.standardDowns?.successRate,
    def_standard_downs_explosiveness: s.defense?.standardDowns?.explosiveness,
    def_passing_downs_ppa: s.defense?.passingDowns?.ppa,
    def_passing_downs_success_rate: s.defense?.passingDowns?.successRate,
    def_passing_downs_explosiveness: s.defense?.passingDowns?.explosiveness,
    def_rushing_ppa: s.defense?.rushingPlays?.ppa,
    def_rushing_total_ppa: s.defense?.rushingPlays?.totalPPA,
    def_rushing_success_rate: s.defense?.rushingPlays?.successRate,
    def_rushing_explosiveness: s.defense?.rushingPlays?.explosiveness,
    def_passing_ppa: s.defense?.passingPlays?.ppa,
    def_passing_total_ppa: s.defense?.passingPlays?.totalPPA,
    def_passing_success_rate: s.defense?.passingPlays?.successRate,
    def_passing_explosiveness: s.defense?.passingPlays?.explosiveness,
  }));

  const { error } = await supabase.from('advanced_stats').upsert(records, {
    onConflict: 'season,team',
  });

  if (error) throw error;
  log(`Inserted ${stats.length} advanced stats for ${season}`, 'success');
}

// =====================
// Sync Log Functions
// =====================

async function startSyncLog(syncType, tableName, season) {
  const { data, error } = await supabase
    .from('data_sync_log')
    .insert({
      sync_type: syncType,
      table_name: tableName,
      season: season,
      status: 'running',
    })
    .select()
    .single();

  if (error) {
    log(`Warning: Could not create sync log: ${error.message}`, 'error');
    return null;
  }
  return data.id;
}

async function completeSyncLog(logId, recordsProcessed, recordsInserted) {
  if (!logId) return;

  const { error } = await supabase
    .from('data_sync_log')
    .update({
      status: 'completed',
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);

  if (error) {
    log(`Warning: Could not update sync log: ${error.message}`, 'error');
  }
}

async function failSyncLog(logId, errorMessage) {
  if (!logId) return;

  await supabase
    .from('data_sync_log')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

// =====================
// Main Import Functions
// =====================

async function importSeason(season) {
  log(`\n${'='.repeat(50)}`);
  log(`Starting import for season ${season}`);
  log('='.repeat(50));

  const playerCategories = [
    'passing',
    'rushing',
    'receiving',
    'defensive',
    'interceptions',
    'punting',
    'kicking',
  ];

  try {
    // Import games
    const games = await fetchGames(season);
    await upsertGames(games, season);
    await sleep(500);

    // Import team records
    const records = await fetchTeamRecords(season);
    await upsertTeamRecords(records, season);
    await sleep(500);

    // Import rankings
    const rankings = await fetchRankings(season);
    await upsertRankings(rankings, season);
    await sleep(500);

    // Import player stats for each category
    for (const category of playerCategories) {
      try {
        const stats = await fetchPlayerStats(season, category);
        if (stats && stats.length > 0) {
          await upsertPlayerStats(stats, season, category);
        }
        await sleep(300);
      } catch (err) {
        log(`Warning: Could not fetch ${category} stats for ${season}: ${err.message}`, 'error');
      }
    }

    // Import advanced stats
    try {
      const advStats = await fetchAdvancedStats(season);
      if (advStats && advStats.length > 0) {
        await upsertAdvancedStats(advStats, season);
      }
    } catch (err) {
      log(`Warning: Could not fetch advanced stats for ${season}: ${err.message}`, 'error');
    }

    log(`Completed import for season ${season}`, 'success');
  } catch (error) {
    log(`Error importing season ${season}: ${error.message}`, 'error');
    throw error;
  }
}

async function fullImport(startYear = 2015, endYear = 2024) {
  log('\n🏈 Starting full CFB data import...\n');

  const syncLogId = await startSyncLog('full', 'all', null);

  try {
    // First, import conferences and teams (one-time)
    const conferences = await fetchConferences();
    await upsertConferences(conferences);
    await sleep(500);

    const teams = await fetchTeams();
    await upsertTeams(teams);
    await sleep(500);

    // Import each season
    for (let season = startYear; season <= endYear; season++) {
      await importSeason(season);
      await sleep(1000); // Pause between seasons to avoid rate limiting
    }

    await completeSyncLog(syncLogId, endYear - startYear + 1, 0);
    log('\n🎉 Full import completed successfully!', 'success');
  } catch (error) {
    await failSyncLog(syncLogId, error.message);
    throw error;
  }
}

async function weeklyUpdate() {
  const currentYear = new Date().getFullYear();
  log(`\n🏈 Running weekly update for ${currentYear}...\n`);

  const syncLogId = await startSyncLog('weekly', 'all', currentYear);

  try {
    await importSeason(currentYear);
    await completeSyncLog(syncLogId, 1, 0);
    log('\n🎉 Weekly update completed successfully!', 'success');
  } catch (error) {
    await failSyncLog(syncLogId, error.message);
    throw error;
  }
}

// =====================
// CLI Entry Point
// =====================

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes('--full')) {
      await fullImport();
    } else if (args.includes('--weekly')) {
      await weeklyUpdate();
    } else if (args.includes('--season')) {
      const seasonIndex = args.indexOf('--season');
      const season = parseInt(args[seasonIndex + 1]);
      if (isNaN(season)) {
        console.error('Error: Please provide a valid season year');
        process.exit(1);
      }

      // Also import teams if doing a single season
      const teams = await fetchTeams();
      await upsertTeams(teams);
      await sleep(500);

      await importSeason(season);
    } else {
      console.log(`
CFB Analytics - Data Ingestion Script

Usage:
  node scripts/ingest-data.js --full          Full historical import (2015-2024)
  node scripts/ingest-data.js --season 2024   Import specific season
  node scripts/ingest-data.js --weekly        Weekly update (current season)
      `);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
