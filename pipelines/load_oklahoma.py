"""
Load Oklahoma Sooners historical data into DuckDB.

Usage:
    cd pipelines
    python load_oklahoma.py [--full | --incremental]

Options:
    --full          Load all data from 2014-2024 (default for first run)
    --incremental   Only load current season data
"""

import os
import sys
from pathlib import Path

import dlt
from dotenv import load_dotenv

from sources.cfbd import cfbd_source, games_resource, drives_resource, plays_resource

# Load environment variables
load_dotenv()

# Configuration
TEAM = os.getenv("TARGET_TEAM", "Oklahoma")
START_YEAR = int(os.getenv("START_YEAR", "2014"))
END_YEAR = int(os.getenv("END_YEAR", "2024"))
DUCKDB_PATH = os.getenv("DUCKDB_PATH", "../data/cfb.duckdb")


def get_pipeline() -> dlt.Pipeline:
    """Create dlt pipeline targeting DuckDB."""
    # Ensure data directory exists
    db_path = Path(DUCKDB_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    return dlt.pipeline(
        pipeline_name="cfb_analytics",
        destination=dlt.destinations.duckdb(DUCKDB_PATH),
        dataset_name="main",  # Use 'main' to avoid collision with db filename
    )


def load_full():
    """Load all historical data for Oklahoma."""
    print(f"Loading full history for {TEAM} ({START_YEAR}-{END_YEAR})")

    pipeline = get_pipeline()

    # Load all resources
    source = cfbd_source(team=TEAM, start_year=START_YEAR, end_year=END_YEAR)

    info = pipeline.run(source)
    print(info)


def load_incremental():
    """Load only current season data."""
    import datetime

    current_year = datetime.datetime.now().year
    print(f"Loading incremental data for {TEAM} - {current_year}")

    pipeline = get_pipeline()

    # Only load games, drives, plays for current season
    info = pipeline.run([
        games_resource(team=TEAM, start_year=current_year, end_year=current_year),
        drives_resource(team=TEAM, start_year=current_year, end_year=current_year),
        plays_resource(team=TEAM, start_year=current_year, end_year=current_year),
    ])
    print(info)


def load_games_only():
    """Quick load of just games data (for testing)."""
    print(f"Loading games only for {TEAM} ({START_YEAR}-{END_YEAR})")

    pipeline = get_pipeline()
    info = pipeline.run(games_resource(team=TEAM, start_year=START_YEAR, end_year=END_YEAR))
    print(info)


def main():
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode == "--incremental":
            load_incremental()
        elif mode == "--games-only":
            load_games_only()
        elif mode == "--full":
            load_full()
        else:
            print(f"Unknown option: {mode}")
            print("Usage: python load_oklahoma.py [--full | --incremental | --games-only]")
            sys.exit(1)
    else:
        # Default to full load
        load_full()


if __name__ == "__main__":
    main()
