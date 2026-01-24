/**
 * Unit Tests for Utility Functions
 *
 * Tests for pure utility functions in queries.ts:
 * - calculateDelta(): Computes metric changes between seasons
 * - escapeLikePattern(): Escapes SQL LIKE special characters
 *
 * These are pure functions with no external dependencies, making them
 * ideal candidates for fast, isolated unit tests.
 */

import { describe, it, expect } from 'vitest';
import { calculateDelta, escapeLikePattern } from '../queries';

// ============================================================================
// calculateDelta() Tests
// ============================================================================

describe('calculateDelta', () => {
  describe('offensive metrics (higher is better)', () => {
    it('calculates improvement when value increases', () => {
      // PPG goes from 24 to 30
      const result = calculateDelta(24, 30);

      expect(result.absolute).toBe(6);
      expect(result.percentage).toBe(25);
      expect(result.direction).toBe('improvement');
    });

    it('calculates decline when value decreases', () => {
      // PPG goes from 30 to 24
      const result = calculateDelta(30, 24);

      expect(result.absolute).toBe(-6);
      expect(result.percentage).toBe(-20);
      expect(result.direction).toBe('decline');
    });

    it('handles large improvements correctly', () => {
      // Yards per game doubles
      const result = calculateDelta(200, 400);

      expect(result.absolute).toBe(200);
      expect(result.percentage).toBe(100);
      expect(result.direction).toBe('improvement');
    });
  });

  describe('defensive metrics (lower is better)', () => {
    it('calculates improvement when value decreases', () => {
      // PPG allowed goes from 24 to 17 (good - lower is better)
      const result = calculateDelta(24, 17, true);

      expect(result.absolute).toBe(-7);
      expect(result.percentage).toBeCloseTo(-29.2, 1);
      expect(result.direction).toBe('improvement');
    });

    it('calculates decline when value increases', () => {
      // PPG allowed goes from 17 to 24 (bad - lower is better)
      const result = calculateDelta(17, 24, true);

      expect(result.absolute).toBe(7);
      expect(result.percentage).toBeCloseTo(41.2, 1);
      expect(result.direction).toBe('decline');
    });

    it('handles yards allowed improvement', () => {
      // Yards allowed per game drops from 400 to 300
      const result = calculateDelta(400, 300, true);

      expect(result.absolute).toBe(-100);
      expect(result.percentage).toBe(-25);
      expect(result.direction).toBe('improvement');
    });
  });

  describe('edge cases: division by zero', () => {
    it('returns 0 percentage when starting value is 0', () => {
      // Cannot calculate percentage change from 0
      const result = calculateDelta(0, 10);

      expect(result.absolute).toBe(10);
      expect(result.percentage).toBe(0);
      expect(result.direction).toBe('improvement');
    });

    it('handles zero to zero (defensive metric)', () => {
      const result = calculateDelta(0, 0, true);

      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.direction).toBe('unchanged');
    });

    it('handles improvement from zero (defensive)', () => {
      // Turnovers go from 0 to 5 (bad for defense)
      const result = calculateDelta(0, 5, true);

      expect(result.absolute).toBe(5);
      expect(result.percentage).toBe(0); // Can't calculate % from 0
      expect(result.direction).toBe('decline');
    });
  });

  describe('unchanged metrics', () => {
    it('identifies no change for offensive metrics', () => {
      const result = calculateDelta(28.5, 28.5);

      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.direction).toBe('unchanged');
    });

    it('identifies no change for defensive metrics', () => {
      const result = calculateDelta(21.3, 21.3, true);

      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.direction).toBe('unchanged');
    });
  });

  describe('rounding behavior', () => {
    it('rounds absolute value to 1 decimal place', () => {
      // 10.666... should round to 10.7
      const result = calculateDelta(20, 30.666);

      expect(result.absolute).toBe(10.7);
    });

    it('rounds percentage to 1 decimal place', () => {
      // (7 / 24) * 100 = 29.166... should round to 29.2
      const result = calculateDelta(24, 31);

      expect(result.percentage).toBe(29.2);
    });

    it('handles negative rounding correctly', () => {
      const result = calculateDelta(30, 20);

      expect(result.absolute).toBe(-10);
      expect(result.percentage).toBeCloseTo(-33.3, 1);
    });
  });

  describe('negative starting values', () => {
    it('handles negative to positive (EPA scenario)', () => {
      // EPA goes from -0.1 to +0.2
      const result = calculateDelta(-0.1, 0.2);

      expect(result.absolute).toBe(0.3);
      // Formula: ((0.2 - (-0.1)) / abs(-0.1)) * 100 = (0.3 / 0.1) * 100 = 300
      expect(result.percentage).toBe(300);
      expect(result.direction).toBe('improvement');
    });

    it('handles negative to more negative (defensive)', () => {
      // Getting worse: -5 to -10 (for a metric where lower is better)
      const result = calculateDelta(-5, -10, true);

      expect(result.absolute).toBe(-5);
      expect(result.direction).toBe('improvement'); // Lower is better
    });

    it('handles negative improvement correctly', () => {
      // EPA goes from -0.5 to -0.2 (improvement - getting closer to positive)
      const result = calculateDelta(-0.5, -0.2);

      expect(result.absolute).toBe(0.3);
      expect(result.direction).toBe('improvement');
    });
  });
});

// ============================================================================
// escapeLikePattern() Tests
// ============================================================================

describe('escapeLikePattern', () => {
  describe('special character escaping', () => {
    it('escapes percent sign (%)', () => {
      const result = escapeLikePattern('100% complete');

      expect(result).toBe('100\\% complete');
    });

    it('escapes underscore (_)', () => {
      const result = escapeLikePattern('first_name');

      expect(result).toBe('first\\_name');
    });

    it('escapes backslash (\\)', () => {
      const result = escapeLikePattern('path\\to\\file');

      expect(result).toBe('path\\\\to\\\\file');
    });

    it('escapes multiple different special characters', () => {
      const result = escapeLikePattern('50%_discount\\sale');

      expect(result).toBe('50\\%\\_discount\\\\sale');
    });

    it('escapes multiple occurrences of same character', () => {
      const result = escapeLikePattern('a%b%c%d');

      expect(result).toBe('a\\%b\\%c\\%d');
    });
  });

  describe('normal strings (no escaping needed)', () => {
    it('returns unchanged string with no special characters', () => {
      const result = escapeLikePattern('Oklahoma Sooners');

      expect(result).toBe('Oklahoma Sooners');
    });

    it('handles empty string', () => {
      const result = escapeLikePattern('');

      expect(result).toBe('');
    });

    it('preserves spaces and regular punctuation', () => {
      const result = escapeLikePattern("Player's touchdown pass!");

      expect(result).toBe("Player's touchdown pass!");
    });

    it('preserves numbers', () => {
      const result = escapeLikePattern('4th and 10');

      expect(result).toBe('4th and 10');
    });

    it('preserves Unicode characters', () => {
      const result = escapeLikePattern('Player José scored');

      expect(result).toBe('Player José scored');
    });
  });

  describe('real-world search patterns', () => {
    it('handles typical play search text', () => {
      const result = escapeLikePattern('touchdown pass');

      expect(result).toBe('touchdown pass');
    });

    it('handles player name search', () => {
      const result = escapeLikePattern('Williams');

      expect(result).toBe('Williams');
    });

    it('escapes search with SQL wildcards', () => {
      // User might try to inject wildcards
      const result = escapeLikePattern('%rush%');

      expect(result).toBe('\\%rush\\%');
    });

    it('handles yard line notation (underscore in common use)', () => {
      const result = escapeLikePattern('play_type');

      expect(result).toBe('play\\_type');
    });
  });

  describe('edge cases', () => {
    it('handles string of only special characters', () => {
      const result = escapeLikePattern('%_%\\');

      expect(result).toBe('\\%\\_\\%\\\\');
    });

    it('handles consecutive special characters', () => {
      const result = escapeLikePattern('%%__\\\\');

      expect(result).toBe('\\%\\%\\_\\_\\\\\\\\');
    });

    it('handles very long strings', () => {
      const longString = 'a'.repeat(1000) + '%' + 'b'.repeat(1000);
      const result = escapeLikePattern(longString);

      expect(result).toBe('a'.repeat(1000) + '\\%' + 'b'.repeat(1000));
      // Original: 1000 + 1 + 1000 = 2001, escaped: 1000 + 2 + 1000 = 2002
      expect(result.length).toBe(2002);
    });
  });
});
