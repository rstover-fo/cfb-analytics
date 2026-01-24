/**
 * Test Fixtures
 *
 * Factory functions for creating test data.
 * All factories return type-safe objects matching the domain types.
 */

import type { Game, Play, Drive, Team, TeamRecord } from '@/types/cfb';

// ============================================================================
// Game Fixtures
// ============================================================================

export interface GameFixtureOptions {
  id?: number;
  season?: number;
  week?: number;
  homeTeam?: string;
  awayTeam?: string;
  homePoints?: number | null;
  awayPoints?: number | null;
  venue?: string | null;
  conferenceGame?: boolean;
}

export function createGame(options: GameFixtureOptions = {}): Game {
  const id = options.id ?? Math.floor(Math.random() * 1000000);
  return {
    id,
    season: options.season ?? 2024,
    week: options.week ?? 1,
    season_type: 'regular',
    start_date: '2024-09-01T19:00:00.000Z',
    neutral_site: false,
    conference_game: options.conferenceGame ?? false,
    attendance: 85000,
    venue_id: 1,
    venue: options.venue ?? 'Gaylord Family Oklahoma Memorial Stadium',
    home_id: 201,
    home_team: options.homeTeam ?? 'Oklahoma',
    home_conference: 'SEC',
    home_points: options.homePoints ?? 35,
    home_line_scores: [7, 14, 7, 7],
    away_id: 202,
    away_team: options.awayTeam ?? 'Houston',
    away_conference: 'Big 12',
    away_points: options.awayPoints ?? 14,
    away_line_scores: [0, 7, 0, 7],
    excitement_index: 5.5,
  };
}

export function createGames(count: number, baseOptions: GameFixtureOptions = {}): Game[] {
  return Array.from({ length: count }, (_, i) =>
    createGame({
      ...baseOptions,
      id: (baseOptions.id ?? 1000) + i,
      week: (baseOptions.week ?? 1) + i,
    })
  );
}

// ============================================================================
// Play Fixtures
// ============================================================================

export interface PlayFixtureOptions {
  id?: number;
  gameId?: number;
  driveId?: number;
  driveNumber?: number;
  playNumber?: number;
  offense?: string;
  defense?: string;
  down?: number;
  distance?: number;
  yardsGained?: number;
  playType?: string;
  ppa?: number | null;
  scoring?: boolean;
}

export function createPlay(options: PlayFixtureOptions = {}): Play {
  const id = options.id ?? Math.floor(Math.random() * 1000000);
  return {
    id,
    game_id: options.gameId ?? 1,
    drive_id: options.driveId ?? 1,
    drive_number: options.driveNumber ?? 1,
    play_number: options.playNumber ?? 1,
    offense: options.offense ?? 'Oklahoma',
    offense_conference: 'SEC',
    defense: options.defense ?? 'Houston',
    defense_conference: 'Big 12',
    home: 'Oklahoma',
    away: 'Houston',
    offense_score: 7,
    defense_score: 0,
    period: 1,
    clock: { minutes: 12, seconds: 30 },
    yard_line: 25,
    down: options.down ?? 1,
    distance: options.distance ?? 10,
    yards_gained: options.yardsGained ?? 5,
    play_type: options.playType ?? 'Rush',
    play_text: 'Player rushes for 5 yards',
    ppa: options.ppa ?? 0.15,
    scoring: options.scoring ?? false,
    home_favorites: true,
    spread: -14.5,
  };
}

export function createPlays(count: number, baseOptions: PlayFixtureOptions = {}): Play[] {
  return Array.from({ length: count }, (_, i) =>
    createPlay({
      ...baseOptions,
      id: (baseOptions.id ?? 1000) + i,
      playNumber: (baseOptions.playNumber ?? 1) + i,
    })
  );
}

// ============================================================================
// Drive Fixtures
// ============================================================================

export interface DriveFixtureOptions {
  id?: number;
  gameId?: number;
  driveNumber?: number;
  offense?: string;
  defense?: string;
  scoring?: boolean;
  plays?: number;
  yards?: number;
  driveResult?: string;
}

export function createDrive(options: DriveFixtureOptions = {}): Drive {
  const id = options.id ?? Math.floor(Math.random() * 1000000);
  return {
    id,
    game_id: options.gameId ?? 1,
    offense: options.offense ?? 'Oklahoma',
    offense_conference: 'SEC',
    defense: options.defense ?? 'Houston',
    defense_conference: 'Big 12',
    drive_number: options.driveNumber ?? 1,
    scoring: options.scoring ?? false,
    start_period: 1,
    start_yardline: 25,
    start_yards_to_goal: 75,
    start_time: { minutes: 15, seconds: 0 },
    end_period: 1,
    end_yardline: 0,
    end_yards_to_goal: 0,
    end_time: { minutes: 10, seconds: 30 },
    plays: options.plays ?? 8,
    yards: options.yards ?? 75,
    drive_result: options.driveResult ?? 'PUNT',
    elapsed: { minutes: 4, seconds: 30 },
  };
}

export function createDrives(count: number, baseOptions: DriveFixtureOptions = {}): Drive[] {
  return Array.from({ length: count }, (_, i) =>
    createDrive({
      ...baseOptions,
      id: (baseOptions.id ?? 1000) + i,
      driveNumber: (baseOptions.driveNumber ?? 1) + i,
    })
  );
}

// ============================================================================
// Team Fixtures
// ============================================================================

export interface TeamFixtureOptions {
  id?: number;
  school?: string;
  mascot?: string;
  conference?: string;
}

export function createTeam(options: TeamFixtureOptions = {}): Team {
  return {
    id: options.id ?? 201,
    school: options.school ?? 'Oklahoma',
    mascot: options.mascot ?? 'Sooners',
    abbreviation: 'OU',
    conference: options.conference ?? 'SEC',
    division: null,
    color: '#841617',
    alt_color: '#FDF9D8',
    logos: ['https://a.espncdn.com/i/teamlogos/ncaa/500/201.png'],
  };
}

// ============================================================================
// Team Record Fixtures
// ============================================================================

export interface TeamRecordFixtureOptions {
  year?: number;
  team?: string;
  wins?: number;
  losses?: number;
}

export function createTeamRecord(options: TeamRecordFixtureOptions = {}): TeamRecord {
  const wins = options.wins ?? 10;
  const losses = options.losses ?? 2;
  return {
    year: options.year ?? 2024,
    team: options.team ?? 'Oklahoma',
    conference: 'SEC',
    division: null,
    total: {
      games: wins + losses,
      wins,
      losses,
      ties: 0,
    },
    conference_games: {
      games: 8,
      wins: 6,
      losses: 2,
      ties: 0,
    },
    home_games: {
      games: 6,
      wins: 6,
      losses: 0,
      ties: 0,
    },
    away_games: {
      games: 6,
      wins: 4,
      losses: 2,
      ties: 0,
    },
  };
}

// ============================================================================
// Database Row Fixtures (for mocking DuckDB results)
// ============================================================================

/**
 * Creates a raw database row matching the games table schema
 */
export function createGameRow(options: GameFixtureOptions = {}) {
  return {
    game_id: options.id ?? 1,
    season: options.season ?? 2024,
    week: options.week ?? 1,
    season_type: 'regular',
    start_date: '2024-09-01T19:00:00.000Z',
    neutral_site: false,
    conference_game: options.conferenceGame ?? false,
    attendance: 85000,
    venue: options.venue ?? 'Gaylord Family Oklahoma Memorial Stadium',
    home_team: options.homeTeam ?? 'Oklahoma',
    home_id: 201,
    home_conference: 'SEC',
    home_points: options.homePoints ?? 35,
    away_team: options.awayTeam ?? 'Houston',
    away_id: 202,
    away_conference: 'Big 12',
    away_points: options.awayPoints ?? 14,
    spread: -14.5,
    over_under: 55.5,
    excitement_index: 5.5,
  };
}

/**
 * Creates a raw database row matching the plays table schema
 */
export function createPlayRow(options: PlayFixtureOptions = {}) {
  return {
    play_id: options.id ?? 1,
    game_id: options.gameId ?? 1,
    drive_id: options.driveId ?? 1,
    drive_number: options.driveNumber ?? 1,
    play_number: options.playNumber ?? 1,
    period: 1,
    clock_minutes: 12,
    clock_seconds: 30,
    offense: options.offense ?? 'Oklahoma',
    defense: options.defense ?? 'Houston',
    yard_line: 25,
    down: options.down ?? 1,
    distance: options.distance ?? 10,
    yards_gained: options.yardsGained ?? 5,
    play_type: options.playType ?? 'Rush',
    play_text: 'Player rushes for 5 yards',
    scoring: options.scoring ?? false,
    ppa: options.ppa ?? 0.15,
    epa: 0.12,
    success: true,
  };
}

/**
 * Creates a raw database row matching the drives table schema
 */
export function createDriveRow(options: DriveFixtureOptions = {}) {
  return {
    drive_id: options.id ?? 1,
    game_id: options.gameId ?? 1,
    drive_number: options.driveNumber ?? 1,
    offense: options.offense ?? 'Oklahoma',
    defense: options.defense ?? 'Houston',
    scoring: options.scoring ?? false,
    start_period: 1,
    start_yardline: 25,
    start_yards_to_goal: 75,
    end_period: 1,
    end_yardline: 0,
    end_yards_to_goal: 0,
    plays: options.plays ?? 8,
    yards: options.yards ?? 75,
    drive_result: options.driveResult ?? 'PUNT',
    elapsed_minutes: 4,
    elapsed_seconds: 30,
  };
}
