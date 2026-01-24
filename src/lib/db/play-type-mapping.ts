/**
 * Play Type Classification
 *
 * Maps CFBD play_type values to standardized categories for EPA calculations.
 * Based on data audit findings (see docs/SPRINT_5_DATA_AUDIT.md).
 *
 * 45 distinct play types discovered in Oklahoma data (2001-2025).
 */

/**
 * Standardized play type categories.
 * - rush: Running plays (includes rushing TDs, 2pt rush attempts)
 * - pass: Passing plays (completions, incompletions, sacks, interceptions)
 * - special_teams: Kicks, punts, returns, field goals, extra points
 * - penalty: Penalty plays
 * - other: Administrative plays (timeouts, end of period, etc.)
 */
export type PlayTypeCategory = 'rush' | 'pass' | 'special_teams' | 'penalty' | 'other';

/**
 * Rush play types - running plays where the ball carrier advances on the ground.
 * These are scrimmage plays that count toward EPA calculations.
 */
const RUSH_PLAY_TYPES = new Set(['Rush', 'Rushing Touchdown', 'Two Point Rush']);

/**
 * Pass play types - plays involving a forward pass attempt.
 * Includes completions, incompletions, sacks (treated as pass plays), and interceptions.
 * These are scrimmage plays that count toward EPA calculations.
 *
 * Note: CFBD uses different terminology across seasons:
 * - "Pass Reception" vs "Pass Completion" (same meaning)
 * - "Pass" (generic, older data)
 * - "Pass Interception" vs "Pass Interception Return" vs "Interception"
 */
const PASS_PLAY_TYPES = new Set([
  'Pass Reception',
  'Pass Completion',
  'Pass',
  'Pass Incompletion',
  'Passing Touchdown',
  'Sack',
  'Pass Interception',
  'Pass Interception Return',
  'Interception',
  'Two Point Pass',
]);

/**
 * Special teams play types - kicks, punts, returns, and scoring attempts.
 * These are excluded from EPA/success rate calculations.
 */
const SPECIAL_TEAMS_PLAY_TYPES = new Set([
  'Kickoff',
  'Kickoff Return (Offense)',
  'Kickoff Return (Defense)',
  'Kickoff Return Touchdown',
  'Punt',
  'Punt Return',
  'Punt Return Touchdown',
  'Blocked Punt',
  'Blocked Punt Touchdown',
  'Field Goal Good',
  'Field Goal Missed',
  'Blocked Field Goal',
  'Missed Field Goal Return Touchdown',
  'Extra Point Good',
  'Extra Point Missed',
  'Blocked PAT',
  '2pt Conversion',
]);

/**
 * Penalty play types.
 * Excluded from EPA calculations.
 */
const PENALTY_PLAY_TYPES = new Set(['Penalty']);

/**
 * Administrative/other play types.
 * These are not actual plays and are excluded from all calculations.
 */
const OTHER_PLAY_TYPES = new Set([
  'Timeout',
  'End Period',
  'End of Half',
  'End of Game',
  'End of Regulation',
  'Start of Period',
  'Uncategorized',
  // Turnover results (the play itself is categorized by the preceding action)
  'Fumble',
  'Fumble Recovery (Own)',
  'Fumble Recovery (Opponent)',
  'Fumble Return Touchdown',
  // Defensive scores (result of opponent's play)
  'Interception Return Touchdown',
  'Safety',
  'Defensive 2pt Conversion',
]);

// Track unknown play types for logging
const unknownPlayTypes = new Set<string>();

/**
 * Classifies a CFBD play_type into a standardized category.
 *
 * @param playType - The raw play_type value from CFBD
 * @returns The standardized category
 *
 * @example
 * classifyPlayType('Rush') // => 'rush'
 * classifyPlayType('Pass Reception') // => 'pass'
 * classifyPlayType('Kickoff') // => 'special_teams'
 * classifyPlayType('Penalty') // => 'penalty'
 * classifyPlayType('Timeout') // => 'other'
 */
export function classifyPlayType(playType: string | null | undefined): PlayTypeCategory {
  if (!playType) {
    return 'other';
  }

  if (RUSH_PLAY_TYPES.has(playType)) {
    return 'rush';
  }

  if (PASS_PLAY_TYPES.has(playType)) {
    return 'pass';
  }

  if (SPECIAL_TEAMS_PLAY_TYPES.has(playType)) {
    return 'special_teams';
  }

  if (PENALTY_PLAY_TYPES.has(playType)) {
    return 'penalty';
  }

  if (OTHER_PLAY_TYPES.has(playType)) {
    return 'other';
  }

  // Log unknown play types (only once per type)
  if (!unknownPlayTypes.has(playType)) {
    unknownPlayTypes.add(playType);
    console.warn(`[play-type-mapping] Unknown play type: "${playType}" - classifying as "other"`);
  }

  return 'other';
}

/**
 * Categories that represent scrimmage plays (rush + pass).
 * These are the plays used for EPA and success rate calculations.
 */
export const SCRIMMAGE_PLAY_CATEGORIES: PlayTypeCategory[] = ['rush', 'pass'];

/**
 * SQL-safe list of scrimmage play types for use in WHERE clauses.
 * Use with: `play_type IN (${SCRIMMAGE_PLAY_TYPES_SQL})`
 *
 * Note: This is a static list that should match RUSH_PLAY_TYPES + PASS_PLAY_TYPES.
 */
export const SCRIMMAGE_PLAY_TYPES_SQL = [
  // Rush
  'Rush',
  'Rushing Touchdown',
  'Two Point Rush',
  // Pass
  'Pass Reception',
  'Pass Completion',
  'Pass',
  'Pass Incompletion',
  'Passing Touchdown',
  'Sack',
  'Pass Interception',
  'Pass Interception Return',
  'Interception',
  'Two Point Pass',
] as const;

/**
 * Type for scrimmage play type strings.
 */
export type ScrimmagePlayType = (typeof SCRIMMAGE_PLAY_TYPES_SQL)[number];

/**
 * Checks if a play type is a scrimmage play (rush or pass).
 *
 * @param playType - The raw play_type value from CFBD
 * @returns true if the play is a rush or pass play
 */
export function isScrimmagePlay(playType: string | null | undefined): boolean {
  const category = classifyPlayType(playType);
  return category === 'rush' || category === 'pass';
}

/**
 * Checks if a play type is a rush play.
 */
export function isRushPlay(playType: string | null | undefined): boolean {
  return classifyPlayType(playType) === 'rush';
}

/**
 * Checks if a play type is a pass play.
 */
export function isPassPlay(playType: string | null | undefined): boolean {
  return classifyPlayType(playType) === 'pass';
}

/**
 * Returns all unknown play types encountered during classification.
 * Useful for debugging and data quality checks.
 */
export function getUnknownPlayTypes(): string[] {
  return Array.from(unknownPlayTypes);
}

/**
 * Clears the unknown play types log.
 * Useful for testing or resetting state.
 */
export function clearUnknownPlayTypes(): void {
  unknownPlayTypes.clear();
}
