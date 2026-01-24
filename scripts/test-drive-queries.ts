import {
  getPointsPerDriveByPosition,
  getDriveSuccessRate,
  getAverageDriveMetrics,
  getDriveOutcomeDistribution,
  getDriveComparison,
} from '../src/lib/db/queries';

async function testDriveQueries() {
  const season = 2024;
  console.log('Testing drive analytics queries for ' + season + '...\n');

  try {
    // Test 1: Points per drive by position
    console.log('1. Points Per Drive by Position:');
    const ppd = await getPointsPerDriveByPosition(season);
    if (ppd) {
      console.log('   Red Zone (0-20):     ' + ppd.redZone.drives + ' drives, ' + ppd.redZone.points + ' pts, ' + ppd.redZone.ppd + ' PPD');
      console.log('   Opponent (21-40):    ' + ppd.opponent.drives + ' drives, ' + ppd.opponent.points + ' pts, ' + ppd.opponent.ppd + ' PPD');
      console.log('   Midfield (41-60):    ' + ppd.midfield.drives + ' drives, ' + ppd.midfield.points + ' pts, ' + ppd.midfield.ppd + ' PPD');
      console.log('   Own Half (61+):      ' + ppd.ownHalf.drives + ' drives, ' + ppd.ownHalf.points + ' pts, ' + ppd.ownHalf.ppd + ' PPD');
      console.log('   Overall:             ' + ppd.overall.drives + ' drives, ' + ppd.overall.points + ' pts, ' + ppd.overall.ppd + ' PPD');
    } else {
      console.log('   No data');
    }

    // Test 2: Drive success rate
    console.log('\n2. Drive Success Rate:');
    const success = await getDriveSuccessRate(season);
    if (success) {
      console.log('   Total Drives:    ' + success.totalDrives);
      console.log('   Scoring Drives:  ' + success.scoringDrives);
      console.log('   Success Rate:    ' + success.successRate + '%');
    } else {
      console.log('   No data');
    }

    // Test 3: Average drive metrics
    console.log('\n3. Average Drive Metrics:');
    const avg = await getAverageDriveMetrics(season);
    if (avg) {
      console.log('   Avg Plays:  ' + avg.avgPlays);
      console.log('   Avg Yards:  ' + avg.avgYards);
      console.log('   Avg Time:   ' + avg.avgTimeMinutes + ':' + String(avg.avgTimeSeconds).padStart(2, '0'));
      console.log('   Total:      ' + avg.totalDrives + ' drives');
    } else {
      console.log('   No data');
    }

    // Test 4: Drive outcome distribution
    console.log('\n4. Drive Outcome Distribution:');
    const outcomes = await getDriveOutcomeDistribution(season);
    if (outcomes) {
      console.log('   Touchdowns:   ' + outcomes.touchdowns + ' (' + Math.round(100 * outcomes.touchdowns / outcomes.total) + '%)');
      console.log('   Field Goals:  ' + outcomes.fieldGoals + ' (' + Math.round(100 * outcomes.fieldGoals / outcomes.total) + '%)');
      console.log('   Punts:        ' + outcomes.punts + ' (' + Math.round(100 * outcomes.punts / outcomes.total) + '%)');
      console.log('   Turnovers:    ' + outcomes.turnovers + ' (' + Math.round(100 * outcomes.turnovers / outcomes.total) + '%)');
      console.log('   Downs:        ' + outcomes.downs + ' (' + Math.round(100 * outcomes.downs / outcomes.total) + '%)');
      console.log('   End of Half:  ' + outcomes.endOfHalf + ' (' + Math.round(100 * outcomes.endOfHalf / outcomes.total) + '%)');
      console.log('   Other:        ' + outcomes.other + ' (' + Math.round(100 * outcomes.other / outcomes.total) + '%)');
      console.log('   Total:        ' + outcomes.total);
    } else {
      console.log('   No data');
    }

    // Test 5: Drive comparison
    console.log('\n5. Drive Comparison (OU vs Opponents):');
    const comp = await getDriveComparison(season);
    if (comp) {
      console.log('   OU Offense:');
      console.log('     Drives: ' + comp.ou.totalDrives + ', Scoring: ' + comp.ou.scoringDrives + ', Rate: ' + comp.ou.successRate + '%');
      console.log('     Avg: ' + comp.ou.avgPlays + ' plays, ' + comp.ou.avgYards + ' yds, ' + comp.ou.avgTimeMinutes + ' min');
      console.log('   Opponent Offense (vs OU Defense):');
      console.log('     Drives: ' + comp.opponent.totalDrives + ', Scoring: ' + comp.opponent.scoringDrives + ', Rate: ' + comp.opponent.successRate + '%');
      console.log('     Avg: ' + comp.opponent.avgPlays + ' plays, ' + comp.opponent.avgYards + ' yds, ' + comp.opponent.avgTimeMinutes + ' min');
    } else {
      console.log('   No data');
    }

    console.log('\nAll drive queries executed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

testDriveQueries();
