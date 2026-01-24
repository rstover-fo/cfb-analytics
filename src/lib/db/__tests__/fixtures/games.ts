/**
 * Game-related Test Fixtures
 *
 * Specialized fixtures for testing core query functions.
 * Provides pre-built scenarios for common test cases.
 */

// ============================================================================
// Database Row Factories (match DuckDB query result format)
// ============================================================================

export interface SeasonGameRow {
  id: number;
  season: number;
  week: number;
  season_type: string;
  start_date: string;
  venue: string;
  home_team: string;
  home_points: number;
  home_conference: string;
  away_team: string;
  away_points: number;
  away_conference: string;
  completed: boolean;
  conference_game: boolean;
  attendance: number | null;
  excitement_index: number | null;
}

/**
 * Creates a game row matching the database schema
 */
export function createSeasonGameRow(options: Partial<SeasonGameRow> = {}): SeasonGameRow {
  return {
    id: options.id ?? 1,
    season: options.season ?? 2024,
    week: options.week ?? 1,
    season_type: options.season_type ?? 'regular',
    start_date: options.start_date ?? '2024-09-01T19:00:00.000Z',
    venue: options.venue ?? 'Gaylord Family Oklahoma Memorial Stadium',
    home_team: options.home_team ?? 'Oklahoma',
    home_points: options.home_points ?? 35,
    home_conference: options.home_conference ?? 'SEC',
    away_team: options.away_team ?? 'Houston',
    away_points: options.away_points ?? 14,
    away_conference: options.away_conference ?? 'Big 12',
    completed: options.completed ?? true,
    conference_game: options.conference_game ?? false,
    attendance: options.attendance ?? 85000,
    excitement_index: options.excitement_index ?? 5.5,
  };
}

// ============================================================================
// Pre-built Test Scenarios
// ============================================================================

/**
 * A complete 2024 season for Oklahoma with varied results
 * - 12 games total
 * - 10 wins, 2 losses
 * - 6 conference games (5-1)
 * - Mix of home/away games
 */
export function create2024SeasonGames(): SeasonGameRow[] {
  return [
    // Week 1: Home win vs Houston (non-conf)
    createSeasonGameRow({
      id: 1001,
      season: 2024,
      week: 1,
      home_team: 'Oklahoma',
      away_team: 'Houston',
      home_points: 35,
      away_points: 14,
      conference_game: false,
      start_date: '2024-09-01T19:00:00.000Z',
    }),
    // Week 2: Away win at Temple (non-conf)
    createSeasonGameRow({
      id: 1002,
      season: 2024,
      week: 2,
      home_team: 'Temple',
      away_team: 'Oklahoma',
      home_points: 10,
      away_points: 45,
      conference_game: false,
      start_date: '2024-09-07T19:00:00.000Z',
    }),
    // Week 3: Home win vs Tulane (non-conf)
    createSeasonGameRow({
      id: 1003,
      season: 2024,
      week: 3,
      home_team: 'Oklahoma',
      away_team: 'Tulane',
      home_points: 34,
      away_points: 19,
      conference_game: false,
      start_date: '2024-09-14T19:00:00.000Z',
    }),
    // Week 4: SEC opener - Home win vs Tennessee
    createSeasonGameRow({
      id: 1004,
      season: 2024,
      week: 4,
      home_team: 'Oklahoma',
      away_team: 'Tennessee',
      home_points: 25,
      away_points: 15,
      conference_game: true,
      start_date: '2024-09-21T19:00:00.000Z',
    }),
    // Week 5: Away LOSS at Auburn
    createSeasonGameRow({
      id: 1005,
      season: 2024,
      week: 5,
      home_team: 'Auburn',
      away_team: 'Oklahoma',
      home_points: 21,
      away_points: 14,
      conference_game: true,
      start_date: '2024-09-28T19:00:00.000Z',
    }),
    // Week 6: Home win vs Texas
    createSeasonGameRow({
      id: 1006,
      season: 2024,
      week: 6,
      home_team: 'Oklahoma',
      away_team: 'Texas',
      home_points: 34,
      away_points: 30,
      conference_game: true,
      start_date: '2024-10-05T15:30:00.000Z',
    }),
    // Week 7: BYE
    // Week 8: Away win at South Carolina
    createSeasonGameRow({
      id: 1007,
      season: 2024,
      week: 8,
      home_team: 'South Carolina',
      away_team: 'Oklahoma',
      home_points: 17,
      away_points: 28,
      conference_game: true,
      start_date: '2024-10-19T19:00:00.000Z',
    }),
    // Week 9: Home win vs Ole Miss
    createSeasonGameRow({
      id: 1008,
      season: 2024,
      week: 9,
      home_team: 'Oklahoma',
      away_team: 'Ole Miss',
      home_points: 31,
      away_points: 24,
      conference_game: true,
      start_date: '2024-10-26T19:00:00.000Z',
    }),
    // Week 10: Away LOSS at LSU
    createSeasonGameRow({
      id: 1009,
      season: 2024,
      week: 10,
      home_team: 'LSU',
      away_team: 'Oklahoma',
      home_points: 35,
      away_points: 28,
      conference_game: true,
      start_date: '2024-11-02T19:00:00.000Z',
    }),
    // Week 11: Home win vs Missouri
    createSeasonGameRow({
      id: 1010,
      season: 2024,
      week: 11,
      home_team: 'Oklahoma',
      away_team: 'Missouri',
      home_points: 24,
      away_points: 17,
      conference_game: true,
      start_date: '2024-11-09T19:00:00.000Z',
    }),
    // Week 12: Away win at Alabama
    createSeasonGameRow({
      id: 1011,
      season: 2024,
      week: 12,
      home_team: 'Alabama',
      away_team: 'Oklahoma',
      home_points: 20,
      away_points: 27,
      conference_game: true,
      start_date: '2024-11-16T19:00:00.000Z',
    }),
    // Week 13: Home win vs Oklahoma State (non-conf rivalry)
    createSeasonGameRow({
      id: 1012,
      season: 2024,
      week: 13,
      home_team: 'Oklahoma',
      away_team: 'Oklahoma State',
      home_points: 42,
      away_points: 7,
      conference_game: false,
      start_date: '2024-11-23T19:00:00.000Z',
    }),
  ];
}

/**
 * Season with upcoming (incomplete) games
 */
export function createSeasonWithUpcomingGames(): SeasonGameRow[] {
  return [
    // Completed games
    createSeasonGameRow({
      id: 2001,
      season: 2024,
      week: 1,
      home_team: 'Oklahoma',
      away_team: 'Houston',
      home_points: 35,
      away_points: 14,
      completed: true,
      start_date: '2024-09-01T19:00:00.000Z',
    }),
    createSeasonGameRow({
      id: 2002,
      season: 2024,
      week: 2,
      home_team: 'Temple',
      away_team: 'Oklahoma',
      home_points: 10,
      away_points: 45,
      completed: true,
      start_date: '2024-09-07T19:00:00.000Z',
    }),
    // Upcoming games (not completed)
    createSeasonGameRow({
      id: 2003,
      season: 2024,
      week: 3,
      home_team: 'Oklahoma',
      away_team: 'Tulane',
      home_points: 0,
      away_points: 0,
      completed: false,
      start_date: '2024-09-14T19:00:00.000Z',
    }),
    createSeasonGameRow({
      id: 2004,
      season: 2024,
      week: 4,
      home_team: 'Oklahoma',
      away_team: 'Tennessee',
      home_points: 0,
      away_points: 0,
      completed: false,
      start_date: '2024-09-21T19:00:00.000Z',
    }),
    createSeasonGameRow({
      id: 2005,
      season: 2024,
      week: 5,
      home_team: 'Auburn',
      away_team: 'Oklahoma',
      home_points: 0,
      away_points: 0,
      completed: false,
      start_date: '2024-09-28T19:00:00.000Z',
    }),
  ];
}

/**
 * Multiple seasons for getAvailableSeasons testing
 */
export function createMultipleSeasons(): SeasonGameRow[] {
  return [
    createSeasonGameRow({ id: 3001, season: 2024, week: 1 }),
    createSeasonGameRow({ id: 3002, season: 2024, week: 2 }),
    createSeasonGameRow({ id: 3003, season: 2023, week: 1 }),
    createSeasonGameRow({ id: 3004, season: 2023, week: 2 }),
    createSeasonGameRow({ id: 3005, season: 2022, week: 1 }),
    createSeasonGameRow({ id: 3006, season: 2021, week: 1 }),
    createSeasonGameRow({ id: 3007, season: 2020, week: 1 }),
  ];
}

// ============================================================================
// Drive Test Data
// ============================================================================

export interface DriveRow {
  id: string;
  game_id: number;
  drive_number: number;
  offense: string;
  defense: string;
  start_period: number;
  start_yards_to_goal: number;
  end_yards_to_goal: number;
  plays: number;
  yards: number;
  drive_result: string;
  scoring: boolean;
  elapsed_minutes: number;
  elapsed_seconds: number;
}

export function createDriveRow(options: Partial<DriveRow> = {}): DriveRow {
  return {
    id: options.id ?? 'drive-1',
    game_id: options.game_id ?? 1001,
    drive_number: options.drive_number ?? 1,
    offense: options.offense ?? 'Oklahoma',
    defense: options.defense ?? 'Houston',
    start_period: options.start_period ?? 1,
    start_yards_to_goal: options.start_yards_to_goal ?? 75,
    end_yards_to_goal: options.end_yards_to_goal ?? 0,
    plays: options.plays ?? 8,
    yards: options.yards ?? 75,
    drive_result: options.drive_result ?? 'TD',
    scoring: options.scoring ?? true,
    elapsed_minutes: options.elapsed_minutes ?? 4,
    elapsed_seconds: options.elapsed_seconds ?? 30,
  };
}

export function createGameDrives(gameId: number = 1001): DriveRow[] {
  return [
    createDriveRow({
      id: `drive-${gameId}-1`,
      game_id: gameId,
      drive_number: 1,
      offense: 'Oklahoma',
      defense: 'Houston',
      start_yards_to_goal: 75,
      end_yards_to_goal: 0,
      plays: 8,
      yards: 75,
      drive_result: 'TD',
      scoring: true,
    }),
    createDriveRow({
      id: `drive-${gameId}-2`,
      game_id: gameId,
      drive_number: 2,
      offense: 'Houston',
      defense: 'Oklahoma',
      start_yards_to_goal: 75,
      end_yards_to_goal: 35,
      plays: 5,
      yards: 40,
      drive_result: 'PUNT',
      scoring: false,
    }),
    createDriveRow({
      id: `drive-${gameId}-3`,
      game_id: gameId,
      drive_number: 3,
      offense: 'Oklahoma',
      defense: 'Houston',
      start_yards_to_goal: 65,
      end_yards_to_goal: 0,
      plays: 6,
      yards: 65,
      drive_result: 'TD',
      scoring: true,
    }),
    createDriveRow({
      id: `drive-${gameId}-4`,
      game_id: gameId,
      drive_number: 4,
      offense: 'Houston',
      defense: 'Oklahoma',
      start_yards_to_goal: 75,
      end_yards_to_goal: 45,
      plays: 3,
      yards: 30,
      drive_result: 'INT',
      scoring: false,
    }),
  ];
}

// ============================================================================
// Play Test Data
// ============================================================================

export interface PlayRow {
  id: string;
  game_id: number;
  drive_id: string;
  drive_number: number;
  play_number: number;
  period: number;
  clock_minutes: number;
  clock_seconds: number;
  offense: string;
  defense: string;
  offense_score: number;
  defense_score: number;
  down: number | null;
  distance: number | null;
  yards_gained: number;
  play_type: string;
  play_text: string;
  ppa: number | null;
  scoring: boolean;
}

export function createPlayRow(options: Partial<PlayRow> = {}): PlayRow {
  return {
    id: options.id ?? 'play-1',
    game_id: options.game_id ?? 1001,
    drive_id: options.drive_id ?? 'drive-1',
    drive_number: options.drive_number ?? 1,
    play_number: options.play_number ?? 1,
    period: options.period ?? 1,
    clock_minutes: options.clock_minutes ?? 15,
    clock_seconds: options.clock_seconds ?? 0,
    offense: options.offense ?? 'Oklahoma',
    defense: options.defense ?? 'Houston',
    offense_score: options.offense_score ?? 0,
    defense_score: options.defense_score ?? 0,
    down: options.down ?? 1,
    distance: options.distance ?? 10,
    yards_gained: options.yards_gained ?? 5,
    play_type: options.play_type ?? 'Rush',
    play_text: options.play_text ?? 'Player rushes for 5 yards',
    ppa: options.ppa ?? 0.15,
    scoring: options.scoring ?? false,
  };
}

export function createGamePlays(gameId: number = 1001): PlayRow[] {
  return [
    createPlayRow({
      id: `play-${gameId}-1`,
      game_id: gameId,
      drive_id: `drive-${gameId}-1`,
      drive_number: 1,
      play_number: 1,
      down: 1,
      distance: 10,
      yards_gained: 8,
      play_type: 'Rush',
      play_text: 'Jackson rushes for 8 yards',
    }),
    createPlayRow({
      id: `play-${gameId}-2`,
      game_id: gameId,
      drive_id: `drive-${gameId}-1`,
      drive_number: 1,
      play_number: 2,
      down: 2,
      distance: 2,
      yards_gained: 15,
      play_type: 'Pass Reception',
      play_text: 'Williams pass complete to Smith for 15 yards',
    }),
    createPlayRow({
      id: `play-${gameId}-3`,
      game_id: gameId,
      drive_id: `drive-${gameId}-1`,
      drive_number: 1,
      play_number: 3,
      down: 1,
      distance: 10,
      yards_gained: 52,
      play_type: 'Pass Reception',
      play_text: 'Williams pass complete to Jones for 52 yard TOUCHDOWN',
      scoring: true,
    }),
    createPlayRow({
      id: `play-${gameId}-4`,
      game_id: gameId,
      drive_id: `drive-${gameId}-2`,
      drive_number: 2,
      play_number: 1,
      offense: 'Houston',
      defense: 'Oklahoma',
      down: 1,
      distance: 10,
      yards_gained: 3,
      play_type: 'Rush',
      play_text: 'Martinez rushes for 3 yards',
    }),
    createPlayRow({
      id: `play-${gameId}-5`,
      game_id: gameId,
      drive_id: `drive-${gameId}-2`,
      drive_number: 2,
      play_number: 2,
      offense: 'Houston',
      defense: 'Oklahoma',
      down: 2,
      distance: 7,
      yards_gained: -2,
      play_type: 'Sack',
      play_text: 'SACK by Johnson for -2 yards',
    }),
  ];
}

// ============================================================================
// Line Score Test Data (for getGameById)
// ============================================================================

export interface LineScoreRow {
  value: number;
  _dlt_parent_id: string;
  _dlt_list_idx: number;
}

export function createHomeLineScores(dltParentId: string): LineScoreRow[] {
  return [
    { value: 7, _dlt_parent_id: dltParentId, _dlt_list_idx: 0 },
    { value: 14, _dlt_parent_id: dltParentId, _dlt_list_idx: 1 },
    { value: 7, _dlt_parent_id: dltParentId, _dlt_list_idx: 2 },
    { value: 7, _dlt_parent_id: dltParentId, _dlt_list_idx: 3 },
  ];
}

export function createAwayLineScores(dltParentId: string): LineScoreRow[] {
  return [
    { value: 0, _dlt_parent_id: dltParentId, _dlt_list_idx: 0 },
    { value: 7, _dlt_parent_id: dltParentId, _dlt_list_idx: 1 },
    { value: 0, _dlt_parent_id: dltParentId, _dlt_list_idx: 2 },
    { value: 7, _dlt_parent_id: dltParentId, _dlt_list_idx: 3 },
  ];
}
