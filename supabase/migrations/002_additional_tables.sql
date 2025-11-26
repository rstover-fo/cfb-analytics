-- Additional tables for CFB Analytics
-- Run this in Supabase SQL Editor

-- Drives table
CREATE TABLE IF NOT EXISTS drives (
  id BIGSERIAL PRIMARY KEY,
  cfbd_id BIGINT UNIQUE,
  game_id BIGINT,
  drive_number INTEGER,
  offense TEXT,
  offense_conference TEXT,
  defense TEXT,
  defense_conference TEXT,
  scoring BOOLEAN DEFAULT FALSE,
  start_period INTEGER,
  start_yardline INTEGER,
  start_yards_to_goal INTEGER,
  start_time JSONB,
  end_period INTEGER,
  end_yardline INTEGER,
  end_yards_to_goal INTEGER,
  end_time JSONB,
  plays INTEGER,
  yards INTEGER,
  drive_result TEXT,
  is_home_offense BOOLEAN,
  start_offense_score INTEGER,
  start_defense_score INTEGER,
  end_offense_score INTEGER,
  end_defense_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drives_game_id ON drives(game_id);
CREATE INDEX IF NOT EXISTS idx_drives_offense ON drives(offense);

-- Plays table
CREATE TABLE IF NOT EXISTS plays (
  id BIGSERIAL PRIMARY KEY,
  cfbd_id BIGINT UNIQUE,
  drive_id BIGINT,
  game_id BIGINT,
  drive_number INTEGER,
  play_number INTEGER,
  offense TEXT,
  offense_conference TEXT,
  offense_score INTEGER,
  defense TEXT,
  defense_conference TEXT,
  defense_score INTEGER,
  home TEXT,
  away TEXT,
  period INTEGER,
  clock JSONB,
  offense_timeouts INTEGER,
  defense_timeouts INTEGER,
  yardline INTEGER,
  yards_to_goal INTEGER,
  down INTEGER,
  distance INTEGER,
  yards_gained INTEGER,
  scoring BOOLEAN DEFAULT FALSE,
  play_type TEXT,
  play_text TEXT,
  ppa DECIMAL(10, 6),
  wallclock TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plays_game_id ON plays(game_id);
CREATE INDEX IF NOT EXISTS idx_plays_drive_id ON plays(drive_id);
CREATE INDEX IF NOT EXISTS idx_plays_offense ON plays(offense);
CREATE INDEX IF NOT EXISTS idx_plays_play_type ON plays(play_type);

-- Advanced Game Stats table
CREATE TABLE IF NOT EXISTS advanced_game_stats (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT,
  season INTEGER,
  week INTEGER,
  team TEXT,
  opponent TEXT,
  -- Offense passing
  off_passing_explosiveness DECIMAL(10, 6),
  off_passing_success_rate DECIMAL(10, 6),
  off_passing_total_ppa DECIMAL(10, 6),
  off_passing_ppa DECIMAL(10, 6),
  -- Offense rushing
  off_rushing_explosiveness DECIMAL(10, 6),
  off_rushing_success_rate DECIMAL(10, 6),
  off_rushing_total_ppa DECIMAL(10, 6),
  off_rushing_ppa DECIMAL(10, 6),
  -- Offense passing downs
  off_passing_downs_explosiveness DECIMAL(10, 6),
  off_passing_downs_success_rate DECIMAL(10, 6),
  off_passing_downs_ppa DECIMAL(10, 6),
  -- Offense standard downs
  off_standard_downs_explosiveness DECIMAL(10, 6),
  off_standard_downs_success_rate DECIMAL(10, 6),
  off_standard_downs_ppa DECIMAL(10, 6),
  -- Offense line stats
  off_open_field_yards_total DECIMAL(10, 6),
  off_open_field_yards DECIMAL(10, 6),
  off_second_level_yards_total DECIMAL(10, 6),
  off_second_level_yards DECIMAL(10, 6),
  off_line_yards_total DECIMAL(10, 6),
  off_line_yards DECIMAL(10, 6),
  -- Offense overall
  off_stuff_rate DECIMAL(10, 6),
  off_power_success DECIMAL(10, 6),
  off_explosiveness DECIMAL(10, 6),
  off_success_rate DECIMAL(10, 6),
  off_total_ppa DECIMAL(10, 6),
  off_ppa DECIMAL(10, 6),
  off_drives INTEGER,
  off_plays INTEGER,
  -- Defense passing
  def_passing_explosiveness DECIMAL(10, 6),
  def_passing_success_rate DECIMAL(10, 6),
  def_passing_total_ppa DECIMAL(10, 6),
  def_passing_ppa DECIMAL(10, 6),
  -- Defense rushing
  def_rushing_explosiveness DECIMAL(10, 6),
  def_rushing_success_rate DECIMAL(10, 6),
  def_rushing_total_ppa DECIMAL(10, 6),
  def_rushing_ppa DECIMAL(10, 6),
  -- Defense passing downs
  def_passing_downs_explosiveness DECIMAL(10, 6),
  def_passing_downs_success_rate DECIMAL(10, 6),
  def_passing_downs_ppa DECIMAL(10, 6),
  -- Defense standard downs
  def_standard_downs_explosiveness DECIMAL(10, 6),
  def_standard_downs_success_rate DECIMAL(10, 6),
  def_standard_downs_ppa DECIMAL(10, 6),
  -- Defense line stats
  def_open_field_yards_total DECIMAL(10, 6),
  def_open_field_yards DECIMAL(10, 6),
  def_second_level_yards_total DECIMAL(10, 6),
  def_second_level_yards DECIMAL(10, 6),
  def_line_yards_total DECIMAL(10, 6),
  def_line_yards DECIMAL(10, 6),
  -- Defense overall
  def_stuff_rate DECIMAL(10, 6),
  def_power_success DECIMAL(10, 6),
  def_explosiveness DECIMAL(10, 6),
  def_success_rate DECIMAL(10, 6),
  def_total_ppa DECIMAL(10, 6),
  def_ppa DECIMAL(10, 6),
  def_drives INTEGER,
  def_plays INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, team)
);

CREATE INDEX IF NOT EXISTS idx_advanced_game_stats_season ON advanced_game_stats(season);
CREATE INDEX IF NOT EXISTS idx_advanced_game_stats_team ON advanced_game_stats(team);

-- Season Stats table
CREATE TABLE IF NOT EXISTS season_stats (
  id BIGSERIAL PRIMARY KEY,
  season INTEGER,
  team TEXT,
  conference TEXT,
  games INTEGER,
  -- First downs
  first_downs INTEGER,
  first_downs_opponent INTEGER,
  -- Fourth downs
  fourth_down_conversions INTEGER,
  fourth_down_conversions_opponent INTEGER,
  fourth_downs INTEGER,
  fourth_downs_opponent INTEGER,
  -- Turnovers
  fumbles_lost INTEGER,
  fumbles_lost_opponent INTEGER,
  fumbles_recovered INTEGER,
  fumbles_recovered_opponent INTEGER,
  turnovers INTEGER,
  turnovers_opponent INTEGER,
  -- Interceptions
  interception_tds INTEGER,
  interception_tds_opponent INTEGER,
  interception_yards INTEGER,
  interception_yards_opponent INTEGER,
  interceptions INTEGER,
  interceptions_opponent INTEGER,
  passes_intercepted INTEGER,
  passes_intercepted_opponent INTEGER,
  -- Kick returns
  kick_return_tds INTEGER,
  kick_return_tds_opponent INTEGER,
  kick_return_yards INTEGER,
  kick_return_yards_opponent INTEGER,
  kick_returns INTEGER,
  kick_returns_opponent INTEGER,
  -- Passing
  net_passing_yards INTEGER,
  net_passing_yards_opponent INTEGER,
  pass_attempts INTEGER,
  pass_attempts_opponent INTEGER,
  pass_completions INTEGER,
  pass_completions_opponent INTEGER,
  passing_tds INTEGER,
  passing_tds_opponent INTEGER,
  -- Penalties
  penalties INTEGER,
  penalties_opponent INTEGER,
  penalty_yards INTEGER,
  penalty_yards_opponent INTEGER,
  -- Possession
  possession_time INTEGER,
  possession_time_opponent INTEGER,
  -- Punt returns
  punt_return_tds INTEGER,
  punt_return_tds_opponent INTEGER,
  punt_return_yards INTEGER,
  punt_return_yards_opponent INTEGER,
  punt_returns INTEGER,
  punt_returns_opponent INTEGER,
  -- Rushing
  rushing_attempts INTEGER,
  rushing_attempts_opponent INTEGER,
  rushing_tds INTEGER,
  rushing_tds_opponent INTEGER,
  rushing_yards INTEGER,
  rushing_yards_opponent INTEGER,
  -- Sacks and TFL
  sacks INTEGER,
  sacks_opponent INTEGER,
  tackles_for_loss INTEGER,
  tackles_for_loss_opponent INTEGER,
  -- Third downs
  third_down_conversions INTEGER,
  third_down_conversions_opponent INTEGER,
  third_downs INTEGER,
  third_downs_opponent INTEGER,
  -- Total
  total_yards INTEGER,
  total_yards_opponent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season, team)
);

CREATE INDEX IF NOT EXISTS idx_season_stats_season ON season_stats(season);
CREATE INDEX IF NOT EXISTS idx_season_stats_team ON season_stats(team);

-- Enable RLS on new tables
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;

-- Create read policies for anonymous users
CREATE POLICY "Allow anonymous read access on drives" ON drives FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on plays" ON plays FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on advanced_game_stats" ON advanced_game_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on season_stats" ON season_stats FOR SELECT USING (true);

-- Create insert policies for service role
CREATE POLICY "Allow service role insert on drives" ON drives FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on plays" ON plays FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on advanced_game_stats" ON advanced_game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert on season_stats" ON season_stats FOR INSERT WITH CHECK (true);
