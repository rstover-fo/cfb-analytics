# Sprint 3 Task Breakdown

**Generated:** 2026-01-21
**Reviewed by:** task-splitter (Marie Kondo persona)
**Last Updated:** 2026-01-21 (Session: Tasks 7-9 complete)

## Epic Overview

Sprint 3 adds granular game analysis with play-level data and drive visualization to the existing game detail page. The original 16 subtasks have been reorganized into **10 focused tasks** that each spark clarity and can be completed in a single Claude Code session.

**Total Tasks:** 10
**Completed:** 10 (Tasks 1-10) ✅
**Remaining:** 0
**Status:** Sprint 3 Complete

---

## Task 1: Query Pattern Documentation and Index Verification

**Priority:** P0 (Foundation - blocks all new queries)
**Complexity:** Small
**Blocked By:** None
**Blocks:** Task 2

### Description

Establish secure query conventions before adding any string-based filtering. Document patterns in `queries.ts` and verify/document database index requirements.

### Files Involved
- `src/lib/db/queries.ts` — Add header comment documenting query security conventions
- `docs/DATABASE.md` — Add index requirements section

### Acceptance Criteria
- [x] Header comment in `queries.ts` documents: numeric params validated via `parseInt()`, string params use prepared statements or validated enums, never interpolate raw user strings
- [x] `DATABASE.md` lists required indexes including `idx_plays_game_id`
- [x] Existing queries reviewed to confirm they follow documented patterns

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Documentation task. Quick win that unblocks the data layer work. Pre-sprint checklist confirms the index already exists.

---

## Task 2: Play Data Layer (Interface + Query)

**Priority:** P0 (Foundation - blocks all UI work)
**Complexity:** Small
**Blocked By:** Task 1
**Blocks:** Task 3, Task 4, Task 5, Task 6

### Description

Add the `Play` TypeScript interface and `getGamePlays()` query function to fetch play-by-play data for a game.

### Files Involved
- `src/lib/db/queries.ts` — Add `Play` interface and `getGamePlays(gameId: number)` query
- `src/lib/db/index.ts` — Export new query

### Acceptance Criteria
- [x] `Play` interface includes: id, driveNumber, playNumber, period, clockMinutes, clockSeconds, down, distance, yardsGained, playType, playText, ppa, scoring, offense, defense, offenseScore, defenseScore
- [x] `getGamePlays(gameId)` returns plays ordered by `drive_number, play_number`
- [x] Clock semantics documented in comment (time remaining, not elapsed)
- [x] Query handles overtime periods (5, 6, 8)
- [x] TypeScript compiles without errors

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Follows existing `getGameDrives()` pattern. Keep query simple — no filtering yet.

---

## Task 3: PlayList Component with Drive Grouping

**Priority:** P1 (Core feature)
**Complexity:** Medium
**Blocked By:** Task 2
**Blocks:** Task 9

### Description

Create the core play-by-play display component with plays grouped by drive in collapsible sections. Includes basic play type badges.

### Files Involved
- `src/components/game/play-list.tsx` — New component
- `src/components/game/play-badge.tsx` — New component for play type display
- `src/components/game/index.ts` — Barrel export (create file)

### Acceptance Criteria
- [x] Plays displayed grouped by drive with collapsible headers
- [x] Each play shows: down & distance, yard line, result description, yards gained
- [x] Clock formatted as `Q{period} {min}:{sec}` (cap seconds at 59)
- [x] Play type badges with colors per badge mapping in SPRINT_3_PLAN.md
- [x] `tabular-nums` on all numeric displays
- [x] PPA displayed as colored indicator (+green, -red) when available
- [x] Handles overtime periods correctly (Q5+)
- [x] Component accepts `plays: Play[]` prop

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Badge mapping covers 17 categories for 45 play types with "Other" fallback. Use lucide-react icons.

---

## Task 4: Play Filters with URL Persistence

**Priority:** P1 (Core feature)
**Complexity:** Medium
**Blocked By:** Task 2
**Blocks:** Task 5, Task 9

### Description

Create filter bar for play-by-play view with quarter, down, play type, and team filters. Filter state persisted in URL search params.

### Files Involved
- `src/components/game/play-filters.tsx` — New filter bar component
- `src/components/game/index.ts` — Add export

### Acceptance Criteria
- [x] Quarter filter: All | Q1 | Q2 | Q3 | Q4 | OT
- [x] Down filter: All | 1st | 2nd | 3rd | 4th
- [x] Play type filter: All | Run | Pass | Special Teams
- [x] Team filter: Both | Oklahoma Offense | Opponent Offense
- [x] URL params: `?quarter=1|2|3|4|ot&down=1|2|3|4&type=run|pass|special&team=ou|opp`
- [x] Invalid URL param values default gracefully
- [x] Filters apply client-side (acceptable for ~200 plays)

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Use `useSearchParams` from Next.js. Tab state stays local, NOT in URL.

---

## Task 5: Server-Side Play Search

**Priority:** P2 (Enhancement)
**Complexity:** Medium
**Blocked By:** Task 4
**Blocks:** Task 9

### Description

Add search functionality for play text with debounced input and server-side filtering using prepared statements.

### Files Involved
- `src/lib/db/queries.ts` — Extend `getGamePlays` to accept optional search filter
- `src/components/game/play-filters.tsx` — Add search input with debounce

### Acceptance Criteria
- [x] `getGamePlays(gameId, filters?)` supports optional search parameter
- [x] Search uses SQL `ILIKE` with properly escaped user input
- [x] Search input limited to 100 characters
- [x] Input debounced at 300ms
- [x] Search term added to URL: `?search=<string>`
- [x] Matching text highlighted in results (client-side)
- [x] Empty search returns all plays

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Only filter requiring server-side handling. Other filters remain client-side.

---

## Task 6: Drive Chart Visualization

**Priority:** P1 (Core feature)
**Complexity:** Medium
**Blocked By:** Task 2
**Blocks:** Task 7, Task 9

### Description

Create horizontal drive chart showing field position progression. Uses existing `DriveSummary` data.

### Files Involved
- `src/components/game/drive-chart.tsx` — New component
- `src/components/game/index.ts` — Add export
- `src/app/globals.css` — Drive chart styles if needed

### Acceptance Criteria
- [x] Horizontal bar chart with 100-yard field representation
- [x] Each drive as bar showing start → end field position
- [x] Uses `startYardsToGoal` and `endYardsToGoal` (not net yards)
- [x] Color-coded: TD=green-600, FG=yellow-500, Punt=gray-500, INT/Fumble=red-600, Downs=orange-500, End Half=gray-400, Safety=purple-600
- [x] Oklahoma drives distinguished from opponent (darker shade)
- [x] Yard line markers (10, 20, 30, 40, 50, 40, 30, 20, 10)
- [x] End zone labels showing team names
- [x] Hover tooltip with drive details

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Component receives `drives: DriveSummary[]` and team names as props. Does NOT need Play data. Also added `endYardsToGoal` to the `DriveSummary` interface and `getGameDrives` query.

---

## Task 7: Drive Chart Interactivity and Accessibility

**Priority:** P2 (Enhancement)
**Complexity:** Small
**Blocked By:** Task 6
**Blocks:** Task 9

### Description

Add click-to-scroll behavior, keyboard navigation, and reduced motion support to drive chart.

### Files Involved
- `src/components/game/drive-chart.tsx` — Add interactivity

### Acceptance Criteria
- [x] Clicking a drive scrolls to/expands that drive in play-by-play view
- [x] Keyboard navigable (arrow keys, Enter to select)
- [x] `prefers-reduced-motion` respected for hover animations
- [x] Static tooltip on focus for keyboard users
- [x] All information accessible without hover
- [x] Appropriate ARIA labels

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Click-to-scroll requires coordination with PlayList component via ref or callback. Implemented via `onDriveSelect` callback on DriveChart and `scrollToDrive` imperative handle on PlayList.

---

## Task 8: Enhanced Drive Table (Sort + Filter + Export)

**Priority:** P1 (Core feature)
**Complexity:** Medium
**Blocked By:** None (uses existing drive data)
**Blocks:** Task 9

### Description

Enhance existing drive summary table with sortable columns, team filter, and CSV export. Can be developed in parallel with play-by-play work.

### Files Involved
- `src/components/game/drive-table.tsx` — New component (extract from game page)
- `src/components/game/index.ts` — Add export
- `package.json` — Add papaparse dependency

### Acceptance Criteria
- [x] Sortable columns: Drive #, Plays, Yards, Time, Result
- [x] Visual sort indicator (arrow up/down)
- [x] Default sort: drive number ascending
- [x] Team toggle: All | Oklahoma | Opponent
- [x] Filtered view shows aggregate stats
- [x] "Export CSV" button exports visible drives
- [x] CSV uses Papa Parse for encoding/escaping
- [x] UTF-8 with BOM for Excel compatibility
- [x] Filename: `oklahoma-{opponent}-{date}-drives.csv`

### Status: ✅ COMPLETE (2026-01-21)

### Notes
**PARALLEL TRACK** - No dependencies on play data layer. Can be developed alongside Tasks 3-5.

---

## Task 9: Game Page Integration (Tabs + Layout)

**Priority:** P0 (Assembly)
**Complexity:** Medium
**Blocked By:** Task 3, Task 4, Task 6, Task 8
**Blocks:** Task 10

### Description

Integrate all new components into the game detail page with tabbed interface.

### Files Involved
- `src/app/games/[id]/page.tsx` — Major changes

### Acceptance Criteria
- [x] Tabbed interface below scoring: "Drives" | "Play-by-Play"
- [x] Drives tab: Drive chart at top, enhanced drive table below
- [x] Play-by-Play tab: Filter bar at top, play list below
- [x] Tab state local (not in URL)
- [x] Existing scoring by quarter section preserved
- [x] Click on drive chart navigates to drive in play list
- [x] Data fetched with `Promise.all([getGameById, getGameDrives, getGamePlays])`

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Assembly task. All components must be complete first. Created GameTabs client component to handle tab state and drive chart → play list interaction.

---

## Task 10: Loading States, Empty States, and Error Handling

**Priority:** P1 (Polish)
**Complexity:** Small
**Blocked By:** Task 9
**Blocks:** None

### Description

Add progressive loading, skeleton states, and graceful degradation for games with missing data.

### Files Involved
- `src/app/games/[id]/page.tsx` — Add Suspense boundaries
- `src/components/game/play-list.tsx` — Loading skeleton
- `src/components/game/drive-chart.tsx` — Loading skeleton

### Acceptance Criteria
- [x] Skeleton loader for play list
- [x] Skeleton loader for drive chart
- [x] Game + drives load first, plays stream second
- [x] Pre-2014 games show: "Play-by-play data not available for games before 2014"
- [x] Page loads even if plays query fails
- [x] Suspense boundaries used for streaming

### Status: ✅ COMPLETE (2026-01-21)

### Notes
Test with pre-2014 games to verify graceful degradation. Implemented `PlayListSkeleton` and `DriveChartSkeleton` components, refactored game page to use Suspense boundaries with async `PlaysData` component that streams plays after initial game/drives load, added `fetchPlaysWithFallback` for graceful error handling, and `isPrePlayByPlayEra` helper for pre-2014 detection.

---

## Dependency Graph

```
                                 ┌──────────────────────────────────────────────┐
                                 │                                              │
Task 1: Query Docs               │   Task 8: Drive Table (Sort/Filter/Export)   │
      │                          │              (parallel track)                │
      ▼                          └──────────────────────────────────────────────┘
Task 2: Play Data Layer                                │
      │                                                │
      ├─────────────────┬────────────────┐             │
      │                 │                │             │
      ▼                 ▼                ▼             │
Task 3: PlayList   Task 4: Filters   Task 6: DriveChart│
      │                 │                │             │
      │                 ▼                ▼             │
      │            Task 5: Search   Task 7: a11y       │
      │                 │                │             │
      └────────────┬────┴────────────────┴─────────────┘
                   │
                   ▼
          Task 9: Integration
                   │
                   ▼
          Task 10: Loading/Empty States
```

---

## Suggested Session Order

### Session 1: Foundation
- **Task 1:** Query Pattern Documentation (~15 min)
- **Task 2:** Play Data Layer (~30 min)
- **Commit:** Data layer complete

### Session 2: Play-by-Play Core
- **Task 3:** PlayList Component with Badges (~60 min)
- **Commit:** Basic play list renders

### Session 3: Play Filtering
- **Task 4:** Play Filters with URL (~45 min)
- **Task 5:** Server-Side Search (~30 min)
- **Commit:** Filterable, searchable play list

### Session 4: Drive Chart
- **Task 6:** Drive Chart Visualization (~60 min)
- **Task 7:** Drive Chart Interactivity (~30 min)
- **Commit:** Interactive drive chart complete

### Session 5: Drive Table (PARALLEL)
- **Task 8:** Enhanced Drive Table (~60 min)
- **Commit:** Sortable, filterable, exportable drive table
- *Can run in parallel with Sessions 2-4*

### Session 6: Assembly
- **Task 9:** Game Page Integration (~60 min)
- **Commit:** All components integrated

### Session 7: Polish
- **Task 10:** Loading/Empty States (~45 min)
- **Commit:** Sprint 3 complete

---

## Parallel Opportunities

| Track A (Play Data) | Track B (Drive Table) |
|---------------------|----------------------|
| Task 1 + 2 (must go first) | — |
| Task 3 | Task 8 |
| Task 4 + 5 | Task 8 (continued) |
| Task 6 + 7 | — |
| Task 9 + 10 (reunite) | — |

**Task 8** has no dependencies on the play data layer — it uses existing `DriveSummary` data.

---

## Quick Reference: First Session

**Start with Session 1 (Tasks 1 + 2):**

```bash
# Files to modify:
src/lib/db/queries.ts    # Add docs header + Play interface + getGamePlays()
src/lib/db/index.ts      # Export getGamePlays
docs/DATABASE.md         # Add index requirements section
```

**Task 1 acceptance test:** Documentation exists
**Task 2 acceptance test:** `getGamePlays(401628455)` returns ~180 plays for a 2024 game
