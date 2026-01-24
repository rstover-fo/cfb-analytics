# Sprint 7: Polish & Performance - Task Breakdown

**Status:** Ready to Start
**Goal:** Production-ready quality and speed
**Estimated Duration:** 7-10 days

---

## Quick Reference

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

## Execution Plan

### Day 1: Foundation + Parallel Start

**Critical Path:**
- [ ] **7.0** Establish Baselines

**Parallel (Track A/B/C):**
- [ ] **7.2.1** Empty States
- [ ] **7.2.3** Offline Indicator
- [ ] **7.4.1** Favicon/OG Images
- [ ] **7.4.3** 404/Error Pages

### Day 2-3: Build on Foundation

**After 7.0:**
- [ ] **7.1.1** React Query Infrastructure

**Parallel:**
- [ ] **7.2.2** Error Boundaries
- [ ] **7.2.4** Missing Data Handling
- [ ] **7.1.4** DuckDB Optimization
- [ ] **7.1.5** Image Optimization

### Day 3-4: UI + Data Freshness

**After 7.1.1:**
- [ ] **7.1.2** Migrate to Query Hooks
- [ ] **7.3.1** Scheduled Refresh

**Parallel:**
- [ ] **7.2.5** API Rate Limiting
- [ ] **7.4.2** SEO Metadata
- [ ] **7.4.4** Analytics

### Day 4-5: Completion

**After 7.1.2:**
- [ ] **7.1.3** Loading Skeletons
- [ ] **7.3.3** Last Updated Timestamps

**After 7.3.1:**
- [ ] **7.3.2** Manual Refresh

**After 7.3.3:**
- [ ] **7.3.4** Stale Indicators

**Final:**
- [ ] **7.1.6** Lighthouse Audit
- [ ] **7.4.5** Design Review
- [ ] **7.5** Production Readiness

---

## Detailed Task Specifications

### Task 7.0: Establish Performance Baselines

**Priority:** P0 — Required before optimization
**Complexity:** Low
**Dependencies:** None

Before optimizing, measure. Without baselines, "optimization" is guessing.

#### Subtasks
- [ ] Run Lighthouse on all main pages, document scores
- [ ] Run bundle analysis with `@next/bundle-analyzer`
- [ ] Profile DuckDB queries, identify top 5 slow queries
- [ ] Document DuckDB WASM cold-start time
- [ ] Set up Vercel Analytics (free tier) for real user metrics
- [ ] Create baseline documentation

#### Files Involved
```
docs/PERFORMANCE_BASELINES.md    (new)
next.config.ts                   (modify — add bundle analyzer)
package.json                     (modify — add analyzer dependency)
```

#### Validation
```bash
npm install @next/bundle-analyzer
ANALYZE=true npm run build
# Document all scores before proceeding
```

---

### Task 7.1.1: React Query Infrastructure

**Priority:** P1
**Complexity:** Low
**Dependencies:** 7.0

#### Subtasks
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `lib/query-client.ts` with defaults (staleTime, gcTime, retry logic)
- [ ] Create `providers/query-provider.tsx` wrapping QueryClientProvider
- [ ] Add QueryProvider to root layout with SSR hydration handling
- [ ] Add ReactQueryDevtools (dev only)
- [ ] Create type-safe query key factory in `lib/query-keys.ts`

#### Files Involved
```
src/lib/query-client.ts           (new)
src/lib/query-keys.ts             (new)
src/providers/query-provider.tsx  (new)
src/app/layout.tsx                (modify)
package.json                      (modify)
```

#### Validation
```bash
npm run dev
# DevTools icon appears in bottom-right corner
# No hydration errors in console
# TypeScript compiles without errors
```

---

### Task 7.1.2: Migrate Data Fetching to React Query Hooks

**Priority:** P1
**Complexity:** Medium
**Dependencies:** 7.1.1

#### Subtasks
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

#### Files Involved
```
src/hooks/queries/*.ts       (new — multiple files)
src/app/**/page.tsx          (modify — each data page)
```

#### Validation
```bash
# Navigate between pages — data persists
# No duplicate requests in Network tab
# DevTools shows cached queries
npm run build
```

---

### Task 7.1.3: Loading Skeleton Components

**Priority:** P1
**Complexity:** Medium
**Dependencies:** 7.1.2

#### Subtasks
- [ ] Create `components/skeletons/table-skeleton.tsx`
- [ ] Create `components/skeletons/card-skeleton.tsx`
- [ ] Create `components/skeletons/chart-skeleton.tsx`
- [ ] Create `components/skeletons/page-skeleton.tsx`
- [ ] Integrate skeletons with React Query `isLoading` states
- [ ] Ensure pulse animation respects `prefers-reduced-motion`
- [ ] Match skeleton dimensions to final content (prevent CLS)

#### Files Involved
```
src/components/skeletons/*.tsx   (new — multiple files)
src/components/skeletons/index.ts (new)
```

#### Validation
```bash
# Throttle network to Slow 3G in DevTools
# Navigate to each page — skeletons appear
# No layout shift (CLS < 0.1)
```

---

### Task 7.1.4: Optimize DuckDB Queries

**Priority:** P1
**Complexity:** Medium
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Audit existing queries in `lib/db/` for performance
- [ ] Create `lib/db/indexes.sql` with index definitions
- [ ] Add indexes on frequently filtered columns (team_id, season, week)
- [ ] Add composite indexes for common JOIN patterns
- [ ] Address DuckDB WASM cold-start:
  - [ ] Add explicit initialization loading state
  - [ ] Consider service worker pre-warming
- [ ] Document query patterns with EXPLAIN ANALYZE

#### Files Involved
```
src/lib/db/indexes.sql       (new)
src/lib/db/queries/*.ts      (modify)
src/lib/db/duckdb.ts         (modify)
```

#### Validation
```bash
# Query times improved vs baseline
# Cold-start has loading indicator
# No regression in functionality
```

---

### Task 7.1.5: Image Optimization

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Audit current logo sources and sizes
- [ ] Create optimized logo set (WebP, multiple sizes)
- [ ] Implement `components/ui/team-logo.tsx` wrapper using next/image
- [ ] Add blur placeholder data URLs
- [ ] Configure image domains in `next.config.ts` if using external
- [ ] Create fallback for missing logos

#### Files Involved
```
public/logos/                    (optimize)
src/components/ui/team-logo.tsx  (new)
next.config.ts                   (modify)
```

#### Validation
```bash
# Lighthouse shows "Properly sized images"
# No CLS from logo loading
```

---

### Task 7.1.6: Lighthouse Audit and Fixes

**Priority:** P1
**Complexity:** Medium
**Dependencies:** Soft — 7.1.3, 7.1.4, 7.1.5

#### Subtasks
- [ ] Run Lighthouse CI on all main pages
- [ ] Fix render-blocking resources
- [ ] Add `font-display: swap` for custom fonts
- [ ] Implement resource hints (preconnect, prefetch)
- [ ] Code split visualization components (dynamic imports)
- [ ] Address flagged accessibility issues
- [ ] Document final scores vs baseline
- [ ] Target: 90+ landing pages, 80+ data-heavy pages

#### Files Involved
```
src/app/layout.tsx               (modify)
src/app/**/page.tsx              (modify as needed)
docs/LIGHTHOUSE_SCORES.md        (new)
```

#### Validation
```bash
npx lighthouse http://localhost:3000 --output html
# Landing pages score >90
# Data pages score >80
# Document exceptions with justification
```

---

### Task 7.2.1: Empty State Components

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Create `components/ui/empty-state.tsx` base component
- [ ] Create contextual empty states:
  - No search results
  - No games scheduled
  - No stats available
  - No recruits found
- [ ] Add helpful CTAs ("Clear filters", "Try different search")
- [ ] Ensure accessible (proper headings, ARIA)

#### Files Involved
```
src/components/ui/empty-state.tsx    (new)
src/components/empty-states/*.tsx    (new)
```

#### Validation
```bash
# Filter to impossible criteria — empty state appears with CTA
```

---

### Task 7.2.2: Error Boundaries with Retry

**Priority:** P1
**Complexity:** Medium
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Enhance existing `components/error-boundary.tsx`
- [ ] Create `components/ui/error-fallback.tsx` UI component
- [ ] Implement retry with exponential backoff
- [ ] Create page-level error boundaries (`app/**/error.tsx`)
- [ ] Create component-level boundaries for independent widgets
- [ ] Add error logging (console dev, service prod)

#### Files Involved
```
src/components/error-boundary.tsx    (modify)
src/components/ui/error-fallback.tsx (new)
src/app/**/error.tsx                 (new — multiple)
src/lib/error-logging.ts             (new)
```

#### Validation
```bash
# Trigger error — boundary catches it
# Retry works
# Error logged
```

---

### Task 7.2.3: Offline Indicator

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Create `hooks/use-online-status.ts` hook
- [ ] Create `components/ui/offline-banner.tsx` component
- [ ] Add banner to root layout (appears when offline)
- [ ] Add `aria-live` for screen reader announcement
- [ ] Style as non-intrusive but visible

#### Files Involved
```
src/hooks/use-online-status.ts       (new)
src/components/ui/offline-banner.tsx (new)
src/app/layout.tsx                   (modify)
```

#### Validation
```bash
# Toggle offline in DevTools — banner appears within 1s
# Dismisses when online
```

---

### Task 7.2.4: Handle Missing Data Gracefully

**Priority:** P1
**Complexity:** Medium
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Audit components for potential null/undefined access
- [ ] Create `lib/data-utils.ts` with safe accessor helpers
- [ ] Add fallback values for all data displays
- [ ] Implement "Data unavailable" micro-states
- [ ] Test with partial/malformed API responses

#### Files Involved
```
src/lib/data-utils.ts        (new)
src/components/**/*.tsx      (modify — add null checks)
```

#### Validation
```bash
# Mock partial data — no crashes
# Fallback text appears
# No "undefined" visible
```

---

### Task 7.2.5: CFBD API Rate Limiting

**Priority:** P1
**Complexity:** Medium
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Implement request queue with rate limiting
- [ ] Add 429 response handling with exponential backoff
- [ ] Display user-friendly message when rate limited
- [ ] Log rate limit events for monitoring
- [ ] Consider request batching where possible

#### Files Involved
```
src/lib/cfbd/rate-limiter.ts (new)
src/lib/cfbd/client.ts       (modify)
```

#### Validation
```bash
# Simulate 429 response — graceful degradation
# User sees message
```

---

### Task 7.3.1: Scheduled Data Refresh

**Priority:** P1
**Complexity:** Medium
**Dependencies:** 7.1.1

#### Subtasks
- [ ] Create `app/api/cron/refresh/route.ts` API endpoint
- [ ] Add `CRON_SECRET` environment variable for security
- [ ] Configure `vercel.json` with cron schedule
- [ ] Implement incremental refresh logic (not full reload)
- [ ] Store last refresh timestamp in PostgreSQL
- [ ] Add logging for refresh operations
- [ ] Coordinate React Query cache invalidation

#### Files Involved
```
src/app/api/cron/refresh/route.ts  (new)
vercel.json                        (new or modify)
src/lib/db/refresh.ts              (new)
.env.local                         (modify)
```

#### Validation
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/refresh
# Returns 200 with success
# Database shows updated timestamp
```

**Note:** Vercel cron requires Pro tier for <1/day frequency.

---

### Task 7.3.2: Manual Refresh Button (Admin)

**Priority:** P1
**Complexity:** Medium
**Dependencies:** 7.3.1

#### Subtasks
- [ ] Create `app/api/admin/refresh/route.ts` protected endpoint
- [ ] Add admin authentication check
- [ ] Create `components/admin/refresh-button.tsx` component
- [ ] Show refresh status (idle, refreshing, success, error)
- [ ] Implement React Query cache invalidation on success
- [ ] Add rate limiting to prevent abuse

#### Files Involved
```
src/app/api/admin/refresh/route.ts    (new)
src/components/admin/refresh-button.tsx (new)
src/app/admin/page.tsx                (new)
```

#### Validation
```bash
# Non-admin gets 401
# Admin can trigger refresh
# UI shows loading state
```

---

### Task 7.3.3: "Last Updated" Timestamps

**Priority:** P1
**Complexity:** Low
**Dependencies:** 7.1.2

#### Subtasks
- [ ] Create `components/ui/last-updated.tsx` component
- [ ] Store update timestamps per data type in PostgreSQL
- [ ] Create `hooks/queries/use-last-updated.ts` query hook
- [ ] Add relative time formatting ("5 minutes ago")
- [ ] Add tooltip with absolute timestamp (user timezone)
- [ ] Place on each data page in consistent location

#### Files Involved
```
src/components/ui/last-updated.tsx       (new)
src/hooks/queries/use-last-updated.ts    (new)
src/lib/db/timestamps.ts                 (new)
src/app/**/page.tsx                      (modify)
```

#### Validation
```bash
# Each page shows "Last updated: X ago"
# Tooltip shows full datetime
```

---

### Task 7.3.4: Stale Data Indicators

**Priority:** P1
**Complexity:** Low
**Dependencies:** 7.3.3

#### Subtasks
- [ ] Define staleness thresholds per data type in `lib/freshness-config.ts`
- [ ] Create `components/ui/stale-indicator.tsx` component
- [ ] Create `hooks/use-data-freshness.ts` hook
- [ ] Add subtle visual indicator for stale data (badge/icon)
- [ ] Add tooltip explaining staleness
- [ ] Integrate with React Query's `dataUpdatedAt`

#### Files Involved
```
src/lib/freshness-config.ts          (new)
src/components/ui/stale-indicator.tsx (new)
src/hooks/use-data-freshness.ts      (new)
```

#### Validation
```bash
# Data older than threshold shows indicator
# Fresh data shows none
```

---

### Task 7.4.1: Favicon and OG Images

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Design favicon (16, 32, 180, 192, 512 sizes)
- [ ] Generate `favicon.ico` and PNG variants
- [ ] Create `apple-touch-icon.png`
- [ ] Design OG image template (1200x630)
- [ ] Add to `app/layout.tsx` metadata
- [ ] Test with social media debuggers

#### Files Involved
```
public/favicon.ico           (new)
public/favicon-*.png         (new)
public/apple-touch-icon.png  (new)
public/og-image.png          (new)
src/app/layout.tsx           (modify)
```

#### Validation
```bash
# Browser tab shows favicon
# Share on Twitter/Slack shows OG image
# Test: https://cards-dev.twitter.com/validator
```

---

### Task 7.4.2: SEO Metadata

**Priority:** P1
**Complexity:** Medium
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Create `lib/seo.ts` with metadata generation helpers
- [ ] Add unique titles and descriptions per page
- [ ] Implement canonical URLs
- [ ] Add JSON-LD structured data (Organization, SportsEvent)
- [ ] Create `app/sitemap.ts` for auto-generated sitemap
- [ ] Create `app/robots.ts` for robots.txt

#### Files Involved
```
src/lib/seo.ts           (new)
src/app/layout.tsx       (modify)
src/app/**/page.tsx      (modify)
src/app/sitemap.ts       (new)
src/app/robots.ts        (new)
```

#### Validation
```bash
# Each page has unique title/description
# /sitemap.xml returns valid sitemap
# Lighthouse SEO >90
```

---

### Task 7.4.3: Style 404 and Error Pages

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Design 404 page (on-brand, helpful)
- [ ] Create `app/not-found.tsx`
- [ ] Add navigation links on 404
- [ ] Create `app/global-error.tsx` (root boundary)

#### Files Involved
```
src/app/not-found.tsx      (new)
src/app/global-error.tsx   (new)
```

#### Validation
```bash
# Navigate to /asdfasdf — 404 appears with nav home
```

---

### Task 7.4.4: Analytics Integration

**Priority:** P1
**Complexity:** Low
**Dependencies:** None (parallel)

#### Subtasks
- [ ] Install `@vercel/analytics`
- [ ] Add Analytics component to root layout
- [ ] Configure Web Vitals tracking
- [ ] Verify data appears in Vercel dashboard

#### Files Involved
```
package.json             (modify)
src/app/layout.tsx       (modify)
```

#### Validation
```bash
npm install @vercel/analytics
# Deploy, visit site
# Check Vercel Analytics — data appears
```

---

### Task 7.4.5: Final Design Review

**Priority:** P1
**Complexity:** High
**Dependencies:** All 7.x tasks

#### Subtasks
- [ ] Run `/rams` review on all main pages
- [ ] Document findings in `docs/DESIGN_REVIEW.md`
- [ ] Address critical accessibility issues
- [ ] Address major visual inconsistencies
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verification
- [ ] Keyboard navigation regression test

#### Files Involved
```
docs/DESIGN_REVIEW.md        (new)
src/components/**/*.tsx      (modify as needed)
```

#### Validation
```bash
# All /rams issues addressed
# WCAG 2.1 AA compliant
# Works on mobile
```

---

### Task 7.5: Production Readiness

**Priority:** P1
**Complexity:** Low
**Dependencies:** 7.4.5

Final checklist before launch:

#### Subtasks
- [ ] All environment variables documented in `docs/DEPLOYMENT.md`
- [ ] Deployment runbook exists
- [ ] Rollback procedure documented and tested
- [ ] Compare final metrics to baselines (document improvement)
- [ ] Monitoring dashboards reviewed

#### Files Involved
```
docs/DEPLOYMENT.md           (new)
docs/PERFORMANCE_FINAL.md    (new)
```

#### Validation
```bash
# All documentation complete
# Can deploy and rollback confidently
```

---

## Acceptance Criteria

After all tasks complete:

1. [ ] Lighthouse scores improved vs baseline (documented)
2. [ ] All pages load with skeletons, no layout shift
3. [ ] Error boundaries catch failures gracefully
4. [ ] Offline indicator works
5. [ ] Data freshness visible on all pages
6. [ ] Scheduled refresh running (or manual fallback documented)
7. [ ] SEO metadata and OG images validated
8. [ ] Final design review passed
9. [ ] Production readiness checklist complete

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DuckDB WASM cold start | High | High | Explicit loading state, service worker pre-warming |
| React Query + SSR hydration mismatch | Medium | High | Test hydration, use initialData carefully |
| Vercel cron tier limitations | High (hobby) | Medium | Document tier requirements, manual refresh fallback |
| Lighthouse 90+ unrealistic with DuckDB | Medium | Low | 80+ target for data pages, document exceptions |
| CFBD API rate limits (1000/month free) | Medium | Medium | Caching, rate limiting, backoff |
