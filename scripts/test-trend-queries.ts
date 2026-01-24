/**
 * Test script for Task 4.1a Season Trend queries
 * Run with: npx tsx scripts/test-trend-queries.ts
 */

import {
  getWinLossTrends,
  getPointsTrends,
  getConferenceSplits,
  getHomeAwaySplits,
} from '../src/lib/db/queries';

async function main() {
  console.log('Testing Season Trend Queries (2014-2024)\n');
  console.log('='.repeat(60));

  // Test getWinLossTrends
  console.log('\n1. Win-Loss Trends:');
  console.log('-'.repeat(40));
  const winLoss = await getWinLossTrends(2014, 2024);
  console.log('Season  | Wins | Losses');
  for (const row of winLoss) {
    console.log(`${row.season}    | ${String(row.wins).padStart(4)} | ${row.losses}`);
  }
  console.log(`Total seasons: ${winLoss.length}`);

  // Test getPointsTrends
  console.log('\n2. Points Per Game Trends:');
  console.log('-'.repeat(40));
  const points = await getPointsTrends(2014, 2024);
  console.log('Season  | PPG Off | PPG Def');
  for (const row of points) {
    console.log(
      `${row.season}    | ${String(row.ppgOffense).padStart(7)} | ${row.ppgDefense}`
    );
  }

  // Test getConferenceSplits
  console.log('\n3. Conference Splits:');
  console.log('-'.repeat(40));
  const confSplits = await getConferenceSplits(2014, 2024);
  console.log('Season  | Conf W | Conf L | Non-Conf W | Non-Conf L');
  for (const row of confSplits) {
    console.log(
      `${row.season}    | ${String(row.confWins).padStart(6)} | ${String(row.confLosses).padStart(6)} | ${String(row.nonConfWins).padStart(10)} | ${row.nonConfLosses}`
    );
  }

  // Test getHomeAwaySplits
  console.log('\n4. Home/Away Splits:');
  console.log('-'.repeat(40));
  const homeAway = await getHomeAwaySplits(2014, 2024);
  console.log('Season  | Home W | Home L | Away W | Away L');
  for (const row of homeAway) {
    console.log(
      `${row.season}    | ${String(row.homeWins).padStart(6)} | ${String(row.homeLosses).padStart(6)} | ${String(row.awayWins).padStart(6)} | ${row.awayLosses}`
    );
  }

  // Validation check - 2017 season (known: 12-2 overall)
  console.log('\n' + '='.repeat(60));
  console.log('Validation Check - 2017 Season:');
  const season2017 = winLoss.find((r) => r.season === 2017);
  if (season2017) {
    console.log(`  Record: ${season2017.wins}-${season2017.losses}`);
    console.log(`  Expected: 12-2 (known from historical records)`);
    const isValid = season2017.wins === 12 && season2017.losses === 2;
    console.log(`  Status: ${isValid ? '✓ PASS' : '✗ MISMATCH - verify data'}`);
  } else {
    console.log('  ✗ 2017 data not found');
  }

  console.log('\nAll queries executed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
