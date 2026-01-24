/**
 * EPA and Metrics Test Fixtures
 *
 * Specialized fixtures for testing analytics query functions.
 * Provides pre-built scenarios for EPA, success rate, and explosive play testing.
 */

// ============================================================================
// EPA Fixtures
// ============================================================================

/**
 * Season EPA row format:
 * [season, epa_per_play, rush_epa, pass_epa, total_plays, rush_plays, pass_plays]
 */
export type SeasonEPARow = [number, number, number, number, number, number, number];

/**
 * Creates a season EPA row for mocking
 */
export function createSeasonEPARow(
  options: {
    season?: number;
    epaPerPlay?: number;
    rushEpa?: number;
    passEpa?: number;
    totalPlays?: number;
    rushPlays?: number;
    passPlays?: number;
  } = {}
): SeasonEPARow {
  return [
    options.season ?? 2024,
    options.epaPerPlay ?? 0.125,
    options.rushEpa ?? 0.08,
    options.passEpa ?? 0.18,
    options.totalPlays ?? 850,
    options.rushPlays ?? 400,
    options.passPlays ?? 450,
  ];
}

/**
 * Game EPA row format for OU offense:
 * [epa_per_play, total_epa, plays]
 */
export type GameEPARow = [number, number, number];

export function createGameEPARow(
  options: {
    epaPerPlay?: number;
    totalEpa?: number;
    plays?: number;
  } = {}
): GameEPARow {
  return [options.epaPerPlay ?? 0.15, options.totalEpa ?? 12.5, options.plays ?? 75];
}

/**
 * EPA trend row format:
 * [season, epa_per_play]
 */
export type EPATrendRow = [number, number];

export function createEPATrendRows(): EPATrendRow[] {
  return [
    [2020, 0.08],
    [2021, 0.12],
    [2022, 0.1],
    [2023, 0.15],
    [2024, 0.18],
  ];
}

// ============================================================================
// Success Rate Fixtures
// ============================================================================

/**
 * Success rate by play type row format:
 * [season, rush_success_rate, pass_success_rate, overall_rate, rush_attempts, pass_attempts]
 */
export type SuccessRateByPlayTypeRow = [number, number, number, number, number, number];

export function createSuccessRateByPlayTypeRow(
  options: {
    season?: number;
    rushSuccessRate?: number;
    passSuccessRate?: number;
    overallRate?: number;
    rushAttempts?: number;
    passAttempts?: number;
  } = {}
): SuccessRateByPlayTypeRow {
  return [
    options.season ?? 2024,
    options.rushSuccessRate ?? 45.5,
    options.passSuccessRate ?? 52.3,
    options.overallRate ?? 48.9,
    options.rushAttempts ?? 400,
    options.passAttempts ?? 450,
  ];
}

/**
 * Success rate by down row format:
 * [season, down1, down2, down3, down4]
 */
export type SuccessRateByDownRow = [number, number, number, number, number];

export function createSuccessRateByDownRow(
  options: {
    season?: number;
    down1?: number;
    down2?: number;
    down3?: number;
    down4?: number;
  } = {}
): SuccessRateByDownRow {
  return [
    options.season ?? 2024,
    options.down1 ?? 52.1,
    options.down2 ?? 48.7,
    options.down3 ?? 41.2,
    options.down4 ?? 55.0,
  ];
}

/**
 * Success rate by distance row format:
 * [season, short_rate, medium_rate, long_rate]
 */
export type SuccessRateByDistanceRow = [number, number, number, number];

export function createSuccessRateByDistanceRow(
  options: {
    season?: number;
    short?: number;
    medium?: number;
    long?: number;
  } = {}
): SuccessRateByDistanceRow {
  return [
    options.season ?? 2024,
    options.short ?? 68.5,
    options.medium ?? 52.3,
    options.long ?? 38.1,
  ];
}

/**
 * Situational success rate row format:
 * [season, early_down_rate, late_down_rate, red_zone_rate, early_attempts, late_attempts, rz_attempts]
 */
export type SituationalSuccessRateRow = [number, number, number, number, number, number, number];

export function createSituationalSuccessRateRow(
  options: {
    season?: number;
    earlyDownRate?: number;
    lateDownRate?: number;
    redZoneRate?: number;
    earlyDownAttempts?: number;
    lateDownAttempts?: number;
    redZoneAttempts?: number;
  } = {}
): SituationalSuccessRateRow {
  return [
    options.season ?? 2024,
    options.earlyDownRate ?? 50.5,
    options.lateDownRate ?? 42.3,
    options.redZoneRate ?? 55.8,
    options.earlyDownAttempts ?? 550,
    options.lateDownAttempts ?? 300,
    options.redZoneAttempts ?? 120,
  ];
}

// ============================================================================
// Explosive Play Fixtures
// ============================================================================

/**
 * Explosive play metrics row format:
 * [season, count, rate, by_rush, by_pass, total_plays]
 */
export type ExplosivePlayMetricsRow = [number, number, number, number, number, number];

export function createExplosivePlayMetricsRow(
  options: {
    season?: number;
    count?: number;
    rate?: number;
    byRush?: number;
    byPass?: number;
    totalPlays?: number;
  } = {}
): ExplosivePlayMetricsRow {
  return [
    options.season ?? 2024,
    options.count ?? 65,
    options.rate ?? 7.6,
    options.byRush ?? 20,
    options.byPass ?? 45,
    options.totalPlays ?? 850,
  ];
}

/**
 * Top play row format:
 * [game_id, season, opponent, date, yards_gained, play_type, play_text]
 */
export type TopPlayRow = [number, number, string, string, number, string, string];

export function createTopPlayRow(
  options: {
    gameId?: number;
    season?: number;
    opponent?: string;
    date?: string;
    yardsGained?: number;
    playType?: string;
    playText?: string;
  } = {}
): TopPlayRow {
  return [
    options.gameId ?? 1001,
    options.season ?? 2024,
    options.opponent ?? 'Houston',
    options.date ?? '2024-09-01T19:00:00.000Z',
    options.yardsGained ?? 75,
    options.playType ?? 'Pass Reception',
    options.playText ?? 'Williams pass complete to Jones for 75 yard TOUCHDOWN',
  ];
}

export function createTopPlayRows(): TopPlayRow[] {
  return [
    createTopPlayRow({
      yardsGained: 75,
      playType: 'Pass Reception',
      playText: 'Williams pass for 75 yd TD',
    }),
    createTopPlayRow({
      yardsGained: 65,
      playType: 'Rush',
      playText: 'Jackson rushes for 65 yards',
      gameId: 1002,
    }),
    createTopPlayRow({
      yardsGained: 58,
      playType: 'Pass Reception',
      playText: 'Pass for 58 yards',
      gameId: 1003,
    }),
    createTopPlayRow({
      yardsGained: 52,
      playType: 'Rush',
      playText: 'Rush for 52 yard TD',
      gameId: 1004,
    }),
    createTopPlayRow({
      yardsGained: 48,
      playType: 'Pass Reception',
      playText: 'Pass for 48 yards',
      gameId: 1005,
    }),
  ];
}

// ============================================================================
// Edge Case Fixtures
// ============================================================================

/**
 * Creates EPA row with positive values (good offense)
 */
export function createPositiveEPARow(): SeasonEPARow {
  return createSeasonEPARow({
    epaPerPlay: 0.25,
    rushEpa: 0.18,
    passEpa: 0.32,
    totalPlays: 900,
    rushPlays: 420,
    passPlays: 480,
  });
}

/**
 * Creates EPA row with negative values (struggling offense)
 */
export function createNegativeEPARow(): SeasonEPARow {
  return createSeasonEPARow({
    epaPerPlay: -0.08,
    rushEpa: -0.12,
    passEpa: -0.05,
    totalPlays: 750,
    rushPlays: 380,
    passPlays: 370,
  });
}

/**
 * Creates EPA row with zero values
 */
export function createZeroEPARow(): SeasonEPARow {
  return createSeasonEPARow({
    epaPerPlay: 0,
    rushEpa: 0,
    passEpa: 0,
    totalPlays: 800,
    rushPlays: 400,
    passPlays: 400,
  });
}

/**
 * Creates success rate row with 100% success
 */
export function createPerfectSuccessRateRow(): SuccessRateByPlayTypeRow {
  return createSuccessRateByPlayTypeRow({
    rushSuccessRate: 100,
    passSuccessRate: 100,
    overallRate: 100,
    rushAttempts: 100,
    passAttempts: 100,
  });
}

/**
 * Creates success rate row with 0 attempts (should return null)
 */
export function createZeroAttemptsRow(): SuccessRateByPlayTypeRow {
  return createSuccessRateByPlayTypeRow({
    rushSuccessRate: 0,
    passSuccessRate: 0,
    overallRate: 0,
    rushAttempts: 0,
    passAttempts: 0,
  });
}

/**
 * Creates explosive play row with no explosive plays
 */
export function createNoExplosivePlaysRow(): ExplosivePlayMetricsRow {
  return createExplosivePlayMetricsRow({
    count: 0,
    rate: 0,
    byRush: 0,
    byPass: 0,
    totalPlays: 800,
  });
}

/**
 * Creates explosive play row with high explosiveness
 */
export function createHighExplosivePlaysRow(): ExplosivePlayMetricsRow {
  return createExplosivePlayMetricsRow({
    count: 120,
    rate: 15.0,
    byRush: 35,
    byPass: 85,
    totalPlays: 800,
  });
}
