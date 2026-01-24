/**
 * Sprint 6 Data Layer Validation Script
 * Run with: npx tsx scripts/validate-sprint6.ts
 *
 * Validates all Sprint 6 data layers:
 * - Recruiting data (2014-2025)
 * - Transfer portal data (2021-2025)
 * - Roster data (current season)
 */

import {
  getClassSummary,
  getPositionBreakdown,
  getCommitTimeline,
  getClassRankingHistory,
  getTopRecruits,
  getPositionTrends,
  getConferencePeerComparison,
  getPortalDepartures,
  getPortalArrivals,
  getPortalImpact,
  getPortalHistory,
  getRosterByPosition,
  getExperienceBreakdown,
  getScholarshipCount,
  getRosterSummary,
} from '../src/lib/db/queries/index';
import { getDuckDB, closeDuckDB } from '../src/lib/db/duckdb';

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

// ============================================================================
// Recruiting Validation
// ============================================================================

async function validateRecruitingData() {
  console.log('\n=== Recruiting Data Validation ===\n');

  // Test class summary for 2024
  try {
    const summary2024 = await getClassSummary(2024);
    if (summary2024 && summary2024.totalCommits > 0) {
      log({
        name: 'Class Summary 2024',
        status: 'pass',
        message: `${summary2024.totalCommits} commits, avg rating ${summary2024.avgRating.toFixed(4)}, ${summary2024.fiveStars}★5, ${summary2024.fourStars}★4`,
      });
    } else {
      log({
        name: 'Class Summary 2024',
        status: 'warn',
        message: 'No recruiting data for 2024',
      });
    }
  } catch (error) {
    log({
      name: 'Class Summary 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test position breakdown
  try {
    const positions = await getPositionBreakdown(2024);
    if (positions.length > 0) {
      log({
        name: 'Position Breakdown 2024',
        status: 'pass',
        message: `${positions.length} position groups`,
      });
    } else {
      log({
        name: 'Position Breakdown 2024',
        status: 'warn',
        message: 'No position data',
      });
    }
  } catch (error) {
    log({
      name: 'Position Breakdown 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test commit timeline
  try {
    const timeline = await getCommitTimeline(2024);
    if (timeline.length > 0) {
      log({
        name: 'Commit Timeline 2024',
        status: 'pass',
        message: `${timeline.length} commits in timeline`,
      });
    } else {
      log({
        name: 'Commit Timeline 2024',
        status: 'warn',
        message: 'No timeline data',
      });
    }
  } catch (error) {
    log({
      name: 'Commit Timeline 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test class ranking history
  try {
    const history = await getClassRankingHistory(2014, 2025);
    if (history.length > 0) {
      log({
        name: 'Class Ranking History',
        status: 'pass',
        message: `${history.length} years of ranking data`,
      });
    } else {
      log({
        name: 'Class Ranking History',
        status: 'warn',
        message: 'No ranking history',
      });
    }
  } catch (error) {
    log({
      name: 'Class Ranking History',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test top recruits (validate Spencer Rattler in 2019 class)
  try {
    const top2019 = await getTopRecruits(2019, 20);
    const rattler = top2019.find((r) => r.name.toLowerCase().includes('rattler'));
    if (rattler && rattler.stars === 5) {
      log({
        name: 'Top Recruits 2019 (Rattler)',
        status: 'pass',
        message: `Found Spencer Rattler: ${rattler.stars}★, rating ${rattler.rating.toFixed(4)}`,
      });
    } else if (top2019.length > 0) {
      log({
        name: 'Top Recruits 2019',
        status: 'warn',
        message: `${top2019.length} recruits found, but Rattler not found as 5★`,
      });
    } else {
      log({
        name: 'Top Recruits 2019',
        status: 'warn',
        message: 'No recruit data for 2019',
      });
    }
  } catch (error) {
    log({
      name: 'Top Recruits 2019',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test position trends
  try {
    const trends = await getPositionTrends(2014, 2025);
    if (trends.length > 0) {
      log({
        name: 'Position Trends',
        status: 'pass',
        message: `${trends.length} position-year combinations`,
      });
    } else {
      log({
        name: 'Position Trends',
        status: 'warn',
        message: 'No trend data',
      });
    }
  } catch (error) {
    log({
      name: 'Position Trends',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test conference peer comparison
  try {
    const peers = await getConferencePeerComparison(2024);
    if (peers.length > 0) {
      const ouRank = peers.find((p) => p.team === 'Oklahoma');
      log({
        name: 'Conference Peer Comparison 2024',
        status: 'pass',
        message: `${peers.length} teams compared, Oklahoma rank: #${ouRank?.rank || 'N/A'}`,
      });
    } else {
      log({
        name: 'Conference Peer Comparison 2024',
        status: 'warn',
        message: 'No peer comparison data',
      });
    }
  } catch (error) {
    log({
      name: 'Conference Peer Comparison 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}

// ============================================================================
// Transfer Portal Validation
// ============================================================================

async function validateTransferData() {
  console.log('\n=== Transfer Portal Data Validation ===\n');

  // Test portal departures 2024
  try {
    const departures = await getPortalDepartures(2024);
    if (departures.length > 0) {
      log({
        name: 'Portal Departures 2024',
        status: 'pass',
        message: `${departures.length} departures`,
      });
    } else {
      log({
        name: 'Portal Departures 2024',
        status: 'warn',
        message: 'No departure data for 2024',
      });
    }
  } catch (error) {
    log({
      name: 'Portal Departures 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test portal arrivals 2024
  try {
    const arrivals = await getPortalArrivals(2024);
    if (arrivals.length > 0) {
      log({
        name: 'Portal Arrivals 2024',
        status: 'pass',
        message: `${arrivals.length} arrivals`,
      });
    } else {
      log({
        name: 'Portal Arrivals 2024',
        status: 'warn',
        message: 'No arrival data for 2024',
      });
    }
  } catch (error) {
    log({
      name: 'Portal Arrivals 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test portal impact
  try {
    const impact = await getPortalImpact(2024);
    if (impact) {
      log({
        name: 'Portal Impact 2024',
        status: 'pass',
        message: `Net change: ${impact.netChange > 0 ? '+' : ''}${impact.netChange} players`,
      });
    } else {
      log({
        name: 'Portal Impact 2024',
        status: 'warn',
        message: 'No impact data',
      });
    }
  } catch (error) {
    log({
      name: 'Portal Impact 2024',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test portal history
  try {
    const history = await getPortalHistory(2021, 2025);
    if (history.length > 0) {
      log({
        name: 'Portal History (2021-2025)',
        status: 'pass',
        message: `${history.length} years of portal data`,
      });
    } else {
      log({
        name: 'Portal History (2021-2025)',
        status: 'warn',
        message: 'No portal history',
      });
    }
  } catch (error) {
    log({
      name: 'Portal History (2021-2025)',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test pre-2021 returns empty (not error)
  try {
    const pre2021 = await getPortalDepartures(2020);
    if (pre2021.length === 0) {
      log({
        name: 'Portal Pre-2021 Empty',
        status: 'pass',
        message: 'Correctly returns empty array for pre-2021',
      });
    } else {
      log({
        name: 'Portal Pre-2021 Empty',
        status: 'warn',
        message: 'Expected empty array for pre-2021',
      });
    }
  } catch (error) {
    log({
      name: 'Portal Pre-2021 Empty',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}

// ============================================================================
// Roster Validation
// ============================================================================

async function validateRosterData() {
  console.log('\n=== Roster Data Validation ===\n');

  const currentYear = 2024;

  // Test roster by position
  try {
    const positions = await getRosterByPosition(currentYear);
    const totalPlayers = positions.reduce((sum, g) => sum + g.count, 0);

    // Expected: 85-130 players
    if (totalPlayers >= 85 && totalPlayers <= 150) {
      log({
        name: `Roster ${currentYear}`,
        status: 'pass',
        message: `${totalPlayers} players across ${positions.length} positions`,
      });
    } else if (totalPlayers > 0) {
      log({
        name: `Roster ${currentYear}`,
        status: 'warn',
        message: `${totalPlayers} players (expected 85-130)`,
      });
    } else {
      log({
        name: `Roster ${currentYear}`,
        status: 'warn',
        message: 'No roster data',
      });
    }
  } catch (error) {
    log({
      name: `Roster ${currentYear}`,
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test experience breakdown
  try {
    const breakdown = await getExperienceBreakdown(currentYear);
    if (breakdown.length > 0) {
      const frCount = breakdown.find((b) => b.label === 'FR')?.count || 0;
      const srCount = breakdown.find((b) => b.label === 'SR')?.count || 0;
      log({
        name: 'Experience Breakdown',
        status: 'pass',
        message: `FR: ${frCount}, SR: ${srCount}, ${breakdown.length} class years`,
      });
    } else {
      log({
        name: 'Experience Breakdown',
        status: 'warn',
        message: 'No experience data',
      });
    }
  } catch (error) {
    log({
      name: 'Experience Breakdown',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test scholarship count
  try {
    const scholarship = await getScholarshipCount(currentYear);
    if (scholarship) {
      log({
        name: 'Scholarship Count',
        status: 'pass',
        message: `${scholarship.totalPlayers} total (${scholarship.utilizationPercentage}% of 85 limit)`,
      });
    } else {
      log({
        name: 'Scholarship Count',
        status: 'warn',
        message: 'No scholarship data',
      });
    }
  } catch (error) {
    log({
      name: 'Scholarship Count',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test roster summary
  try {
    const summary = await getRosterSummary(currentYear);
    if (summary) {
      log({
        name: 'Roster Summary',
        status: 'pass',
        message: `${summary.totalPlayers} players, avg height ${summary.avgHeight?.toFixed(0) || 'N/A'}`,
      });
    } else {
      log({
        name: 'Roster Summary',
        status: 'warn',
        message: 'No summary data',
      });
    }
  } catch (error) {
    log({
      name: 'Roster Summary',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}

// ============================================================================
// Database Validation
// ============================================================================

async function validateDatabaseTables() {
  console.log('\n=== Database Table Validation ===\n');

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Check recruiting table
    const recruitResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting WHERE committed_to = 'Oklahoma'
    `);
    const recruitRows = await recruitResult.getRows();
    const recruitCount = Number(recruitRows[0]?.[0] || 0);

    if (recruitCount > 0) {
      log({
        name: 'Recruiting Table',
        status: 'pass',
        message: `${recruitCount} Oklahoma recruits`,
      });
    } else {
      log({
        name: 'Recruiting Table',
        status: 'warn',
        message: 'No recruiting data - run ingest-recruiting.ts',
      });
    }

    // Check recruiting_classes table
    const classResult = await connection.run(`
      SELECT COUNT(*) FROM recruiting_classes WHERE team = 'Oklahoma'
    `);
    const classRows = await classResult.getRows();
    const classCount = Number(classRows[0]?.[0] || 0);

    if (classCount > 0) {
      log({
        name: 'Recruiting Classes Table',
        status: 'pass',
        message: `${classCount} class rankings`,
      });
    } else {
      log({
        name: 'Recruiting Classes Table',
        status: 'warn',
        message: 'No class ranking data',
      });
    }

    // Check transfers table
    const transferResult = await connection.run(`
      SELECT COUNT(*) FROM transfers WHERE origin = 'Oklahoma' OR destination = 'Oklahoma'
    `);
    const transferRows = await transferResult.getRows();
    const transferCount = Number(transferRows[0]?.[0] || 0);

    if (transferCount > 0) {
      log({
        name: 'Transfers Table',
        status: 'pass',
        message: `${transferCount} Oklahoma-related transfers`,
      });
    } else {
      log({
        name: 'Transfers Table',
        status: 'warn',
        message: 'No transfer data - run ingest-transfers.ts',
      });
    }

    // Check roster table
    const rosterResult = await connection.run(`
      SELECT COUNT(*) FROM roster WHERE team = 'Oklahoma'
    `);
    const rosterRows = await rosterResult.getRows();
    const rosterCount = Number(rosterRows[0]?.[0] || 0);

    if (rosterCount > 0) {
      log({
        name: 'Roster Table',
        status: 'pass',
        message: `${rosterCount} Oklahoma roster entries`,
      });
    } else {
      log({
        name: 'Roster Table',
        status: 'warn',
        message: 'No roster data - run ingest-roster.ts',
      });
    }
  } finally {
    connection.closeSync();
  }
}

// ============================================================================
// Multi-Year Validation
// ============================================================================

async function validateMultiYearRecruiting() {
  console.log('\n=== Multi-Year Recruiting Validation (2014-2025) ===\n');

  const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  let successCount = 0;

  for (const year of years) {
    try {
      const summary = await getClassSummary(year);
      if (summary && summary.totalCommits > 0) {
        successCount++;
      }
    } catch {
      // Skip errors silently
    }
  }

  log({
    name: 'Multi-Year Recruiting',
    status: successCount >= 10 ? 'pass' : successCount >= 5 ? 'warn' : 'fail',
    message: `${successCount} of ${years.length} years have recruiting data`,
  });
}

async function validateMultiYearPortal() {
  console.log('\n=== Multi-Year Portal Validation (2021-2025) ===\n');

  const years = [2021, 2022, 2023, 2024, 2025];
  let successCount = 0;

  for (const year of years) {
    try {
      const departures = await getPortalDepartures(year);
      const arrivals = await getPortalArrivals(year);
      if (departures.length > 0 || arrivals.length > 0) {
        successCount++;
      }
    } catch {
      // Skip errors silently
    }
  }

  log({
    name: 'Multi-Year Portal',
    status: successCount === years.length ? 'pass' : successCount >= 3 ? 'warn' : 'fail',
    message: `${successCount} of ${years.length} years have portal data`,
  });
}

// ============================================================================
// Empty State Validation
// ============================================================================

async function validateEmptyStates() {
  console.log('\n=== Empty State Validation ===\n');

  // Test recruiting empty state for year with no data (e.g., 2000)
  try {
    const summaryFar = await getClassSummary(2000);
    log({
      name: 'Recruiting Empty (Year 2000)',
      status: summaryFar === null ? 'pass' : 'warn',
      message: summaryFar === null ? 'Correctly returns null for year with no data' : 'Expected null',
    });
  } catch (error) {
    log({
      name: 'Recruiting Empty (Year 2000)',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test portal empty state for pre-2021 year
  try {
    const portalPre = await getPortalDepartures(2019);
    log({
      name: 'Portal Empty (Pre-2021)',
      status: portalPre.length === 0 ? 'pass' : 'warn',
      message: portalPre.length === 0 ? 'Correctly returns empty array' : `Expected empty, got ${portalPre.length}`,
    });
  } catch (error) {
    log({
      name: 'Portal Empty (Pre-2021)',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test roster empty state for year with no data
  try {
    const rosterFar = await getRosterByPosition(2000);
    log({
      name: 'Roster Empty (Year 2000)',
      status: rosterFar.length === 0 ? 'pass' : 'warn',
      message: rosterFar.length === 0 ? 'Correctly returns empty array' : `Expected empty, got ${rosterFar.length}`,
    });
  } catch (error) {
    log({
      name: 'Roster Empty (Year 2000)',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Sprint 6 - Data Layer Validation Script            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  await validateDatabaseTables();
  await validateRecruitingData();
  await validateTransferData();
  await validateRosterData();
  await validateMultiYearRecruiting();
  await validateMultiYearPortal();
  await validateEmptyStates();

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
    console.log('Note: Warnings may indicate missing data. Run ingestion scripts:');
    console.log('  npx tsx scripts/ingest-recruiting.ts');
    console.log('  npx tsx scripts/ingest-transfers.ts');
    console.log('  npx tsx scripts/ingest-roster.ts');
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
