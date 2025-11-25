import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================
// Type Definitions
// =====================

export interface Conference {
  id: number;
  name: string;
  short_name: string | null;
  abbreviation: string | null;
  classification: string | null;
}

export interface Team {
  id: number;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  conference_id: number | null;
  conference: string | null;
  division: string | null;
  color: string | null;
  alt_color: string | null;
  logo_url: string | null;
}

export interface Game {
  id: number;
  cfbd_id: number | null;
  season: number;
  week: number;
  season_type: string;
  start_date: string | null;
  neutral_site: boolean;
  conference_game: boolean;
  attendance: number | null;
  venue: string | null;
  home_team: string;
  home_conference: string | null;
  home_points: number | null;
  home_line_scores: number[] | null;
  away_team: string;
  away_conference: string | null;
  away_points: number | null;
  away_line_scores: number[] | null;
  excitement_index: number | null;
}

export interface TeamRecord {
  id: number;
  season: number;
  team: string;
  conference: string | null;
  division: string | null;
  total_wins: number;
  total_losses: number;
  total_ties: number;
  conference_wins: number;
  conference_losses: number;
  conference_ties: number;
  home_wins: number;
  home_losses: number;
  away_wins: number;
  away_losses: number;
  expected_wins: number | null;
}

export interface Ranking {
  id: number;
  season: number;
  week: number;
  poll_type: string;
  rank: number;
  school: string;
  conference: string | null;
  first_place_votes: number;
  points: number | null;
}

export interface PlayerStat {
  id: number;
  season: number;
  player_name: string;
  team: string;
  conference: string | null;
  category: string;
  stat_type: string;
  stat_value: number;
}

export interface AdvancedStat {
  id: number;
  season: number;
  team: string;
  conference: string | null;
  off_ppa: number | null;
  off_success_rate: number | null;
  off_explosiveness: number | null;
  off_rushing_ppa: number | null;
  off_passing_ppa: number | null;
  def_ppa: number | null;
  def_success_rate: number | null;
  def_explosiveness: number | null;
  def_rushing_ppa: number | null;
  def_passing_ppa: number | null;
}

// =====================
// Query Functions
// =====================

export async function getTeams(conference?: string) {
  let query = supabase.from('teams').select('*').order('school');

  if (conference) {
    query = query.eq('conference', conference);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Team[];
}

export async function getConferences() {
  const { data, error } = await supabase
    .from('conferences')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Conference[];
}

export async function getGames(options: {
  season: number;
  week?: number;
  team?: string;
  conference?: string;
}) {
  let query = supabase
    .from('games')
    .select('*')
    .eq('season', options.season)
    .order('start_date', { ascending: false });

  if (options.week) {
    query = query.eq('week', options.week);
  }
  if (options.team) {
    query = query.or(`home_team.eq.${options.team},away_team.eq.${options.team}`);
  }
  if (options.conference) {
    query = query.or(`home_conference.eq.${options.conference},away_conference.eq.${options.conference}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Game[];
}

export async function getTeamRecords(season: number, conference?: string) {
  let query = supabase
    .from('team_records')
    .select('*')
    .eq('season', season)
    .order('total_wins', { ascending: false });

  if (conference) {
    query = query.eq('conference', conference);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as TeamRecord[];
}

export async function getRankings(options: {
  season: number;
  week: number;
  pollType?: string;
}) {
  let query = supabase
    .from('rankings')
    .select('*')
    .eq('season', options.season)
    .eq('week', options.week)
    .order('rank');

  if (options.pollType) {
    query = query.eq('poll_type', options.pollType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Ranking[];
}

export async function getPlayerStats(options: {
  season: number;
  category?: string;
  team?: string;
  limit?: number;
}) {
  let query = supabase
    .from('player_stats')
    .select('*')
    .eq('season', options.season)
    .order('stat_value', { ascending: false });

  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.team) {
    query = query.eq('team', options.team);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as PlayerStat[];
}

export async function getAdvancedStats(options: {
  season: number;
  team?: string;
  conference?: string;
}) {
  let query = supabase
    .from('advanced_stats')
    .select('*')
    .eq('season', options.season);

  if (options.team) {
    query = query.eq('team', options.team);
  }
  if (options.conference) {
    query = query.eq('conference', options.conference);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AdvancedStat[];
}

// Get available seasons from the database
export async function getAvailableSeasons() {
  const { data, error } = await supabase
    .from('games')
    .select('season')
    .order('season', { ascending: false });

  if (error) throw error;

  // Get unique seasons
  const seasons = [...new Set(data?.map(d => d.season) || [])];
  return seasons;
}

// Get the last sync info
export async function getLastSync() {
  const { data, error } = await supabase
    .from('data_sync_log')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}
