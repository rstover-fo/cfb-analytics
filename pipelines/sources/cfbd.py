"""
CFBD API Source for dlt

College Football Data API source with resources for:
- Games
- Plays
- Drives
- Recruiting
- Transfer Portal
- Advanced Stats
"""

import os
from typing import Iterator

import dlt
import requests
from dlt.sources import DltResource

BASE_URL = "https://api.collegefootballdata.com"


def get_api_key() -> str:
    """Get CFBD API key from environment."""
    api_key = os.getenv("CFBD_API_KEY")
    if not api_key:
        raise ValueError("CFBD_API_KEY environment variable not set")
    return api_key


def make_request(endpoint: str, params: dict | None = None) -> list[dict]:
    """Make authenticated request to CFBD API."""
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Accept": "application/json",
    }
    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


@dlt.source(name="cfbd")
def cfbd_source(
    team: str = "Oklahoma",
    start_year: int = 2001,
    end_year: int = 2025,
):
    """
    CFBD data source for a specific team.

    Args:
        team: Team name (e.g., "Oklahoma")
        start_year: First season to load
        end_year: Last season to load
    """
    return [
        games_resource(team, start_year, end_year),
        drives_resource(team, start_year, end_year),
        plays_resource(team, start_year, end_year),
        recruiting_resource(team, start_year, end_year),
        transfers_resource(start_year, end_year),
    ]


@dlt.resource(name="games", write_disposition="merge", primary_key="id")
def games_resource(
    team: str = "Oklahoma",
    start_year: int = 2001,
    end_year: int = 2025,
) -> Iterator[dict]:
    """Load games for a team across multiple seasons."""
    for year in range(start_year, end_year + 1):
        print(f"Loading games for {team} - {year}")
        games = make_request("/games", {"year": year, "team": team})
        for game in games:
            # Flatten the response for DuckDB
            yield {
                "id": game["id"],
                "season": game["season"],
                "week": game["week"],
                "season_type": game.get("seasonType"),
                "start_date": game.get("startDate"),
                "completed": game.get("completed"),
                "neutral_site": game.get("neutralSite"),
                "conference_game": game.get("conferenceGame"),
                "attendance": game.get("attendance"),
                "venue_id": game.get("venueId"),
                "venue": game.get("venue"),
                "home_id": game.get("homeId"),
                "home_team": game.get("homeTeam"),
                "home_conference": game.get("homeConference"),
                "home_points": game.get("homePoints"),
                "home_line_scores": game.get("homeLineScores"),
                "home_postgame_win_prob": game.get("homePostgameWinProbability"),
                "home_pregame_elo": game.get("homePregameElo"),
                "home_postgame_elo": game.get("homePostgameElo"),
                "away_id": game.get("awayId"),
                "away_team": game.get("awayTeam"),
                "away_conference": game.get("awayConference"),
                "away_points": game.get("awayPoints"),
                "away_line_scores": game.get("awayLineScores"),
                "away_postgame_win_prob": game.get("awayPostgameWinProbability"),
                "away_pregame_elo": game.get("awayPregameElo"),
                "away_postgame_elo": game.get("awayPostgameElo"),
                "excitement_index": game.get("excitementIndex"),
            }


@dlt.resource(name="drives", write_disposition="merge", primary_key="id")
def drives_resource(
    team: str = "Oklahoma",
    start_year: int = 2001,
    end_year: int = 2025,
) -> Iterator[dict]:
    """Load drive data for a team across multiple seasons."""
    for year in range(start_year, end_year + 1):
        print(f"Loading drives for {team} - {year}")
        drives = make_request("/drives", {"year": year, "team": team})
        for drive in drives:
            yield {
                "id": drive.get("id"),
                "game_id": drive.get("gameId"),
                "offense": drive.get("offense"),
                "offense_conference": drive.get("offenseConference"),
                "defense": drive.get("defense"),
                "defense_conference": drive.get("defenseConference"),
                "drive_number": drive.get("driveNumber"),
                "scoring": drive.get("scoring"),
                "start_period": drive.get("startPeriod"),
                "start_yardline": drive.get("startYardline"),
                "start_yards_to_goal": drive.get("startYardsToGoal"),
                "start_time_minutes": drive.get("startTime", {}).get("minutes") if drive.get("startTime") else None,
                "start_time_seconds": drive.get("startTime", {}).get("seconds") if drive.get("startTime") else None,
                "end_period": drive.get("endPeriod"),
                "end_yardline": drive.get("endYardline"),
                "end_yards_to_goal": drive.get("endYardsToGoal"),
                "end_time_minutes": drive.get("endTime", {}).get("minutes") if drive.get("endTime") else None,
                "end_time_seconds": drive.get("endTime", {}).get("seconds") if drive.get("endTime") else None,
                "plays": drive.get("plays"),
                "yards": drive.get("yards"),
                "drive_result": drive.get("driveResult"),
                "is_home_offense": drive.get("isHomeOffense"),
                "elapsed_minutes": drive.get("elapsed", {}).get("minutes") if drive.get("elapsed") else None,
                "elapsed_seconds": drive.get("elapsed", {}).get("seconds") if drive.get("elapsed") else None,
            }


@dlt.resource(name="plays", write_disposition="merge", primary_key="id")
def plays_resource(
    team: str = "Oklahoma",
    start_year: int = 2001,
    end_year: int = 2025,
) -> Iterator[dict]:
    """Load play-by-play data for a team across multiple seasons."""
    for year in range(start_year, end_year + 1):
        print(f"Loading plays for {team} - {year}")
        # CFBD requires week parameter for plays, so we iterate through weeks
        for week in range(1, 16):  # Regular season weeks
            try:
                plays = make_request("/plays", {"year": year, "week": week, "team": team})
                for play in plays:
                    yield {
                        "id": play.get("id"),
                        "game_id": play.get("gameId"),
                        "drive_id": play.get("driveId"),
                        "drive_number": play.get("driveNumber"),
                        "play_number": play.get("playNumber"),
                        "offense": play.get("offense"),
                        "offense_conference": play.get("offenseConference"),
                        "defense": play.get("defense"),
                        "defense_conference": play.get("defenseConference"),
                        "home": play.get("home"),
                        "away": play.get("away"),
                        "offense_score": play.get("offenseScore"),
                        "defense_score": play.get("defenseScore"),
                        "period": play.get("period"),
                        "clock_minutes": play.get("clock", {}).get("minutes") if play.get("clock") else None,
                        "clock_seconds": play.get("clock", {}).get("seconds") if play.get("clock") else None,
                        "yard_line": play.get("yardLine"),
                        "down": play.get("down"),
                        "distance": play.get("distance"),
                        "yards_gained": play.get("yardsGained"),
                        "play_type": play.get("playType"),
                        "play_text": play.get("playText"),
                        "ppa": play.get("ppa"),
                        "scoring": play.get("scoring"),
                        "wallclock": play.get("wallclock"),
                    }
            except requests.exceptions.HTTPError:
                # Some weeks may not have data (bye weeks, etc.)
                continue

        # Also load postseason
        try:
            plays = make_request("/plays", {"year": year, "seasonType": "postseason", "team": team})
            for play in plays:
                yield {
                    "id": play.get("id"),
                    "game_id": play.get("gameId"),
                    "drive_id": play.get("driveId"),
                    "drive_number": play.get("driveNumber"),
                    "play_number": play.get("playNumber"),
                    "offense": play.get("offense"),
                    "offense_conference": play.get("offenseConference"),
                    "defense": play.get("defense"),
                    "defense_conference": play.get("defenseConference"),
                    "home": play.get("home"),
                    "away": play.get("away"),
                    "offense_score": play.get("offenseScore"),
                    "defense_score": play.get("defenseScore"),
                    "period": play.get("period"),
                    "clock_minutes": play.get("clock", {}).get("minutes") if play.get("clock") else None,
                    "clock_seconds": play.get("clock", {}).get("seconds") if play.get("clock") else None,
                    "yard_line": play.get("yardLine"),
                    "down": play.get("down"),
                    "distance": play.get("distance"),
                    "yards_gained": play.get("yardsGained"),
                    "play_type": play.get("playType"),
                    "play_text": play.get("playText"),
                    "ppa": play.get("ppa"),
                    "scoring": play.get("scoring"),
                    "wallclock": play.get("wallclock"),
                }
        except requests.exceptions.HTTPError:
            continue


@dlt.resource(name="recruiting", write_disposition="merge", primary_key="id")
def recruiting_resource(
    team: str = "Oklahoma",
    start_year: int = 2001,
    end_year: int = 2025,
) -> Iterator[dict]:
    """Load recruiting data for a team across multiple years."""
    for year in range(start_year, end_year + 1):
        print(f"Loading recruiting for {team} - {year}")
        try:
            recruits = make_request("/recruiting/players", {"year": year, "team": team})
            for recruit in recruits:
                yield {
                    "id": recruit.get("id"),
                    "athlete_id": recruit.get("athleteId"),
                    "recruit_type": recruit.get("recruitType"),
                    "year": recruit.get("year"),
                    "ranking": recruit.get("ranking"),
                    "name": recruit.get("name"),
                    "school": recruit.get("school"),
                    "committed_to": recruit.get("committedTo"),
                    "position": recruit.get("position"),
                    "height": recruit.get("height"),
                    "weight": recruit.get("weight"),
                    "stars": recruit.get("stars"),
                    "rating": recruit.get("rating"),
                    "city": recruit.get("city"),
                    "state_province": recruit.get("stateProvince"),
                    "country": recruit.get("country"),
                }
        except requests.exceptions.HTTPError:
            continue


@dlt.resource(name="transfers", write_disposition="merge", primary_key=["season", "first_name", "last_name", "origin"])
def transfers_resource(
    start_year: int = 2021,  # Transfer portal tracking started ~2021
    end_year: int = 2025,
) -> Iterator[dict]:
    """Load transfer portal data."""
    for year in range(max(start_year, 2021), end_year + 1):
        print(f"Loading transfers - {year}")
        try:
            transfers = make_request("/player/portal", {"year": year})
            for transfer in transfers:
                yield {
                    "season": transfer.get("season"),
                    "first_name": transfer.get("firstName"),
                    "last_name": transfer.get("lastName"),
                    "position": transfer.get("position"),
                    "origin": transfer.get("origin"),
                    "destination": transfer.get("destination"),
                    "transfer_date": transfer.get("transferDate"),
                    "rating": transfer.get("rating"),
                    "stars": transfer.get("stars"),
                    "eligibility": transfer.get("eligibility"),
                }
        except requests.exceptions.HTTPError:
            continue
