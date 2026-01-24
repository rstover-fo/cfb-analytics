/**
 * Test script for Task 5.1b EPA Aggregation Queries
 * Run with: npx tsx scripts/test-epa-queries.ts
 */

import { getSeasonEPA, getGameEPA, getEPATrends } from '../src/lib/db/queries';
import { closeDuckDB } from '../src/lib/db/duckdb';

async function main() {
  console.log('='.repeat(70));
  console.log('Task 5.1b: EPA Aggregation Query Tests');
  console.log('='.repeat(70));
  console.log();

  try {
    // Test 1: getSeasonEPA for recent seasons
    console.log('1. getSeasonEPA - Recent Seasons');
    console.log('-'.repeat(70));
    console.log('Season | EPA/Play | Rush EPA | Pass EPA | Total | Rush | Pass');
    console.log('-'.repeat(70));

    for (const season of [2024, 2023, 2022, 2021, 2020]) {
      const epa = await getSeasonEPA(season);
      if (epa) {
        console.log(
          `${season}   | ${epa.epaPerPlay.toFixed(3).padStart(8)} | ${epa.rushEpaPerPlay.toFixed(3).padStart(8)} | ${epa.passEpaPerPlay.toFixed(3).padStart(8)} | ${String(epa.totalPlays).padStart(5)} | ${String(epa.rushPlays).padStart(4)} | ${epa.passPlays}`
        );
      } else {
        console.log(`${season}   | No data`);
      }
    }

    // Test 2: getGameEPA for a specific game
    console.log();
    console.log('2. getGameEPA - Sample Games');
    console.log('-'.repeat(70));

    // Get a sample game ID from 2024
    const { getAllGames } = await import('../src/lib/db/queries');
    const { games } = await getAllGames(2024, 3);

    if (games.length > 0) {
      console.log('Game ID | OU EPA/Play | Opp EPA/Play | OU Total | Opp Total | Matchup');
      console.log('-'.repeat(70));

      for (const game of games) {
        const epa = await getGameEPA(game.id);
        if (epa) {
          console.log(
            `${String(game.id).padStart(7)} | ${epa.ouEpaPerPlay.toFixed(3).padStart(11)} | ${epa.oppEpaPerPlay.toFixed(3).padStart(12)} | ${epa.ouTotalEPA.toFixed(1).padStart(8)} | ${epa.oppTotalEPA.toFixed(1).padStart(9)} | vs ${game.opponent}`
          );
        }
      }
    }

    // Test 3: getEPATrends across all available seasons
    console.log();
    console.log('3. getEPATrends - Full Dataset (2001-2025)');
    console.log('-'.repeat(70));

    const trends = await getEPATrends(2001, 2025);
    console.log('Season | EPA/Play | Direction');
    console.log('-'.repeat(40));

    let prevEpa = 0;
    for (const trend of trends) {
      const direction =
        prevEpa === 0 ? '  ' : trend.epaPerPlay > prevEpa ? ' ↑' : trend.epaPerPlay < prevEpa ? ' ↓' : '  ';
      console.log(`${trend.season}   | ${trend.epaPerPlay.toFixed(3).padStart(8)} | ${direction}`);
      prevEpa = trend.epaPerPlay;
    }

    console.log();
    console.log(`Total seasons with data: ${trends.length}`);

    // Summary statistics
    if (trends.length > 0) {
      const avgEpa = trends.reduce((sum, t) => sum + t.epaPerPlay, 0) / trends.length;
      const maxEpa = Math.max(...trends.map((t) => t.epaPerPlay));
      const minEpa = Math.min(...trends.map((t) => t.epaPerPlay));
      const maxSeason = trends.find((t) => t.epaPerPlay === maxEpa)?.season;
      const minSeason = trends.find((t) => t.epaPerPlay === minEpa)?.season;

      console.log();
      console.log('Summary Statistics:');
      console.log(`  Average EPA/Play: ${avgEpa.toFixed(3)}`);
      console.log(`  Best Season: ${maxSeason} (${maxEpa.toFixed(3)})`);
      console.log(`  Worst Season: ${minSeason} (${minEpa.toFixed(3)})`);
    }

    // Test 4: Validation - Check 2017 Baker Mayfield season
    console.log();
    console.log('4. Validation - 2017 Season (Baker Mayfield Heisman)');
    console.log('-'.repeat(70));

    const epa2017 = await getSeasonEPA(2017);
    if (epa2017) {
      console.log(`EPA/Play: ${epa2017.epaPerPlay.toFixed(3)}`);
      console.log(`Rush EPA/Play: ${epa2017.rushEpaPerPlay.toFixed(3)}`);
      console.log(`Pass EPA/Play: ${epa2017.passEpaPerPlay.toFixed(3)}`);
      console.log(`Total Plays: ${epa2017.totalPlays}`);

      // 2017 should be one of OU's best offensive seasons
      if (epa2017.epaPerPlay > 0.2) {
        console.log('✓ 2017 EPA/play is positive and high (expected for elite offense)');
      } else {
        console.log('⚠ 2017 EPA/play seems low for a Heisman-winning offense');
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('All EPA query tests completed!');
    console.log('='.repeat(70));
  } finally {
    closeDuckDB();
  }
}

main().catch((err) => {
  console.error('Error:', err);
  closeDuckDB();
  process.exit(1);
});
