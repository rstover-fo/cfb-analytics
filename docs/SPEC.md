# CFB Analytics - Project Specification

## Overview

**CFB Analytics** is a college football analytics platform for fans and data enthusiasts. The application provides historical statistics, live game analysis, recruiting insights, transfer portal tracking, advanced metrics, and drive analytics.

**Initial Focus:** University of Oklahoma Sooners
**Target Audience:** College football fans, fantasy players, sports bettors, data enthusiasts
**Deployment:** Vercel

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR/SSG |
| **Language** | TypeScript (strict) | Type safety throughout |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design |
| **Charts** | Recharts or ECharts | Data visualization |
| **App Database** | PostgreSQL (Supabase or Neon) | User data, saved queries, app state |
| **Analytics DB** | DuckDB (via WASM or server) | Fast OLAP queries on historical data |
| **Data Sources** | CFBD API + cfbfastR patterns | Primary data ingestion |
| **Auth** | NextAuth.js (optional) | User accounts if needed |
| **Deployment** | Vercel | Hosting + CI/CD |

---

## Data Sources

### Primary: College Football Data API (CFBD)
- **Base URL:** `https://api.collegefootballdata.com`
- **Docs:** https://collegefootballdata.com/
- **Coverage:** Games, plays, drives, teams, players, recruiting, rankings, betting lines
- **Auth:** Free API key required

### Secondary: cfbfastR Patterns
- Reference: https://github.com/sportsdataverse/cfbfastR
- ESPN endpoints for player stats, game summaries
- Use as supplementary data source

### Data to Collect (Oklahoma Focus)

| Category | Data Points | Update Frequency |
|----------|-------------|------------------|
| **Games** | Scores, stats, betting lines, weather | Weekly (season) |
| **Plays** | Play-by-play with EPA, success rate | Post-game |
| **Drives** | Drive summaries, efficiency metrics | Post-game |
| **Players** | Season stats, usage rates, PFF-style grades | Weekly |
| **Recruiting** | Commits, rankings, position breakdown | Daily (signing periods) |
| **Transfer Portal** | Entries, commits, ratings | Daily (portal windows) |
| **Historical** | 10+ years for trend analysis | One-time backfill |

---

## Core Features

### Phase 1: Foundation (MVP)

#### 1.1 Team Dashboard
- Season record and conference standing
- Key stats summary (offense/defense rankings)
- Recent game results with scores
- Upcoming schedule with betting lines

#### 1.2 Game Explorer
- Select any historical game (2014-present)
- Box score with team/player stats
- Drive chart visualization
- Play-by-play with filtering (down, distance, play type)

#### 1.3 Historical Trends
- Win/loss records by season
- Offensive/defensive efficiency over time
- Head-to-head records vs rivals
- Home vs away performance

#### 1.4 Basic Metrics
- Points per game, yards per play
- Third-down conversion rate
- Red zone efficiency
- Turnover margin

### Phase 2: Advanced Analytics

#### 2.1 Advanced Metrics
- Expected Points Added (EPA) per play
- Success rate by play type
- Explosiveness (plays of 20+ yards)
- Havoc rate (TFLs, sacks, turnovers forced)

#### 2.2 Drive Analytics
- Drive success rate by field position
- Points per drive
- Average drive length (plays, yards, time)
- Drive outcomes distribution (TD, FG, Punt, TO)

#### 2.3 Player Analytics
- Usage rates and target share
- Yards after contact / YAC
- Player comparison tool
- Season-over-season progression

### Phase 3: Recruiting & Portal

#### 3.1 Recruiting Dashboard
- Current class rankings and commits
- Position breakdown and needs
- Recruiting trends over time
- Commit timelines and flip tracking

#### 3.2 Transfer Portal Tracker
- Portal entries and destinations
- Impact ratings for transfers
- Roster composition changes
- NIL context (where available)

### Phase 4: Live Features (Future)

#### 4.1 Live Game Dashboard
- Real-time score and stats
- Win probability chart
- Live play-by-play
- Situational analytics during game

---

## Database Schema (Conceptual)

### PostgreSQL (Application Data)
```
users
  - id, email, created_at, preferences

saved_views
  - id, user_id, name, query_config, created_at

data_refresh_log
  - id, data_type, status, records_updated, timestamp
```

### DuckDB (Analytics Data)
```
games
  - game_id, season, week, home_team, away_team, home_score, away_score
  - spread, over_under, attendance, venue, weather

plays
  - play_id, game_id, drive_id, period, clock, down, distance
  - play_type, yards, epa, success, ppa, home_score, away_score

drives
  - drive_id, game_id, offense, defense, start_period, start_yardline
  - plays, yards, result, time_elapsed

players
  - player_id, name, position, team, season
  - games, stats (JSON or normalized)

recruiting
  - recruit_id, name, position, rating, stars, committed_to
  - ranking_247, ranking_rivals, ranking_espn

transfers
  - transfer_id, player_id, from_team, to_team, transfer_date
  - eligibility, years_remaining
```

---

## API Routes (Next.js)

```
/api/team/[team]              GET team overview
/api/team/[team]/games        GET games for team/season
/api/team/[team]/schedule     GET upcoming schedule
/api/game/[gameId]            GET game details
/api/game/[gameId]/plays      GET play-by-play
/api/game/[gameId]/drives     GET drive summary
/api/players/[team]           GET player roster/stats
/api/recruiting/[team]        GET recruiting class
/api/portal                   GET transfer portal activity
/api/metrics/[team]           GET advanced metrics
/api/sync/[dataType]          POST trigger data refresh (admin)
```

---

## UI/UX Guidelines

### Design Principles
- **Data-forward:** Lead with numbers, support with visuals
- **Fast:** Sub-second page loads, instant filtering
- **Mobile-friendly:** Responsive tables, touch-friendly charts
- **Dark mode:** Default dark theme (sports data aesthetic)

### Color Palette (Oklahoma Crimson & Cream)
- Primary: `#841617` (Crimson)
- Secondary: `#FDF9F2` (Cream)
- Accent: `#A50000` (Darker crimson for hover)
- Background: `#0A0A0A` (Near black)
- Surface: `#1A1A1A` (Card backgrounds)
- Text: `#FAFAFA` (Primary text)
- Muted: `#A1A1AA` (Secondary text)

### Typography
- Headings: System font stack (native feel)
- Data: Monospace for numbers/stats
- Body: Inter or system sans-serif

---

## Success Metrics

### MVP Launch
- [ ] Load Oklahoma team dashboard in <2s
- [ ] Display 10 years of historical games
- [ ] Play-by-play for any game 2014+
- [ ] Mobile-responsive on all pages

### Phase 2
- [ ] EPA/play calculations match CFBD
- [ ] Drive analytics visualizations
- [ ] Player comparison tool functional

### Phase 3
- [ ] Recruiting data current within 24h
- [ ] Transfer portal updates daily

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CFBD API rate limits | Cache aggressively, batch requests, store locally |
| Data freshness during season | Scheduled jobs post-game, manual refresh option |
| DuckDB in browser performance | Server-side DuckDB for heavy queries, WASM for simple |
| Scope creep | Oklahoma-only until core features solid |

---

## Out of Scope (For Now)

- User-generated content / comments
- Betting recommendations or predictions
- Real-time push notifications
- Multiple sport support
- Mobile native apps

---

## Timeline

**Sprint 1:** Project setup, data pipeline foundation
**Sprint 2:** Team dashboard, game explorer
**Sprint 3:** Historical trends, basic metrics
**Sprint 4:** Advanced metrics, drive analytics
**Sprint 5:** Recruiting & portal features
**Sprint 6:** Polish, performance, launch prep

---

## References

- [College Football Data API](https://collegefootballdata.com/)
- [cfbfastR R Package](https://github.com/sportsdataverse/cfbfastR)
- [ESPN Hidden API Endpoints](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [DuckDB WASM](https://duckdb.org/docs/api/wasm/overview.html)
