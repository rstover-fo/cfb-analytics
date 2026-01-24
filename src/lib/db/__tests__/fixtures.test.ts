/**
 * Tests for Test Fixtures
 *
 * Verifies that fixture factories produce valid, type-safe objects.
 */

import { describe, it, expect } from 'vitest';
import {
  createGame,
  createGames,
  createPlay,
  createPlays,
  createDrive,
  createDrives,
  createTeam,
  createTeamRecord,
  createGameRow,
  createPlayRow,
  createDriveRow,
} from './fixtures';

describe('Game Fixtures', () => {
  describe('createGame', () => {
    it('should create a valid game with defaults', () => {
      const game = createGame();

      expect(game.id).toBeDefined();
      expect(game.season).toBe(2024);
      expect(game.week).toBe(1);
      expect(game.home_team).toBe('Oklahoma');
      expect(game.away_team).toBe('Houston');
      expect(game.home_points).toBe(35);
      expect(game.away_points).toBe(14);
    });

    it('should allow overriding properties', () => {
      const game = createGame({
        id: 999,
        season: 2023,
        homeTeam: 'Texas',
        awayTeam: 'Oklahoma',
        homePoints: 21,
        awayPoints: 28,
      });

      expect(game.id).toBe(999);
      expect(game.season).toBe(2023);
      expect(game.home_team).toBe('Texas');
      expect(game.away_team).toBe('Oklahoma');
      expect(game.home_points).toBe(21);
      expect(game.away_points).toBe(28);
    });
  });

  describe('createGames', () => {
    it('should create multiple games with incrementing ids and weeks', () => {
      const games = createGames(3, { id: 100, week: 5 });

      expect(games).toHaveLength(3);
      expect(games[0]?.id).toBe(100);
      expect(games[0]?.week).toBe(5);
      expect(games[1]?.id).toBe(101);
      expect(games[1]?.week).toBe(6);
      expect(games[2]?.id).toBe(102);
      expect(games[2]?.week).toBe(7);
    });
  });
});

describe('Play Fixtures', () => {
  describe('createPlay', () => {
    it('should create a valid play with defaults', () => {
      const play = createPlay();

      expect(play.id).toBeDefined();
      expect(play.game_id).toBe(1);
      expect(play.offense).toBe('Oklahoma');
      expect(play.defense).toBe('Houston');
      expect(play.down).toBe(1);
      expect(play.distance).toBe(10);
      expect(play.yards_gained).toBe(5);
      expect(play.play_type).toBe('Rush');
    });

    it('should allow overriding properties', () => {
      const play = createPlay({
        gameId: 999,
        down: 3,
        distance: 5,
        yardsGained: 10,
        playType: 'Pass Reception',
        scoring: true,
      });

      expect(play.game_id).toBe(999);
      expect(play.down).toBe(3);
      expect(play.distance).toBe(5);
      expect(play.yards_gained).toBe(10);
      expect(play.play_type).toBe('Pass Reception');
      expect(play.scoring).toBe(true);
    });
  });

  describe('createPlays', () => {
    it('should create multiple plays with incrementing play numbers', () => {
      const plays = createPlays(5);

      expect(plays).toHaveLength(5);
      expect(plays[0]?.play_number).toBe(1);
      expect(plays[4]?.play_number).toBe(5);
    });
  });
});

describe('Drive Fixtures', () => {
  describe('createDrive', () => {
    it('should create a valid drive with defaults', () => {
      const drive = createDrive();

      expect(drive.id).toBeDefined();
      expect(drive.game_id).toBe(1);
      expect(drive.offense).toBe('Oklahoma');
      expect(drive.defense).toBe('Houston');
      expect(drive.plays).toBe(8);
      expect(drive.yards).toBe(75);
      expect(drive.drive_result).toBe('PUNT');
    });

    it('should allow overriding properties', () => {
      const drive = createDrive({
        scoring: true,
        plays: 12,
        yards: 80,
        driveResult: 'TD',
      });

      expect(drive.scoring).toBe(true);
      expect(drive.plays).toBe(12);
      expect(drive.yards).toBe(80);
      expect(drive.drive_result).toBe('TD');
    });
  });

  describe('createDrives', () => {
    it('should create multiple drives with incrementing numbers', () => {
      const drives = createDrives(4);

      expect(drives).toHaveLength(4);
      expect(drives[0]?.drive_number).toBe(1);
      expect(drives[3]?.drive_number).toBe(4);
    });
  });
});

describe('Team Fixtures', () => {
  describe('createTeam', () => {
    it('should create a valid team with defaults', () => {
      const team = createTeam();

      expect(team.id).toBe(201);
      expect(team.school).toBe('Oklahoma');
      expect(team.mascot).toBe('Sooners');
      expect(team.conference).toBe('SEC');
    });

    it('should allow overriding properties', () => {
      const team = createTeam({
        id: 300,
        school: 'Texas',
        mascot: 'Longhorns',
        conference: 'SEC',
      });

      expect(team.id).toBe(300);
      expect(team.school).toBe('Texas');
      expect(team.mascot).toBe('Longhorns');
    });
  });
});

describe('Team Record Fixtures', () => {
  describe('createTeamRecord', () => {
    it('should create a valid team record', () => {
      const record = createTeamRecord();

      expect(record.year).toBe(2024);
      expect(record.team).toBe('Oklahoma');
      expect(record.total.wins).toBe(10);
      expect(record.total.losses).toBe(2);
      expect(record.total.games).toBe(12);
    });

    it('should calculate total games from wins and losses', () => {
      const record = createTeamRecord({ wins: 8, losses: 4 });

      expect(record.total.games).toBe(12);
      expect(record.total.wins).toBe(8);
      expect(record.total.losses).toBe(4);
    });
  });
});

describe('Database Row Fixtures', () => {
  describe('createGameRow', () => {
    it('should create a valid game row matching DB schema', () => {
      const row = createGameRow();

      expect(row.game_id).toBeDefined();
      expect(row.season).toBe(2024);
      expect(row.home_team).toBe('Oklahoma');
      expect(row.away_team).toBe('Houston');
      // DB schema uses different field names
      expect(row.spread).toBeDefined();
      expect(row.over_under).toBeDefined();
    });
  });

  describe('createPlayRow', () => {
    it('should create a valid play row matching DB schema', () => {
      const row = createPlayRow();

      expect(row.play_id).toBeDefined();
      expect(row.game_id).toBe(1);
      // DB schema uses clock_minutes/seconds instead of clock object
      expect(row.clock_minutes).toBeDefined();
      expect(row.clock_seconds).toBeDefined();
      expect(row.epa).toBeDefined();
      expect(row.success).toBeDefined();
    });
  });

  describe('createDriveRow', () => {
    it('should create a valid drive row matching DB schema', () => {
      const row = createDriveRow();

      expect(row.drive_id).toBeDefined();
      expect(row.game_id).toBe(1);
      // DB schema uses elapsed_minutes/seconds
      expect(row.elapsed_minutes).toBeDefined();
      expect(row.elapsed_seconds).toBeDefined();
    });
  });
});
