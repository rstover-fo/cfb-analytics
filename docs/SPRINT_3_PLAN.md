# Sprint 3: Play-by-Play & Drive Charts

## Overview

**Goal:** Granular game analysis with play-level data and drive visualization

**Builds On:** Sprint 2 Game Detail page (`/games/[id]`) which already displays scoring by quarter and drive summary table

**Deliverable:** Enhanced game detail experience with:
- Interactive play-by-play view with filtering
- Visual drive chart showing field position progression
- Enhanced drive summary with sortable columns and CSV export

---

## Pre-Sprint Checklist ✅ VERIFIED

Verification run on 2026-01-21 via `/api/debug/verify`:

- [x] **Index exists on plays.game_id** - `idx_plays_game_id` defined in `duckdb.ts:142`
- [x] **Clock semantics confirmed** - Time REMAINING (Q1 starts at 15:00, decreases)
- [x] **Play type enumeration** - 45 distinct types found (see below)
- [x] **Overtime period values** - Periods 5, 6, 8 exist (134 plays in OT1, 21 in OT2, 1 in OT4)
- [x] **Plays per game** - Min: 9 | Avg: 188 | Max: 245

### Play Types (45 total, by frequency)

| Category | Types |
|----------|-------|
| **Rush** (21,758) | Rush, Rushing Touchdown |
| **Pass** (20,720) | Pass Incompletion, Pass Completion, Pass Reception, Pass, Passing Touchdown, Sack |
| **Special Teams** (7,019) | Kickoff, Punt, Kickoff Return (Offense/Defense), Punt Return, Field Goal Good/Missed, Blocked Punt/FG |
| **Scoring** (2,164) | Extra Point Good/Missed, 2pt Conversion, Two Point Pass/Rush, Blocked PAT |
| **Turnovers** (897) | Pass Interception, Interception, Interception Return Touchdown, Fumble Recovery (Own/Opponent), Fumble, Fumble Return Touchdown |
| **Game State** (877) | Penalty, Timeout, End Period, End of Half, End of Game, Start of Period, End of Regulation |
| **Rare** (25) | Safety, Defensive 2pt Conversion, Kickoff/Punt Return Touchdown, Missed FG Return TD, Blocked Punt TD |

### Null Drive Plays
✅ All plays have `drive_number` - no orphan kickoffs/touchbacks

---

## Sprint 3 Tasks

### 3.0 Query Pattern Hardening (from Plan Review)

**Goal:** Establish secure query patterns before adding string-based filters

#### 3.0.1 Document Query Conventions
- [ ] Add header comment to `queries.ts` documenting:
  - All numeric params validated via `parseInt()` before interpolation
  - String params MUST use prepared statements or be from a validated enum
  - Never interpolate user-provided strings directly
- [ ] Add `createIndex` utility function for ensuring indexes exist

#### 3.0.2 Verify Database Indexes
- [ ] Verify index on `plays.game_id` exists
- [ ] If not, add index creation to data pipeline or init script
- [ ] Document index requirements in DATABASE.md

**Files Modified:**
- `src/lib/db/queries.ts` (add documentation header)
- `docs/DATABASE.md` (add index section)

**Validation:** Query patterns are documented; index confirmed

---

### 3.1 Play-by-Play Data Layer

**Goal:** Add database queries and types for play-level data

#### 3.1.1 Add Play Interface and Query
- [ ] Add `Play` interface to `/src/lib/db/queries.ts`
- [ ] Add `getGamePlays(gameId: number)` query returning all plays for a game
- [ ] Include fields: id, driveNumber, playNumber, period, clock, down, distance, yardsGained, playType, playText, ppa, scoring, offense, defense, offenseScore, defenseScore
- [ ] Export from `/src/lib/db/index.ts`
- [ ] Add comment clarifying clock semantics (time remaining vs elapsed)

**Files Modified:**
- `src/lib/db/queries.ts`
- `src/lib/db/index.ts`

**Validation:** Query returns plays ordered by drive_number, play_number for any game

---

### 3.2 Play-by-Play UI Component

**Goal:** Display plays grouped by drive with filtering capabilities

#### 3.2.1 Create PlayList Component
- [ ] Create `/src/components/game/play-list.tsx`
- [ ] Display plays grouped by drive with collapsible drive headers
- [ ] Show play details: down & distance, yard line, result, yards gained
- [ ] Format clock as `Q{period} {min}:{sec}`
- [ ] Add `tabular-nums` to all numeric displays

**Files Created:**
- `src/components/game/play-list.tsx`
- `src/components/game/index.ts` (barrel export)

#### 3.2.2 Add Play Type Badges
- [ ] Create play type badge with icons:
  - Rush: footsteps icon, blue badge
  - Pass Reception: target icon, green badge
  - Pass Incompletion: x-circle icon, gray badge
  - Sack: shield icon, red badge
  - Punt: arrow-up icon, gray badge
  - Kickoff: zap icon, yellow badge
  - Field Goal Good: check-circle icon, green badge
  - Field Goal Missed: x-circle icon, red badge
  - Touchdown: trophy icon, gold badge
  - Interception: alert-triangle icon, red badge
  - Fumble: alert-octagon icon, red badge
  - Penalty: flag icon, yellow badge
- [ ] Display PPA (Predicted Points Added) as colored indicator (+green, -red)

#### 3.2.3 Add Play Filters
- [ ] Create filter bar above play list
- [ ] Quarter filter: All | Q1 | Q2 | Q3 | Q4 | OT
- [ ] Down filter: All | 1st | 2nd | 3rd | 4th
- [ ] Play type filter: All | Run | Pass | Special Teams
- [ ] Team filter: Both | Oklahoma Offense | Opponent Offense
- [ ] Use URL search params for filter state (shareable links)
- [ ] Define URL param schema with validation (invalid values → defaults)
- [ ] Tab state (Drives vs Play-by-Play) should be local, not in URL

**URL Param Schema:**
```
?quarter=1|2|3|4|ot    (default: all)
?down=1|2|3|4          (default: all)
?type=run|pass|special (default: all)
?team=ou|opp           (default: all)
?search=<string>       (default: empty, max 100 chars)
```

#### 3.2.4 Add Play Search (Server-Side)
- [ ] Add search input to filter by play_text content
- [ ] Debounce search input (300ms)
- [ ] **Server-side filtering**: Add `getGamePlays(gameId, filters)` that includes WHERE clause for search
- [ ] Use SQL LIKE with escaped user input (not client-side regex)
- [ ] Highlight matching text in results (client-side after fetch)
- [ ] Limit search to 100 characters to prevent abuse

**Validation:** Can filter to all 3rd down pass plays in a game; filters persist in URL

---

### 3.3 Drive Chart Visualization

**Goal:** Horizontal drive chart showing field position progression

#### 3.3.1 Create DriveChart Component
- [ ] Create `/src/components/game/drive-chart.tsx`
- [ ] Horizontal bar chart with 100-yard field representation
- [ ] Each drive as a bar showing start → end field position
- [ ] **Use `start_yards_to_goal` and `end_yards_to_goal`** for visual position (not `yards` field which is net yards)
- [ ] Handle turnover drives correctly (field direction flips)
- [ ] Color-code by drive result:
  - TD: `bg-green-600`
  - FG: `bg-yellow-500`
  - Punt: `bg-gray-500`
  - INT/Fumble/Turnover: `bg-red-600`
  - Turnover on Downs: `bg-orange-500`
  - End of Half/Game: `bg-gray-400`
  - Safety: `bg-purple-600`

#### 3.3.2 Add Drive Chart Interactivity
- [ ] Hover state: Show tooltip with drive details (team, plays, yards, time, result)
- [ ] Click: Scroll to and expand that drive in play-by-play view
- [ ] Distinguish Oklahoma drives vs opponent drives (darker shade for Oklahoma)
- [ ] Add yard line markers (10, 20, 30, 40, 50, 40, 30, 20, 10)
- [ ] Add end zone labels (Team A | Team B)

#### 3.3.3 Add Reduced Motion Support
- [ ] Respect `prefers-reduced-motion` for hover animations
- [ ] Static tooltip on focus for keyboard users
- [ ] Ensure all information is accessible without hover

**Validation:** Drive chart matches official box score drive summary; accessible via keyboard

---

### 3.4 Enhanced Drive Summary Table

**Goal:** Sortable drive table with filtering and export

#### 3.4.1 Make Drive Table Sortable
- [ ] Add sort controls to column headers
- [ ] Sortable columns: Drive #, Plays, Yards, Time, Result
- [ ] Visual sort indicator (arrow up/down)
- [ ] Default sort: drive number ascending

#### 3.4.2 Add Team Filter to Drive Table
- [ ] Add toggle buttons: All | Oklahoma | Opponent
- [ ] Filter drives by offense team
- [ ] Show aggregate stats for filtered view (total drives, yards, points)

#### 3.4.3 Add CSV Export
- [ ] Add "Export CSV" button to drive table header
- [ ] Export all visible drives (respects filter)
- [ ] Columns: Drive, Team, Quarter, Start, Plays, Yards, Time, Result
- [ ] Filename: `oklahoma-{opponent}-{date}-drives.csv`
- [ ] **Use proper CSV library** (Papa Parse) for encoding/escaping
- [ ] **UTF-8 with BOM** for Excel compatibility
- [ ] Handle special characters in team names and play descriptions

**Files Modified:**
- `src/app/games/[id]/page.tsx` (or extract to component)

**Validation:** Drive totals sum correctly; CSV downloads and opens in Excel with correct encoding

---

### 3.5 Integrate Components into Game Detail Page

**Goal:** Assemble all new components into the game detail page

#### 3.5.1 Update Game Detail Layout
- [ ] Add tabbed interface below scoring: "Drives" | "Play-by-Play"
- [ ] Drives tab: Drive chart + enhanced drive table
- [ ] Play-by-Play tab: Filter bar + play list
- [ ] Preserve existing scoring by quarter section

#### 3.5.2 Add Loading States (Progressive Enhancement)
- [ ] Skeleton loader for play list (matches existing patterns)
- [ ] Skeleton loader for drive chart
- [ ] Use Suspense boundaries for streaming
- [ ] **Progressive loading**: Load game + drives first (fast), then stream plays
- [ ] Drive chart can render from drive data while plays load

#### 3.5.3 Add Empty States
- [ ] Handle games with no plays data (pre-2014)
- [ ] Display message: "Play-by-play data not available for games before 2014"
- [ ] Still show drive summary if drives exist

**Files Modified:**
- `src/app/games/[id]/page.tsx`

**Validation:** Game detail page loads with all new features; older games degrade gracefully

---

## Task Dependencies

```
3.0.1 (Query docs) ──► 3.0.2 (Indexes) ──┐
                                         │
3.1.1 (Play query) ◄────────────────────┘
        │
        ├──► 3.2.1 (PlayList) ──► 3.2.2 (Badges) ──► 3.2.3 (Filters) ──► 3.2.4 (Search)
        │
        └──► 3.3.1 (DriveChart) ──► 3.3.2 (Interactive) ──► 3.3.3 (a11y)

3.4.1 (Sortable) ──► 3.4.2 (Team Filter) ──► 3.4.3 (CSV Export)
        │
        └──► 3.5.1 (Layout) ──► 3.5.2 (Loading) ──► 3.5.3 (Empty)
```

**Critical path:** 3.0.x → 3.1.1 (query hardening before new queries)

**Parallel work possible:**
- 3.2.x and 3.3.x can be developed in parallel after 3.1.1
- 3.4.x can be developed in parallel (uses existing drive data)

---

## New Files

| File | Purpose |
|------|---------|
| `src/components/game/play-list.tsx` | Play-by-play display with grouping |
| `src/components/game/drive-chart.tsx` | Horizontal drive visualization |
| `src/components/game/play-filters.tsx` | Filter bar for plays |
| `src/components/game/play-badge.tsx` | Play type badge with icon |
| `src/components/game/drive-table.tsx` | Enhanced sortable drive table |
| `src/components/game/index.ts` | Barrel export |

---

## Modified Files

| File | Changes |
|------|---------|
| `src/lib/db/queries.ts` | Add `Play` interface, `getGamePlays()` query |
| `src/lib/db/index.ts` | Export new query |
| `src/app/games/[id]/page.tsx` | Integrate new components, add tabs |
| `src/app/globals.css` | Drive chart styles if needed |

---

## Technical Notes

### Play Data Structure (from DATABASE.md)
```typescript
interface Play {
  id: string;
  gameId: number;
  driveId: string;
  driveNumber: number;
  playNumber: number;
  period: number;
  clockMinutes: number;
  clockSeconds: number;
  offense: string;
  defense: string;
  offenseScore: number;
  defenseScore: number;
  down: number;
  distance: number;
  yardsGained: number;
  playType: string;
  playText: string;
  ppa: number | null;
  scoring: boolean;
}
```

### Query Pattern

**IMPORTANT:** All queries MUST follow these conventions:
- Numeric params: Validate with `parseInt()` before interpolation
- String params: Use prepared statements or validate against known enum
- Never interpolate raw user strings

```sql
-- Basic query (gameId is validated number)
SELECT * FROM plays
WHERE game_id = ${gameId}
ORDER BY drive_number, play_number

-- With search (use prepared statement for user input)
SELECT * FROM plays
WHERE game_id = ? AND play_text ILIKE ?
ORDER BY drive_number, play_number
```

### Clock Semantics

`clock_minutes` and `clock_seconds` represent **time remaining** in the quarter, not elapsed time.
- Q1 starts at 15:00
- A play at `clock_minutes=12, clock_seconds=45` means 12:45 left in the quarter
- Handle edge case: `clock_seconds > 59` (bad API data) → cap at 59

### Play Types (45 confirmed from database)

**Badge Mapping** (based on verified play types):

| Badge | Color | Icon | Play Types |
|-------|-------|------|------------|
| Rush | `blue-600` | Footprints | Rush, Rushing Touchdown |
| Pass | `green-600` | Target | Pass Reception, Pass Completion, Passing Touchdown |
| Incomplete | `gray-500` | XCircle | Pass Incompletion, Pass |
| Sack | `red-600` | Shield | Sack |
| Punt | `gray-500` | ArrowUp | Punt, Blocked Punt, Blocked Punt Touchdown |
| Kickoff | `yellow-500` | Zap | Kickoff, Kickoff Return (Offense), Kickoff Return (Defense) |
| FG Good | `green-600` | CheckCircle | Field Goal Good |
| FG Miss | `red-600` | XCircle | Field Goal Missed, Missed Field Goal Return Touchdown |
| Turnover | `red-600` | AlertTriangle | Pass Interception, Interception, Interception Return Touchdown, Fumble, Fumble Recovery (Opponent), Fumble Return Touchdown |
| Penalty | `yellow-500` | Flag | Penalty |
| PAT | `green-600` | Plus | Extra Point Good, 2pt Conversion, Two Point Pass, Two Point Rush |
| PAT Miss | `red-600` | Minus | Extra Point Missed, Blocked PAT |
| Timeout | `gray-400` | Clock | Timeout, End Period, End of Half, End of Game, Start of Period, End of Regulation |
| Safety | `purple-600` | AlertOctagon | Safety, Defensive 2pt Conversion |
| Return TD | `gold-500` | Trophy | Punt Return Touchdown, Kickoff Return Touchdown |
| Fumble Own | `gray-500` | RotateCcw | Fumble Recovery (Own) |
| Other | `gray-400` | HelpCircle | Uncategorized |

**Fallback:** Any unmapped type → "Other" badge with gray styling

### Accessibility Requirements (from Sprint 2.5)
- `scope="col"` on all table headers
- `tabular-nums` on numeric displays
- Focus-visible styles on interactive elements
- `prefers-reduced-motion` respected
- Keyboard navigation for all interactive elements

---

## Acceptance Criteria

After Sprint 3 is complete:

1. **Play-by-Play Works**
   - [ ] Can view all plays for any game (2014+)
   - [ ] Plays grouped by drive with collapsible sections
   - [ ] Can filter to specific quarters, downs, play types
   - [ ] Can search plays by description text

2. **Drive Chart Accurate**
   - [ ] Drive chart shows all drives with correct field position
   - [ ] Colors match drive results
   - [ ] Hovering shows drive details
   - [ ] Clicking navigates to that drive's plays

3. **Drive Table Enhanced**
   - [ ] Can sort by any column
   - [ ] Can filter to Oklahoma or opponent drives
   - [ ] Can export to CSV

4. **Accessibility Maintained**
   - [ ] All new components keyboard navigable
   - [ ] Screen reader announces play information correctly
   - [ ] Reduced motion users see no jarring animations
   - [ ] Lighthouse accessibility score remains 100

5. **Graceful Degradation**
   - [ ] Games before 2014 show appropriate message
   - [ ] Page loads even if plays query fails

---

## Definition of Done

Each task is complete when:
1. Code is written and TypeScript compiles without errors
2. Feature works on desktop and mobile
3. Loading and empty states handled
4. Accessibility requirements met
5. Manual testing completed
6. Code committed with descriptive message
7. Vercel preview deployment verified

---

## Estimated Effort

| Section | Tasks | Complexity |
|---------|-------|------------|
| 3.0 Query Hardening | 2 | Low |
| 3.1 Data Layer | 1 | Low |
| 3.2 Play-by-Play | 4 | Medium-High |
| 3.3 Drive Chart | 3 | Medium |
| 3.4 Drive Table | 3 | Low-Medium |
| 3.5 Integration | 3 | Medium |

**Total:** 16 tasks across 6 sections

---

## Plan Review Summary

**Reviewed by:** plan-reviewer (Cassandra persona)
**Verdict:** APPROVE WITH REVISIONS

### Key Concerns Addressed

| Concern | Severity | Resolution |
|---------|----------|------------|
| SQL injection risk with string params | HIGH | Added 3.0 Query Hardening section; server-side search with prepared statements |
| Query performance (59K plays) | HIGH | Added index verification to pre-sprint checklist; server-side filtering |
| URL params collision | MEDIUM | Defined URL param schema with validation; tab state kept local |
| Clock semantics ambiguity | MEDIUM | Added documentation clarifying time remaining vs elapsed |
| Drive chart field position | MEDIUM | Changed to use `start_yards_to_goal`/`end_yards_to_goal` |
| CSV encoding | LOW | Added Papa Parse + UTF-8 BOM requirements |
| Loading jank | LOW | Added progressive loading (drives first, then plays) |

### Questions to Verify Before Implementation

1. **Index on plays.game_id** - Verify exists or add to pipeline
2. **Clock semantics** - Confirm time remaining interpretation with sample data
3. **Overtime periods** - Query max period value in dataset
4. **Play type completeness** - Get distinct list for badge mapping
5. **Mobile drive chart** - Decide: scrollable, collapsed, or alternate viz?

### Risks Accepted

- Client-side filtering for non-search filters (quarter, down, type) - acceptable for ~200 plays/game
- No virtualization for play list initially - monitor performance, add if needed
