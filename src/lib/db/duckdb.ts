/**
 * DuckDB Client for Analytics Queries
 * Fast OLAP queries on historical CFB data
 */

import { DuckDBInstance } from '@duckdb/node-api';
import { join } from 'path';

const DB_PATH = process.env.DUCKDB_PATH || join(process.cwd(), 'data', 'cfb.duckdb');

let instance: DuckDBInstance | null = null;

export async function getDuckDB(): Promise<DuckDBInstance> {
  if (!instance) {
    instance = await DuckDBInstance.create(DB_PATH);
  }
  return instance;
}

export async function initDuckDBSchema(): Promise<void> {
  const db = await getDuckDB();
  const connection = await db.connect();

  try {
    // Games table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY,
        season INTEGER NOT NULL,
        week INTEGER NOT NULL,
        season_type VARCHAR(20),
        start_date TIMESTAMP,
        neutral_site BOOLEAN,
        conference_game BOOLEAN,
        attendance INTEGER,
        venue VARCHAR(255),
        home_team VARCHAR(100) NOT NULL,
        home_id INTEGER,
        home_conference VARCHAR(50),
        home_points INTEGER,
        away_team VARCHAR(100) NOT NULL,
        away_id INTEGER,
        away_conference VARCHAR(50),
        away_points INTEGER,
        spread DOUBLE,
        over_under DOUBLE,
        excitement_index DOUBLE,
        completed BOOLEAN DEFAULT false
      )
    `);

    // Plays table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS plays (
        play_id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL,
        drive_id INTEGER,
        drive_number INTEGER,
        play_number INTEGER,
        period INTEGER,
        clock_minutes INTEGER,
        clock_seconds INTEGER,
        offense VARCHAR(100),
        defense VARCHAR(100),
        yard_line INTEGER,
        down INTEGER,
        distance INTEGER,
        yards_gained INTEGER,
        play_type VARCHAR(50),
        play_text VARCHAR(500),
        scoring BOOLEAN,
        ppa DOUBLE,
        epa DOUBLE,
        success BOOLEAN,
        FOREIGN KEY (game_id) REFERENCES games(game_id)
      )
    `);

    // Drives table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS drives (
        drive_id INTEGER PRIMARY KEY,
        game_id INTEGER NOT NULL,
        drive_number INTEGER,
        offense VARCHAR(100),
        defense VARCHAR(100),
        scoring BOOLEAN,
        start_period INTEGER,
        start_yardline INTEGER,
        start_yards_to_goal INTEGER,
        end_period INTEGER,
        end_yardline INTEGER,
        end_yards_to_goal INTEGER,
        plays INTEGER,
        yards INTEGER,
        drive_result VARCHAR(50),
        elapsed_minutes INTEGER,
        elapsed_seconds INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(game_id)
      )
    `);

    // Recruiting table (individual recruits)
    await connection.run(`
      CREATE TABLE IF NOT EXISTS recruiting (
        recruit_id INTEGER PRIMARY KEY,
        athlete_id INTEGER,
        recruit_type VARCHAR(20),
        year INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(20),
        height INTEGER,
        weight INTEGER,
        school VARCHAR(100),
        committed_to VARCHAR(100),
        stars INTEGER,
        rating DOUBLE,
        ranking INTEGER,
        city VARCHAR(100),
        state_province VARCHAR(50),
        country VARCHAR(50)
      )
    `);

    // Recruiting classes table (team rankings by year)
    await connection.run(`
      CREATE TABLE IF NOT EXISTS recruiting_classes (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        team VARCHAR(100) NOT NULL,
        rank INTEGER,
        points DOUBLE,
        UNIQUE(year, team)
      )
    `);

    // Recruiting position groups table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS recruiting_position_groups (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        team VARCHAR(100) NOT NULL,
        conference VARCHAR(50),
        position_group VARCHAR(30) NOT NULL,
        avg_rating DOUBLE,
        total_rating DOUBLE,
        commits INTEGER,
        avg_stars DOUBLE,
        UNIQUE(year, team, position_group)
      )
    `);

    // Transfers table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY,
        season INTEGER NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        position VARCHAR(20),
        origin VARCHAR(100),
        destination VARCHAR(100),
        transfer_date DATE,
        rating DOUBLE,
        stars INTEGER,
        eligibility VARCHAR(50)
      )
    `);

    // Roster table
    await connection.run(`
      CREATE TABLE IF NOT EXISTS roster (
        id INTEGER PRIMARY KEY,
        athlete_id INTEGER,
        season INTEGER NOT NULL,
        team VARCHAR(100) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        position VARCHAR(20),
        jersey INTEGER,
        height INTEGER,
        weight INTEGER,
        class_year INTEGER,
        hometown_city VARCHAR(100),
        hometown_state VARCHAR(50),
        hometown_country VARCHAR(50),
        UNIQUE(athlete_id, season, team)
      )
    `);

    // Create indexes for common queries
    await connection.run('CREATE INDEX IF NOT EXISTS idx_games_season ON games(season)');
    await connection.run('CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team)');
    await connection.run('CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team)');
    await connection.run('CREATE INDEX IF NOT EXISTS idx_plays_game_id ON plays(game_id)');
    await connection.run('CREATE INDEX IF NOT EXISTS idx_drives_game_id ON drives(game_id)');

    // Recruiting indexes
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_recruiting_committed ON recruiting(committed_to)'
    );
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_recruiting_year_committed ON recruiting(year, committed_to)'
    );
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_recruiting_classes_year ON recruiting_classes(year)'
    );
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_recruiting_classes_team ON recruiting_classes(team)'
    );
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_recruiting_pos_groups_year_team ON recruiting_position_groups(year, team)'
    );

    // Transfer portal indexes
    await connection.run('CREATE INDEX IF NOT EXISTS idx_transfers_season ON transfers(season)');
    await connection.run('CREATE INDEX IF NOT EXISTS idx_transfers_origin ON transfers(origin)');
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_transfers_destination ON transfers(destination)'
    );

    // Roster indexes
    await connection.run(
      'CREATE INDEX IF NOT EXISTS idx_roster_team_season ON roster(team, season)'
    );
  } finally {
    connection.closeSync();
  }
}

export function closeDuckDB(): void {
  if (instance) {
    instance.closeSync();
    instance = null;
  }
}
