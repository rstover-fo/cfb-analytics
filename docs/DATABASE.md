# CFB Analytics Database Schema

## Overview

The database uses DuckDB for local analytics workloads. Data is sourced from the [College Football Data API](https://collegefootballdata.com/) via dlt pipelines.

**Current Scope:** University of Oklahoma Sooners (2001-2025)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   GAMES                                      │
│  PK: id (BIGINT)                                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  season, week, season_type, start_date, completed                           │
│  venue_id, venue, neutral_site, conference_game, attendance                 │
│  home_id, home_team, home_conference, home_points                           │
│  away_id, away_team, away_conference, away_points                           │
│  home_pregame_elo, home_postgame_elo, home_postgame_win_prob                │
│  away_pregame_elo, away_postgame_elo, away_postgame_win_prob                │
│  excitement_index                                                            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ 1:N
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  DRIVES                                      │
│  PK: id (VARCHAR)                                                           │
│  FK: game_id → games.id                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  drive_number, offense, offense_conference, defense, defense_conference     │
│  start_period, start_yardline, start_yards_to_goal                          │
│  start_time_minutes, start_time_seconds                                     │
│  end_period, end_yardline, end_yards_to_goal                                │
│  end_time_minutes, end_time_seconds                                         │
│  plays, yards, drive_result, scoring, is_home_offense                       │
│  elapsed_minutes, elapsed_seconds                                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ 1:N
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   PLAYS                                      │
│  PK: id (VARCHAR)                                                           │
│  FK: game_id → games.id                                                     │
│  FK: drive_id → drives.id                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  drive_number, play_number, period, clock_minutes, clock_seconds            │
│  offense, offense_conference, defense, defense_conference                   │
│  home, away, offense_score, defense_score                                   │
│  down, distance, yards_gained, play_type, play_text                         │
│  ppa (predicted points added), scoring, wallclock                           │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                                RECRUITING                                    │
│  PK: id (VARCHAR)                                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  athlete_id, recruit_type, year, name                                       │
│  school (high school), committed_to, position                               │
│  height, weight, stars, rating, ranking                                     │
│  city, state_province, country                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                                TRANSFERS                                     │
│  PK: (season, first_name, last_name, origin) - composite                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  season, first_name, last_name, position                                    │
│  origin (previous school), destination (new school)                         │
│  transfer_date, stars, rating, eligibility                                  │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          GAMES__HOME_LINE_SCORES                             │
│  FK: _dlt_parent_id → games._dlt_id                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  value (points per quarter), _dlt_list_idx (quarter index 0-3+)             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          GAMES__AWAY_LINE_SCORES                             │
│  FK: _dlt_parent_id → games._dlt_id                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  value (points per quarter), _dlt_list_idx (quarter index 0-3+)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Table Details

### games

Core game information for all Oklahoma games.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | **Primary Key** - CFBD game ID |
| `season` | BIGINT | Year of the season (e.g., 2024) |
| `week` | BIGINT | Week number (1-15 regular, higher for postseason) |
| `season_type` | VARCHAR | "regular" or "postseason" |
| `start_date` | TIMESTAMPTZ | Game start time |
| `completed` | BOOLEAN | Whether game has finished |
| `neutral_site` | BOOLEAN | Played at neutral location |
| `conference_game` | BOOLEAN | Conference matchup |
| `attendance` | BIGINT | Reported attendance |
| `venue_id` | BIGINT | CFBD venue ID |
| `venue` | VARCHAR | Stadium name |
| `home_id` | BIGINT | Home team CFBD ID |
| `home_team` | VARCHAR | Home team name |
| `home_conference` | VARCHAR | Home team conference |
| `home_points` | BIGINT | Home team final score |
| `home_pregame_elo` | BIGINT | Home team ELO before game |
| `home_postgame_elo` | BIGINT | Home team ELO after game |
| `home_postgame_win_prob` | DOUBLE | Final win probability |
| `away_id` | BIGINT | Away team CFBD ID |
| `away_team` | VARCHAR | Away team name |
| `away_conference` | VARCHAR | Away team conference |
| `away_points` | BIGINT | Away team final score |
| `away_pregame_elo` | BIGINT | Away team ELO before game |
| `away_postgame_elo` | BIGINT | Away team ELO after game |
| `away_postgame_win_prob` | DOUBLE | Final win probability |
| `excitement_index` | DOUBLE | CFBD game excitement metric |

### drives

Drive-level summaries for each possession.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | **Primary Key** - CFBD drive ID |
| `game_id` | BIGINT | **Foreign Key** → games.id |
| `drive_number` | BIGINT | Sequential drive number in game |
| `offense` | VARCHAR | Team on offense |
| `offense_conference` | VARCHAR | Offensive team's conference |
| `defense` | VARCHAR | Team on defense |
| `defense_conference` | VARCHAR | Defensive team's conference |
| `start_period` | BIGINT | Quarter drive started (1-4+) |
| `start_yardline` | BIGINT | Starting yard line |
| `start_yards_to_goal` | BIGINT | Yards to end zone at start |
| `start_time_minutes` | BIGINT | Clock minutes at start |
| `start_time_seconds` | BIGINT | Clock seconds at start |
| `end_period` | BIGINT | Quarter drive ended |
| `end_yardline` | BIGINT | Ending yard line |
| `end_yards_to_goal` | BIGINT | Yards to end zone at end |
| `end_time_minutes` | BIGINT | Clock minutes at end |
| `end_time_seconds` | BIGINT | Clock seconds at end |
| `plays` | BIGINT | Number of plays in drive |
| `yards` | BIGINT | Total yards gained |
| `drive_result` | VARCHAR | Outcome (TD, FG, PUNT, TURNOVER, etc.) |
| `scoring` | BOOLEAN | Whether drive resulted in points |
| `is_home_offense` | BOOLEAN | Home team on offense |
| `elapsed_minutes` | BIGINT | Time of possession (minutes) |
| `elapsed_seconds` | BIGINT | Time of possession (seconds) |

**Drive Results:** TD, FG, PUNT, TURNOVER, DOWNS, END OF HALF, END OF GAME, MISSED FG, SAFETY, TURNOVER ON DOWNS

### plays

Play-by-play data for every snap.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | **Primary Key** - CFBD play ID |
| `game_id` | BIGINT | **Foreign Key** → games.id |
| `drive_id` | VARCHAR | **Foreign Key** → drives.id |
| `drive_number` | BIGINT | Drive number in game |
| `play_number` | BIGINT | Play number within drive |
| `period` | BIGINT | Quarter (1-4+) |
| `clock_minutes` | BIGINT | Game clock minutes |
| `clock_seconds` | BIGINT | Game clock seconds |
| `offense` | VARCHAR | Team on offense |
| `offense_conference` | VARCHAR | Offensive team's conference |
| `defense` | VARCHAR | Team on defense |
| `defense_conference` | VARCHAR | Defensive team's conference |
| `home` | VARCHAR | Home team name |
| `away` | VARCHAR | Away team name |
| `offense_score` | BIGINT | Offensive team's score |
| `defense_score` | BIGINT | Defensive team's score |
| `down` | BIGINT | Down (1-4) |
| `distance` | BIGINT | Yards to first down |
| `yards_gained` | BIGINT | Yards gained on play |
| `play_type` | VARCHAR | Type of play |
| `play_text` | VARCHAR | Full play description |
| `ppa` | DOUBLE | Predicted Points Added (EPA equivalent) |
| `scoring` | BOOLEAN | Scoring play |
| `wallclock` | TIMESTAMPTZ | Real-world timestamp |

**Play Types:** Rush, Pass Reception, Pass Incompletion, Sack, Punt, Kickoff, Field Goal Good, Field Goal Missed, Touchdown, Interception, Fumble Recovery, Penalty, etc.

### recruiting

High school recruit commitments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | **Primary Key** - CFBD recruit ID |
| `athlete_id` | VARCHAR | CFBD athlete ID |
| `recruit_type` | VARCHAR | "HighSchool", "JUCO", "PrepSchool" |
| `year` | BIGINT | Recruiting class year |
| `name` | VARCHAR | Recruit full name |
| `school` | VARCHAR | High school name |
| `committed_to` | VARCHAR | College committed to |
| `position` | VARCHAR | Position (QB, RB, WR, etc.) |
| `height` | BIGINT | Height in inches |
| `weight` | BIGINT | Weight in pounds |
| `stars` | BIGINT | Star rating (2-5) |
| `rating` | DOUBLE | Composite rating (0-1 scale) |
| `ranking` | BIGINT | National ranking |
| `city` | VARCHAR | Hometown city |
| `state_province` | VARCHAR | State/province code |
| `country` | VARCHAR | Country |

### transfers

Transfer portal activity (2021+).

| Column | Type | Description |
|--------|------|-------------|
| `season` | BIGINT | **Primary Key (part)** - Transfer year |
| `first_name` | VARCHAR | **Primary Key (part)** |
| `last_name` | VARCHAR | **Primary Key (part)** |
| `origin` | VARCHAR | **Primary Key (part)** - Previous school |
| `destination` | VARCHAR | New school (NULL if uncommitted) |
| `position` | VARCHAR | Position |
| `transfer_date` | TIMESTAMPTZ | Date entered portal |
| `stars` | BIGINT | Star rating |
| `rating` | DOUBLE | Transfer rating |
| `eligibility` | VARCHAR | Remaining eligibility |

## Relationships

```
games (1) ──────┬────── (N) drives
                │
                └────── (N) plays

drives (1) ──────────── (N) plays
```

- **games → drives:** One game has many drives (typically 20-30 per game)
- **games → plays:** One game has many plays (typically 150-200 per game)
- **drives → plays:** One drive has many plays (typically 3-10 per drive)

The `recruiting` and `transfers` tables are standalone and not linked to games.

## Sample Queries

### Season Record

```sql
SELECT
    season,
    COUNT(*) as games,
    SUM(CASE
        WHEN (home_team = 'Oklahoma' AND home_points > away_points)
          OR (away_team = 'Oklahoma' AND away_points > home_points)
        THEN 1 ELSE 0
    END) as wins,
    SUM(CASE
        WHEN (home_team = 'Oklahoma' AND home_points < away_points)
          OR (away_team = 'Oklahoma' AND away_points < home_points)
        THEN 1 ELSE 0
    END) as losses
FROM games
WHERE completed = true
GROUP BY season
ORDER BY season DESC;
```

### Points Per Game by Season

```sql
SELECT
    season,
    ROUND(AVG(CASE WHEN home_team = 'Oklahoma' THEN home_points ELSE away_points END), 1) as ppg_offense,
    ROUND(AVG(CASE WHEN home_team = 'Oklahoma' THEN away_points ELSE home_points END), 1) as ppg_defense
FROM games
WHERE completed = true
GROUP BY season
ORDER BY season DESC;
```

### Drive Efficiency

```sql
SELECT
    offense,
    COUNT(*) as total_drives,
    SUM(CASE WHEN drive_result = 'TD' THEN 1 ELSE 0 END) as touchdowns,
    SUM(CASE WHEN drive_result = 'FG' THEN 1 ELSE 0 END) as field_goals,
    ROUND(AVG(yards), 1) as avg_yards,
    ROUND(AVG(plays), 1) as avg_plays
FROM drives
WHERE game_id IN (SELECT id FROM games WHERE season = 2024)
GROUP BY offense;
```

### Third Down Conversion Rate

```sql
SELECT
    season,
    COUNT(*) as third_downs,
    SUM(CASE WHEN yards_gained >= distance THEN 1 ELSE 0 END) as conversions,
    ROUND(100.0 * SUM(CASE WHEN yards_gained >= distance THEN 1 ELSE 0 END) / COUNT(*), 1) as conversion_pct
FROM plays p
JOIN games g ON p.game_id = g.id
WHERE p.down = 3
  AND p.offense = 'Oklahoma'
  AND p.play_type NOT IN ('Penalty', 'Timeout')
GROUP BY season
ORDER BY season DESC;
```

### Explosive Plays (20+ yards)

```sql
SELECT
    g.season,
    g.away_team || ' @ ' || g.home_team as matchup,
    p.play_type,
    p.yards_gained,
    p.play_text
FROM plays p
JOIN games g ON p.game_id = g.id
WHERE p.offense = 'Oklahoma'
  AND p.yards_gained >= 20
ORDER BY p.yards_gained DESC
LIMIT 20;
```

### Recruiting Class Summary

```sql
SELECT
    year,
    COUNT(*) as commits,
    ROUND(AVG(rating), 4) as avg_rating,
    SUM(CASE WHEN stars = 5 THEN 1 ELSE 0 END) as five_stars,
    SUM(CASE WHEN stars = 4 THEN 1 ELSE 0 END) as four_stars,
    SUM(CASE WHEN stars = 3 THEN 1 ELSE 0 END) as three_stars
FROM recruiting
WHERE committed_to = 'Oklahoma'
GROUP BY year
ORDER BY year DESC;
```

### Transfer Portal Activity (Oklahoma)

```sql
-- Incoming transfers
SELECT season, first_name || ' ' || last_name as name, position, origin, stars
FROM transfers
WHERE destination = 'Oklahoma'
ORDER BY season DESC, stars DESC;

-- Outgoing transfers
SELECT season, first_name || ' ' || last_name as name, position, destination, stars
FROM transfers
WHERE origin = 'Oklahoma'
ORDER BY season DESC, stars DESC;
```

## Index Requirements

The following indexes are required for optimal query performance. These are defined in `src/lib/db/duckdb.ts` and created when the database initializes.

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| `idx_plays_game_id` | plays | game_id | Fast play-by-play lookups by game |
| `idx_drives_game_id` | drives | game_id | Fast drive lookups by game |
| `idx_games_season` | games | season | Season filtering |
| `idx_games_team_home` | games | home_team | Team-based game lookups |
| `idx_games_team_away` | games | away_team | Team-based game lookups |

### Index Verification

The index on `plays.game_id` was verified via `/api/debug/verify` on 2026-01-21:
- Index `idx_plays_game_id` exists in `duckdb.ts:142`
- Query plan confirms index usage for `getGamePlays()` queries

### Adding New Indexes

If a new index is required:
1. Add the `CREATE INDEX IF NOT EXISTS` statement to `initDuckDB()` in `src/lib/db/duckdb.ts`
2. Document the index in this table
3. Verify the index exists after restart

## Data Refresh

Data is loaded via dlt pipelines in `/pipelines/`. The pipeline uses `merge` write disposition with primary keys to handle incremental updates.

```bash
cd pipelines
source .venv/bin/activate

# Full reload (all years)
python load_oklahoma.py --full

# Current season only
python load_oklahoma.py --incremental

# Games only (quick test)
python load_oklahoma.py --games-only
```

## Row Counts (as of last load)

| Table | Rows |
|-------|------|
| games | 331 |
| drives | 8,772 |
| plays | 59,025 |
| recruiting | 372 |
| transfers | 14,416 |
