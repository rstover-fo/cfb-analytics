-- CFB Analytics Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CONFERENCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS conferences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  short_name VARCHAR(20),
  abbreviation VARCHAR(10),
  classification VARCHAR(20), -- 'fbs' or 'fcs'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TEAMS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  school VARCHAR(100) NOT NULL UNIQUE,
  mascot VARCHAR(100),
  abbreviation VARCHAR(10),
  conference_id INTEGER REFERENCES conferences(id),
  conference VARCHAR(100),
  division VARCHAR(50),
  color VARCHAR(7), -- Hex color
  alt_color VARCHAR(7),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_school ON teams(school);

-- =====================
-- GAMES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  cfbd_id INTEGER UNIQUE, -- ID from CFBD API
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  season_type VARCHAR(20) DEFAULT 'regular', -- regular, postseason
  start_date TIMESTAMPTZ,
  neutral_site BOOLEAN DEFAULT FALSE,
  conference_game BOOLEAN DEFAULT FALSE,
  attendance INTEGER,
  venue VARCHAR(200),
  venue_id INTEGER,

  -- Home team
  home_team VARCHAR(100) NOT NULL,
  home_team_id INTEGER REFERENCES teams(id),
  home_conference VARCHAR(100),
  home_points INTEGER,
  home_line_scores JSONB, -- Quarter-by-quarter scores

  -- Away team
  away_team VARCHAR(100) NOT NULL,
  away_team_id INTEGER REFERENCES teams(id),
  away_conference VARCHAR(100),
  away_points INTEGER,
  away_line_scores JSONB,

  -- Game metadata
  excitement_index DECIMAL(5,4),
  highlights TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_season ON games(season);
CREATE INDEX idx_games_week ON games(season, week);
CREATE INDEX idx_games_home_team ON games(home_team);
CREATE INDEX idx_games_away_team ON games(away_team);
CREATE INDEX idx_games_date ON games(start_date);

-- =====================
-- TEAM RECORDS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS team_records (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  team VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  conference VARCHAR(100),
  division VARCHAR(50),

  -- Overall record
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_ties INTEGER DEFAULT 0,

  -- Conference record
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  conference_ties INTEGER DEFAULT 0,

  -- Home record
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,

  -- Away record
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,

  -- Expected wins (SRS-based)
  expected_wins DECIMAL(4,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season, team)
);

CREATE INDEX idx_team_records_season ON team_records(season);
CREATE INDEX idx_team_records_team ON team_records(team);

-- =====================
-- RANKINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS rankings (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  poll_type VARCHAR(50) NOT NULL, -- 'AP Top 25', 'Coaches Poll', 'Playoff Rankings'

  rank INTEGER NOT NULL,
  school VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  conference VARCHAR(100),

  first_place_votes INTEGER DEFAULT 0,
  points INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season, week, poll_type, school)
);

CREATE INDEX idx_rankings_season_week ON rankings(season, week);
CREATE INDEX idx_rankings_poll ON rankings(poll_type);
CREATE INDEX idx_rankings_school ON rankings(school);

-- =====================
-- PLAYER STATS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS player_stats (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  player_name VARCHAR(150) NOT NULL,
  team VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  conference VARCHAR(100),

  category VARCHAR(50) NOT NULL, -- passing, rushing, receiving, defense, kicking, etc.
  stat_type VARCHAR(50) NOT NULL, -- YDS, TD, ATT, INT, etc.
  stat_value DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season, player_name, team, category, stat_type)
);

CREATE INDEX idx_player_stats_season ON player_stats(season);
CREATE INDEX idx_player_stats_team ON player_stats(team);
CREATE INDEX idx_player_stats_category ON player_stats(category);
CREATE INDEX idx_player_stats_player ON player_stats(player_name);

-- =====================
-- ADVANCED STATS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS advanced_stats (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  team VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  conference VARCHAR(100),

  -- Offensive stats
  off_plays INTEGER,
  off_drives INTEGER,
  off_ppa DECIMAL(6,4), -- Points Per Play Added
  off_total_ppa DECIMAL(8,2),
  off_success_rate DECIMAL(5,4),
  off_explosiveness DECIMAL(6,4),
  off_power_success DECIMAL(5,4),
  off_stuff_rate DECIMAL(5,4),
  off_line_yards DECIMAL(6,2),
  off_line_yards_total DECIMAL(8,2),
  off_second_level_yards DECIMAL(6,2),
  off_second_level_yards_total DECIMAL(8,2),
  off_open_field_yards DECIMAL(6,2),
  off_open_field_yards_total DECIMAL(8,2),
  off_standard_downs_ppa DECIMAL(6,4),
  off_standard_downs_success_rate DECIMAL(5,4),
  off_standard_downs_explosiveness DECIMAL(6,4),
  off_passing_downs_ppa DECIMAL(6,4),
  off_passing_downs_success_rate DECIMAL(5,4),
  off_passing_downs_explosiveness DECIMAL(6,4),
  off_rushing_ppa DECIMAL(6,4),
  off_rushing_total_ppa DECIMAL(8,2),
  off_rushing_success_rate DECIMAL(5,4),
  off_rushing_explosiveness DECIMAL(6,4),
  off_passing_ppa DECIMAL(6,4),
  off_passing_total_ppa DECIMAL(8,2),
  off_passing_success_rate DECIMAL(5,4),
  off_passing_explosiveness DECIMAL(6,4),

  -- Defensive stats
  def_plays INTEGER,
  def_drives INTEGER,
  def_ppa DECIMAL(6,4),
  def_total_ppa DECIMAL(8,2),
  def_success_rate DECIMAL(5,4),
  def_explosiveness DECIMAL(6,4),
  def_power_success DECIMAL(5,4),
  def_stuff_rate DECIMAL(5,4),
  def_line_yards DECIMAL(6,2),
  def_line_yards_total DECIMAL(8,2),
  def_second_level_yards DECIMAL(6,2),
  def_second_level_yards_total DECIMAL(8,2),
  def_open_field_yards DECIMAL(6,2),
  def_open_field_yards_total DECIMAL(8,2),
  def_standard_downs_ppa DECIMAL(6,4),
  def_standard_downs_success_rate DECIMAL(5,4),
  def_standard_downs_explosiveness DECIMAL(6,4),
  def_passing_downs_ppa DECIMAL(6,4),
  def_passing_downs_success_rate DECIMAL(5,4),
  def_passing_downs_explosiveness DECIMAL(6,4),
  def_rushing_ppa DECIMAL(6,4),
  def_rushing_total_ppa DECIMAL(8,2),
  def_rushing_success_rate DECIMAL(5,4),
  def_rushing_explosiveness DECIMAL(6,4),
  def_passing_ppa DECIMAL(6,4),
  def_passing_total_ppa DECIMAL(8,2),
  def_passing_success_rate DECIMAL(5,4),
  def_passing_explosiveness DECIMAL(6,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season, team)
);

CREATE INDEX idx_advanced_stats_season ON advanced_stats(season);
CREATE INDEX idx_advanced_stats_team ON advanced_stats(team);

-- =====================
-- DATA SYNC LOG TABLE
-- =====================
CREATE TABLE IF NOT EXISTS data_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'weekly'
  table_name VARCHAR(50) NOT NULL,
  season INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
-- Enable RLS on all tables (read-only for anonymous users)
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

-- Create read-only policies for anonymous access
CREATE POLICY "Allow anonymous read access" ON conferences FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON games FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON team_records FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON rankings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON player_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON advanced_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON data_sync_log FOR SELECT USING (true);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_conferences_updated_at BEFORE UPDATE ON conferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_records_updated_at BEFORE UPDATE ON team_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advanced_stats_updated_at BEFORE UPDATE ON advanced_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
