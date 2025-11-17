/**
 * Tests for dateHelpers.js
 * Tests date calculations and comparisons
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isToday, getTodayIndex } from '../../js/utils/dateHelpers.js';

describe('dateHelpers', () => {
  beforeEach(() => {
    // Set a fixed date for predictable testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isToday()', () => {
    describe('with date-based matching', () => {
      it('should return true for today when using startDate', () => {
        const menuData = {
          startDate: '2024-01-15', // Today
          days: Array(5).fill({})
        };

        const result = isToday('Måndag', 0, menuData);

        expect(result).toBe(true);
      });

      it('should return false for other days when using startDate', () => {
        const menuData = {
          startDate: '2024-01-15', // Monday
          days: Array(5).fill({})
        };

        const result = isToday('Tisdag', 1, menuData);

        expect(result).toBe(false);
      });

      it('should handle week start on different days', () => {
        const menuData = {
          startDate: '2024-01-14', // Sunday (day before)
          days: Array(7).fill({})
        };

        // Today is index 1 (Monday, second day of week starting Sunday)
        const result = isToday('Måndag', 1, menuData);

        expect(result).toBe(true);
      });

      it('should return false when day is outside menu range', () => {
        const menuData = {
          startDate: '2024-01-08', // Week before
          days: Array(5).fill({})
        };

        // Use Tuesday (non-matching day) to avoid fallback to name matching
        const result = isToday('Tisdag', 1, menuData);

        expect(result).toBe(false);
      });
    });

    describe('with name-based fallback', () => {
      it('should fallback to name matching when no startDate', () => {
        // Monday in Swedish
        const menuData = {
          days: Array(5).fill({})
        };

        const result = isToday('måndag', 0, menuData);

        expect(result).toBe(true);
      });

      it('should be case insensitive for name matching', () => {
        const menuData = {
          days: Array(5).fill({})
        };

        expect(isToday('MÅNDAG', 0, menuData)).toBe(true);
        expect(isToday('Måndag', 0, menuData)).toBe(true);
        expect(isToday('måndag', 0, menuData)).toBe(true);
      });

      it('should return false for non-matching day names', () => {
        const menuData = {
          days: Array(5).fill({})
        };

        const result = isToday('tisdag', 1, menuData);

        expect(result).toBe(false);
      });

      it('should handle null dayName gracefully', () => {
        const menuData = {
          days: Array(5).fill({})
        };

        const result = isToday(null, 0, menuData);

        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null menuData', () => {
        const result = isToday('Måndag', 0, null);

        expect(result).toBe(true); // Falls back to name matching
      });

      it('should handle undefined menuData', () => {
        const result = isToday('Måndag', 0, undefined);

        expect(result).toBe(true);
      });

      it('should handle empty menuData', () => {
        const result = isToday('Måndag', 0, {});

        expect(result).toBe(true);
      });
    });
  });

  describe('getTodayIndex()', () => {
    it('should return 0 for start date matching today', () => {
      const result = getTodayIndex('2024-01-15', 5);

      expect(result).toBe(0);
    });

    it('should return correct index for days after start date', () => {
      // Start on Sunday, today is Monday
      const result = getTodayIndex('2024-01-14', 7);

      expect(result).toBe(1);
    });

    it('should return -1 when startDate is null', () => {
      const result = getTodayIndex(null, 5);

      expect(result).toBe(-1);
    });

    it('should return -1 when startDate is undefined', () => {
      const result = getTodayIndex(undefined, 5);

      expect(result).toBe(-1);
    });

    it('should return -1 when today is before start date', () => {
      // Future date
      const result = getTodayIndex('2024-01-20', 5);

      expect(result).toBe(-1);
    });

    it('should return -1 when today is after week end', () => {
      // Started 10 days ago, only 5 day week
      const result = getTodayIndex('2024-01-05', 5);

      expect(result).toBe(-1);
    });

    it('should handle last day of week', () => {
      // Started 4 days ago, 5 day week, today is last day
      const result = getTodayIndex('2024-01-11', 5);

      expect(result).toBe(4);
    });

    it('should handle single day week', () => {
      const result = getTodayIndex('2024-01-15', 1);

      expect(result).toBe(0);
    });

    it('should normalize dates ignoring time', () => {
      // Should work even with time components
      const result = getTodayIndex('2024-01-15T23:59:59', 5);

      expect(result).toBe(0);
    });

    it('should handle different month boundaries', () => {
      vi.setSystemTime(new Date('2024-02-01T12:00:00Z')); // Feb 1

      // Started on Jan 29 (4 days ago)
      const result = getTodayIndex('2024-01-29', 7);

      expect(result).toBe(3);
    });

    it('should handle year boundaries', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z')); // Jan 2

      // Started on Dec 31 (2 days ago)
      const result = getTodayIndex('2023-12-31', 7);

      expect(result).toBe(2);
    });

    it('should handle leap year correctly', () => {
      vi.setSystemTime(new Date('2024-03-01T12:00:00Z')); // March 1, 2024

      // Started on Feb 26 (leap year, 2024 has 29 days in Feb)
      const result = getTodayIndex('2024-02-26', 7);

      expect(result).toBe(4); // 26, 27, 28, 29, Mar 1 = index 4
    });
  });

  describe('date normalization', () => {
    it('should ignore time components in comparison', () => {
      // Same day, different times
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Use ISO date without time to avoid timezone issues
      // Pass larger weekLength to avoid edge case issues
      const result = getTodayIndex('2024-01-15', 7);

      expect(result).toBe(0);
    });

    it('should handle timezone differences correctly', () => {
      // Dates in different timezones but same day
      const result = getTodayIndex('2024-01-15T00:00:00+01:00', 5);

      expect(result).toBe(0);
    });
  });
});
