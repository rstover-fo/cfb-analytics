# Sprint 5 Data Audit: EPA/PPA Availability

**Date:** 2026-01-22
**Scope:** Oklahoma Sooners (2001-2025)
**Status:** GO

---

## Executive Summary

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| **Scrimmage Play PPA Coverage** | 98.5% | 90% | **PASS** |
| Overall PPA Coverage | 74.2% | N/A | Expected (special teams excluded) |
| Total Plays | 59,025 | - | - |
| Scrimmage Plays | 36,719 | - | - |

**Decision: GO** - Proceed with Sprint 5 EPA-based features.

---

## Key Findings

### 1. PPA Data is Available for Scrimmage Plays

The `ppa` column in the plays table has **98.5% coverage for scrimmage plays** (rush + pass) across all 25 seasons. This is the data we need for EPA analytics.

The lower overall coverage (~74%) is expected because:
- Kickoffs, punts, and other special teams plays don't have PPA values
- Penalties, timeouts, and administrative plays don't have PPA values
- This is correct CFBD behavior

### 2. Schema Clarification

The actual schema differs slightly from the Sprint 5 planning assumptions:

| Column | Documented | Actual |
|--------|------------|--------|
| `ppa` | | Available |
| `epa` | Expected | **Not present** |
| `success` | Expected | **Not present** |

**Implication:** Use `ppa` as the sole EPA metric. Calculate success as `ppa > 0`.

### 3. Coverage by Season (Scrimmage Plays Only)

| Season | Scrimmage Plays | Has PPA | Coverage |
|--------|-----------------|---------|----------|
| 2001 | 1,055 | 1,032 | 97.8% |
| 2002 | 91 | 90 | 98.9% |
| 2003 | 1,243 | 1,205 | 96.9% |
| 2004 | 1,169 | 1,138 | 97.3% |
| 2005 | 840 | 801 | 95.4% |
| 2006 | 1,287 | 1,251 | 97.2% |
| 2007 | 1,331 | 1,277 | 95.9% |
| 2008 | 1,429 | 1,366 | 95.6% |
| 2009 | 1,300 | 1,273 | 97.9% |
| 2010 | 1,496 | 1,459 | 97.5% |
| 2011 | 1,346 | 1,300 | 96.6% |
| 2012 | 1,289 | 1,228 | 95.3% |
| 2013 | 1,263 | 1,225 | 97.0% |
| 2014 | 1,879 | 1,879 | 100.0% |
| 2015 | 1,981 | 1,979 | 99.9% |
| 2016 | 1,893 | 1,890 | 99.8% |
| 2017 | 1,898 | 1,894 | 99.8% |
| 2018 | 1,943 | 1,937 | 99.7% |
| 2019 | 1,797 | 1,793 | 99.8% |
| 2020 | 1,365 | 1,363 | 99.9% |
| 2021 | 1,744 | 1,720 | 98.6% |
| 2022 | 1,908 | 1,905 | 99.8% |
| 2023 | 1,827 | 1,823 | 99.8% |
| 2024 | 1,680 | 1,675 | 99.7% |
| 2025 | 1,665 | 1,664 | 99.9% |
| **Total** | **36,719** | **36,167** | **98.5%** |

**Notes:**
- 2002 has very few plays (91) — likely incomplete game data for that season
- Pre-2014 seasons have slightly lower coverage (95-98%) vs post-2014 (99%+)
- All seasons exceed the 90% threshold for scrimmage plays

### 4. Play Type Inventory

45 distinct play types found (expanded from 31 in initial 2014-2024 audit).

**Scrimmage (Rush):**
- Rush (21,184)
- Rushing Touchdown (574)
- Two Point Rush (1)

**Scrimmage (Pass):**
- Pass Incompletion (7,415)
- Pass Completion (5,877)
- Pass Reception (5,613)
- Pass (847)
- Passing Touchdown (631)
- Sack (1,122)
- Pass Interception (303)
- Pass Interception Return (180)
- Interception (37)
- Two Point Pass (4)

**Special Teams:**
- Kickoff (2,978)
- Punt (2,873)
- Extra Point Good (1,032)
- Field Goal Good (772)
- Kickoff Return (Offense) (549)
- Punt Return (301)
- Field Goal Missed (185)
- Extra Point Missed (61)
- Blocked Punt (12)
- Blocked Field Goal (12)
- Kickoff Return Touchdown (8)
- Punt Return Touchdown (7)
- 2pt Conversion (7)
- Blocked PAT (3)
- Blocked Punt Touchdown (1)
- Missed Field Goal Return Touchdown (1)
- Kickoff Return (Defense) (1)

**Penalty/Administrative:**
- Penalty (3,081)
- Timeout (2,064)
- End Period (492)
- End of Half (144)
- End of Game (139)
- Start of Period (97)
- End of Regulation (5)
- Uncategorized (8)

**Turnovers/Scores:**
- Fumble Recovery (Opponent) (164)
- Fumble Recovery (Own) (159)
- Interception Return Touchdown (33)
- Safety (25)
- Fumble Return Touchdown (17)
- Fumble (3)
- Defensive 2pt Conversion (3)

### 5. PPA Value Distribution

| Range | Count | % of Total |
|-------|-------|------------|
| NULL | 15,237 | 25.8% |
| < -2.0 | 839 | 1.4% |
| -2.0 to -1.0 | 3,877 | 6.6% |
| -1.0 to 0.0 | 20,392 | 34.5% |
| 0.0 to 1.0 | 10,026 | 17.0% |
| 1.0 to 2.0 | 5,098 | 8.6% |
| >= 2.0 | 3,556 | 6.0% |

Distribution appears reasonable:
- Slightly negative skew (more plays 0 to -1 than 0 to +1) — expected in football
- ~14% of plays are highly positive (>1.0 PPA) — big plays
- ~8% of plays are highly negative (<-1.0 PPA) — bad plays

---

## Implementation Notes

### Task 5.1a Updates

The play type mapping needs to handle 45 types (not 31). Key additions from full dataset:
- `Pass Completion` (older seasons use this instead of `Pass Reception`)
- `Pass` (generic pass play)
- `Pass Interception` (distinct from `Pass Interception Return`)
- `Extra Point Good/Missed`
- `Punt Return`, `Punt Return Touchdown`
- `2pt Conversion`, `Two Point Pass`, `Two Point Rush`
- `Blocked PAT`
- `Fumble` (distinct from recovery)
- `Start of Period`
- `Kickoff Return (Defense)`

**Recommended mapping update:**
```typescript
// Rush plays
'Rush', 'Rushing Touchdown', 'Two Point Rush'

// Pass plays
'Pass Reception', 'Pass Completion', 'Pass', 'Pass Incompletion',
'Passing Touchdown', 'Sack', 'Pass Interception', 'Pass Interception Return',
'Interception', 'Two Point Pass'
```

### Task 5.2a Updates

Success calculation must use PPA only:
```typescript
// No separate success column exists
const isSuccess = play.ppa !== null && play.ppa > 0;
```

### EPA Display

- Surface `ppa` values as "EPA" in UI (more recognizable term)
- Add tooltip: "Expected Points Added, calculated using CFBD's Predicted Points model"

### Data Quality Notes

- **2002 season**: Only 91 scrimmage plays — likely incomplete. Consider flagging in UI or excluding from trend calculations.
- **Pre-2014**: Slightly lower PPA coverage (95-98%) — acceptable but worth noting in tooltips for those seasons.

---

## Audit Script

The audit was performed using:
```bash
npx tsx scripts/audit-epa-data.ts
```

Script location: `scripts/audit-epa-data.ts`

---

## Appendix: Raw Audit Output

```
======================================================================
Sprint 5.0: EPA/PPA Data Availability Audit
Oklahoma Sooners (2001-2025)
======================================================================

1. EPA/PPA/Success Coverage by Season
----------------------------------------------------------------------
Season | Total Plays | Has PPA | PPA %  | Status
-------------------------------------------------------
2001   |        2199 |    1534 |  69.8% | LOW
2002   |         186 |     136 |  73.1% | LOW
2003   |        2535 |    1782 |  70.3% | LOW
...
2024   |        2271 |    1709 |  75.3% | LOW
2025   |        2337 |    1711 |  73.2% | LOW
-------------------------------------------------------
TOTAL  |       59025 |   43788 |  74.2%

4. Scrimmage Play Coverage (Rush + Pass only)
----------------------------------------------------------------------
Season | Scrimmage Plays | Has PPA | PPA %
--------------------------------------------------
TOTAL  |           36719 |   36167 |  98.5%

GO/NO-GO DECISION: GO
Scrimmage play PPA coverage is 98.5% (threshold: 90%)
```
