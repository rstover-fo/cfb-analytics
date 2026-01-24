/**
 * Test script for Task 5.1a Play Type Classification
 * Run with: npx tsx scripts/test-play-type-mapping.ts
 */

import {
  classifyPlayType,
  isScrimmagePlay,
  isRushPlay,
  isPassPlay,
  getUnknownPlayTypes,
  clearUnknownPlayTypes,
  SCRIMMAGE_PLAY_TYPES_SQL,
  type PlayTypeCategory,
} from '../src/lib/db/play-type-mapping';

// All 45 play types from the data audit
const ALL_PLAY_TYPES = [
  // Rush (3)
  'Rush',
  'Rushing Touchdown',
  'Two Point Rush',
  // Pass (10)
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
  // Special Teams (17)
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
  // Penalty (1)
  'Penalty',
  // Other/Administrative (14)
  'Timeout',
  'End Period',
  'End of Half',
  'End of Game',
  'End of Regulation',
  'Start of Period',
  'Uncategorized',
  'Fumble',
  'Fumble Recovery (Own)',
  'Fumble Recovery (Opponent)',
  'Fumble Return Touchdown',
  'Interception Return Touchdown',
  'Safety',
  'Defensive 2pt Conversion',
];

interface TestResult {
  playType: string;
  category: PlayTypeCategory;
  isScrimmage: boolean;
  isRush: boolean;
  isPass: boolean;
}

function main() {
  console.log('='.repeat(70));
  console.log('Task 5.1a: Play Type Classification Test');
  console.log('='.repeat(70));
  console.log();

  clearUnknownPlayTypes();

  // Test all known play types
  console.log('1. Classification Results for All 45 Play Types');
  console.log('-'.repeat(70));

  const results: TestResult[] = ALL_PLAY_TYPES.map((pt) => ({
    playType: pt,
    category: classifyPlayType(pt),
    isScrimmage: isScrimmagePlay(pt),
    isRush: isRushPlay(pt),
    isPass: isPassPlay(pt),
  }));

  // Group by category
  const byCategory = new Map<PlayTypeCategory, string[]>();
  for (const r of results) {
    const list = byCategory.get(r.category) || [];
    list.push(r.playType);
    byCategory.set(r.category, list);
  }

  for (const [category, types] of byCategory) {
    console.log(`\n${category.toUpperCase()} (${types.length}):`);
    for (const t of types) {
      console.log(`  - ${t}`);
    }
  }

  // Summary counts
  console.log();
  console.log('2. Summary');
  console.log('-'.repeat(70));
  console.log(`Total play types: ${ALL_PLAY_TYPES.length}`);
  console.log(`Rush plays: ${byCategory.get('rush')?.length || 0}`);
  console.log(`Pass plays: ${byCategory.get('pass')?.length || 0}`);
  console.log(`Special teams: ${byCategory.get('special_teams')?.length || 0}`);
  console.log(`Penalty: ${byCategory.get('penalty')?.length || 0}`);
  console.log(`Other: ${byCategory.get('other')?.length || 0}`);

  const scrimmageCount = results.filter((r) => r.isScrimmage).length;
  console.log(`\nScrimmage plays (rush + pass): ${scrimmageCount}`);

  // Verify SCRIMMAGE_PLAY_TYPES_SQL matches
  console.log();
  console.log('3. SCRIMMAGE_PLAY_TYPES_SQL Verification');
  console.log('-'.repeat(70));
  console.log(`SQL constant has ${SCRIMMAGE_PLAY_TYPES_SQL.length} types`);

  const scrimmageFromResults = results.filter((r) => r.isScrimmage).map((r) => r.playType);
  const sqlSet = new Set(SCRIMMAGE_PLAY_TYPES_SQL);
  const resultSet = new Set(scrimmageFromResults);

  const missingSql = scrimmageFromResults.filter(
    (t) => !sqlSet.has(t as (typeof SCRIMMAGE_PLAY_TYPES_SQL)[number])
  );
  const extraSql = SCRIMMAGE_PLAY_TYPES_SQL.filter((t) => !resultSet.has(t));

  if (missingSql.length === 0 && extraSql.length === 0) {
    console.log('✓ SQL constant matches classification function');
  } else {
    if (missingSql.length > 0) {
      console.log(`✗ Missing from SQL: ${missingSql.join(', ')}`);
    }
    if (extraSql.length > 0) {
      console.log(`✗ Extra in SQL: ${extraSql.join(', ')}`);
    }
  }

  // Test edge cases
  console.log();
  console.log('4. Edge Cases');
  console.log('-'.repeat(70));

  const edgeCases = [
    { input: null, expected: 'other' },
    { input: undefined, expected: 'other' },
    { input: '', expected: 'other' },
    { input: 'Unknown Play Type', expected: 'other' },
  ];

  for (const { input, expected } of edgeCases) {
    const result = classifyPlayType(input as string | null | undefined);
    const status = result === expected ? '✓' : '✗';
    console.log(`${status} classifyPlayType(${JSON.stringify(input)}) => "${result}" (expected: "${expected}")`);
  }

  // Check for unknown types logged
  const unknowns = getUnknownPlayTypes();
  if (unknowns.length > 0) {
    console.log(`\nUnknown types logged: ${unknowns.join(', ')}`);
  }

  // Specific function tests
  console.log();
  console.log('5. Helper Function Tests');
  console.log('-'.repeat(70));

  const helperTests = [
    { fn: 'isScrimmagePlay', input: 'Rush', expected: true },
    { fn: 'isScrimmagePlay', input: 'Pass Reception', expected: true },
    { fn: 'isScrimmagePlay', input: 'Kickoff', expected: false },
    { fn: 'isScrimmagePlay', input: 'Penalty', expected: false },
    { fn: 'isRushPlay', input: 'Rush', expected: true },
    { fn: 'isRushPlay', input: 'Pass Reception', expected: false },
    { fn: 'isPassPlay', input: 'Pass Reception', expected: true },
    { fn: 'isPassPlay', input: 'Rush', expected: false },
    { fn: 'isPassPlay', input: 'Sack', expected: true },
  ];

  for (const { fn, input, expected } of helperTests) {
    const result =
      fn === 'isScrimmagePlay'
        ? isScrimmagePlay(input)
        : fn === 'isRushPlay'
          ? isRushPlay(input)
          : isPassPlay(input);
    const status = result === expected ? '✓' : '✗';
    console.log(`${status} ${fn}("${input}") => ${result} (expected: ${expected})`);
  }

  console.log();
  console.log('='.repeat(70));
  console.log('Test complete!');
  console.log('='.repeat(70));
}

main();
