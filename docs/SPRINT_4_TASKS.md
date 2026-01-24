# Sprint 4: Historical Trends & Basic Metrics — Task Breakdown

## Epic Overview

Sprint 4 transforms raw game data into meaningful historical insights. Total: **12 right-sized tasks** organized into 5 themes. Each task can be completed in a single session without context overflow.

**Goal:** Multi-season analysis and foundational statistics for Oklahoma Sooners (2014-2024)

**Status:** ✅ COMPLETE

---

## Plan Review Summary

### Strengths
- Incremental value: Each section delivers standalone functionality
- Leverages existing patterns: Builds on `StatsCard`, `RecordCard`, query conventions
- Data already exists: 10 years of games/plays/drives loaded and indexed

### Key Revisions Made
1. **Added Task 4.0**: Charting infrastructure spike (blocker for all charts)
2. **Clarified "all-time" scope**: Records labeled "Since 2014" in UI
3. **Descoped "Conference rank context"**: Requires additional data ingestion (future enhancement)
4. **Added red zone calculation**: Documented formula in acceptance criteria

---

## Task 4.0: Select and Configure Charting Library ✅ COMPLETE

**Priority**: P0 (Blocker for all chart tasks)
**Estimated Complexity**: Small
**Blocked By**: None
**Blocks**: Tasks 4.1b, 4.2b, 4.4b
**Status**: Complete

### Description
Evaluate charting options (Recharts recommended for React-first approach), install the library, and create base chart wrapper components that apply dark theme styling and respect `prefers-reduced-motion`.

### Files Created/Modified
- `package.json` — Added `recharts` dependency
- `src/components/charts/index.ts` — Barrel export
- `src/components/charts/base-line-chart.tsx` — Theme-aware line chart wrapper
- `src/components/charts/base-bar-chart.tsx` — Theme-aware bar chart wrapper
- `src/lib/hooks/use-reduced-motion.ts` — Hook for motion preference detection
- `src/lib/hooks/index.ts` — Hooks barrel export

### Acceptance Criteria
- [x] Charting library installed (`npm install recharts`)
- [x] `BaseLineChart` component renders with dark theme colors
- [x] `BaseBarChart` component renders with dark theme colors
- [x] Charts disable animations when `prefers-reduced-motion: reduce`
- [x] Responsive container wrapper included
- [x] Example usage documented in component comments
- [x] `npm run build` passes

### Notes
Recharts pairs well with Tailwind and has built-in responsive containers. Color tokens should match existing design system (`--primary`, `--destructive`, `--muted`, etc.).

---

## Task 4.1a: Season Trends Data Layer ✅ COMPLETE

**Priority**: P0
**Estimated Complexity**: Medium
**Blocked By**: None
**Blocks**: Task 4.1b
**Status**: Complete

### Description
Add DuckDB query functions to aggregate multi-season trend data: wins/losses by season, points scored/allowed per game, conference vs non-conference splits, home vs away splits.

### Files Created/Modified
- `src/lib/db/queries.ts` — Added trend query functions and interfaces

### Acceptance Criteria
- [x] `getWinLossTrends(startYear, endYear)` returns `{ season, wins, losses }[]`
- [x] `getPointsTrends(startYear, endYear)` returns `{ season, ppgOffense, ppgDefense }[]`
- [x] `getConferenceSplits(startYear, endYear)` returns `{ season, confWins, confLosses, nonConfWins, nonConfLosses }[]`
- [x] `getHomeAwaySplits(startYear, endYear)` returns `{ season, homeWins, homeLosses, awayWins, awayLosses }[]`
- [x] All functions handle 2014-2024 range without errors
- [x] Manual test: Query results match expected values for known seasons

### Interfaces
```typescript
interface WinLossTrend {
  season: number;
  wins: number;
  losses: number;
}

interface PointsTrend {
  season: number;
  ppgOffense: number;
  ppgDefense: number;
}

interface ConferenceSplit {
  season: number;
  confWins: number;
  confLosses: number;
  nonConfWins: number;
  nonConfLosses: number;
}

interface HomeAwaySplit {
  season: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
}
```

---

## Task 4.1b: Season Trends UI Components ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Medium
**Blocked By**: Task 4.0, Task 4.1a
**Blocks**: Task 4.1c
**Status**: Complete

### Description
Build trend visualization components: win-loss line chart, PPG offense/defense dual-line chart, conference vs non-conference stacked bar, home/away split bar chart.

### Files Created/Modified
- `src/components/trends/win-loss-chart.tsx` — Line chart for W-L by season
- `src/components/trends/ppg-chart.tsx` — Dual-line for offense/defense PPG
- `src/components/trends/conference-splits-chart.tsx` — Stacked/grouped bar
- `src/components/trends/home-away-chart.tsx` — Bar chart
- `src/components/trends/index.ts` — Barrel export

### Acceptance Criteria
- [x] Win-loss chart shows 10 seasons with clear trend line
- [x] PPG chart shows two lines (offense in team color, defense contrasting) with legend
- [x] Conference splits chart shows conf vs non-conf W-L
- [x] Home/away chart shows venue-based record splits
- [x] All charts responsive (readable on mobile)
- [x] Hover/focus states show data point values (tooltips)
- [x] Empty state if no data for selected range
- [x] Accessible: screen reader announces chart purpose and data summary
- [x] `tabular-nums` in all tooltips and labels

### Notes
Follow the `DriveChart` pattern for accessibility (keyboard navigation where applicable, ARIA labels). Use consistent color coding across all trend charts.

---

## Task 4.1c: Season Trends Page Integration ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Small
**Blocked By**: Task 4.1b
**Blocks**: None
**Status**: Complete

### Description
Create a `/trends` page that displays all season trend charts with a year range selector (start/end season dropdowns).

### Files Created/Modified
- `src/app/trends/page.tsx` — New page
- `src/components/layout/app-sidebar.tsx` — Added "Trends" nav link
- `src/components/trends/year-range-selector.tsx` — Start/end year dropdowns

### Acceptance Criteria
- [x] `/trends` route accessible from sidebar navigation
- [x] Year range selector defaults to 2014-2024
- [x] Changing year range updates all charts
- [x] Skeleton loading states during data fetch
- [x] Page title/meta for SEO: "Oklahoma Sooners - Historical Trends"
- [x] Mobile: Charts stack vertically in single column
- [x] URL preserves year range selection (`?start=2014&end=2024`)

---

## Task 4.2a: Head-to-Head Data Layer ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Small
**Blocked By**: None
**Blocks**: Task 4.2b
**Status**: Complete

### Description
Add query functions to fetch head-to-head records against specific opponents: overall record, recent matchups list, scoring trends.

### Files Created/Modified
- `src/lib/db/queries.ts` — Added head-to-head functions and interfaces

### Acceptance Criteria
- [x] `getHeadToHeadRecord(opponent)` returns `{ opponent, wins, losses, totalGames }`
- [x] `getHeadToHeadGames(opponent, limit?)` returns recent matchups with scores, dates, venues
- [x] `getHeadToHeadScoringTrend(opponent)` returns `{ season, ouScore, oppScore }[]`
- [x] Opponent name matching is case-insensitive (ILIKE pattern)
- [x] Returns empty results gracefully for opponents with no matchups
- [x] Manual test: Texas record matches known history (2014-2024 subset)

### Interfaces
```typescript
interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  totalGames: number;
}

interface HeadToHeadGame {
  gameId: number;
  season: number;
  date: string;
  venue: string;
  isHome: boolean;
  ouScore: number;
  oppScore: number;
  result: 'W' | 'L';
}

interface HeadToHeadScoringTrend {
  season: number;
  ouScore: number;
  oppScore: number;
}
```

### Notes
Add code comment noting records are "since 2014" to manage expectations about all-time data.

---

## Task 4.2b: Head-to-Head UI Components ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Medium
**Blocked By**: Task 4.0, Task 4.2a
**Blocks**: Task 4.2c
**Status**: Complete

### Description
Build rival selector dropdown and head-to-head display: record card, recent matchups table, scoring trend chart.

### Files Created/Modified
- `src/components/rivals/rival-selector.tsx` — Dropdown with key rivals
- `src/components/rivals/h2h-record-card.tsx` — W-L display with opponent
- `src/components/rivals/matchups-table.tsx` — Recent games table
- `src/components/rivals/scoring-trend-chart.tsx` — Line chart comparing scores
- `src/components/rivals/index.ts` — Barrel export

### Acceptance Criteria
- [x] Rival selector includes: Texas, Oklahoma State, Nebraska, Texas A&M, Kansas State
- [x] "Other opponent" option allows typing any team name
- [x] Record card shows W-L with "Since 2014" subtitle
- [x] Matchups table sortable by date, shows venue, score, result
- [x] Scoring trend chart shows OU vs opponent scores over time
- [x] Empty state if no matchups found for selected opponent
- [x] Win/loss badges use icons (not color-only) per Sprint 2.5 pattern

### Notes
Reuse `Badge` component pattern from games table. Consider adding the opponent's primary color as accent if we have that data.

---

## Task 4.2c: Head-to-Head Page Integration ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Small
**Blocked By**: Task 4.2b
**Blocks**: None
**Status**: Complete

### Description
Create a `/rivals` page that integrates rival selector and displays all head-to-head components.

### Files Created/Modified
- `src/app/rivals/page.tsx` — New page
- `src/components/layout/app-sidebar.tsx` — Added "Rivals" nav link

### Acceptance Criteria
- [x] `/rivals` route accessible from sidebar navigation
- [x] Default selection (Texas) loads on page mount
- [x] Changing rival updates all components
- [x] URL params preserve selection (`?opponent=Texas`)
- [x] Skeleton loading states during data fetch
- [x] Page fully accessible via keyboard navigation
- [x] Page title: "Oklahoma Sooners - Head-to-Head Records"

---

## Task 4.3a: Metrics Data Layer ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Medium
**Blocked By**: None
**Blocks**: Task 4.3b, Task 4.4a
**Status**: Complete

### Description
Add comprehensive metrics query function that calculates offensive, defensive, and situational stats for a given season.

### Files Created/Modified
- `src/lib/db/queries.ts` — Added `getDetailedSeasonMetrics(season)` and `DetailedMetrics` interface

### Acceptance Criteria
- [x] **Offensive metrics**: PPG, total yards, YPG, yards per play, 3rd down conversion %
- [x] **Defensive metrics**: PPG allowed, total yards allowed, YPG allowed
- [x] **Turnover margin**: Turnovers gained (INT + fumble recoveries) minus turnovers lost
- [x] **Red zone efficiency**: TD rate on plays where `start_yards_to_goal <= 20`
- [x] All calculations use proper game count denominators
- [x] Query handles seasons with partial data gracefully
- [x] Manual validation against one known season (document expected values)

### Interfaces
```typescript
interface DetailedMetrics {
  season: number;
  gamesPlayed: number;

  // Offense
  ppgOffense: number;
  totalYardsOffense: number;
  ypgOffense: number;
  yardsPerPlay: number;
  thirdDownPct: number;

  // Defense
  ppgDefense: number;
  totalYardsDefense: number;
  ypgDefense: number;

  // Situational
  turnoverMargin: number;
  turnoversGained: number;
  turnoversLost: number;
  redZoneTdPct: number;
  redZoneAttempts: number;
}
```

### Notes
Red zone definition: `start_yards_to_goal <= 20`. Document this in code comments. Turnover detection uses `play_type` values containing 'Interception', 'Fumble Recovery', etc.

---

## Task 4.3b: Metrics Dashboard UI ✅ COMPLETE

**Priority**: P1
**Estimated Complexity**: Medium
**Blocked By**: Task 4.3a
**Blocks**: None
**Status**: Complete

### Description
Build a comprehensive metrics dashboard showing all calculated stats in organized card groups (offense, defense, situational).

### Files Created/Modified
- `src/components/metrics/metrics-grid.tsx` — Layout component
- `src/components/metrics/metric-card.tsx` — Individual metric display (reuse/extend StatsCard pattern)
- `src/components/metrics/metric-group.tsx` — Grouped metrics with header
- `src/app/metrics/page.tsx` — New page
- `src/components/layout/app-sidebar.tsx` — Added "Metrics" nav link
- `src/components/metrics/index.ts` — Barrel export

### Acceptance Criteria
- [x] Metrics organized by category: Offense, Defense, Situational
- [x] Each metric shows label, value, and optional context/unit
- [x] Season selector to view different years
- [x] Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
- [x] `tabular-nums` on all numeric values
- [x] Loading skeletons for each card group
- [x] Empty state if season has no data
- [x] URL preserves season selection (`?season=2024`)

### Notes
Consider subtle trend indicators (↑/↓) comparing to previous season as enhancement, but core metric display is MVP.

---

## Task 4.4a: Season Comparison Data Layer ✅ COMPLETE

**Priority**: P2
**Estimated Complexity**: Small
**Blocked By**: Task 4.3a
**Blocks**: Task 4.4b
**Status**: Complete

### Description
Create a function to fetch metrics for two seasons and calculate deltas (improvement/decline).

### Files Created/Modified
- `src/lib/db/queries.ts` — Added `compareSeasons(season1, season2)` and delta interfaces

### Acceptance Criteria
- [x] Returns both seasons' full metrics plus calculated deltas
- [x] Deltas include absolute difference and percentage change
- [x] Delta direction indicated (positive = improvement for offense, negative = improvement for defense)
- [x] Handles missing data gracefully (returns null for unavailable comparisons)
- [x] Type-safe return with clear delta semantics

### Interfaces
```typescript
interface SeasonComparison {
  season1: DetailedMetrics;
  season2: DetailedMetrics;
  deltas: MetricDeltas;
}

interface MetricDeltas {
  ppgOffense: DeltaValue;
  ppgDefense: DeltaValue;
  ypgOffense: DeltaValue;
  ypgDefense: DeltaValue;
  thirdDownPct: DeltaValue;
  turnoverMargin: DeltaValue;
  redZoneTdPct: DeltaValue;
}

interface DeltaValue {
  absolute: number;
  percentage: number;
  direction: 'improvement' | 'decline' | 'unchanged';
}
```

---

## Task 4.4b: Season Comparison UI ✅ COMPLETE

**Priority**: P2
**Estimated Complexity**: Medium
**Blocked By**: Task 4.0, Task 4.4a
**Blocks**: None
**Status**: Complete

### Description
Build a side-by-side comparison view with two season selectors and delta highlighting.

### Files Created/Modified
- `src/components/comparison/season-comparison.tsx` — Main comparison component
- `src/components/comparison/comparison-row.tsx` — Individual metric row with delta
- `src/components/comparison/comparison-header.tsx` — Season labels and swap button
- `src/app/compare/page.tsx` — New page
- `src/app/compare/compare-page-client.tsx` — Client component for state management
- `src/components/layout/app-sidebar.tsx` — Added "Compare" nav link
- `src/components/comparison/index.ts` — Barrel export

### Acceptance Criteria
- [x] Two season selectors (default: current year and previous year)
- [x] Side-by-side metric display with delta column
- [x] Improvements highlighted green, declines highlighted red
- [x] Icons/arrows for direction (not color-only, per a11y requirements)
- [x] Swap button to reverse season 1 ↔ season 2
- [x] Accessible comparison table with proper `scope` attributes
- [x] URL preserves both seasons (`?s1=2024&s2=2023`)
- [x] Mobile: Stack vertically with clear season headers

### Notes
"Conference rank context" descoped for MVP — would require additional standings data ingestion. Can be added as future enhancement.

---

## Dependency Graph

```
Task 4.0 (charting) ─────────────────────────────────────┐
                                                          │
Task 4.1a (trends data) ──► Task 4.1b (trends UI) ──► Task 4.1c (trends page)
                                     │
Task 4.2a (h2h data) ──► Task 4.2b (h2h UI) ──► Task 4.2c (rivals page)
                                │
Task 4.3a (metrics data) ──► Task 4.3b (metrics UI)
         │
         └──► Task 4.4a (compare data) ──► Task 4.4b (compare UI)
```

---

## Suggested Execution Order

| Order | Task | Rationale |
|-------|------|-----------|
| 1 | **4.0** | Charting infrastructure — unblocks all visualizations |
| 2 | **4.1a** | Trends data layer — foundation for trends UI |
| 3 | **4.2a** | H2H data layer — can run parallel with 4.1a |
| 4 | **4.3a** | Metrics data layer — can run parallel with 4.1a, 4.2a |
| 5 | **4.1b** | Trends UI — after 4.0 and 4.1a complete |
| 6 | **4.2b** | H2H UI — after 4.0 and 4.2a complete |
| 7 | **4.3b** | Metrics dashboard — after 4.3a complete |
| 8 | **4.1c** | Trends page — after 4.1b complete |
| 9 | **4.2c** | Rivals page — after 4.2b complete |
| 10 | **4.4a** | Comparison data — after 4.3a complete |
| 11 | **4.4b** | Comparison UI — after 4.0 and 4.4a complete |

---

## Parallel Opportunities

| Phase | Parallel Tasks | Notes |
|-------|----------------|-------|
| **Data Layer** | 4.1a, 4.2a, 4.3a | All three can run simultaneously after 4.0 |
| **UI Layer** | 4.1b, 4.2b | Both need 4.0; can run in parallel |
| **Page Integration** | 4.1c, 4.2c | Independent after their UI tasks |

**Maximum parallelism:** 3 concurrent tasks during data layer phase.

---

## Sprint Validation Checklist ✅

After all tasks complete:

- [x] `/trends` page renders all 4 trend charts for 2014-2024
- [x] `/rivals` page shows Texas head-to-head correctly
- [x] `/metrics` page displays all offensive/defensive/situational stats
- [x] `/compare` page shows delta between 2023 and 2024 seasons
- [x] All pages accessible via sidebar navigation
- [x] All pages work on mobile (responsive)
- [x] Tab navigation works through all interactive elements
- [x] Charts respect `prefers-reduced-motion`
- [x] `npm run build` passes
- [ ] Lighthouse accessibility score ≥ 95 on all new pages (manual verification recommended)

---

## Technical Notes

### Charting Library Choice
**Recommended: Recharts**
- React-first API
- Built-in responsive containers
- Good TypeScript support
- Lightweight bundle size
- Easy dark theme customization via CSS variables

### Color Tokens for Charts
Use existing design system tokens:
- Offense/positive: `hsl(var(--primary))` or custom green
- Defense/negative: `hsl(var(--destructive))`
- Neutral: `hsl(var(--muted))`
- Grid lines: `hsl(var(--border))`

### Data Scope Reminder
All historical data is **2014-2024**. UI should indicate "Since 2014" where "all-time" might be misinterpreted.

---

## Future Enhancements (Post-Sprint 4)

- Conference rank context (requires standings data ingestion)
- Special teams metrics (FG %, punt average, return yards)
- Export to CSV on all data tables
- Share/embed functionality for charts
- Custom date range beyond available data
