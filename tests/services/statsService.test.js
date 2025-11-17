/**
 * Tests for statsService.js
 * Tests statistics tracking, streaks, and productivity metrics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StatsService } from '../../js/services/statsService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/stateManager.js';

describe('StatsService', () => {
  let statsService;
  let emitSpy;

  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers();
    const now = new Date('2024-01-15T12:00:00Z'); // Monday
    vi.setSystemTime(now);

    // Clear state
    stateManager.clear();
    eventBus.listeners = {};
    eventBus.onceListeners = {};
    eventBus.eventHistory = [];

    // Spy on eventBus.emit
    emitSpy = vi.spyOn(eventBus, 'emit');

    // Create fresh service instance
    statsService = new StatsService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default stats', () => {
      expect(statsService.stats).toBeDefined();
      expect(statsService.stats.totalCompleted).toBe(0);
      expect(statsService.stats.totalCreated).toBe(0);
      expect(statsService.stats.currentStreak).toBe(0);
      expect(statsService.stats.longestStreak).toBe(0);
    });

    it('should have priority stats', () => {
      expect(statsService.stats.priorityStats).toBeDefined();
      expect(statsService.stats.priorityStats.high).toBeDefined();
      expect(statsService.stats.priorityStats.medium).toBeDefined();
      expect(statsService.stats.priorityStats.low).toBeDefined();
      expect(statsService.stats.priorityStats.normal).toBeDefined();
    });

    it('should have source stats', () => {
      expect(statsService.stats.sourceStats).toBeDefined();
      expect(statsService.stats.sourceStats.bifrost).toBeDefined();
      expect(statsService.stats.sourceStats.obsidian).toBeDefined();
    });

    it('should have weekly stats', () => {
      expect(statsService.stats.weeklyStats).toBeDefined();
      expect(statsService.stats.weeklyStats['Måndag']).toBeDefined();
      expect(statsService.stats.weeklyStats['Tisdag']).toBeDefined();
      expect(statsService.stats.weeklyStats['Onsdag']).toBeDefined();
    });

    it('should register schemas', () => {
      expect(stateManager.schemas.stats).toBeDefined();
      expect(stateManager.schemas.statsHistory).toBeDefined();
    });

    it('should subscribe to todo events', () => {
      expect(eventBus.listeners['todo:added']).toBeDefined();
      expect(eventBus.listeners['todo:completed']).toBeDefined();
    });
  });

  describe('trackTodoCreated()', () => {
    it('should increment total created', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.totalCreated).toBe(1);
    });

    it('should track priority stats', () => {
      const todo = { id: '1', text: 'Test', priority: 'high' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.priorityStats.high.created).toBe(1);
    });

    it('should use normal priority as default', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.priorityStats.normal.created).toBe(1);
    });

    it('should track source stats', () => {
      const todo = { id: '1', text: 'Test', source: 'obsidian' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.sourceStats.obsidian.created).toBe(1);
    });

    it('should use bifrost as default source', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.sourceStats.bifrost.created).toBe(1);
    });

    it('should track weekly stats', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      // Monday (2024-01-15)
      expect(statsService.stats.weeklyStats['Måndag'].created).toBe(1);
    });

    it('should update last activity date', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      expect(statsService.stats.lastActivityDate).toBe(new Date().toDateString());
    });

    it('should save stats after tracking', () => {
      const setSpy = vi.spyOn(stateManager, 'set');
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCreated(todo);

      expect(setSpy).toHaveBeenCalledWith('stats', expect.any(Object));
    });
  });

  describe('trackTodoCompleted()', () => {
    it('should increment total completed', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.totalCompleted).toBe(1);
    });

    it('should track priority stats for completion', () => {
      const todo = { id: '1', text: 'Test', priority: 'high' };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.priorityStats.high.completed).toBe(1);
    });

    it('should track source stats for completion', () => {
      const todo = { id: '1', text: 'Test', source: 'obsidian' };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.sourceStats.obsidian.completed).toBe(1);
    });

    it('should track weekly completion stats', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.weeklyStats['Måndag'].completed).toBe(1);
    });

    it('should update last completion date', () => {
      const todo = { id: '1', text: 'Test' };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.lastCompletionDate).toBe(new Date().toDateString());
    });

    it('should track completion time if todo has createdAt', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z');
      const todo = { id: '1', text: 'Test', createdAt: yesterday.toISOString() };

      statsService.trackTodoCompleted(todo);

      expect(statsService.stats.averageCompletionTime).toBeGreaterThan(0);
    });
  });

    describe('Streak tracking', () => {
        it('should start streak on first completion', () => {
            const todo = { id: '1', text: 'Test' };

            statsService.trackTodoCompleted(todo);

            expect(statsService.stats.currentStreak).toBe(1);
            expect(statsService.stats.longestStreak).toBe(1);
        });

        it('should continue streak on consecutive days', () => {
            const todo1 = { id: '1', text: 'Test' };
            statsService.trackTodoCompleted(todo1);

            // Move to next day
            vi.setSystemTime(new Date('2024-01-16T12:00:00Z'));
            const todo2 = { id: '2', text: 'Test' };
            statsService.trackTodoCompleted(todo2);

            expect(statsService.stats.currentStreak).toBe(2);
        });

        it('should break streak if day skipped', () => {
            const todo1 = { id: '1', text: 'Test' };
            statsService.trackTodoCompleted(todo1);

            // Skip a day
            vi.setSystemTime(new Date('2024-01-17T12:00:00Z'));
            const todo2 = { id: '2', text: 'Test' };
            statsService.trackTodoCompleted(todo2);

            expect(statsService.stats.currentStreak).toBe(1);
        });

        it('should update longest streak', () => {
            statsService.stats.currentStreak = 5;
            statsService.stats.longestStreak = 3;

            statsService.updateStreak(new Date().toDateString());

            expect(statsService.stats.longestStreak).toBe(5);
        });

        it('should allow multiple completions same day', () => {
            const todo1 = { id: '1', text: 'Test' };
            statsService.trackTodoCompleted(todo1);

            const todo2 = { id: '2', text: 'Test' };
            statsService.trackTodoCompleted(todo2);

            expect(statsService.stats.currentStreak).toBe(1); // Still day 1
        });
    });

    describe('getStats()', () => {
        it('should return current stats', () => {
            const stats = statsService.getStats();

            expect(stats).toBeDefined();
            expect(stats.totalCompleted).toBe(0);
            expect(stats.totalCreated).toBe(0);
        });

        it('should return copy of stats', () => {
            const stats = statsService.getStats();
            stats.totalCompleted = 999;

            expect(statsService.stats.totalCompleted).toBe(0);
        });
    });

    describe('getCompletionRate()', () => {
        it('should calculate completion rate', () => {
            statsService.stats.totalCreated = 10;
            statsService.stats.totalCompleted = 7;

            const rate = statsService.getCompletionRate();

            expect(rate).toBe(70);
        });

        it('should return 0 if no todos created', () => {
            statsService.stats.totalCreated = 0;
            statsService.stats.totalCompleted = 0;

            const rate = statsService.getCompletionRate();

            expect(rate).toBe(0);
        });

        it('should handle 100% completion', () => {
            statsService.stats.totalCreated = 5;
            statsService.stats.totalCompleted = 5;

            const rate = statsService.getCompletionRate();

            expect(rate).toBe(100);
        });
    });

    describe('getPriorityBreakdown()', () => {
        it('should return priority statistics', () => {
            statsService.stats.priorityStats.high.created = 10;
            statsService.stats.priorityStats.high.completed = 8;

            const breakdown = statsService.getPriorityBreakdown();

            expect(breakdown).toBeDefined();
            expect(breakdown.high).toBeDefined();
            expect(breakdown.high.created).toBe(10);
            expect(breakdown.high.completed).toBe(8);
        });
    });

    describe('getSourceBreakdown()', () => {
        it('should return source statistics', () => {
            statsService.stats.sourceStats.bifrost.created = 20;
            statsService.stats.sourceStats.obsidian.created = 10;

            const breakdown = statsService.getSourceBreakdown();

            expect(breakdown.bifrost.created).toBe(20);
            expect(breakdown.obsidian.created).toBe(10);
        });
    });

    describe('getWeeklyBreakdown()', () => {
        it('should return weekly statistics', () => {
            statsService.stats.weeklyStats['Måndag'].completed = 5;
            statsService.stats.weeklyStats['Tisdag'].completed = 3;

            const breakdown = statsService.getWeeklyBreakdown();

            expect(breakdown['Måndag'].completed).toBe(5);
            expect(breakdown['Tisdag'].completed).toBe(3);
        });
    });

    describe('resetStats()', () => {
        it('should reset all stats to default', () => {
            statsService.stats.totalCompleted = 100;
            statsService.stats.totalCreated = 150;
            statsService.stats.currentStreak = 10;

            statsService.resetStats();

            expect(statsService.stats.totalCompleted).toBe(0);
            expect(statsService.stats.totalCreated).toBe(0);
            expect(statsService.stats.currentStreak).toBe(0);
        });

        it('should emit stats:updated after reset', () => {
            emitSpy.mockClear();

            statsService.resetStats();

            expect(emitSpy).toHaveBeenCalledWith('stats:updated', expect.any(Object));
        });

        it('should save after reset', () => {
            const setSpy = vi.spyOn(stateManager, 'set');

            statsService.resetStats();

            expect(setSpy).toHaveBeenCalledWith('stats', expect.any(Object));
        });
    });

  describe('Event handling', () => {
    it('should respond to todo:added event', () => {
      const todo = { id: '1', text: 'Test' };

      eventBus.emit('todo:added', { todo });

      expect(statsService.stats.totalCreated).toBe(1);
    });

    it('should respond to todo:completed event', () => {
      const todo = { id: '1', text: 'Test' };

      eventBus.emit('todo:completed', { todo });

      expect(statsService.stats.totalCompleted).toBe(1);
    });

    it('should emit stats:updated after tracking', () => {
      const todo = { id: '1', text: 'Test' };
      emitSpy.mockClear();

      statsService.trackTodoCreated(todo);

      expect(emitSpy).toHaveBeenCalledWith('stats:updated', expect.objectContaining({
        stats: expect.any(Object)
      }));
    });
  });

  describe('Storage persistence', () => {
    it('should load stats from storage', () => {
      stateManager.set('stats', {
        totalCompleted: 50,
        totalCreated: 100,
        currentStreak: 5,
        longestStreak: 10,
        lastCompletionDate: null,
        lastActivityDate: null,
        averageCompletionTime: 0,
        tagStats: {},
        priorityStats: {
          high: { created: 0, completed: 0 },
          medium: { created: 0, completed: 0 },
          low: { created: 0, completed: 0 },
          normal: { created: 0, completed: 0 }
        },
        sourceStats: {
          bifrost: { created: 0, completed: 0 },
          obsidian: { created: 0, completed: 0 }
        },
        weeklyStats: statsService.getEmptyWeeklyStats()
      });

      const service = new StatsService();

      expect(service.stats.totalCompleted).toBe(50);
      expect(service.stats.totalCreated).toBe(100);
      expect(service.stats.currentStreak).toBe(5);
    });

    it('should persist stats after changes', () => {
      const todo = { id: '1', text: 'Test' };
      statsService.trackTodoCreated(todo);

      const saved = stateManager.get('stats');

      expect(saved.totalCreated).toBe(1);
    });

    it('should handle history storage', () => {
      expect(statsService.history).toBeDefined();
      expect(Array.isArray(statsService.history)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors when loading', () => {
      vi.spyOn(stateManager, 'get').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => new StatsService()).not.toThrow();
    });

    it('should use default stats on load error', () => {
      vi.spyOn(stateManager, 'get').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const service = new StatsService();

      expect(service.stats.totalCompleted).toBe(0);
    });

    it('should handle storage errors when saving', () => {
      vi.spyOn(stateManager, 'set').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const todo = { id: '1', text: 'Test' };

      expect(() => statsService.trackTodoCreated(todo)).not.toThrow();
    });
  });
});
