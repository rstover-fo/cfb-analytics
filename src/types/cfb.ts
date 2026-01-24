/**
 * College Football Data Types
 * Based on CFBD API schemas
 */

export interface Team {
  id: number;
  school: string;
  mascot: string | null;
  abbreviation: string | null;
  conference: string | null;
  division: string | null;
  color: string | null;
  alt_color: string | null;
  logos: string[] | null;
}

export interface Game {
  id: number;
  season: number;
  week: number;
  season_type: 'regular' | 'postseason';
  start_date: string;
  neutral_site: boolean;
  conference_game: boolean;
  attendance: number | null;
  venue_id: number | null;
  venue: string | null;
  home_id: number;
  home_team: string;
  home_conference: string | null;
  home_points: number | null;
  home_line_scores: number[] | null;
  away_id: number;
  away_team: string;
  away_conference: string | null;
  away_points: number | null;
  away_line_scores: number[] | null;
  excitement_index: number | null;
}

export interface Play {
  id: number;
  game_id: number;
  drive_id: number;
  drive_number: number;
  play_number: number;
  offense: string;
  offense_conference: string | null;
  defense: string;
  defense_conference: string | null;
  home: string;
  away: string;
  offense_score: number;
  defense_score: number;
  period: number;
  clock: {
    minutes: number;
    seconds: number;
  };
  yard_line: number;
  down: number;
  distance: number;
  yards_gained: number;
  play_type: string;
  play_text: string | null;
  ppa: number | null;
  scoring: boolean;
  home_favorites: boolean | null;
  spread: number | null;
}

export interface Drive {
  id: number;
  game_id: number;
  offense: string;
  offense_conference: string | null;
  defense: string;
  defense_conference: string | null;
  drive_number: number;
  scoring: boolean;
  start_period: number;
  start_yardline: number;
  start_yards_to_goal: number;
  start_time: {
    minutes: number;
    seconds: number;
  };
  end_period: number;
  end_yardline: number;
  end_yards_to_goal: number;
  end_time: {
    minutes: number;
    seconds: number;
  };
  plays: number;
  yards: number;
  drive_result: string;
  elapsed: {
    minutes: number;
    seconds: number;
  };
}

export interface PlayerStats {
  player_id: number;
  player: string;
  team: string;
  conference: string | null;
  category: string;
  stat_type: string;
  stat: number | string;
}

export interface TeamStats {
  game_id: number;
  team: string;
  conference: string | null;
  home_away: 'home' | 'away';
  points: number;
  stat: string;
  category: string;
}

export interface Recruit {
  id: number;
  athlete_id: number;
  recruit_type: string;
  year: number;
  ranking: number;
  name: string;
  school: string | null;
  committed_to: string | null;
  position: string;
  height: number | null;
  weight: number | null;
  stars: number;
  rating: number;
  city: string | null;
  state_province: string | null;
  country: string | null;
}

export interface TransferPortal {
  season: number;
  first_name: string;
  last_name: string;
  position: string;
  origin: string;
  destination: string | null;
  transfer_date: string;
  rating: number | null;
  stars: number | null;
  eligibility: string | null;
}

export interface TeamRecruitingRank {
  year: number;
  rank: number;
  team: string;
  points: number;
}

export interface PositionGroup {
  team: string;
  conference: string | null;
  positionGroup: string;
  averageRating: number;
  totalRating: number;
  commits: number;
  averageStars: number;
}

export interface RosterPlayer {
  id: number;
  firstName: string;
  lastName: string;
  team: string;
  weight: number | null;
  height: number | null;
  jersey: number | null;
  year: number;
  position: string | null;
  homeCity: string | null;
  homeState: string | null;
  homeCountry: string | null;
  homeLatitude: number | null;
  homeLongitude: number | null;
  recruitIds: number[] | null;
}

export interface TeamRecord {
  year: number;
  team: string;
  conference: string | null;
  division: string | null;
  total: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
  conference_games: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
  home_games: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
  away_games: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
}

export interface AdvancedStats {
  season: number;
  team: string;
  conference: string | null;
  offense: {
    plays: number;
    drives: number;
    ppa: number;
    total_ppa: number;
    success_rate: number;
    explosiveness: number;
    power_success: number;
    stuff_rate: number;
    line_yards: number;
    line_yards_total: number;
    second_level_yards: number;
    second_level_yards_total: number;
    open_field_yards: number;
    open_field_yards_total: number;
    standard_downs: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    passing_downs: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    rushing_plays: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    passing_plays: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
  };
  defense: {
    plays: number;
    drives: number;
    ppa: number;
    total_ppa: number;
    success_rate: number;
    explosiveness: number;
    power_success: number;
    stuff_rate: number;
    line_yards: number;
    line_yards_total: number;
    second_level_yards: number;
    second_level_yards_total: number;
    open_field_yards: number;
    open_field_yards_total: number;
    standard_downs: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    passing_downs: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    rushing_plays: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
    passing_plays: {
      ppa: number;
      success_rate: number;
      explosiveness: number;
    };
  };
}

// App-specific types
export interface GameSummary {
  game: Game;
  isHome: boolean;
  opponent: string;
  result: 'W' | 'L' | 'T' | null;
  score: string;
  spread: number | null;
}

export interface SeasonSummary {
  year: number;
  record: TeamRecord;
  games: GameSummary[];
}
