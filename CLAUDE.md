# Project: cfb-analytics

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Generate Drizzle migrations
npx drizzle-kit generate

# Push Drizzle migrations
npx drizzle-kit push
```

## Project Overview

**Purpose:** College football analytics platform for Oklahoma Sooners fans featuring historical stats, game analysis, recruiting insights, transfer portal tracking, advanced metrics (EPA, success rate), and drive analytics.

**Initial Focus:** University of Oklahoma (expand to national after patterns perfected)

**Tech Stack:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **App Database:** PostgreSQL (Neon) via Drizzle ORM
- **Analytics Database:** DuckDB (local OLAP queries)
- **Data Source:** CFBD API + cfbfastR patterns
- **Deployment:** Vercel

## Project Structure

```
/src
  /app             - Next.js App Router pages
  /components
    /ui            - shadcn/ui components
    /charts        - Data visualization components
    /layout        - Header, sidebar, navigation
  /lib
    /cfbd          - CFBD API client
    /db            - Database clients (Drizzle, DuckDB)
  /types           - TypeScript type definitions
  /data
    /scripts       - Data ingestion scripts
/docs
  SPEC.md          - Full project specification
  SPRINT_PLAN.md   - Sprint-by-sprint development plan
/drizzle           - Generated migrations
/data              - DuckDB database files (gitignored)
```

## Architecture

### Data Flow
1. CFBD API → Ingestion scripts → DuckDB (historical data)
2. User request → API route → DuckDB query → Response
3. App state (saved views, refresh logs) → PostgreSQL

### Key Files
- `src/lib/cfbd/client.ts` - CFBD API client with rate limiting
- `src/lib/db/schema.ts` - PostgreSQL schema (Drizzle)
- `src/lib/db/duckdb.ts` - DuckDB client and schema
- `src/types/cfb.ts` - All CFB-related TypeScript types

## Environment Variables

```bash
# Required
CFBD_API_KEY=         # Get from https://collegefootballdata.com/key
DATABASE_URL=         # Neon PostgreSQL connection string

# Optional
DUCKDB_PATH=./data/cfb.duckdb
```

## Code Standards

### TypeScript
- Strict mode enabled (noImplicitAny, strictNullChecks, etc.)
- No `any` types - use proper typing or `unknown`
- All API responses typed in `src/types/cfb.ts`

### Data Patterns
- Oklahoma team name: "Oklahoma" (CFBD convention)
- Oklahoma team ID: Use CFBD lookup, don't hardcode
- Seasons: 2014-present (play-by-play data availability)

### Error Handling
```typescript
// CFBD API errors
try {
  const games = await client.getGames({ year, team: 'Oklahoma' });
} catch (error) {
  console.error('CFBD API error:', error);
  // Return empty array or show error UI
}
```

## Color Theme

Oklahoma Sooners palette (dark mode default):
- Primary (Crimson): `oklch(0.42 0.16 25)` / `#841617`
- Background: `oklch(0.12 0 0)` / near black
- Foreground (Cream): `oklch(0.98 0.005 90)` / `#FDF9F2`

## Sprint Progress

See [SPRINT_PLAN.md](docs/SPRINT_PLAN.md) for full plan.

**Current:** Sprint 1 - Foundation & Data Pipeline
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Database configuration (PostgreSQL + DuckDB)
- [x] CFBD API client
- [ ] Data ingestion scripts
- [ ] Historical data load (Oklahoma 2014-2024)

## Common Tasks

### Add a new API route
```typescript
// src/app/api/team/[team]/route.ts
import { getCFBDClient } from '@/lib/cfbd';

export async function GET(
  request: Request,
  { params }: { params: { team: string } }
) {
  const client = getCFBDClient();
  const data = await client.getTeam(params.team);
  return Response.json(data);
}
```

### Query DuckDB
```typescript
import { getDuckDB } from '@/lib/db/duckdb';

const db = await getDuckDB();
const conn = await db.connect();
const result = await conn.all(`
  SELECT * FROM games
  WHERE home_team = 'Oklahoma' OR away_team = 'Oklahoma'
  AND season = 2024
`);
conn.close();
```

### Add a shadcn/ui component
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
```

## Notes

- CFBD API has rate limits - client includes 100ms delay between requests
- DuckDB files are gitignored - run ingestion scripts to populate locally
- Dark mode is default (class="dark" on html element)
- All dates from CFBD are UTC - convert for display
