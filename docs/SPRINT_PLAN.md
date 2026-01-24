# CFB Analytics - Sprint Plan

## Project Scope
**Focus:** University of Oklahoma Sooners
**Goal:** Build a production-ready CFB analytics platform, perfecting patterns before national expansion

---

## Sprint 1: Foundation & Data Pipeline ✅ COMPLETED

**Goal:** Establish project infrastructure and reliable data ingestion

### Tasks

#### 1.1 Project Setup
- [x] Initialize Next.js 14 with App Router and TypeScript
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Set up ESLint, Prettier, and strict TypeScript config
- [x] Create folder structure (`/app`, `/lib`, `/components`, `/data`)
- [x] Initialize Git repository with conventional commits
- [x] Deploy empty shell to Vercel

**Validation:** ✅ `npm run build` passes, Vercel deployment live

#### 1.2 Database Setup
- [x] Provision PostgreSQL (Neon or Supabase free tier)
- [x] Create initial schema (data_refresh_log table)
- [x] Set up Drizzle ORM with type generation
- [x] Configure DuckDB for local development (Node binding)
- [x] Create DuckDB schema for games, plays, drives

**Validation:** ✅ Can insert/query both databases from Next.js API route

#### 1.3 CFBD API Integration
- [x] Obtain CFBD API key
- [x] Create typed API client (`/lib/cfbd/client.ts`)
- [x] Implement endpoints: teams, games, plays, drives
- [x] Add rate limiting and error handling
- [x] Write integration tests for API client

**Validation:** ✅ Can fetch Oklahoma's 2024 schedule and game data

#### 1.4 Data Ingestion Pipeline
- [x] Create ingestion scripts for historical data (2014-2024)
- [x] Build games loader (all Oklahoma games)
- [x] Build plays loader (play-by-play for each game)
- [x] Build drives loader (drive summaries)
- [x] Store data in DuckDB with proper indexing
- [x] Log refresh timestamps to PostgreSQL

**Validation:** ✅ 10 years of Oklahoma games loaded into DuckDB

---

## Sprint 2: Team Dashboard & Game Explorer ✅ COMPLETED

**Goal:** Core viewing experience for team data and individual games

### Tasks

#### 2.1 Layout & Navigation
- [x] Create app shell with header/sidebar
- [x] Implement dark theme with Oklahoma colors
- [x] Build responsive navigation (mobile hamburger)
- [x] Add team selector (hardcoded to Oklahoma for now)

**Validation:** ✅ Navigation works on mobile and desktop

#### 2.2 Team Dashboard
- [x] Season selector component (dropdown)
- [x] Season record card (W-L, conference record)
- [x] Recent results list (last 5 games with scores)
- [x] Upcoming schedule with opponent and date
- [x] Key stats summary (PPG, YPG, defensive rankings)

**Validation:** ✅ Dashboard loads Oklahoma 2024 data correctly

#### 2.3 Game Explorer - List View
- [x] Games table with sortable columns
- [x] Filter by season, opponent, home/away, result
- [x] Search by opponent name
- [x] Pagination for historical games

**Validation:** ✅ Can find any Oklahoma game 2014-2024

#### 2.4 Game Explorer - Detail View
- [x] Game header (teams, final score, date, venue)
- [x] Box score with team stats
- [x] Scoring summary by quarter
- [x] Basic player stats tables (passing, rushing, receiving)

**Validation:** ✅ Full box score renders for any selected game

---

## Sprint 2.5: Accessibility & Polish ✅ COMPLETED

**Goal:** Address frontend review findings to bring CFB Analytics to ship-ready quality before adding new features.

**Deliverable:** All WCAG 2.1 AA compliance issues resolved, motion preferences respected, consistent design patterns.

### Tasks

#### 2.5.1 Add `prefers-reduced-motion` Media Query
- [x] Add media query to `globals.css` that disables animations
- [x] Skeleton loaders still indicate loading (opacity change, no movement)

**Validation:** ✅ Enable `prefers-reduced-motion: reduce` in browser DevTools, verify no jarring animations

#### 2.5.2 Add Visible Label to Season Selector
- [x] Add visible "Season" label to `season-selector.tsx`
- [x] Associate label with select via `htmlFor`/`id`
- [x] Maintain clean layout on both dashboard and games page

**Validation:** ✅ Screen reader announces "Season" when focusing select

#### 2.5.3 Strengthen Focus-Visible Ring Styles
- [x] Add explicit focus-visible styles to `globals.css`
- [x] Use `--ring` color token for consistency
- [x] Add ring offset to prevent overlap with element borders

**Validation:** ✅ Tab through entire app, verify focus is always visible

#### 2.5.4 Add `scope` Attribute to Table Headers
- [x] Update `games/page.tsx` table headers with `scope="col"`
- [x] Update `games/[id]/page.tsx` table headers with `scope="col"`

**Validation:** ✅ VoiceOver/NVDA correctly announces column headers when navigating cells

#### 2.5.5 Add Skip Link to Layout
- [x] Add skip link to `layout.tsx` that appears on focus
- [x] Link targets `#main-content` id on main element
- [x] Style consistently with app theme (hidden until focused)

**Validation:** ✅ Press Tab on page load, skip link appears and works

#### 2.5.6 Add Visual Indicator to Win/Loss Badges (Beyond Color)
- [x] Add checkmark icon to Win badges in `games/page.tsx`
- [x] Add X icon to Loss badges in `games/page.tsx`
- [x] Apply same pattern to `games/[id]/page.tsx`

**Validation:** ✅ View in grayscale mode, wins/losses still distinguishable

#### 2.5.7 Add `tabular-nums` to Numeric Displays
- [x] Add `tabular-nums` to score columns in `games/page.tsx`
- [x] Add `tabular-nums` to scores/stats in `games/[id]/page.tsx`
- [x] Add `tabular-nums` to `record-card.tsx` numbers
- [x] Add `tabular-nums` to `stats-card.tsx` numbers

**Validation:** ✅ Visual inspection — numbers align properly in columns

#### 2.5.8 Add Empty State to Games Table
- [x] Add empty state component when `games.length === 0`
- [x] Display meaningful message (e.g., "No games found for this season")
- [x] Style consistently with card empty states

**Validation:** ✅ Filter to non-existent season, verify empty state displays

### Task Dependencies

```
Task 2.5.1 (reduced-motion) ─┐
Task 2.5.3 (focus styles)   ─┼─► globals.css changes (parallel)
                             │
Task 2.5.2 (season label)   ─┼─► Independent components
Task 2.5.5 (skip link)      ─┤
                             │
Task 2.5.4 (table scope)    ─┼─► Table-related changes (parallel)
Task 2.5.6 (badge icons)    ─┤
Task 2.5.7 (tabular-nums)   ─┤
Task 2.5.8 (empty state)    ─┘
```

### Sprint 2.5 Acceptance Criteria ✅

After all tasks complete:
1. ✅ Lighthouse accessibility audit scores 100
2. ✅ Tab through entire app — focus always visible
3. ✅ Test with VoiceOver — all controls announced correctly
4. ✅ Enable `prefers-reduced-motion` — no jarring animations
5. ✅ View in grayscale — all states distinguishable

---

## Sprint 3: Play-by-Play & Drive Charts ✅ COMPLETED

**Goal:** Granular game analysis with play and drive visualization

### Tasks

#### 3.1 Play-by-Play View
- [x] Chronological play list with drive grouping
- [x] Play detail: down, distance, yard line, result
- [x] Play type icons (run, pass, penalty, turnover)
- [x] Filter controls: quarter, down, play type
- [x] Search plays by description

**Validation:** ✅ Can filter to all 3rd down pass plays in a game

#### 3.2 Drive Chart Visualization
- [x] Horizontal drive chart component
- [x] Color-coded by result (TD green, FG yellow, punt gray, TO red)
- [x] Hover for drive details
- [x] Click to expand plays in that drive

**Validation:** ✅ Drive chart matches official box score drive summary

#### 3.3 Drive Summary Table
- [x] Drives table: start, plays, yards, time, result
- [x] Sortable by any column
- [x] Team filter (Oklahoma offense vs opponent offense)
- [x] Export to CSV option

**Validation:** ✅ Drive totals sum correctly to game totals

---

## Sprint 4: Historical Trends & Basic Metrics ✅ COMPLETED

**Goal:** Multi-season analysis and foundational statistics

### Tasks

#### 4.1 Season Trends
- [x] Win-loss by season line chart
- [x] Points per game trend (offense/defense)
- [x] Conference vs non-conference record breakdown
- [x] Home vs away splits

**Validation:** ✅ Charts render correctly for 2014-2024

#### 4.2 Head-to-Head Records
- [x] Rival selector (Texas, OSU, etc.)
- [x] All-time record vs selected opponent
- [x] Recent matchups table
- [x] Scoring trends in rivalry games

**Validation:** ✅ Texas series record matches historical data

#### 4.3 Basic Metrics Dashboard
- [x] Offensive metrics: PPG, YPG, YPP, 3rd down %
- [x] Defensive metrics: PPG allowed, YPG allowed, sacks
- [x] Special teams: FG %, punt average, return yards
- [x] Red zone efficiency (offense and defense)
- [x] Turnover margin

**Validation:** ✅ Metrics match CFBD team stats endpoint

#### 4.4 Metrics Comparison
- [x] Season-over-season comparison view
- [x] Select 2 seasons to compare side-by-side
- [x] Highlight improvements/declines
- [x] Conference rank context

**Validation:** ✅ Can compare 2023 vs 2024 metrics

---

## Sprint 5: Advanced Metrics ✅ COMPLETED

**Goal:** EPA, success rate, and analytical depth

### Tasks

#### 5.1 EPA Integration
- [x] Pull EPA data from CFBD (pre-calculated)
- [x] Store EPA per play in DuckDB
- [x] Aggregate EPA by game, season, play type
- [x] Display EPA/play on game detail pages

**Validation:** ✅ EPA totals match CFBD game EPA values

#### 5.2 Success Rate Analysis
- [x] Calculate success rate by play type
- [x] Success rate by down and distance
- [x] Early down vs late down success
- [x] Red zone success rate

**Validation:** ✅ Metrics align with published analytics

#### 5.3 Explosiveness Metrics
- [x] Track explosive plays (20+ yards)
- [x] Explosive play rate by game/season
- [x] Biggest plays list
- [x] Opponent explosive plays allowed

**Validation:** ✅ Can identify all 20+ yard Oklahoma plays in 2024

#### 5.4 Drive Analytics Deep Dive
- [x] Points per drive calculation
- [x] Drive success rate by field position
- [x] Average drive length (plays, yards, time)
- [x] Drive outcomes pie chart
- [x] Comparison vs opponent drives

**Validation:** ✅ Drive efficiency matches game outcomes

---

## Sprint 6: Recruiting & Transfer Portal ✅ COMPLETED

**Goal:** Roster building analytics

**Deliverable:** Recruiting class dashboards, historical trends, transfer portal tracker, and roster analysis for Oklahoma.

---

### CFBD API Data Audit

Before implementation, confirm data availability from the CFBD REST API:

| Endpoint | Path | Data Available | Notes |
|----------|------|----------------|-------|
| **Recruiting Players** | `GET /recruiting/players` | ✅ Yes | Name, position, rating, stars, school, state, height/weight, hometown coords |
| **Team Recruiting Rankings** | `GET /recruiting/teams` | ✅ Yes | Year, team, rank, total points |
| **Position Group Recruiting** | `GET /recruiting/groups` | ✅ Yes | Team, conference, position group, avg rating, commit count, avg stars |
| **Transfer Portal** | `GET /player/portal` | ✅ Yes | Season, name, position, origin, destination, transfer date, 247 rating, stars, eligibility |
| **Team Roster** | `GET /roster` | ✅ Yes | Player ID, name, position, jersey, height/weight, class year, hometown |
| **Depth Chart** | — | ❌ No | Not available via CFBD API; defer to future sprint |

**API Rate Limits:** Free tier = 1,000 calls/month. Historical ingestion (2014-2025) will consume ~50-100 calls. Implement caching and daily ETL, not per-request fetches.

**Data Refresh Strategy:** Daily ETL for recruiting/portal data. Recruiting commits are infrequent; portal activity peaks in December-January and April-May.

---

### Schema Design

New tables for Sprint 6 (DuckDB):

```sql
-- Recruiting classes (team-level rankings)
CREATE TABLE recruiting_classes (
  year INTEGER NOT NULL,
  team VARCHAR NOT NULL,
  rank INTEGER,
  points DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (year, team)
);

-- Individual recruits
CREATE TABLE recruits (
  id INTEGER PRIMARY KEY,
  year INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  school VARCHAR,  -- high school
  position VARCHAR,
  height INTEGER,  -- inches
  weight INTEGER,  -- lbs
  stars INTEGER,
  rating DECIMAL(6,4),
  committed_to VARCHAR,
  state_province VARCHAR,
  city VARCHAR,
  recruit_type VARCHAR DEFAULT 'HighSchool',  -- HighSchool, JUCO, PrepSchool
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Position group recruiting aggregates
CREATE TABLE recruiting_position_groups (
  year INTEGER NOT NULL,
  team VARCHAR NOT NULL,
  position_group VARCHAR NOT NULL,
  avg_rating DECIMAL(6,4),
  total_rating DECIMAL(10,4),
  commits INTEGER,
  avg_stars DECIMAL(3,2),
  PRIMARY KEY (year, team, position_group)
);

-- Transfer portal entries
CREATE TABLE transfer_portal (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  position VARCHAR,
  origin VARCHAR,      -- school leaving
  destination VARCHAR, -- school joining (nullable until committed)
  transfer_date DATE,
  rating DECIMAL(6,4),
  stars INTEGER,
  eligibility VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current roster
CREATE TABLE roster (
  athlete_id INTEGER PRIMARY KEY,
  season INTEGER NOT NULL,
  team VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  position VARCHAR,
  jersey INTEGER,
  height INTEGER,
  weight INTEGER,
  class_year VARCHAR,  -- FR, SO, JR, SR, GR
  hometown_city VARCHAR,
  hometown_state VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_recruits_year_team ON recruits(year, committed_to);
CREATE INDEX idx_transfer_portal_season ON transfer_portal(season);
CREATE INDEX idx_transfer_portal_origin ON transfer_portal(origin);
CREATE INDEX idx_transfer_portal_dest ON transfer_portal(destination);
CREATE INDEX idx_roster_team_season ON roster(team, season);
```

---

### Tasks

#### Task 6.0: Data Foundation (P0)

**Priority:** P0 — Blocks all other Sprint 6 tasks
**Complexity:** Medium

##### 6.0.1 Recruiting Data Schema & API Client
- [x] Add recruiting tables to DuckDB schema (`lib/db/schema/recruiting.sql`)
- [x] Create CFBD API client for recruiting endpoints (`lib/api/cfbd/recruiting.ts`)
  - `getRecruits(year, team)` → `/recruiting/players`
  - `getTeamRankings(year)` → `/recruiting/teams`
  - `getPositionGroups(year, team)` → `/recruiting/groups`
- [x] Add TypeScript interfaces (`types/recruiting.ts`)
- [x] Write data ingestion script for 2014-2025 Oklahoma recruiting data
- [x] Add rate limiting (respect 1,000/month free tier)

**Validation:** ✅ Can query `SELECT * FROM recruits WHERE committed_to = 'Oklahoma' AND year = 2024` and get results

##### 6.0.2 Transfer Portal Data Layer
- [x] Add transfer_portal table to DuckDB schema
- [x] Create CFBD API client for portal endpoint (`lib/api/cfbd/transfers.ts`)
  - `getTransferPortal(year)` → `/player/portal`
- [x] Add TypeScript interfaces (`types/transfers.ts`)
- [x] Write ingestion script for 2021-2025 portal data (API available from 2021)
- [x] Filter ingestion to Oklahoma-related transfers (origin OR destination = Oklahoma)

**Validation:** ✅ Can query portal entries/exits for Oklahoma 2024 season

##### 6.0.3 Roster Data Layer
- [x] Add roster table to DuckDB schema
- [x] Create CFBD API client for roster endpoint (`lib/api/cfbd/roster.ts`)
  - `getRoster(team, year)` → `/roster`
- [x] Add TypeScript interfaces (`types/roster.ts`)
- [x] Write ingestion script for current Oklahoma roster

**Validation:** ✅ Roster count matches official Oklahoma athletics site (~120 players)

**Files Involved:**
- `lib/db/schema/recruiting.sql` (new)
- `lib/api/cfbd/recruiting.ts` (new)
- `lib/api/cfbd/transfers.ts` (new)
- `lib/api/cfbd/roster.ts` (new)
- `types/recruiting.ts` (new)
- `types/transfers.ts` (new)
- `types/roster.ts` (new)
- `scripts/ingest-recruiting.ts` (new)
- `scripts/ingest-transfers.ts` (new)
- `scripts/ingest-roster.ts` (new)

---

#### Task 6.1: Recruiting Class Dashboard (P1)

**Priority:** P1
**Complexity:** Medium
**Blocked By:** Task 6.0

##### 6.1.1 Class Summary Card
- [x] Create `components/recruiting/class-summary-card.tsx`
- [x] Display: total commits, average rating, star breakdown (5★/4★/3★)
- [x] Show team ranking (national and conference)
- [x] Add "Last updated" timestamp
- [x] Handle empty state: "No commits yet for [year] class"

**Validation:** ✅ 2025 class summary matches 247Sports composite data

##### 6.1.2 Position Breakdown Chart
- [x] Create `components/recruiting/position-breakdown-chart.tsx`
- [x] Bar or donut chart showing commits by position group
- [x] Position groups: QB, RB, WR, TE, OL, DL, LB, DB, ATH, K/P
- [x] Hover tooltip with count and percentage
- [x] Handle zero commits in a position gracefully

**Validation:** ✅ Position breakdown matches 247Sports class breakdown

##### 6.1.3 Commit Timeline
- [x] Create `components/recruiting/commit-timeline.tsx`
- [x] Vertical timeline showing commits chronologically
- [x] Each entry: recruit name, position, stars, commit date
- [x] Highlight NSD (National Signing Day) milestones

**Validation:** ✅ Timeline shows commits in correct chronological order

##### 6.1.4 Dashboard Assembly
- [x] Create `app/recruiting/page.tsx`
- [x] Add year selector (reuse season selector pattern)
- [x] Layout: summary card top, position chart and timeline side-by-side
- [x] Add navigation link from main sidebar

**Validation:** ✅ Dashboard renders for any year 2014-2025

**Files Involved:**
- `app/recruiting/page.tsx` (new)
- `components/recruiting/class-summary-card.tsx` (new)
- `components/recruiting/position-breakdown-chart.tsx` (new)
- `components/recruiting/commit-timeline.tsx` (new)
- `components/recruiting/year-selector.tsx` (new or reuse)
- `lib/db/queries/recruiting.ts` (new)

---

#### Task 6.2: Recruiting History (P1)

**Priority:** P1
**Complexity:** Medium
**Blocked By:** Task 6.0

##### 6.2.1 Class Rankings Chart
- [x] Create `components/recruiting/class-ranking-chart.tsx`
- [x] Line chart: Oklahoma national ranking by year (2014-2025)
- [x] Secondary line for conference ranking
- [x] Highlight conference change (Big 12 → SEC in 2024)

**Validation:** ✅ Rankings match 247Sports historical records

##### 6.2.2 Top Recruits Table
- [x] Create `components/recruiting/top-recruits-table.tsx`
- [x] Sortable table: name, position, rating, stars, hometown
- [x] Filter by year
- [x] Limit to top 10 per class (expandable)

**Validation:** ✅ Top recruits for 2020 class include Spencer Rattler, etc.

##### 6.2.3 Position Group Trends
- [x] Create `components/recruiting/position-trends-chart.tsx`
- [x] Stacked area or multi-line chart showing position distribution over time
- [x] Identify recruiting emphasis shifts (e.g., more OL focus)

**Validation:** ✅ Chart renders for 10-year history

##### 6.2.4 Conference Peer Comparison
- [x] Create `components/recruiting/conference-comparison.tsx`
- [x] Compare Oklahoma vs SEC peers: Texas, Georgia, Alabama, LSU, Texas A&M
- [x] Table or bar chart showing relative rankings
- [x] Note: pre-2024 shows Big 12 comparison context

**Validation:** ✅ Peer comparison shows accurate relative rankings

##### 6.2.5 History Page Assembly
- [x] Create `app/recruiting/history/page.tsx`
- [x] Layout: ranking chart top, recruits table and trends below
- [x] Add conference comparison as collapsible section

**Files Involved:**
- `app/recruiting/history/page.tsx` (new)
- `components/recruiting/class-ranking-chart.tsx` (new)
- `components/recruiting/top-recruits-table.tsx` (new)
- `components/recruiting/position-trends-chart.tsx` (new)
- `components/recruiting/conference-comparison.tsx` (new)

---

#### Task 6.3: Transfer Portal Tracker (P1)

**Priority:** P1
**Complexity:** Medium
**Blocked By:** Task 6.0

##### 6.3.1 Portal Departures Table
- [x] Create `components/recruiting/portal-departures-table.tsx`
- [x] Columns: player, position, rating/stars, destination (if known), date
- [x] Filter by year
- [x] Empty state: "No portal departures for [year]"

**Validation:** ✅ 2024 departures list is accurate

##### 6.3.2 Portal Arrivals Table
- [x] Create `components/recruiting/portal-arrivals-table.tsx`
- [x] Columns: player, position, original school, rating/stars, eligibility, date
- [x] Filter by year
- [x] Empty state: "No portal arrivals for [year]"

**Validation:** ✅ 2024 arrivals list is accurate

##### 6.3.3 Portal Impact Summary
- [x] Create `components/recruiting/portal-impact-card.tsx`
- [x] Net player change (+/- count)
- [x] Net rating impact (sum of arrivals rating - sum of departures rating)
- [x] Positions gained/lost breakdown

**Validation:** ✅ Summary math is correct

##### 6.3.4 Portal Tracker Page Assembly
- [x] Create `app/recruiting/portal/page.tsx`
- [x] Layout: impact card top, departures and arrivals tables below
- [x] Year selector for historical portal windows

**Files Involved:**
- `app/recruiting/portal/page.tsx` (new)
- `components/recruiting/portal-departures-table.tsx` (new)
- `components/recruiting/portal-arrivals-table.tsx` (new)
- `components/recruiting/portal-impact-card.tsx` (new)
- `lib/db/queries/transfers.ts` (new)

---

#### Task 6.4: Roster Analysis (P1)

**Priority:** P1
**Complexity:** Medium
**Blocked By:** Task 6.0

##### 6.4.1 Roster by Position Table
- [x] Create `components/roster/position-roster-table.tsx`
- [x] Group players by position (expandable sections)
- [x] Columns: name, jersey, class year, height, weight, hometown
- [x] Sortable within each position group

**Validation:** ✅ Player count matches official roster

##### 6.4.2 Experience Breakdown Chart
- [x] Create `components/roster/experience-breakdown.tsx`
- [x] Pie or bar chart: FR, SO, JR, SR, GR distribution
- [x] Show count and percentage for each class

**Validation:** ✅ Class distribution matches official roster

##### 6.4.3 Scholarship Tracker
- [x] Create `components/roster/scholarship-tracker.tsx`
- [x] Display: scholarship count vs 85 limit
- [x] Visual indicator (progress bar or gauge)
- [x] Note: CFBD doesn't distinguish scholarship vs walk-on; may need manual flag or heuristic

**Validation:** ✅ Scholarship count is reasonable (typically 83-85)

##### 6.4.4 Roster Page Assembly
- [x] Create `app/roster/page.tsx`
- [x] Layout: experience breakdown and scholarship tracker top, position table below
- [x] Add navigation link from main sidebar
- [x] Add "Depth chart coming soon" placeholder (deferred feature)

**Files Involved:**
- `app/roster/page.tsx` (new)
- `components/roster/position-roster-table.tsx` (new)
- `components/roster/experience-breakdown.tsx` (new)
- `components/roster/scholarship-tracker.tsx` (new)
- `lib/db/queries/roster.ts` (new)

---

### Task Dependencies

```
Task 6.0 (Data Foundation)
    ├── 6.0.1 Recruiting Data ──┬──► Task 6.1 (Dashboard)
    │                           └──► Task 6.2 (History)
    ├── 6.0.2 Transfer Data ───────► Task 6.3 (Portal)
    └── 6.0.3 Roster Data ─────────► Task 6.4 (Roster)
```

### Parallel Opportunities

| Track A | Track B |
|---------|---------|
| 6.0.1 Recruiting + 6.0.2 Transfer | 6.0.3 Roster |
| 6.1 Dashboard | 6.4 Roster Page |
| 6.2 History | 6.3 Portal Tracker |

### Suggested Order

1. **Task 6.0**: Data Foundation (required first)
2. **Task 6.1**: Recruiting Dashboard (highest user value)
3. **Task 6.4**: Roster Analysis (independent, can parallel with 6.2)
4. **Task 6.2**: Recruiting History
5. **Task 6.3**: Transfer Portal Tracker

---

### Sprint 6 Acceptance Criteria ✅

After all tasks complete:
1. ✅ Recruiting dashboard loads 2025 class with accurate commit count and ratings
2. ✅ Historical recruiting rankings match 247Sports for 2014-2024
3. ✅ Transfer portal tracker shows accurate 2024 Oklahoma portal activity
4. ✅ Roster page matches official Oklahoma athletics roster
5. ✅ All pages have loading states, empty states, and error boundaries
6. ✅ "Last updated" timestamp visible on all recruiting/portal pages
7. ✅ API calls are cached; no redundant fetches on page navigation

### Deferred to Future Sprint

- **Depth chart integration**: CFBD API does not provide depth chart data; requires alternate source or manual entry
- **Recruiting predictions/projections**: Out of scope for MVP
- **Crystal ball / commitment predictions**: Requires 247Sports premium data

---

## Sprint 7: Polish & Performance

**Goal:** Production-ready quality and speed

**Deliverable:** Ship-ready application with optimized performance, robust error handling, automated data freshness, and comprehensive SEO/analytics.

---

### Task Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRITICAL PATH (Sequential)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  7.0 Baselines ──► 7.1.1 React Query Setup ──► 7.1.2 Query Hooks           │
│                           │                         │                       │
│                           │                         ▼                       │
│                           │                    7.1.3 Skeletons              │
│                           │                         │                       │
│                           ▼                         ▼                       │
│                    7.3.1 Scheduled Refresh    7.3.3 Timestamps              │
│                           │                         │                       │
│                           ▼                         ▼                       │
│                    7.3.2 Manual Refresh       7.3.4 Stale Indicators        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PARALLEL TRACKS (Independent)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Track A: Performance      Track B: Error UX        Track C: Polish         │
│  ─────────────────────     ───────────────────      ─────────────────       │
│  7.1.4 DuckDB Optimize     7.2.1 Empty States       7.4.1 Favicon/OG        │
│  7.1.5 Image Optimization  7.2.2 Error Boundaries   7.4.2 SEO Metadata      │
│  7.1.6 Lighthouse Audit    7.2.3 Offline Indicator  7.4.3 Error Pages       │
│                            7.2.4 Missing Data       7.4.4 Analytics         │
│                            7.2.5 API Rate Limiting                          │
│                                                                             │
│  ──────────────────────────────────────────────────────────────────────────│
│  FINAL (after all above): 7.4.5 Design Review ──► 7.5 Production Readiness │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Task 7.0: Establish Performance Baselines (P0)

**Priority:** P0 — Required before optimization
**Complexity:** Low

Before optimizing, measure. Without baselines, "optimization" is guessing.

- [ ] Run Lighthouse on all main pages, document scores
- [ ] Run bundle analysis with `@next/bundle-analyzer`
- [ ] Profile DuckDB queries, identify top 5 slow queries
- [ ] Document DuckDB WASM cold-start time
- [ ] Set up Vercel Analytics (free tier) for real user metrics
- [ ] Create baseline documentation in `docs/PERFORMANCE_BASELINES.md`

**Files Involved:**
- `docs/PERFORMANCE_BASELINES.md` (new)
- `next.config.js` (modify — add bundle analyzer)
- `package.json` (modify — add analyzer dependency)

**Validation:** Baseline document exists with current Lighthouse scores, bundle sizes, and query times

---

### Task 7.1: Performance Optimization (P1)

#### 7.1.1 React Query Infrastructure

**Complexity:** Low

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `lib/query-client.ts` with defaults (staleTime, gcTime, retry logic)
- [ ] Create `providers/query-provider.tsx` wrapping QueryClientProvider
- [ ] Add QueryProvider to root layout with SSR hydration handling
- [ ] Add ReactQueryDevtools (dev only)
- [ ] Create type-safe query key factory in `lib/query-keys.ts`

**Files Involved:**
- `lib/query-client.ts` (new)
- `lib/query-keys.ts` (new)
- `providers/query-provider.tsx` (new)
- `app/layout.tsx` (modify)
- `package.json` (modify)

**Validation:** DevTools icon appears, no hydration errors, TypeScript compiles

---

#### 7.1.2 Migrate Data Fetching to React Query Hooks

**Complexity:** Medium
**Blocked By:** 7.1.1

- [ ] Create `hooks/queries/use-teams.ts` — team data queries
- [ ] Create `hooks/queries/use-games.ts` — game/schedule queries
- [ ] Create `hooks/queries/use-recruiting.ts` — recruiting queries
- [ ] Create `hooks/queries/use-roster.ts` — roster queries
- [ ] Create `hooks/queries/use-stats.ts` — statistical data queries
- [ ] Create `hooks/queries/index.ts` barrel export
- [ ] Replace direct fetches in page components with hooks
- [ ] Configure staleTime per data type:
  - Historical data: 24 hours
  - Recruiting: 1 hour
  - Live/schedule: 5 minutes

**Files Involved:**
- `hooks/queries/*.ts` (new — multiple files)
- `app/**/page.tsx` (modify — each data page)

**Validation:** Navigate between pages — data persists; no duplicate requests in Network tab; DevTools shows cached queries

---

#### 7.1.3 Loading Skeleton Components

**Complexity:** Medium
**Blocked By:** 7.1.2

- [ ] Create `components/skeletons/table-skeleton.tsx` — for data tables
- [ ] Create `components/skeletons/card-skeleton.tsx` — for stat cards
- [ ] Create `components/skeletons/chart-skeleton.tsx` — for charts/graphs
- [ ] Create `components/skeletons/page-skeleton.tsx` — full page layouts
- [ ] Integrate skeletons with React Query `isLoading` states
- [ ] Ensure pulse animation respects `prefers-reduced-motion`
- [ ] Match skeleton dimensions to final content (prevent CLS)

**Files Involved:**
- `components/skeletons/*.tsx` (new — multiple files)
- `components/skeletons/index.ts` (new)

**Validation:** Throttle network to Slow 3G; skeletons appear; no layout shift (CLS < 0.1)

---

#### 7.1.4 Optimize DuckDB Queries

**Complexity:** Medium
**Parallel:** Can run independently

- [ ] Audit existing queries in `lib/db/` for performance
- [ ] Create `lib/db/indexes.sql` with index definitions
- [ ] Add indexes on frequently filtered columns (team_id, season, week)
- [ ] Add composite indexes for common JOIN patterns
- [ ] Address DuckDB WASM cold-start:
  - [ ] Add explicit initialization loading state
  - [ ] Consider service worker pre-warming
- [ ] Document query patterns with EXPLAIN ANALYZE

**Files Involved:**
- `lib/db/indexes.sql` (new)
- `lib/db/queries/*.ts` (modify)
- `lib/db/init.ts` (modify)

**Validation:** Query times improved vs baseline; cold-start has loading indicator

---

#### 7.1.5 Image Optimization

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Audit current logo sources and sizes
- [ ] Create optimized logo set (WebP, multiple sizes)
- [ ] Implement `components/ui/team-logo.tsx` wrapper using next/image
- [ ] Add blur placeholder data URLs
- [ ] Configure image domains in `next.config.js` if using external
- [ ] Create fallback for missing logos

**Files Involved:**
- `public/logos/` (optimize)
- `components/ui/team-logo.tsx` (new)
- `next.config.js` (modify)

**Validation:** Lighthouse shows "Properly sized images"; no CLS from logo loading

---

#### 7.1.6 Lighthouse Audit and Fixes

**Complexity:** Medium
**Soft Dependencies:** Benefits from 7.1.3, 7.1.4, 7.1.5

- [ ] Run Lighthouse CI on all main pages
- [ ] Fix render-blocking resources
- [ ] Add `font-display: swap` for custom fonts
- [ ] Implement resource hints (preconnect, prefetch)
- [ ] Code split visualization components (dynamic imports)
- [ ] Address flagged accessibility issues
- [ ] Document final scores vs baseline
- [ ] Set target: 90+ for landing pages, 80+ for data-heavy pages (DuckDB WASM overhead)

**Files Involved:**
- `app/layout.tsx` (modify)
- `app/**/page.tsx` (modify as needed)
- `docs/LIGHTHOUSE_SCORES.md` (new)

**Validation:** Landing pages score >90; data pages score >80; documented exceptions justified

---

### Task 7.2: Error Handling & Resilience (P1)

#### 7.2.1 Empty State Components

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Create `components/ui/empty-state.tsx` base component
- [ ] Create contextual empty states:
  - [ ] No search results
  - [ ] No games scheduled
  - [ ] No stats available
  - [ ] No recruits found
- [ ] Add helpful CTAs ("Clear filters", "Try different search")
- [ ] Ensure accessible (proper headings, ARIA)

**Files Involved:**
- `components/ui/empty-state.tsx` (new)
- `components/empty-states/*.tsx` (new)

**Validation:** Filter to impossible criteria — empty state appears with actionable CTA

---

#### 7.2.2 Error Boundaries with Retry

**Complexity:** Medium
**Parallel:** Can run independently

- [ ] Create `components/error-boundary.tsx` base component
- [ ] Create `components/ui/error-fallback.tsx` UI component
- [ ] Implement retry with exponential backoff
- [ ] Create page-level error boundaries (`app/**/error.tsx`)
- [ ] Create component-level boundaries for independent widgets
- [ ] Add error logging (console dev, service prod)

**Files Involved:**
- `components/error-boundary.tsx` (new)
- `components/ui/error-fallback.tsx` (new)
- `app/**/error.tsx` (new — multiple)
- `lib/error-logging.ts` (new)

**Validation:** Trigger error — boundary catches it; retry works; error logged

---

#### 7.2.3 Offline Indicator

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Create `hooks/use-online-status.ts` hook
- [ ] Create `components/ui/offline-banner.tsx` component
- [ ] Add banner to root layout (appears when offline)
- [ ] Add `aria-live` for screen reader announcement
- [ ] Style as non-intrusive but visible

**Files Involved:**
- `hooks/use-online-status.ts` (new)
- `components/ui/offline-banner.tsx` (new)
- `app/layout.tsx` (modify)

**Validation:** Toggle offline in DevTools — banner appears within 1s, dismisses when online

---

#### 7.2.4 Handle Missing Data Gracefully

**Complexity:** Medium
**Parallel:** Can run independently

- [ ] Audit components for potential null/undefined access
- [ ] Create `lib/data-utils.ts` with safe accessor helpers
- [ ] Add fallback values for all data displays
- [ ] Implement "Data unavailable" micro-states
- [ ] Test with partial/malformed API responses

**Files Involved:**
- `lib/data-utils.ts` (new)
- `components/**/*.tsx` (modify — add null checks)

**Validation:** Mock partial data — no crashes; fallback text appears; no "undefined" visible

---

#### 7.2.5 CFBD API Rate Limiting

**Complexity:** Medium
**Parallel:** Can run independently

- [ ] Implement request queue with rate limiting
- [ ] Add 429 response handling with exponential backoff
- [ ] Display user-friendly message when rate limited
- [ ] Log rate limit events for monitoring
- [ ] Consider request batching where possible

**Files Involved:**
- `lib/cfbd/rate-limiter.ts` (new)
- `lib/cfbd/client.ts` (modify)

**Validation:** Simulate 429 response — graceful degradation, user sees message

---

### Task 7.3: Data Freshness (P1)

#### 7.3.1 Scheduled Data Refresh

**Complexity:** Medium
**Blocked By:** 7.1.1 (for cache invalidation)

- [ ] Create `app/api/cron/refresh/route.ts` API endpoint
- [ ] Add `CRON_SECRET` environment variable for security
- [ ] Configure `vercel.json` with cron schedule
- [ ] Implement incremental refresh logic (not full reload)
- [ ] Store last refresh timestamp in PostgreSQL
- [ ] Add logging for refresh operations
- [ ] Coordinate React Query cache invalidation

**Files Involved:**
- `app/api/cron/refresh/route.ts` (new)
- `vercel.json` (new or modify)
- `lib/db/refresh.ts` (new)
- `.env.local` (modify)

**Validation:** Curl test returns 200; database shows updated timestamp; Vercel logs show execution

**Note:** Vercel cron requires Pro tier for <1/day. Document hosting requirements.

---

#### 7.3.2 Manual Refresh Button (Admin)

**Complexity:** Medium
**Blocked By:** 7.3.1

- [ ] Create `app/api/admin/refresh/route.ts` protected endpoint
- [ ] Add admin authentication check
- [ ] Create `components/admin/refresh-button.tsx` component
- [ ] Show refresh status (idle, refreshing, success, error)
- [ ] Implement React Query cache invalidation on success
- [ ] Add rate limiting to prevent abuse

**Files Involved:**
- `app/api/admin/refresh/route.ts` (new)
- `components/admin/refresh-button.tsx` (new)
- `app/admin/page.tsx` (modify or create)

**Validation:** Non-admin gets 401; admin can trigger refresh; UI shows loading state

---

#### 7.3.3 "Last Updated" Timestamps

**Complexity:** Low
**Blocked By:** 7.1.2

- [ ] Create `components/ui/last-updated.tsx` component
- [ ] Store update timestamps per data type in PostgreSQL
- [ ] Create `hooks/queries/use-last-updated.ts` query hook
- [ ] Add relative time formatting ("5 minutes ago")
- [ ] Add tooltip with absolute timestamp (user timezone)
- [ ] Place on each data page in consistent location

**Files Involved:**
- `components/ui/last-updated.tsx` (new)
- `hooks/queries/use-last-updated.ts` (new)
- `lib/db/timestamps.ts` (new)
- `app/**/page.tsx` (modify)

**Validation:** Each page shows "Last updated: X ago"; tooltip shows full datetime

---

#### 7.3.4 Stale Data Indicators

**Complexity:** Low
**Blocked By:** 7.3.3

- [ ] Define staleness thresholds per data type in `lib/freshness-config.ts`
- [ ] Create `components/ui/stale-indicator.tsx` component
- [ ] Create `hooks/use-data-freshness.ts` hook
- [ ] Add subtle visual indicator for stale data (badge/icon)
- [ ] Add tooltip explaining staleness
- [ ] Integrate with React Query's `dataUpdatedAt`

**Files Involved:**
- `lib/freshness-config.ts` (new)
- `components/ui/stale-indicator.tsx` (new)
- `hooks/use-data-freshness.ts` (new)

**Validation:** Data older than threshold shows indicator; fresh data shows none

---

### Task 7.4: Final Polish (P1)

#### 7.4.1 Favicon and OG Images

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Design favicon (16, 32, 180, 192, 512 sizes)
- [ ] Generate `favicon.ico` and PNG variants
- [ ] Create `apple-touch-icon.png`
- [ ] Design OG image template (1200x630)
- [ ] Add to `app/layout.tsx` metadata
- [ ] Test with social media debuggers

**Files Involved:**
- `public/favicon.ico` (new)
- `public/favicon-*.png` (new)
- `public/apple-touch-icon.png` (new)
- `public/og-image.png` (new)
- `app/layout.tsx` (modify)

**Validation:** Browser tab shows favicon; share on Twitter/Slack shows OG image

---

#### 7.4.2 SEO Metadata

**Complexity:** Medium
**Parallel:** Can run independently

- [ ] Create `lib/seo.ts` with metadata generation helpers
- [ ] Add unique titles and descriptions per page
- [ ] Implement canonical URLs
- [ ] Add JSON-LD structured data (Organization, SportsEvent)
- [ ] Create `app/sitemap.ts` for auto-generated sitemap
- [ ] Create `app/robots.ts` for robots.txt

**Files Involved:**
- `lib/seo.ts` (new)
- `app/layout.tsx` (modify)
- `app/**/page.tsx` (modify)
- `app/sitemap.ts` (new)
- `app/robots.ts` (new)

**Validation:** Each page has unique title/description; `/sitemap.xml` valid; Lighthouse SEO >90

---

#### 7.4.3 Style 404 and Error Pages

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Design 404 page (on-brand, helpful)
- [ ] Create `app/not-found.tsx`
- [ ] Add navigation links on 404
- [ ] Create `app/error.tsx` (global error)
- [ ] Create `app/global-error.tsx` (root boundary)

**Files Involved:**
- `app/not-found.tsx` (new)
- `app/error.tsx` (new)
- `app/global-error.tsx` (new)

**Validation:** Navigate to `/asdfasdf` — 404 appears with nav back home

---

#### 7.4.4 Analytics Integration

**Complexity:** Low
**Parallel:** Can run independently

- [ ] Install `@vercel/analytics`
- [ ] Add Analytics component to root layout
- [ ] Configure Web Vitals tracking
- [ ] Verify data appears in Vercel dashboard

**Files Involved:**
- `package.json` (modify)
- `app/layout.tsx` (modify)

**Validation:** Deploy, visit site, check Vercel Analytics — data appears

---

#### 7.4.5 Final Design Review

**Complexity:** High
**Blocked By:** All 7.x tasks

- [ ] Run `/rams` review on all main pages
- [ ] Document findings in `docs/DESIGN_REVIEW.md`
- [ ] Address critical accessibility issues
- [ ] Address major visual inconsistencies
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verification
- [ ] Keyboard navigation regression test

**Files Involved:**
- `docs/DESIGN_REVIEW.md` (new)
- Various components (modify as needed)

**Validation:** All `/rams` issues addressed; WCAG 2.1 AA compliant; works on mobile

---

### Task 7.5: Production Readiness (P1)

**Complexity:** Low
**Blocked By:** 7.4.5

Final checklist before launch:

- [ ] All environment variables documented in `docs/DEPLOYMENT.md`
- [ ] Deployment runbook exists
- [ ] Rollback procedure documented and tested
- [ ] Compare final metrics to baselines (document improvement)
- [ ] Monitoring dashboards reviewed
- [ ] On-call procedure established (even if just you)

**Files Involved:**
- `docs/DEPLOYMENT.md` (new)
- `docs/PERFORMANCE_FINAL.md` (new)

**Validation:** All documentation complete; can deploy and rollback confidently

---

### Sprint 7 Summary

| Task | Title | Complexity | Dependencies | Track |
|------|-------|------------|--------------|-------|
| 7.0 | Establish Baselines | Low | None | Start |
| 7.1.1 | React Query Infrastructure | Low | 7.0 | Critical |
| 7.1.2 | Migrate to Query Hooks | Medium | 7.1.1 | Critical |
| 7.1.3 | Loading Skeletons | Medium | 7.1.2 | Critical |
| 7.1.4 | DuckDB Optimization | Medium | None | A |
| 7.1.5 | Image Optimization | Low | None | A |
| 7.1.6 | Lighthouse Audit | Medium | Soft: 7.1.3-5 | A |
| 7.2.1 | Empty States | Low | None | B |
| 7.2.2 | Error Boundaries | Medium | None | B |
| 7.2.3 | Offline Indicator | Low | None | B |
| 7.2.4 | Missing Data Handling | Medium | None | B |
| 7.2.5 | API Rate Limiting | Medium | None | B |
| 7.3.1 | Scheduled Refresh | Medium | 7.1.1 | Critical |
| 7.3.2 | Manual Refresh | Medium | 7.3.1 | Critical |
| 7.3.3 | Last Updated Timestamps | Low | 7.1.2 | Critical |
| 7.3.4 | Stale Indicators | Low | 7.3.3 | Critical |
| 7.4.1 | Favicon/OG Images | Low | None | C |
| 7.4.2 | SEO Metadata | Medium | None | C |
| 7.4.3 | 404/Error Pages | Low | None | C |
| 7.4.4 | Analytics | Low | None | C |
| 7.4.5 | Design Review | High | All above | Final |
| 7.5 | Production Readiness | Low | 7.4.5 | Final |

---

### Sprint 7 Acceptance Criteria

After all tasks complete:
1. Lighthouse scores improved vs baseline (documented)
2. All pages load with skeletons, no layout shift
3. Error boundaries catch failures gracefully
4. Offline indicator works
5. Data freshness visible on all pages
6. Scheduled refresh running (or manual fallback documented)
7. SEO metadata and OG images validated
8. Final design review passed
9. Production readiness checklist complete

---

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DuckDB WASM cold start | High | High | Explicit loading state, consider service worker pre-warming |
| React Query + SSR hydration mismatch | Medium | High | Test hydration explicitly, use initialData carefully |
| Vercel cron tier limitations | High (hobby) | Medium | Document tier requirements, manual refresh fallback |
| Lighthouse 90+ unrealistic with DuckDB | Medium | Low | Set 80+ target for data pages, document exceptions |
| CFBD API rate limits (1000/month free) | Medium | Medium | Implement caching, rate limiting, backoff |

---

## Future Sprints (Post-MVP)

### Sprint 8: National Expansion
- Multi-team support
- Conference dashboards
- National rankings integration
- Comparison tools across teams

### Sprint 9: User Features
- User accounts and preferences
- Saved views and custom dashboards
- Alerts for recruiting commits
- Share functionality

### Sprint 10: Live Features
- Real-time game updates
- Live win probability
- In-game notifications
- Second screen experience

---

## Definition of Done

Each task is complete when:
1. Code is written and TypeScript compiles without errors
2. Feature works on desktop and mobile
3. Loading and error states handled
4. Manual testing completed
5. Code committed with descriptive message
6. Vercel preview deployment verified

---

## Technical Debt Allowance

During MVP phase, acceptable shortcuts:
- Hardcoded team ID (will parameterize in Sprint 8)
- Basic caching (will optimize in Sprint 7)
- Minimal test coverage (will expand post-MVP)
- Single-user focus (no auth until needed)

Track all shortcuts in `docs/TECH_DEBT.md` for later resolution.
