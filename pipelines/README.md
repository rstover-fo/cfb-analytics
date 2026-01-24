# CFB Analytics Data Pipelines

Data ingestion pipelines using [dlt](https://dlthub.com/) to load College Football Data API data into DuckDB.

## Setup

```bash
cd pipelines

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -e ".[dev]"
```

## Configuration

Copy `.env.example` to `.env` and set your CFBD API key:

```bash
CFBD_API_KEY=your_api_key_here
TARGET_TEAM=Oklahoma
START_YEAR=2014
END_YEAR=2024
DUCKDB_PATH=../data/cfb.duckdb
```

## Usage

### Full Historical Load

Load all Oklahoma data from 2014-2024:

```bash
python load_oklahoma.py --full
```

This loads:
- Games (scores, attendance, ELO ratings)
- Drives (drive summaries with results)
- Plays (play-by-play with PPA)
- Recruiting (commits with ratings)
- Transfers (portal activity since 2021)

### Incremental Load

Load only current season data:

```bash
python load_oklahoma.py --incremental
```

### Games Only (Quick Test)

Load just games data to verify setup:

```bash
python load_oklahoma.py --games-only
```

## Data Sources

All data sourced from [College Football Data API](https://collegefootballdata.com/):

| Resource | Description | Primary Key |
|----------|-------------|-------------|
| `games` | Game results, scores, ELO | `id` |
| `drives` | Drive summaries | `id` |
| `plays` | Play-by-play with PPA | `id` |
| `recruiting` | Recruiting commits | `id` |
| `transfers` | Transfer portal | composite |

## Pipeline Architecture

```
CFBD API
    │
    ▼
dlt Source (sources/cfbd.py)
    │
    ├── games_resource
    ├── drives_resource
    ├── plays_resource
    ├── recruiting_resource
    └── transfers_resource
    │
    ▼
DuckDB (../data/cfb.duckdb)
    │
    ▼
Next.js App (queries via DuckDB client)
```

## Extending to Other Teams

To load data for a different team, modify `.env`:

```bash
TARGET_TEAM=Texas
```

Or call the source directly:

```python
from sources.cfbd import cfbd_source

source = cfbd_source(team="Texas", start_year=2020, end_year=2024)
pipeline.run(source)
```

## Scheduling

For production, schedule `load_oklahoma.py --incremental` to run:
- During season: After each game day (Sundays)
- Off-season: Weekly for recruiting/portal updates

Options:
- Vercel Cron (if integrated with app)
- GitHub Actions scheduled workflow
- Local cron job
