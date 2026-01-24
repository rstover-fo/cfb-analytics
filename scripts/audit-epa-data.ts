/**
 * Task 5.0: EPA/PPA Data Availability Audit
 * Run with: npx tsx scripts/audit-epa-data.ts
 *
 * This script verifies EPA data availability before building Sprint 5 features.
 * Go/No-Go decision: Proceed if >90% of plays have PPA data.
 */

import { getDuckDB, closeDuckDB } from '../src/lib/db/duckdb';

interface CoverageRow {
  season: number;
  total_plays: number;
  has_ppa: number;
  ppa_pct: number;
}

interface PlayTypeRow {
  play_type: string;
  count: number;
}

async function main() {
  console.log('='.repeat(70));
  console.log('Sprint 5.0: EPA/PPA Data Availability Audit');
  console.log('Oklahoma Sooners (2001-2025)');
  console.log('='.repeat(70));
  console.log();

  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Query 1: Coverage by season
    console.log('1. EPA/PPA/Success Coverage by Season');
    console.log('-'.repeat(70));

    const coverageQuery = `
      SELECT
        g.season,
        COUNT(*) as total_plays,
        COUNT(p.ppa) as has_ppa,
        ROUND(100.0 * COUNT(p.ppa) / COUNT(*), 1) as ppa_pct
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE (g.home_team = 'Oklahoma' OR g.away_team = 'Oklahoma')
        AND g.season >= 2001 AND g.season <= 2025
      GROUP BY g.season
      ORDER BY g.season
    `;

    const coverageResult = await connection.run(coverageQuery);
    const coverageRows: CoverageRow[] = (await coverageResult.getRows()).map((row) => ({
      season: Number(row[0]),
      total_plays: Number(row[1]),
      has_ppa: Number(row[2]),
      ppa_pct: Number(row[3]),
    }));

    console.log('Season | Total Plays | Has PPA | PPA %  | Status');
    console.log('-'.repeat(55));

    let totalPlays = 0;
    let totalWithPPA = 0;
    const flaggedSeasons: number[] = [];

    for (const row of coverageRows) {
      totalPlays += row.total_plays;
      totalWithPPA += row.has_ppa;

      const status = row.ppa_pct < 80 ? '⚠️ LOW' : '✓';
      if (row.ppa_pct < 80) flaggedSeasons.push(row.season);

      console.log(
        `${row.season}   | ${String(row.total_plays).padStart(11)} | ${String(row.has_ppa).padStart(7)} | ${String(row.ppa_pct).padStart(5)}% | ${status}`
      );
    }

    const overallPPAPct = totalPlays > 0 ? ((totalWithPPA / totalPlays) * 100).toFixed(1) : '0.0';

    console.log('-'.repeat(55));
    console.log(
      `TOTAL  | ${String(totalPlays).padStart(11)} | ${String(totalWithPPA).padStart(7)} | ${overallPPAPct.padStart(5)}%`
    );

    console.log();
    console.log('Summary:');
    console.log(`  - Overall PPA coverage: ${overallPPAPct}%`);
    if (flaggedSeasons.length > 0) {
      console.log(`  - Seasons with <80% coverage: ${flaggedSeasons.join(', ')}`);
    }

    // Query 2: Distinct play types
    console.log();
    console.log('2. Distinct Play Types');
    console.log('-'.repeat(70));

    const playTypesQuery = `
      SELECT
        play_type,
        COUNT(*) as count
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE (g.home_team = 'Oklahoma' OR g.away_team = 'Oklahoma')
        AND g.season >= 2001 AND g.season <= 2025
      GROUP BY play_type
      ORDER BY count DESC
    `;

    const playTypesResult = await connection.run(playTypesQuery);
    const playTypeRows: PlayTypeRow[] = (await playTypesResult.getRows()).map((row) => ({
      play_type: String(row[0]),
      count: Number(row[1]),
    }));

    console.log('Play Type                          | Count');
    console.log('-'.repeat(50));
    for (const row of playTypeRows) {
      console.log(`${(row.play_type || '(null)').padEnd(34)} | ${row.count}`);
    }
    console.log(`\nTotal distinct play types: ${playTypeRows.length}`);

    // Query 3: PPA distribution check (sanity check for values)
    console.log();
    console.log('3. PPA Value Distribution (sanity check)');
    console.log('-'.repeat(70));

    const ppaDistQuery = `
      SELECT
        CASE
          WHEN ppa IS NULL THEN 'NULL'
          WHEN ppa < -2 THEN '< -2.0'
          WHEN ppa < -1 THEN '-2.0 to -1.0'
          WHEN ppa < 0 THEN '-1.0 to 0.0'
          WHEN ppa < 1 THEN '0.0 to 1.0'
          WHEN ppa < 2 THEN '1.0 to 2.0'
          ELSE '>= 2.0'
        END as ppa_bucket,
        COUNT(*) as count
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE (g.home_team = 'Oklahoma' OR g.away_team = 'Oklahoma')
        AND g.season >= 2001 AND g.season <= 2025
      GROUP BY ppa_bucket
      ORDER BY
        CASE ppa_bucket
          WHEN 'NULL' THEN 0
          WHEN '< -2.0' THEN 1
          WHEN '-2.0 to -1.0' THEN 2
          WHEN '-1.0 to 0.0' THEN 3
          WHEN '0.0 to 1.0' THEN 4
          WHEN '1.0 to 2.0' THEN 5
          ELSE 6
        END
    `;

    const ppaDistResult = await connection.run(ppaDistQuery);
    const ppaDistRows = await ppaDistResult.getRows();

    console.log('PPA Bucket       | Count');
    console.log('-'.repeat(35));
    for (const row of ppaDistRows) {
      console.log(`${String(row[0]).padEnd(16)} | ${row[1]}`);
    }

    // Query 4: Scrimmage plays only (for EPA calculations)
    console.log();
    console.log('4. Scrimmage Play Coverage (Rush + Pass only)');
    console.log('-'.repeat(70));

    const scrimmageQuery = `
      SELECT
        g.season,
        COUNT(*) as total_scrimmage,
        COUNT(p.ppa) as has_ppa,
        ROUND(100.0 * COUNT(p.ppa) / COUNT(*), 1) as ppa_pct
      FROM plays p
      JOIN games g ON p.game_id = g.id
      WHERE (g.home_team = 'Oklahoma' OR g.away_team = 'Oklahoma')
        AND g.season >= 2001 AND g.season <= 2025
        AND p.play_type IN (
          'Rush', 'Rushing Touchdown',
          'Pass Reception', 'Pass Incompletion', 'Passing Touchdown',
          'Sack', 'Pass Interception Return'
        )
      GROUP BY g.season
      ORDER BY g.season
    `;

    const scrimmageResult = await connection.run(scrimmageQuery);
    const scrimmageRows = await scrimmageResult.getRows();

    console.log('Season | Scrimmage Plays | Has PPA | PPA %');
    console.log('-'.repeat(50));

    let totalScrimmage = 0;
    let scrimmagePPA = 0;

    for (const row of scrimmageRows) {
      totalScrimmage += Number(row[1]);
      scrimmagePPA += Number(row[2]);
      console.log(
        `${row[0]}   | ${String(row[1]).padStart(15)} | ${String(row[2]).padStart(7)} | ${String(row[3]).padStart(5)}%`
      );
    }

    const scrimmagePPAPct =
      totalScrimmage > 0 ? ((scrimmagePPA / totalScrimmage) * 100).toFixed(1) : '0.0';
    console.log('-'.repeat(50));
    console.log(
      `TOTAL  | ${String(totalScrimmage).padStart(15)} | ${String(scrimmagePPA).padStart(7)} | ${scrimmagePPAPct.padStart(5)}%`
    );

    // GO/NO-GO Decision
    console.log();
    console.log('='.repeat(70));
    console.log('GO/NO-GO DECISION');
    console.log('='.repeat(70));
    console.log();

    const ppaThreshold = 90;
    const overallPPANum = parseFloat(overallPPAPct);
    const scrimmagePPANum = parseFloat(scrimmagePPAPct);

    if (scrimmagePPANum >= ppaThreshold) {
      console.log(`✅ GO: Scrimmage play PPA coverage is ${scrimmagePPAPct}% (threshold: ${ppaThreshold}%)`);
      console.log();
      console.log('Recommendation: Proceed with Sprint 5 implementation.');
      console.log('- Use PPA column as primary EPA metric (surface as "EPA" in UI)');
      console.log('- Success rate: Calculate as ppa > 0 (no separate success column in schema)');
    } else if (overallPPANum >= ppaThreshold) {
      console.log(`⚠️ CONDITIONAL GO: Overall PPA coverage is ${overallPPAPct}%`);
      console.log(`   Scrimmage play coverage is ${scrimmagePPAPct}%`);
      console.log();
      console.log('Recommendation: Proceed with caution, document gaps.');
    } else {
      console.log(`❌ NO-GO: PPA coverage is ${overallPPAPct}% (threshold: ${ppaThreshold}%)`);
      console.log();
      console.log('Recommendation: Revise Sprint 5 scope or investigate data ingestion.');
    }

    if (flaggedSeasons.length > 0) {
      console.log();
      console.log('Note: The following seasons have <80% coverage and may have gaps:');
      console.log(`  ${flaggedSeasons.join(', ')}`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('Audit complete. Save results to docs/SPRINT_5_DATA_AUDIT.md');
    console.log('='.repeat(70));
  } finally {
    connection.closeSync();
    closeDuckDB();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error running audit:', err);
  process.exit(1);
});
