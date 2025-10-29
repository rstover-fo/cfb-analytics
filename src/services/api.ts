import axios from 'axios';

const API_BASE_URL = 'https://api.collegefootballdata.com';

// Note: For production use, you should get your own API key from https://collegefootballdata.com/
// and store it in environment variables
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// API Functions
export const getTeams = async (year?: number): Promise<Team[]> => {
  try {
    const params = year ? { year } : {};
    const response = await api.get('/teams', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
};

export const getTeamRecords = async (year: number, team?: string): Promise<TeamRecord[]> => {
  try {
    const params: any = { year };
    if (team) params.team = team;
    const response = await api.get('/records', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching team records:', error);
    return [];
  }
};

export const getGames = async (year: number, week?: number, team?: string): Promise<Game[]> => {
  try {
    const params: any = { year };
    if (week) params.week = week;
    if (team) params.team = team;
    const response = await api.get('/games', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
};

export const getRankings = async (year: number, week?: number): Promise<RankingWeek[]> => {
  try {
    const params: any = { year };
    if (week) params.week = week;
    const response = await api.get('/rankings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

export const getPlayerSeasonStats = async (
  year: number,
  category?: string,
  team?: string
): Promise<PlayerSeasonStat[]> => {
  try {
    const params: any = { year };
    if (category) params.category = category;
    if (team) params.team = team;
    const response = await api.get('/stats/player/season', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return [];
  }
};

export const getTeamStats = async (year: number, team?: string): Promise<TeamStat[]> => {
  try {
    const params: any = { year };
    if (team) params.team = team;
    const response = await api.get('/stats/season', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return [];
  }
};

export const getAdvancedStats = async (year: number, team?: string): Promise<AdvancedStat[]> => {
  try {
    const params: any = { year };
    if (team) params.team = team;
    const response = await api.get('/stats/season/advanced', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching advanced stats:', error);
    return [];
  }
};

export const getConferences = async (): Promise<string[]> => {
  try {
    const response = await api.get('/conferences');
    return response.data.map((conf: any) => conf.name);
  } catch (error) {
    console.error('Error fetching conferences:', error);
    return [];
  }
};
