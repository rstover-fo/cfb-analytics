import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'https://api.collegefootballdata.com';
const API_KEY = import.meta.env.VITE_CFB_API_KEY;

// =====================
// API Error Handling
// =====================

export class ApiError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'UNKNOWN',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function handleApiError(error: unknown, context: string): never {
  console.error(`Error in ${context}:`, error);

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection.',
        'NETWORK_ERROR',
        true
      );
    }

    const status = axiosError.response.status;

    if (status === 404) {
      throw new ApiError(
        'The requested data was not found.',
        'NOT_FOUND',
        false
      );
    }

    if (status === 429) {
      throw new ApiError(
        'Too many requests. Please wait a moment and try again.',
        'RATE_LIMITED',
        true
      );
    }

    if (status >= 500) {
      throw new ApiError(
        'The server is experiencing issues. Please try again later.',
        'SERVER_ERROR',
        true
      );
    }
  }

  throw new ApiError(
    'An unexpected error occurred. Please try again.',
    'UNKNOWN',
    true
  );
}

// Direct API client (fallback when Supabase has no data)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
  },
});

// =====================
// Type Definitions
// =====================

export interface Team {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  alt_name1?: string;
  conference: string;
  division?: string;
  color: string;
  alt_color: string;
  logos: string[];
}

export interface TeamRecord {
  year: number;
  team: string;
  conference: string;
  total: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
  conferenceGames: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
}

export interface Game {
  id: number;
  season: number;
  week: number;
  season_type: string;
  start_date: string;
  home_team: string;
  home_conference: string;
  home_points: number;
  away_team: string;
  away_conference: string;
  away_points: number;
  venue: string;
  attendance?: number;
  excitement_index?: number;
}

export interface RankingWeek {
  season: number;
  seasonType: string;
  week: number;
  polls: Poll[];
}

export interface Poll {
  poll: string;
  ranks: Rank[];
}

export interface Rank {
  rank: number;
  school: string;
  conference: string;
  firstPlaceVotes: number;
  points: number;
}

export interface PlayerSeasonStat {
  season: number;
  team: string;
  conference: string;
  player: string;
  category: string;
  statType: string;
  stat: number;
}

export interface TeamStat {
  season: number;
  team: string;
  conference: string;
  statName: string;
  statValue: number;
}

export interface AdvancedStat {
  season: number;
  team: string;
  conference: string;
  offense?: {
    plays: number;
    drives: number;
    ppa: number;
    totalPPA: number;
    successRate: number;
    explosiveness: number;
    powerSuccess: number;
    stuffRate: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
  };
  defense?: {
    plays: number;
    drives: number;
    ppa: number;
    totalPPA: number;
    successRate: number;
    explosiveness: number;
    powerSuccess: number;
    stuffRate: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
  };
}

// =====================
// Helper: Check if Supabase has data
// =====================

async function hasSupabaseData(table: string, season?: number): Promise<boolean> {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    if (season) {
      query = query.eq('season', season);
    }
    const { count, error } = await query;
    if (error) return false;
    return (count || 0) > 0;
  } catch {
    return false;
  }
}

// =====================
// API Functions (Hybrid: Supabase first, then direct API)
// =====================

export const getTeams = async (year?: number): Promise<Team[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('teams');
    if (hasData) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('school');

      if (!error && data && data.length > 0) {
        return data.map(t => ({
          id: t.id,
          school: t.school,
          mascot: t.mascot || '',
          abbreviation: t.abbreviation || '',
          conference: t.conference || '',
          division: t.division || undefined,
          color: t.color || '#000000',
          alt_color: t.alt_color || '#ffffff',
          logos: t.logo_url ? [t.logo_url] : [],
        }));
      }
    }

    // Fallback to direct API
    const params = year ? { year } : {};
    const response = await api.get('/teams', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getTeams');
  }
};

export const getTeamRecords = async (year: number, team?: string): Promise<TeamRecord[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('team_records', year);
    if (hasData) {
      let query = supabase
        .from('team_records')
        .select('*')
        .eq('season', year)
        .order('total_wins', { ascending: false });

      if (team) {
        query = query.eq('team', team);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map(r => ({
          year: r.season,
          team: r.team,
          conference: r.conference || '',
          total: {
            games: r.total_wins + r.total_losses + r.total_ties,
            wins: r.total_wins,
            losses: r.total_losses,
            ties: r.total_ties,
          },
          conferenceGames: {
            games: r.conference_wins + r.conference_losses + r.conference_ties,
            wins: r.conference_wins,
            losses: r.conference_losses,
            ties: r.conference_ties,
          },
        }));
      }
    }

    // Fallback to direct API
    const params: Record<string, unknown> = { year };
    if (team) params.team = team;
    const response = await api.get('/records', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getTeamRecords');
  }
};

export const getGames = async (year: number, week?: number, team?: string): Promise<Game[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('games', year);
    if (hasData) {
      let query = supabase
        .from('games')
        .select('*')
        .eq('season', year)
        .order('start_date', { ascending: false });

      if (week) {
        query = query.eq('week', week);
      }
      if (team) {
        query = query.or(`home_team.eq.${team},away_team.eq.${team}`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map(g => ({
          id: g.cfbd_id || g.id,
          season: g.season,
          week: g.week,
          season_type: g.season_type || 'regular',
          start_date: g.start_date,
          home_team: g.home_team,
          home_conference: g.home_conference || '',
          home_points: g.home_points || 0,
          away_team: g.away_team,
          away_conference: g.away_conference || '',
          away_points: g.away_points || 0,
          venue: g.venue || '',
          attendance: g.attendance || undefined,
          excitement_index: g.excitement_index || undefined,
        }));
      }
    }

    // Fallback to direct API
    const params: Record<string, unknown> = { year };
    if (week) params.week = week;
    if (team) params.team = team;
    const response = await api.get('/games', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getGames');
  }
};

export const getRankings = async (year: number, week?: number): Promise<RankingWeek[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('rankings', year);
    if (hasData) {
      let query = supabase
        .from('rankings')
        .select('*')
        .eq('season', year)
        .order('rank');

      if (week) {
        query = query.eq('week', week);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // Group by week and poll type
        const groupedByWeek: Record<number, Record<string, Rank[]>> = {};

        data.forEach(r => {
          if (!groupedByWeek[r.week]) {
            groupedByWeek[r.week] = {};
          }
          if (!groupedByWeek[r.week][r.poll_type]) {
            groupedByWeek[r.week][r.poll_type] = [];
          }
          groupedByWeek[r.week][r.poll_type].push({
            rank: r.rank,
            school: r.school,
            conference: r.conference || '',
            firstPlaceVotes: r.first_place_votes || 0,
            points: r.points || 0,
          });
        });

        // Convert to RankingWeek format
        return Object.entries(groupedByWeek).map(([weekNum, polls]) => ({
          season: year,
          seasonType: 'regular',
          week: parseInt(weekNum),
          polls: Object.entries(polls).map(([pollName, ranks]) => ({
            poll: pollName,
            ranks: ranks.sort((a, b) => a.rank - b.rank),
          })),
        }));
      }
    }

    // Fallback to direct API
    const params: Record<string, unknown> = { year };
    if (week) params.week = week;
    const response = await api.get('/rankings', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getRankings');
  }
};

export const getPlayerSeasonStats = async (
  year: number,
  category?: string,
  team?: string
): Promise<PlayerSeasonStat[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('player_stats', year);
    if (hasData) {
      let query = supabase
        .from('player_stats')
        .select('*')
        .eq('season', year)
        .order('stat_value', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }
      if (team) {
        query = query.eq('team', team);
      }

      const { data, error } = await query.limit(500);

      if (!error && data && data.length > 0) {
        return data.map(p => ({
          season: p.season,
          team: p.team,
          conference: p.conference || '',
          player: p.player_name,
          category: p.category,
          statType: p.stat_type,
          stat: p.stat_value,
        }));
      }
    }

    // Fallback to direct API
    const params: Record<string, unknown> = { year };
    if (category) params.category = category;
    if (team) params.team = team;
    const response = await api.get('/stats/player/season', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getPlayerSeasonStats');
  }
};

export const getTeamStats = async (year: number, team?: string): Promise<TeamStat[]> => {
  try {
    const params: Record<string, unknown> = { year };
    if (team) params.team = team;
    const response = await api.get('/stats/season', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getTeamStats');
  }
};

export const getAdvancedStats = async (year: number, team?: string): Promise<AdvancedStat[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('advanced_stats', year);
    if (hasData) {
      let query = supabase
        .from('advanced_stats')
        .select('*')
        .eq('season', year);

      if (team) {
        query = query.eq('team', team);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map(s => ({
          season: s.season,
          team: s.team,
          conference: s.conference || '',
          offense: {
            plays: s.off_plays || 0,
            drives: s.off_drives || 0,
            ppa: s.off_ppa || 0,
            totalPPA: s.off_total_ppa || 0,
            successRate: s.off_success_rate || 0,
            explosiveness: s.off_explosiveness || 0,
            powerSuccess: s.off_power_success || 0,
            stuffRate: s.off_stuff_rate || 0,
            lineYards: s.off_line_yards || 0,
            secondLevelYards: s.off_second_level_yards || 0,
            openFieldYards: s.off_open_field_yards || 0,
          },
          defense: {
            plays: s.def_plays || 0,
            drives: s.def_drives || 0,
            ppa: s.def_ppa || 0,
            totalPPA: s.def_total_ppa || 0,
            successRate: s.def_success_rate || 0,
            explosiveness: s.def_explosiveness || 0,
            powerSuccess: s.def_power_success || 0,
            stuffRate: s.def_stuff_rate || 0,
            lineYards: s.def_line_yards || 0,
            secondLevelYards: s.def_second_level_yards || 0,
            openFieldYards: s.def_open_field_yards || 0,
          },
        }));
      }
    }

    // Fallback to direct API
    const params: Record<string, unknown> = { year };
    if (team) params.team = team;
    const response = await api.get('/stats/season/advanced', { params });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getAdvancedStats');
  }
};

export const getConferences = async (): Promise<string[]> => {
  try {
    // Try Supabase first
    const hasData = await hasSupabaseData('conferences');
    if (hasData) {
      const { data, error } = await supabase
        .from('conferences')
        .select('name')
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map(c => c.name);
      }
    }

    // Fallback to direct API
    const response = await api.get('/conferences');
    return response.data.map((conf: { name: string }) => conf.name);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    handleApiError(error, 'getConferences');
  }
};

// =====================
// Supabase-specific functions
// =====================

export const getAvailableSeasons = async (): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('season')
      .order('season', { ascending: false });

    if (error) throw error;

    // Get unique seasons
    const seasons = [...new Set(data?.map(d => d.season) || [])];
    return seasons.length > 0 ? seasons : Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  } catch {
    // Return default years if Supabase fails
    return Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  }
};

export const getLastSyncInfo = async (): Promise<{ lastSync: string | null; status: string }> => {
  try {
    const { data, error } = await supabase
      .from('data_sync_log')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { lastSync: null, status: 'No data synced yet' };
    }

    return {
      lastSync: data[0].completed_at,
      status: `Last synced: ${new Date(data[0].completed_at).toLocaleString()}`,
    };
  } catch {
    return { lastSync: null, status: 'Unable to check sync status' };
  }
};
