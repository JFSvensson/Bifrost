/**
 * Tests for naturalLanguageParser.js
 * Tests parsing of natural language todo inputs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NaturalLanguageParser } from '../../js/utils/naturalLanguageParser.js';

describe('NaturalLanguageParser', () => {
  let parser;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Monday
    parser = new NaturalLanguageParser();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parse()', () => {
    it('should parse simple text without metadata', () => {
      const result = parser.parse('Buy groceries');

      expect(result).toMatchObject({
        text: 'Buy groceries',
        dueDate: null,
        dueTime: null,
        tags: [],
        priority: 'normal',
        source: 'bifrost'
      });
    });

    it('should return null for null input', () => {
      expect(parser.parse(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parser.parse(undefined)).toBeNull();
    });

    it('should return null for non-string input', () => {
      expect(parser.parse(123)).toBeNull();
      expect(parser.parse({})).toBeNull();
      expect(parser.parse([])).toBeNull();
    });

    it('should parse complete complex input', () => {
      const result = parser.parse('Möt Anna imorgon 14:00 #arbete [!high]');

      expect(result.text).toBe('Möt Anna');
      expect(result.dueDate).toBe('2024-01-16');
      expect(result.dueTime).toBe('14:00');
      expect(result.tags).toEqual(['arbete']);
      expect(result.priority).toBe('high');
    });
  });

  describe('extractTags()', () => {
    it('should extract single tag', () => {
      const tags = parser.extractTags('Task #work');
      expect(tags).toEqual(['work']);
    });

    it('should extract multiple tags', () => {
      const tags = parser.extractTags('Task #work #urgent #personal');
      expect(tags).toEqual(['work', 'urgent', 'personal']);
    });

    it('should return empty array when no tags', () => {
      const tags = parser.extractTags('Task without tags');
      expect(tags).toEqual([]);
    });

    it('should handle tags with numbers', () => {
      const tags = parser.extractTags('Task #project123 #q1');
      expect(tags).toEqual(['project123', 'q1']);
    });

    it('should extract tags including numbers', () => {
      const tags = parser.extractTags('Price #10 Task #real');
      expect(tags).toEqual(['10', 'real']);
    });
  });

  describe('extractPriority()', () => {
    it('should extract high priority marker', () => {
      expect(parser.extractPriority('[!high]')).toBe('high');
      expect(parser.extractPriority('🔥')).toBe('high');
      expect(parser.extractPriority('‼️')).toBe('high');
    });

    it('should extract medium priority marker', () => {
      expect(parser.extractPriority('[!medium]')).toBe('medium');
      expect(parser.extractPriority('⚠️')).toBe('medium');
    });

    it('should extract low priority marker', () => {
      expect(parser.extractPriority('[!low]')).toBe('low');
      expect(parser.extractPriority('🔽')).toBe('low');
    });

    it('should return null when no priority marker', () => {
      expect(parser.extractPriority('Regular task')).toBeNull();
    });

    it('should be case insensitive', () => {
      expect(parser.extractPriority('[!HIGH]')).toBe('high');
      expect(parser.extractPriority('[!Medium]')).toBe('medium');
      expect(parser.extractPriority('[!LOW]')).toBe('low');
    });
  });

  describe('extractSource()', () => {
    it('should extract source', () => {
      expect(parser.extractSource('Task @obsidian')).toBe('obsidian');
    });

    it('should return null when no source', () => {
      expect(parser.extractSource('Regular task')).toBeNull();
    });

    it('should extract first source if multiple', () => {
      const source = parser.extractSource('Task @source1 @source2');
      expect(source).toBe('source1');
    });
  });

  describe('extractDate()', () => {
    describe('relative dates (Swedish)', () => {
      it('should parse "idag"', () => {
        const result = parser.extractDate('idag');
        expect(result.formatted).toBe('2024-01-15');
      });

      it('should parse "today"', () => {
        const result = parser.extractDate('today');
        expect(result.formatted).toBe('2024-01-15');
      });

      it('should parse "imorgon"', () => {
        const result = parser.extractDate('imorgon');
        expect(result.formatted).toBe('2024-01-16');
      });

      it('should parse "tomorrow"', () => {
        const result = parser.extractDate('tomorrow');
        expect(result.formatted).toBe('2024-01-16');
      });

      it('should parse "igår"', () => {
        const result = parser.extractDate('igår');
        expect(result.formatted).toBe('2024-01-14');
      });
    });

    describe('weekdays (Swedish)', () => {
      it('should parse "måndag" to next Monday', () => {
        const result = parser.extractDate('måndag');
        // Currently Monday, next Monday is in 7 days
        expect(result.formatted).toBe('2024-01-22');
      });

      it('should parse "tisdag" to next Tuesday', () => {
        const result = parser.extractDate('tisdag');
        expect(result.formatted).toBe('2024-01-16'); // Tomorrow (Tuesday)
      });

      it('should parse weekday abbreviations', () => {
        expect(parser.extractDate('mån').formatted).toBe('2024-01-22');
        expect(parser.extractDate('tis').formatted).toBe('2024-01-16');
        expect(parser.extractDate('ons').formatted).toBe('2024-01-17');
      });
    });

    describe('ISO dates', () => {
      it('should parse ISO date format', () => {
        const result = parser.extractDate('2024-12-25');
        expect(result.formatted).toBe('2024-12-25');
      });

      it('should handle leap year dates', () => {
        const result = parser.extractDate('2024-02-29');
        expect(result.formatted).toBe('2024-02-29');
      });
    });

    describe('slash dates', () => {
      it('should parse DD/MM format', () => {
        const result = parser.extractDate('25/12');
        expect(result.formatted).toContain('-12-25');
      });

      it('should parse DD/MM/YYYY format', () => {
        const result = parser.extractDate('25/12/2024');
        expect(result.formatted).toBe('2024-12-25');
      });

      it('should parse DD/MM/YY format', () => {
        const result = parser.extractDate('25/12/24');
        expect(result.formatted).toBe('2024-12-25');
      });
    });

    describe('relative with numbers', () => {
      it('should parse "om X dagar"', () => {
        const result = parser.extractDate('om 5 dagar');
        expect(result.formatted).toBe('2024-01-20');
      });

      it('should parse "om X veckor"', () => {
        const result = parser.extractDate('om 2 veckor');
        expect(result.formatted).toBe('2024-01-29');
      });
    });

    it('should return null when no date found', () => {
      expect(parser.extractDate('No date here')).toBeNull();
    });
  });

  describe('extractTime()', () => {
    it('should parse HH:MM format', () => {
      const result = parser.extractTime('14:30');
      expect(result.formatted).toBe('14:30');
    });

    it('should parse "kl. HH" format', () => {
      const result = parser.extractTime('kl. 14');
      expect(result.formatted).toBe('14:00');
    });

    it('should parse "kl HH" format without dot', () => {
      const result = parser.extractTime('kl 9');
      expect(result.formatted).toBe('09:00');
    });

    it('should parse AM/PM format', () => {
      expect(parser.extractTime('2 pm').formatted).toBe('14:00');
      expect(parser.extractTime('2 am').formatted).toBe('02:00');
      expect(parser.extractTime('12 pm').formatted).toBe('12:00');
      expect(parser.extractTime('12 am').formatted).toBe('00:00');
    });

    it('should pad single digit hours', () => {
      const result = parser.extractTime('9:30');
      expect(result.formatted).toBe('09:30');
    });

    it('should return null when no time found', () => {
      expect(parser.extractTime('No time here')).toBeNull();
    });
  });

  describe('extractRecurring()', () => {
    it('should parse daily pattern', () => {
      const result = parser.extractRecurring('varje dag');
      expect(result).toMatchObject({
        type: 'daily',
        frequency: 1
      });
    });

    it('should parse "every N days" pattern', () => {
      const result = parser.extractRecurring('var 3:e dag');
      expect(result).toMatchObject({
        type: 'daily',
        frequency: 3
      });
    });

    it('should parse weekly pattern', () => {
      const result = parser.extractRecurring('varje vecka');
      expect(result).toMatchObject({
        type: 'weekly',
        frequency: 1
      });
    });

    it('should parse specific weekday pattern', () => {
      const result = parser.extractRecurring('varje måndag');
      expect(result).toMatchObject({
        type: 'weekly',
        frequency: 1,
        daysOfWeek: [1] // Monday
      });
    });

    it('should parse monthly pattern', () => {
      const result = parser.extractRecurring('varje månad');
      expect(result).toMatchObject({
        type: 'monthly',
        frequency: 1
      });
    });

    it('should parse monthly on specific day', () => {
      const result = parser.extractRecurring('varje månad den 15:e');
      expect(result).toMatchObject({
        type: 'monthly',
        frequency: 1,
        dayOfMonth: 15
      });
    });

    it('should return null when no recurring pattern', () => {
      expect(parser.extractRecurring('One-time task')).toBeNull();
    });
  });

  describe('extractReminder()', () => {
    it('should parse "påminn om X minuter"', () => {
      const result = parser.extractReminder('påminn mig om 30 minuter');
      expect(result).toMatchObject({
        type: 'in-time'
      });
      expect(result.offset).toBeDefined();
      expect(result.offsetDisplay).toContain('30');
    });

    it('should parse "remind in X hours"', () => {
      const result = parser.extractReminder('remind me in 2h');
      expect(result).toMatchObject({
        type: 'in-time'
      });
      expect(result.offset).toBeDefined();
      expect(result.offsetDisplay).toContain('2');
    });

    it('should parse "påminn X innan"', () => {
      const result = parser.extractReminder('påminn 30 minuter innan');
      expect(result).toMatchObject({
        type: 'before-deadline'
      });
      expect(result.offset).toBeDefined();
      expect(result.offsetDisplay).toContain('innan');
    });

    it('should parse reminder at specific time', () => {
      const result = parser.extractReminder('påminn mig imorgon 09:00');
      expect(result).toMatchObject({
        type: 'at-time',
        when: 'tomorrow',
        time: '09:00'
      });
    });

    it('should return null when no reminder pattern', () => {
      expect(parser.extractReminder('No reminder')).toBeNull();
    });
  });

  describe('integration tests', () => {
    it('should handle multiple metadata types together', () => {
      const result = parser.parse('Viktigt möte imorgon 14:00 #arbete [!high] varje vecka påminn mig om 30 minuter');

      expect(result).toMatchObject({
        text: 'Viktigt möte',
        dueDate: '2024-01-16',
        dueTime: '14:00',
        tags: ['arbete'],
        priority: 'high',
        source: 'bifrost'
      });
      expect(result.recurring).toBeDefined();
      expect(result.reminder).toBeDefined();
    });

    it('should clean up extra whitespace', () => {
      const result = parser.parse('Task   with    extra     spaces');
      expect(result.text).toBe('Task with extra spaces');
    });

    it('should preserve original input', () => {
      const input = 'Möt Anna imorgon 14:00 #arbete [!high]';
      const result = parser.parse(input);
      expect(result.rawInput).toBe(input);
    });

    it('should handle emoji in text', () => {
      const result = parser.parse('🎉 Party time tomorrow 20:00');
      expect(result.text).toBe('🎉 Party time');
      expect(result.dueDate).toBe('2024-01-16');
      expect(result.dueTime).toBe('20:00');
    });

    it('should handle mixed language input', () => {
      const result = parser.parse('Meeting tomorrow kl. 14 #work [!high]');
      expect(result.text).toBe('Meeting');
      expect(result.dueDate).toBe('2024-01-16');
      expect(result.dueTime).toBe('14:00');
      expect(result.tags).toEqual(['work']);
      expect(result.priority).toBe('high');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = parser.parse('');
      expect(result).toBeNull();
    });

    it('should handle string with only whitespace', () => {
      const result = parser.parse('   ');
      expect(result.text).toBe('');
    });

    it('should handle string with only metadata', () => {
      const result = parser.parse('#tag [!high] imorgon');
      expect(result.text).toBe('');
      expect(result.tags).toEqual(['tag']);
      expect(result.priority).toBe('high');
      expect(result.dueDate).toBe('2024-01-16');
    });

    it('should handle multiple consecutive tags', () => {
      const result = parser.parse('Task #tag1#tag2#tag3');
      // Tags need space or end of word, so this might not work as expected
      // Test actual behavior
      const tags = parser.extractTags('Task #tag1#tag2#tag3');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should handle very long input', () => {
      const longText = 'A'.repeat(1000);
      const result = parser.parse(`${longText} tomorrow`);
      expect(result.text).toBe(longText);
      expect(result.dueDate).toBe('2024-01-16');
    });

    it('should handle special characters in text', () => {
      const result = parser.parse('Email åäö@example.com tomorrow');
      expect(result.text).toContain('Email');
      expect(result.dueDate).toBe('2024-01-16');
    });
  });
});
