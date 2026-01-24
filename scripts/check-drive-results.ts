import { getDuckDB } from '../src/lib/db/duckdb';

async function checkDriveResults() {
  const db = await getDuckDB();
  const connection = await db.connect();
  
  try {
    // Get distinct drive results
    const result = await connection.run(`
      SELECT DISTINCT drive_result, COUNT(*) as count
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE (g.home_team = 'Oklahoma' OR g.away_team = 'Oklahoma')
      GROUP BY drive_result
      ORDER BY count DESC
    `);
    
    const rows = await result.getRows();
    console.log('Drive Results:');
    for (const row of rows) {
      console.log(`  ${row[0]}: ${row[1]}`);
    }
    
    // Check field position distribution
    const fpResult = await connection.run(`
      SELECT 
        CASE 
          WHEN start_yards_to_goal <= 20 THEN 'Red Zone (0-20)'
          WHEN start_yards_to_goal <= 40 THEN 'Opponent Territory (21-40)'
          WHEN start_yards_to_goal <= 60 THEN 'Midfield (41-60)'
          ELSE 'Own Half (61+)'
        END as bucket,
        COUNT(*) as count
      FROM drives d
      JOIN games g ON d.game_id = g.id
      WHERE d.offense = 'Oklahoma'
        AND g.season = 2024
      GROUP BY bucket
      ORDER BY bucket
    `);
    
    const fpRows = await fpResult.getRows();
    console.log('\nField Position Buckets (2024 OU Offense):');
    for (const row of fpRows) {
      console.log(`  ${row[0]}: ${row[1]}`);
    }
    
    // Check if there's a points column or if we need to infer
    const schemaResult = await connection.run(`
      DESCRIBE drives
    `);
    const schemaRows = await schemaResult.getRows();
    console.log('\nDrives Table Schema:');
    for (const row of schemaRows) {
      console.log(`  ${row[0]}: ${row[1]}`);
    }
    
  } finally {
    connection.closeSync();
    process.exit(0);
  }
}

checkDriveResults().catch(console.error);
