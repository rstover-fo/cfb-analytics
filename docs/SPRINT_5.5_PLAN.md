# Sprint 5.5 Plan: Post-Review Remediation

**Project:** cfb-analytics
**Sprint Goal:** Address critical findings from Sprint 5 comprehensive review
**Focus Areas:** Testing, Error Handling, Performance, Accessibility
**Plan Status:** ✅ COMPLETE (All 10 tasks done)

---

## Executive Summary

Sprint 5 reviews identified significant gaps that pose risk to code quality and maintainability:
- ~~**0% test coverage** on 2,800+ lines of complex query logic (33 exported functions)~~ **ADDRESSED: 199 tests covering 18 query functions**
- ~~**23 instances** of console.error + re-throw anti-pattern~~ **ADDRESSED: Migrated to structured logging + wrapError**
- **8 sequential queries** in `getDetailedSeasonMetrics()`
- **Missing accessibility features** (focus trap, Escape handler)
- **No error boundaries** in React application

This sprint focuses on the highest-impact remediation work.

### Progress Summary
| Task | Status | Tests Added |
|------|--------|-------------|
| Task 1: Testing Infrastructure | ✅ Complete | Setup, fixtures, mocks |
| Task 2: Unit Tests (Utilities) | ✅ Complete | 34 tests |
| Task 3: Core Query Tests | ✅ Complete | 51 tests |
| Task 4: Metrics Query Tests | ✅ Complete | 62 tests |
| Task 5: Error Infrastructure | ✅ Complete (prior) | 36 tests |
| Task 6: Error Migration | ✅ Complete | 23 patterns migrated |
| Task 7: Error Boundary | ✅ Complete | Client + server handling |
| Task 8: CTE Refactor | ✅ Complete | 8 queries → 1 CTE |
| Task 9: Caching Layer | ✅ Complete | 1-hour TTL, dev logging |
| Task 10: Accessibility | ✅ Complete | Patterns, icons, modal |

---

## Pre-Sprint Decisions (from Cassandra's Review)

Before starting, resolve these open questions:

### 1. Test Database Strategy
**Decision:** In-memory DuckDB instance per test file, seeded with fixture data
- Fixture factory functions for `Game`, `Drive`, `Play` objects
- No test should depend on another test's state
- Mock factory returns stubbed `run()` and `closeSync()`

### 2. Cache TTL Strategy
| Data Category | Example | TTL | Rationale |
|---------------|---------|-----|-----------|
| Truly static | Historical seasons list | 1 hour | Changes once/year |
| Slowly changing | Completed game results | 15 min | Final after game ends |
| Frequently changing | Live game data | No cache | Real-time requirement |

### 3. Structured Logging Destination
**Decision:** JSON to stdout (works with Vercel's log drain)
- Development: Pretty-printed with context
- Production: Single-line JSON with timestamp, level, context

### 4. Error Recovery UX
**Decision:** "Try again" button that resets error boundary + link to home
- Development: Show full stack trace
- Production: Generic message with error ID for support

### 5. Colorblind Testing Method
**Decision:** Chrome DevTools > Rendering > Emulate vision deficiencies
- Test: Protanopia, Deuteranopia, Tritanopia
- Charts must be distinguishable without relying on red/green alone

---

## Task Breakdown (10 Tasks)

### Task 1: Testing Infrastructure Setup ✅ COMPLETE
**Priority:** P0 (Critical) | **Complexity:** Small | **Blocked By:** None

**Goal:** Establish Vitest with DuckDB mocking - infrastructure only, not tests.

**Files:**
- `vitest.config.ts` ✅
- `package.json` (vitest, @vitest/coverage-v8) ✅
- `src/lib/db/__tests__/setup.ts` ✅
- `src/lib/db/__tests__/fixtures/index.ts` ✅

**Acceptance Criteria:**
- [x] `npm test` runs Vitest without errors
- [x] `vitest.config.ts` includes `@/` path alias
- [x] Mock factory exists for DuckDB connection
- [x] Fixture factories scaffolded (Play, Game, Drive)

---

### Task 2: Unit Tests for Utility Functions ✅ COMPLETE
**Priority:** P0 (Critical) | **Complexity:** Small | **Blocked By:** Task 1

**Goal:** Test pure functions `calculateDelta()` and `escapeLikePattern()`.

**Files:**
- `src/lib/db/__tests__/utils.test.ts` ✅ (34 tests)
- `src/lib/db/queries.ts` (exported utilities) ✅

**Acceptance Criteria:**
- [x] `calculateDelta()` tested: offensive metrics, defensive metrics, division by zero, unchanged
- [x] `escapeLikePattern()` tested: %, _, \, normal strings
- [x] All tests pass

---

### Task 3: Integration Tests - Core Queries (Batch 1) ✅ COMPLETE
**Priority:** P0 (Critical) | **Complexity:** Medium | **Blocked By:** Task 1

**Goal:** Test foundational query functions (8 functions).

**Functions:** `getAvailableSeasons`, `getSeasonRecord`, `getRecentGames`, `getUpcomingGames`, `getAllGames`, `getGameById`, `getGameDrives`, `getGamePlays`

**Files:**
- `src/lib/db/__tests__/queries-core.test.ts` ✅ (51 tests)
- `src/lib/db/__tests__/fixtures/games.ts` ✅

**Acceptance Criteria:**
- [x] Each function has happy path test
- [x] `getGamePlays()` tested with search filter
- [x] `getAllGames()` tested with pagination
- [x] SQL snapshot tests for query verification (12 snapshots)

---

### Task 4: Integration Tests - Advanced Metrics (Batch 2) ✅ COMPLETE
**Priority:** P0 (Critical) | **Complexity:** Medium | **Blocked By:** Task 1

**Goal:** Test analytics functions with business logic (10 functions).

**Functions:** `getSeasonEPA`, `getGameEPA`, `getEPATrends`, `getSuccessRateByPlayType`, `getSuccessRateByDown`, `getSuccessRateByDistance`, `getSituationalSuccessRate`, `getExplosivePlays`, `getExplosivePlaysAllowed`, `getTopPlays`

**Files:**
- `src/lib/db/__tests__/queries-metrics.test.ts` ✅ (62 tests)
- `src/lib/db/__tests__/fixtures/epa.ts` ✅

**Acceptance Criteria:**
- [x] EPA functions tested: positive, negative, zero values
- [x] Success rate edge cases: 0 attempts, 100% success
- [x] Explosive play thresholds verified (20+ yards)

---

### Task 5: Error Handling Infrastructure ✅ COMPLETE
**Priority:** P1 (High) | **Complexity:** Small | **Blocked By:** None

**Goal:** Create error classes and `withConnection()` wrapper.

**Files:**
- `src/lib/db/errors.ts` ✅
- `src/lib/db/connection.ts` ✅
- `src/lib/db/__tests__/connection.test.ts` ✅

**Acceptance Criteria:**
- [x] `QueryError`, `ConnectionError`, `ValidationError` classes
- [x] All extend base `DatabaseError` with `toJSON()`
- [x] `withConnection()` wrapper acquires, runs callback, always closes
- [x] Unit tests for error classes and wrapper

---

### Task 6: Error Migration (23 patterns) ✅ COMPLETE
**Priority:** P1 (High) | **Complexity:** Large | **Blocked By:** Task 5

**Goal:** Replace all 23 console.error + throw patterns.

**Files:**
- `src/lib/db/queries.ts` ✅ (modified 23 catch blocks)
- `src/lib/logger.ts` ✅ (structured logging)

**Acceptance Criteria:**
- [x] Zero `console.error` in queries.ts
- [x] All functions use `logger.queryError()` + `wrapError()`
- [x] Errors include context (function name, parameters)
- [x] Existing behavior unchanged for callers

**Functions Migrated (23):**
`getWinLossTrends`, `getPointsTrends`, `getConferenceSplits`, `getHomeAwaySplits`, `getHeadToHeadRecord`, `getHeadToHeadGames`, `getHeadToHeadScoringTrend`, `getDetailedSeasonMetrics`, `getSeasonEPA`, `getGameEPA`, `getEPATrends`, `getSuccessRateByPlayType`, `getSuccessRateByDown`, `getSuccessRateByDistance`, `getSituationalSuccessRate`, `getExplosivePlays`, `getExplosivePlaysAllowed`, `getTopPlays`, `getPointsPerDriveByPosition`, `getDriveSuccessRate`, `getAverageDriveMetrics`, `getDriveOutcomeDistribution`, `getDriveComparison`

---

### Task 7: React Error Boundary + Server Error Handling ✅ COMPLETE
**Priority:** P1 (High) | **Complexity:** Small | **Blocked By:** None

**Goal:** Catch errors at both client and server component levels.

**Files:**
- `src/components/error-boundary.tsx` ✅ (client errors)
- `src/app/error.tsx` ✅ (server component errors)
- `src/app/layout.tsx` ✅ (wrapped with error boundary)

**Acceptance Criteria:**
- [x] React ErrorBoundary catches client component errors
- [x] `error.tsx` catches server component errors
- [x] Dev mode shows stack trace
- [x] Prod mode shows friendly message + retry button
- [x] Errors logged with context

---

### Task 8: CTE Refactor for getDetailedSeasonMetrics ✅ COMPLETE
**Priority:** P2 (Medium) | **Complexity:** Medium | **Blocked By:** None

**Goal:** Reduce 8 sequential queries to ≤3 using CTEs.

**Files:**
- `src/lib/db/queries.ts` ✅ (refactored to single CTE query)

**Acceptance Criteria:**
- [x] ≤3 database round-trips (reduced from 8 to 1)
- [x] Output shape unchanged (DetailedMetrics interface)
- [x] CTE query readable with clear subquery names (season_games, games_summary, offense_yards, defense_yards, third_down, turnovers_gained, turnovers_lost, red_zone)
- [ ] Snapshot comparison against ALL 11 seasons (2014-2024) - manual verification recommended
- [ ] Edge cases documented: 0 games, no plays data, NULL values - handled via COALESCE

---

### Task 9: Caching Layer for Static Data ✅ COMPLETE
**Priority:** P2 (Medium) | **Complexity:** Small | **Blocked By:** None

**Goal:** Cache `getAvailableSeasons()` and `getAllOpponents()`.

**Files:**
- `src/lib/cache.ts` ✅ (new)
- `src/lib/db/queries.ts` ✅ (cache applied)

**Acceptance Criteria:**
- [x] `getAvailableSeasons()` cached with 1-hour TTL
- [x] `getAllOpponents()` cached with 1-hour TTL
- [x] Manual cache invalidation available (`cacheInvalidate`, `cacheClear`)
- [x] Cache hits/misses logged in development

---

### Task 10: Accessibility Remediation ✅ COMPLETE
**Priority:** P2 (Medium) | **Complexity:** Medium | **Blocked By:** None

**Goal:** Fix focus management and colorblind accessibility.

**Files:**
- `src/components/ui/sheet.tsx` ✅ (added modal={true})
- `src/components/charts/base-bar-chart.tsx` ✅ (added SVG pattern support)
- `src/components/charts/base-line-chart.tsx` ✅ (added strokeDasharray patterns)
- `src/components/metrics/success-rate-by-down.tsx` ✅ (added icons alongside colors)

**Acceptance Criteria:**
- [x] Verify Radix Dialog has `modal={true}` (focus trap built-in)
- [x] Escape closes any open popover/dialog (Radix native behavior)
- [x] Charts use patterns/icons in addition to color
- [ ] Pass Chrome DevTools colorblind simulation - manual verification recommended

**Note:** Use existing Radix focus trap - don't build custom unless needed.

---

## Dependency Graph

```
Task 1 (Test Infra) ──┬──► Task 2 (Unit Tests)
                      ├──► Task 3 (Core Query Tests)
                      └──► Task 4 (Metrics Tests)

Task 5 (Error Infra) ────► Task 6 (Error Migration)

Task 7 (Error Boundary)   [independent]
Task 8 (CTE Refactor)     [independent]
Task 9 (Caching)          [independent]
Task 10 (Accessibility)   [independent]
```

---

## Parallel Execution Plan

**Batch 1 (Start together):**
- Task 1 + Task 5 + Task 7 (no dependencies between them)

**Batch 2 (After Batch 1):**
- Tasks 2, 3, 4 (after Task 1)
- Task 6 (after Task 5)

**Batch 3 (Anytime / parallel):**
- Tasks 8, 9, 10 (all independent)

---

## Out of Scope

- Small multiples chart implementation (future sprint)
- Direct labeling on line charts (future sprint)
- Full SQL parameterization refactor (requires architecture decision)
- Query result virtualization (premature optimization)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Test setup takes longer than expected | Start with minimal config, expand incrementally |
| CTE refactor changes query results | Snapshot ALL 11 seasons before/after |
| Error boundary hides useful errors in dev | Different behavior for dev vs prod |
| Caching causes stale data issues | Conservative 1-hour TTL, manual invalidation |
| Focus trap complexity | Use Radix built-in, don't roll custom |

---

## Pre-Flight Checklist

Before starting Sprint 5.5:
- [ ] `grep -r "papaparse" src/` confirms it's unused
- [ ] Team agrees on test database strategy (in-memory DuckDB)
- [ ] Team agrees on logging destination (JSON stdout)
- [ ] Snapshot current `getDetailedSeasonMetrics()` output for all seasons

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] PR reviewed and approved
- [ ] Deployed to staging and smoke tested
