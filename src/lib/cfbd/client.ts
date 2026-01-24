/**
 * CFBD API Client
 * Documentation: https://api.collegefootballdata.com/api/docs
 */

import type {
  Game,
  Play,
  Drive,
  Team,
  TeamRecord,
  Recruit,
  TransferPortal,
  AdvancedStats,
  TeamRecruitingRank,
  PositionGroup,
  RosterPlayer,
} from '@/types/cfb';

const BASE_URL = 'https://api.collegefootballdata.com';

interface CFBDClientConfig {
  apiKey: string;
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
}

class CFBDClient {
  private apiKey: string;
  private rateLimitDelay = 100; // ms between requests

  constructor(config: CFBDClientConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CFBD API error (${response.status}): ${error}`);
    }

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));

    return response.json() as Promise<T>;
  }

  // Teams
  async getTeams(params?: { conference?: string }): Promise<Team[]> {
    return this.request<Team[]>('/teams', { params });
  }

  async getTeam(team: string): Promise<Team | undefined> {
    const teams = await this.getTeams();
    return teams.find((t) => t.school.toLowerCase() === team.toLowerCase());
  }

  // Games
  async getGames(params: {
    year: number;
    week?: number;
    team?: string;
    seasonType?: 'regular' | 'postseason' | 'both';
  }): Promise<Game[]> {
    return this.request<Game[]>('/games', {
      params: {
        year: params.year,
        week: params.week,
        team: params.team,
        seasonType: params.seasonType,
      },
    });
  }

  async getGame(gameId: number): Promise<Game | undefined> {
    const games = await this.request<Game[]>('/games', {
      params: { id: gameId },
    });
    return games[0];
  }

  async getTeamGames(team: string, year: number): Promise<Game[]> {
    return this.getGames({ year, team });
  }

  // Plays
  async getPlays(params: {
    year: number;
    week?: number;
    team?: string;
    gameId?: number;
    playType?: string;
  }): Promise<Play[]> {
    return this.request<Play[]>('/plays', {
      params: {
        year: params.year,
        week: params.week,
        team: params.team,
        gameId: params.gameId,
        playType: params.playType,
      },
    });
  }

  async getGamePlays(gameId: number, year: number): Promise<Play[]> {
    return this.getPlays({ year, gameId });
  }

  // Drives
  async getDrives(params: {
    year: number;
    team?: string;
    week?: number;
    gameId?: number;
  }): Promise<Drive[]> {
    return this.request<Drive[]>('/drives', {
      params: {
        year: params.year,
        team: params.team,
        week: params.week,
      },
    });
  }

  async getGameDrives(year: number, week: number, team?: string): Promise<Drive[]> {
    return this.getDrives({ year, week, team });
  }

  // Records
  async getRecords(params: {
    year?: number;
    team?: string;
    conference?: string;
  }): Promise<TeamRecord[]> {
    return this.request<TeamRecord[]>('/records', { params });
  }

  async getTeamRecord(team: string, year: number): Promise<TeamRecord | undefined> {
    const records = await this.getRecords({ team, year });
    return records[0];
  }

  async getTeamHistoricalRecords(
    team: string,
    startYear: number,
    endYear: number
  ): Promise<TeamRecord[]> {
    const records: TeamRecord[] = [];
    for (let year = startYear; year <= endYear; year++) {
      const record = await this.getTeamRecord(team, year);
      if (record) {
        records.push(record);
      }
    }
    return records;
  }

  // Advanced Stats
  async getAdvancedStats(params: {
    year: number;
    team?: string;
    excludeGarbageTime?: boolean;
  }): Promise<AdvancedStats[]> {
    return this.request<AdvancedStats[]>('/stats/season/advanced', {
      params: {
        year: params.year,
        team: params.team,
        excludeGarbageTime: params.excludeGarbageTime,
      },
    });
  }

  async getTeamAdvancedStats(team: string, year: number): Promise<AdvancedStats | undefined> {
    const stats = await this.getAdvancedStats({ year, team });
    return stats[0];
  }

  // Recruiting
  async getRecruits(params: {
    year: number;
    team?: string;
    position?: string;
    classification?: 'HighSchool' | 'JUCO' | 'PrepSchool';
  }): Promise<Recruit[]> {
    return this.request<Recruit[]>('/recruiting/players', {
      params: {
        year: params.year,
        team: params.team,
        position: params.position,
        classification: params.classification,
      },
    });
  }

  async getTeamRecruits(team: string, year: number): Promise<Recruit[]> {
    return this.getRecruits({ year, team });
  }

  // Team Recruiting Rankings
  async getTeamRankings(params: { year: number; team?: string }): Promise<TeamRecruitingRank[]> {
    return this.request<TeamRecruitingRank[]>('/recruiting/teams', {
      params: {
        year: params.year,
        team: params.team,
      },
    });
  }

  // Position Group Rankings
  async getPositionGroups(params: {
    year: number;
    team?: string;
    conference?: string;
  }): Promise<PositionGroup[]> {
    return this.request<PositionGroup[]>('/recruiting/groups', {
      params: {
        startYear: params.year,
        endYear: params.year,
        team: params.team,
        conference: params.conference,
      },
    });
  }

  // Roster
  async getRoster(params: { team: string; year?: number }): Promise<RosterPlayer[]> {
    return this.request<RosterPlayer[]>('/roster', {
      params: {
        team: params.team,
        year: params.year,
      },
    });
  }

  async getTeamRoster(team: string, year: number): Promise<RosterPlayer[]> {
    return this.getRoster({ team, year });
  }

  // Transfer Portal
  async getTransferPortal(year: number): Promise<TransferPortal[]> {
    return this.request<TransferPortal[]>('/player/portal', {
      params: { year },
    });
  }

  async getTeamTransfers(
    team: string,
    year: number
  ): Promise<{ incoming: TransferPortal[]; outgoing: TransferPortal[] }> {
    const allTransfers = await this.getTransferPortal(year);
    return {
      incoming: allTransfers.filter((t) => t.destination?.toLowerCase() === team.toLowerCase()),
      outgoing: allTransfers.filter((t) => t.origin.toLowerCase() === team.toLowerCase()),
    };
  }
}

// Singleton instance
let client: CFBDClient | null = null;

export function getCFBDClient(): CFBDClient {
  if (!client) {
    const apiKey = process.env.CFBD_API_KEY;
    if (!apiKey) {
      throw new Error('CFBD_API_KEY environment variable is not set');
    }
    client = new CFBDClient({ apiKey });
  }
  return client;
}

export { CFBDClient };
