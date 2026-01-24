# Performance Baselines

**Date:** 2026-01-23
**Sprint:** 7.0 - Establish Performance Baselines
**Purpose:** Document pre-optimization metrics to measure improvement

---

## Summary

| Metric | Baseline Value | Target | Notes |
|--------|----------------|--------|-------|
| Total Client JS | 1.6 MB | < 1 MB | Recharts is largest (380 KB) |
| Lighthouse Performance (avg) | 93 | 90+ (landing), 80+ (data) | Already meets target |
| Lighthouse Accessibility (avg) | 98 | 95+ | Excellent |
| Lighthouse Best Practices (avg) | 99 | 95+ | Excellent |
| Lighthouse SEO (avg) | 100 | 95+ | Perfect |
| DuckDB Cold Start | ~50-200ms | < 100ms | Server-side Node API |
| Database Size | 17 MB | N/A | cfb.duckdb |

---

## 1. Bundle Analysis

### Build Configuration

- **Framework:** Next.js 16.1.4
- **Build Tool:** Webpack (Turbopack default, analyzer requires webpack)
- **Analyzer:** @next/bundle-analyzer

### Client Bundle Breakdown (2026-01-23, Webpack build)

| Chunk | Size | Contents |
|-------|------|----------|
| `339-*.js` | 380 KB | Recharts (charting library) |
| `4bd1b696-*.js` | 198 KB | Vendor dependencies |
| `framework-*.js` | 190 KB | React framework |
| `794-*.js` | 188 KB | Application code / Radix UI |
| `main-*.js` | 134 KB | Next.js runtime |
| `polyfills-*.js` | 113 KB | Browser polyfills |
| `431-*.js` | 51 KB | Shared components |
| `578-*.js` | 38 KB | Page-specific |
| `301-*.js` | 35 KB | Page-specific |

**Total Static Chunks:** 1.6 MB (uncompressed)

**Reports generated:** `.next/analyze/client.html`, `nodejs.html`, `edge.html`

### Optimization Opportunities

1. **Recharts (371 KB)** - Largest single chunk
   - Consider: dynamic imports, tree-shaking, alternative lighter libraries
   - Charts only used on metrics/trends pages

2. **Polyfills (110 KB)** - May not be needed for modern browsers
   - Review browserlist config
   - Consider conditional loading

3. **Code splitting** - Some pages don't need charting
   - `/roster`, `/recruiting/portal` could skip recharts entirely

### How to Run Bundle Analysis

```bash
# Generate bundle analysis reports
ANALYZE=true npx next build --webpack

# Reports saved to:
# .next/analyze/client.html  (client bundles)
# .next/analyze/nodejs.html  (server bundles)
# .next/analyze/edge.html    (edge functions)
```

---

## 2. Lighthouse Scores (Pre-Optimization)

> **Note:** Run Lighthouse via Chrome DevTools for most reliable results.
> Open DevTools > Lighthouse tab > Generate report

### Instructions to Run

```bash
# Start production server
npm run build && npm start

# Run Lighthouse (in separate terminal)
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-home.html
npx lighthouse http://localhost:3000/games --output html --output-path ./lighthouse-games.html
npx lighthouse http://localhost:3000/recruiting --output html --output-path ./lighthouse-recruiting.html
npx lighthouse http://localhost:3000/metrics --output html --output-path ./lighthouse-metrics.html
npx lighthouse http://localhost:3000/trends --output html --output-path ./lighthouse-trends.html
npx lighthouse http://localhost:3000/roster --output html --output-path ./lighthouse-roster.html
```

### Pages to Test

| Page | Route | Expected Complexity |
|------|-------|---------------------|
| Landing | `/` | Low - static content |
| Games | `/games` | High - data table + filtering |
| Game Detail | `/games/[id]` | High - charts + play data |
| Recruiting | `/recruiting` | Medium - class summary |
| Recruiting History | `/recruiting/history` | Medium - historical charts |
| Transfer Portal | `/recruiting/portal` | Medium - table data |
| Roster | `/roster` | Medium - position groups |
| Metrics | `/metrics` | High - multiple charts |
| Trends | `/trends` | High - time series charts |
| Rivals | `/rivals` | Medium - comparison view |
| Compare | `/compare` | High - dual team data |

### Baseline Scores (2026-01-23)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| `/` | 96 | 100 | 100 | 100 |
| `/games` | 95 | 100 | 100 | 100 |
| `/recruiting` | 92 | 95 | 96 | 100 |
| `/metrics` | 91 | 95 | 100 | 100 |
| `/trends` | 89 | 100 | 100 | 100 |
| `/rivals` | 93 | 100 | 100 | 100 |
| `/roster` | N/A | N/A | N/A | N/A |

> **Note:** `/roster` has a pre-existing server error (digest: 1914187975) that needs investigation.

---

## 3. DuckDB Query Performance

### Database Overview

- **Database:** DuckDB (Node API, server-side)
- **Size:** 17 MB
- **Location:** `data/cfb.duckdb`

### Tables

| Table | Description | Key Indexes |
|-------|-------------|-------------|
| `games` | Game records | `season`, `home_team`, `away_team` |
| `plays` | Play-by-play data | `game_id` |
| `drives` | Drive summaries | `game_id` |
| `recruiting` | Individual recruits | `committed_to`, `(year, committed_to)` |
| `recruiting_classes` | Team class rankings | `year`, `team` |
| `recruiting_position_groups` | Position group stats | `(year, team)` |
| `transfers` | Transfer portal | `season`, `origin`, `destination` |
| `roster` | Team rosters | `(team, season)` |

### Query Patterns to Profile

1. **Games by Season/Team**
   ```sql
   SELECT * FROM games
   WHERE season = ? AND (home_team = ? OR away_team = ?)
   ```

2. **Recruiting Class Summary**
   ```sql
   SELECT year, COUNT(*), AVG(rating), ...
   FROM recruiting
   WHERE committed_to = ?
   GROUP BY year
   ```

3. **Play-by-Play for Game**
   ```sql
   SELECT * FROM plays
   WHERE game_id = ?
   ORDER BY drive_number, play_number
   ```

4. **Transfer Portal Activity**
   ```sql
   SELECT * FROM transfers
   WHERE season = ? AND (origin = ? OR destination = ?)
   ```

### Cold Start Analysis

DuckDB uses the Node API (not WASM), so cold start occurs on:
- First request after Vercel function cold start
- Local dev server startup

**Mitigation strategies:**
- Serverless function warm-up
- Connection pooling
- Lazy initialization with loading state

### How to Profile Queries

```sql
-- Run in DuckDB CLI or add to query code
EXPLAIN ANALYZE SELECT * FROM games WHERE season = 2024;
```

---

## 4. Real User Metrics

### Vercel Analytics (Pending Setup)

Will be configured in Task 7.4.4. Once enabled:

- Core Web Vitals (LCP, FID, CLS)
- Page view tracking
- Geographic distribution
- Device breakdown

### Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| LCP | Largest Contentful Paint | < 2.5s |
| FID | First Input Delay | < 100ms |
| CLS | Cumulative Layout Shift | < 0.1 |
| TTFB | Time to First Byte | < 600ms |

---

## 5. Build Performance

### Current Build Stats

| Metric | Value |
|--------|-------|
| Build Time (Turbopack) | ~1.7s compile |
| Build Time (Webpack) | ~5.3s compile |
| Total Build Output | 271 MB |
| Static Generation | 178.7ms (13 pages) |

### Route Types

- **Static (SSG):** `/_not-found`
- **Dynamic (SSR):** All other pages

---

## 6. Action Items for Optimization

### Immediate (Sprint 7)

- [x] Run Lighthouse on all pages, document baseline scores
- [ ] Profile top 5 slowest DuckDB queries
- [ ] Set up Vercel Analytics (Task 7.4.4)
- [ ] Implement React Query caching (Task 7.1.1-7.1.2)
- [ ] Investigate /roster server error (digest: 1914187975)

### Code Splitting Candidates

- [ ] Recharts - dynamic import on chart pages only
- [ ] Heavy components on non-critical paths

### Caching Strategy

- Historical data: 24 hours stale time
- Recruiting data: 1 hour stale time
- Game schedules: 5 minutes stale time

---

## Appendix: Commands Reference

```bash
# Bundle analysis
ANALYZE=true npx next build --webpack

# Lighthouse CI
npx lighthouse http://localhost:3000 --output html

# DuckDB CLI
duckdb data/cfb.duckdb

# Build production
npm run build

# Start production server
npm start
```

---

*Document will be updated with Lighthouse scores and query profiling results.*
