/**
 * Sprint 5.4 Validation Script
 * Run with: npx tsx scripts/validate-sprint5-metrics.ts
 *
 * Tests all EPA, Success Rate, and Explosiveness queries
 * to verify data renders correctly for documented season range.
 */

import {
  getSeasonEPA,
  getGameEPA,
  getEPATrends,
  getSuccessRateByPlayType,
  getSuccessRateByDown,
  getSuccessRateByDistance,
  getSituationalSuccessRate,
  getExplosivePlays,
  getExplosivePlaysAllowed,
  getTopPlays,
  getAllGames,
} from '../src/lib/db/queries';
import { closeDuckDB } from '../src/lib/db/duckdb';

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  data?: unknown;
}

const results: ValidationResult[] = [];

function log(result: ValidationResult) {
  const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
  console.log(`${icon} ${result.name}: ${result.message}`);
  results.push(result);
}

async function validateEPAMetrics() {
  console.log('\n=== EPA Metrics Validation ===\n');

  // Test EPA for seasons 2014-2024
  const seasons = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const seasonsWithData: number[] = [];

  for (const season of seasons) {
    try {
      const epa = await getSeasonEPA(season);
      if (epa && epa.totalPlays > 0) {
        seasonsWithData.push(season);
        log({
          name: `Season EPA ${season}`,
          status: 'pass',
          message: `EPA/play: ${epa.epaPerPlay.toFixed(3)}, Rush: ${epa.rushEpaPerPlay.toFixed(3)}, Pass: ${epa.passEpaPerPlay.toFixed(3)} (${epa.totalPlays} plays)`,
        });
      } else {
        log({
          name: `Season EPA ${season}`,
          status: 'warn',
          message: 'No EPA data available',
        });
      }
    } catch (error) {
      log({
        name: `Season EPA ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  // Test EPA trends
  try {
    const trends = await getEPATrends(2014, 2024);
    log({
      name: 'EPA Trends (2014-2024)',
      status: trends.length > 0 ? 'pass' : 'warn',
      message: `${trends.length} seasons with trend data`,
      data: trends,
    });
  } catch (error) {
    log({
      name: 'EPA Trends (2014-2024)',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test Game EPA (find a recent game)
  try {
    const { games } = await getAllGames(2024, 1, 0);
    const firstGame = games[0];
    if (firstGame) {
      const gameId = firstGame.id;
      const gameEPA = await getGameEPA(gameId);
      if (gameEPA) {
        log({
          name: `Game EPA (ID: ${gameId})`,
          status: 'pass',
          message: `OU: ${gameEPA.ouEpaPerPlay.toFixed(3)} EPA/play (${gameEPA.ouPlays} plays), Opp: ${gameEPA.oppEpaPerPlay.toFixed(3)} (${gameEPA.oppPlays} plays)`,
        });
      } else {
        log({
          name: `Game EPA (ID: ${gameId})`,
          status: 'warn',
          message: 'No game EPA data',
        });
      }
    }
  } catch (error) {
    log({
      name: 'Game EPA',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Validate 2017/2018 EPA (Baker/Kyler years - manual validation from Task 5.1b)
  try {
    const epa2017 = await getSeasonEPA(2017);
    const epa2018 = await getSeasonEPA(2018);
    if (epa2017 && epa2018) {
      const baker = epa2017.epaPerPlay;
      const kyler = epa2018.epaPerPlay;
      // Expected: 2017 ~0.446, 2018 ~0.517
      log({
        name: 'Historical Validation (2017/2018)',
        status: baker > 0.4 && kyler > 0.4 ? 'pass' : 'warn',
        message: `2017 (Baker): ${baker.toFixed(3)}, 2018 (Kyler): ${kyler.toFixed(3)}`,
      });
    }
  } catch (error) {
    log({
      name: 'Historical Validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return seasonsWithData;
}

async function validateSuccessRateMetrics() {
  console.log('\n=== Success Rate Metrics Validation ===\n');

  const testSeasons = [2020, 2022, 2024];

  for (const season of testSeasons) {
    // By play type
    try {
      const byType = await getSuccessRateByPlayType(season);
      if (byType) {
        log({
          name: `Success Rate by Type ${season}`,
          status: 'pass',
          message: `Overall: ${byType.overallSuccessRate}%, Rush: ${byType.rushSuccessRate}%, Pass: ${byType.passSuccessRate}%`,
        });
      } else {
        log({
          name: `Success Rate by Type ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Success Rate by Type ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // By down
    try {
      const byDown = await getSuccessRateByDown(season);
      if (byDown) {
        log({
          name: `Success Rate by Down ${season}`,
          status: 'pass',
          message: `1st: ${byDown.down1}%, 2nd: ${byDown.down2}%, 3rd: ${byDown.down3}%, 4th: ${byDown.down4}%`,
        });
      } else {
        log({
          name: `Success Rate by Down ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Success Rate by Down ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // By distance
    try {
      const byDist = await getSuccessRateByDistance(season);
      if (byDist) {
        log({
          name: `Success Rate by Distance ${season}`,
          status: 'pass',
          message: `Short: ${byDist.short}%, Medium: ${byDist.medium}%, Long: ${byDist.long}%`,
        });
      } else {
        log({
          name: `Success Rate by Distance ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Success Rate by Distance ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // Situational
    try {
      const situational = await getSituationalSuccessRate(season);
      if (situational) {
        log({
          name: `Situational Success ${season}`,
          status: 'pass',
          message: `Early: ${situational.earlyDownRate}%, Late: ${situational.lateDownRate}%, Red Zone: ${situational.redZoneRate}%`,
        });
      } else {
        log({
          name: `Situational Success ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Situational Success ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }
}

async function validateExplosivenessMetrics() {
  console.log('\n=== Explosiveness Metrics Validation ===\n');

  const testSeasons = [2020, 2022, 2024];

  for (const season of testSeasons) {
    // Explosive plays (offense)
    try {
      const explosive = await getExplosivePlays(season);
      if (explosive) {
        log({
          name: `Explosive Plays ${season}`,
          status: 'pass',
          message: `Count: ${explosive.count} (${explosive.rate}%), Rush: ${explosive.byRush}, Pass: ${explosive.byPass}`,
        });
      } else {
        log({
          name: `Explosive Plays ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Explosive Plays ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // Explosive plays allowed (defense)
    try {
      const allowed = await getExplosivePlaysAllowed(season);
      if (allowed) {
        log({
          name: `Explosive Plays Allowed ${season}`,
          status: 'pass',
          message: `Count: ${allowed.count} (${allowed.rate}%), Rush: ${allowed.byRush}, Pass: ${allowed.byPass}`,
        });
      } else {
        log({
          name: `Explosive Plays Allowed ${season}`,
          status: 'warn',
          message: 'No data',
        });
      }
    } catch (error) {
      log({
        name: `Explosive Plays Allowed ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }

    // Top plays
    try {
      const topPlays = await getTopPlays(season, 5);
      const topPlay = topPlays[0];
      if (topPlays.length > 0 && topPlay) {
        log({
          name: `Top Plays ${season}`,
          status: 'pass',
          message: `Found ${topPlays.length} big plays, max: ${topPlay.yardsGained} yards vs ${topPlay.opponent}`,
        });
      } else {
        log({
          name: `Top Plays ${season}`,
          status: 'warn',
          message: 'No explosive plays found',
        });
      }
    } catch (error) {
      log({
        name: `Top Plays ${season}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Sprint 5.4 - Metrics Validation Script            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  await validateEPAMetrics();
  await validateSuccessRateMetrics();
  await validateExplosivenessMetrics();

  const elapsed = Date.now() - startTime;

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  console.log(`Total tests: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);
  console.log(`\nExecution time: ${elapsed}ms`);

  if (failed > 0) {
    console.log('\n❌ VALIDATION FAILED - See failed tests above');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️ VALIDATION PASSED WITH WARNINGS');
    process.exit(0);
  } else {
    console.log('\n✅ ALL VALIDATIONS PASSED');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    closeDuckDB();
  });
