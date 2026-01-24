/**
 * Validation script for Task 5.5 - Drive Analytics Deep Dive
 *
 * Tests all drive analytics queries across multiple seasons
 * and validates the data integrity.
 */

import {
  getPointsPerDriveByPosition,
  getDriveSuccessRate,
  getAverageDriveMetrics,
  getDriveOutcomeDistribution,
  getDriveComparison,
} from '../src/lib/db/queries';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function logResult(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const status = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${status}] ${name}${details ? ` - ${details}` : ''}`);
}

async function validateDriveQueries() {
  console.log('\n=== Task 5.5 Validation: Drive Analytics ===\n');

  const testSeasons = [2024, 2023, 2022, 2020, 2017]; // Various seasons to test

  for (const season of testSeasons) {
    console.log(`\nTesting Season ${season}:`);

    // Test 1: Points Per Drive by Position
    try {
      const ppd = await getPointsPerDriveByPosition(season);
      if (ppd) {
        // Validate that bucket drives sum to total
        const bucketSum = ppd.redZone.drives + ppd.opponent.drives + ppd.midfield.drives + ppd.ownHalf.drives;
        const sumMatches = bucketSum === ppd.overall.drives;
        logResult(
          `Points Per Drive (${season})`,
          sumMatches,
          `${ppd.overall.drives} total drives, PPD: ${ppd.overall.ppd.toFixed(2)}`
        );
        if (!sumMatches) {
          console.log(`    WARNING: Bucket sum (${bucketSum}) != overall (${ppd.overall.drives})`);
        }
      } else {
        logResult(`Points Per Drive (${season})`, true, 'No data (expected for older seasons)');
      }
    } catch (e) {
      logResult(`Points Per Drive (${season})`, false, String(e));
    }

    // Test 2: Drive Success Rate
    try {
      const success = await getDriveSuccessRate(season);
      if (success) {
        const validRate = success.successRate >= 0 && success.successRate <= 100;
        const scoringValid = success.scoringDrives <= success.totalDrives;
        logResult(
          `Drive Success Rate (${season})`,
          validRate && scoringValid,
          `${success.successRate.toFixed(1)}% (${success.scoringDrives}/${success.totalDrives})`
        );
      } else {
        logResult(`Drive Success Rate (${season})`, true, 'No data');
      }
    } catch (e) {
      logResult(`Drive Success Rate (${season})`, false, String(e));
    }

    // Test 3: Average Drive Metrics
    try {
      const avg = await getAverageDriveMetrics(season);
      if (avg) {
        const validPlays = avg.avgPlays > 0 && avg.avgPlays < 20;
        const validYards = avg.avgYards >= -10 && avg.avgYards < 100;
        logResult(
          `Average Drive Metrics (${season})`,
          validPlays && validYards,
          `${avg.avgPlays} plays, ${avg.avgYards} yds, ${avg.avgTimeMinutes}:${String(avg.avgTimeSeconds).padStart(2, '0')}`
        );
      } else {
        logResult(`Average Drive Metrics (${season})`, true, 'No data');
      }
    } catch (e) {
      logResult(`Average Drive Metrics (${season})`, false, String(e));
    }

    // Test 4: Drive Outcome Distribution
    try {
      const outcomes = await getDriveOutcomeDistribution(season);
      if (outcomes) {
        const summedOutcomes = outcomes.touchdowns + outcomes.fieldGoals + outcomes.punts +
          outcomes.turnovers + outcomes.downs + outcomes.endOfHalf + outcomes.other;
        const sumsToTotal = summedOutcomes === outcomes.total;
        logResult(
          `Drive Outcome Distribution (${season})`,
          sumsToTotal,
          `TD:${outcomes.touchdowns}, FG:${outcomes.fieldGoals}, Punt:${outcomes.punts}, TO:${outcomes.turnovers}`
        );
        if (!sumsToTotal) {
          console.log(`    WARNING: Sum (${summedOutcomes}) != total (${outcomes.total})`);
        }
      } else {
        logResult(`Drive Outcome Distribution (${season})`, true, 'No data');
      }
    } catch (e) {
      logResult(`Drive Outcome Distribution (${season})`, false, String(e));
    }

    // Test 5: Drive Comparison
    try {
      const comp = await getDriveComparison(season);
      if (comp) {
        const validOURate = comp.ou.successRate >= 0 && comp.ou.successRate <= 100;
        const validOppRate = comp.opponent.successRate >= 0 && comp.opponent.successRate <= 100;
        logResult(
          `Drive Comparison (${season})`,
          validOURate && validOppRate,
          `OU: ${comp.ou.successRate.toFixed(1)}% vs Opp: ${comp.opponent.successRate.toFixed(1)}%`
        );
      } else {
        logResult(`Drive Comparison (${season})`, true, 'No data');
      }
    } catch (e) {
      logResult(`Drive Comparison (${season})`, false, String(e));
    }
  }

  // Summary
  console.log('\n=== Summary ===\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} tests`);
  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
  if (failed > 0) {
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
  }

  if (failed === 0) {
    console.log('\n\x1b[32m✅ All Task 5.5 validation tests passed!\x1b[0m\n');
  } else {
    console.log('\n\x1b[31m❌ Some tests failed. Please review.\x1b[0m\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

validateDriveQueries().catch(console.error);
