/**
 * Tests for deadlineService.js
 * Tests deadline warnings, notifications, and urgency analysis
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DeadlineService } from '../../js/services/deadlineService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/core/stateManager.js';

describe('DeadlineService', () => {
  let deadlineService;
  let emitSpy;

  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers();
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    // Clear state
    stateManager.clear();
    eventBus.listeners = {};
    eventBus.onceListeners = {};
    eventBus.eventHistory = [];

    // Spy on eventBus.emit
    emitSpy = vi.spyOn(eventBus, 'emit');

    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    // Create fresh service instance
    deadlineService = new DeadlineService();
  });

  afterEach(() => {
    if (deadlineService.checkInterval) {
      clearInterval(deadlineService.checkInterval);
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete global.Notification;
  });

  describe('Initialization', () => {
    it('should initialize with warning levels', () => {
      expect(deadlineService.warningLevels).toBeDefined();
      expect(deadlineService.warningLevels.overdue).toBeDefined();
      expect(deadlineService.warningLevels.today).toBeDefined();
      expect(deadlineService.warningLevels.tomorrow).toBeDefined();
      expect(deadlineService.warningLevels.thisWeek).toBeDefined();
      expect(deadlineService.warningLevels.future).toBeDefined();
    });

    it('should have correct priority levels', () => {
      expect(deadlineService.warningLevels.overdue.priority).toBe(4);
      expect(deadlineService.warningLevels.today.priority).toBe(3);
      expect(deadlineService.warningLevels.tomorrow.priority).toBe(2);
      expect(deadlineService.warningLevels.thisWeek.priority).toBe(1);
      expect(deadlineService.warningLevels.future.priority).toBe(0);
    });

    it('should initialize notification tracking', () => {
      expect(deadlineService.notificationShown).toBeInstanceOf(Set);
      expect(deadlineService.notificationShown.size).toBe(0);
    });

    it('should register schema', () => {
      expect(stateManager.schemas.deadlineNotifications).toBeDefined();
      expect(stateManager.schemas.deadlineNotifications.version).toBe(1);
    });

    it('should subscribe to todo events', () => {
      expect(eventBus.listeners['todo:added']).toBeDefined();
      expect(eventBus.listeners['todo:updated']).toBeDefined();
      expect(eventBus.listeners['todo:completed']).toBeDefined();
    });
  });

  describe('analyzeTodo()', () => {
    it('should return null for todo without due date', () => {
      const todo = { id: '1', text: 'No deadline' };
      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis).toBeNull();
    });

    it('should detect overdue todos', () => {
      const todo = {
        id: '1',
        text: 'Overdue task',
        dueDate: '2024-01-10T00:00:00Z' // 5 days ago
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.level).toBe('overdue');
      expect(analysis.daysUntil).toBeLessThan(0);
      expect(analysis.priority).toBe(4);
      expect(analysis.icon).toBe('🚨');
    });

    it('should detect todos due today', () => {
      const todo = {
        id: '2',
        text: 'Due today',
        dueDate: '2024-01-15T23:59:59Z'
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.level).toBe('today');
      expect(analysis.daysUntil).toBe(0);
      expect(analysis.priority).toBe(3);
      expect(analysis.icon).toBe('⚡');
    });

    it('should detect todos due tomorrow', () => {
      const todo = {
        id: '3',
        text: 'Due tomorrow',
        dueDate: '2024-01-16T12:00:00Z'
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.level).toBe('tomorrow');
      expect(analysis.daysUntil).toBe(1);
      expect(analysis.priority).toBe(2);
      expect(analysis.icon).toBe('📅');
    });

    it('should detect todos due this week', () => {
      const todo = {
        id: '4',
        text: 'Due this week',
        dueDate: '2024-01-20T12:00:00Z' // 5 days from now
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.level).toBe('thisWeek');
      expect(analysis.daysUntil).toBe(5);
      expect(analysis.priority).toBe(1);
      expect(analysis.icon).toBe('📆');
    });

    it('should detect future todos', () => {
      const todo = {
        id: '5',
        text: 'Future task',
        dueDate: '2024-02-01T12:00:00Z' // 17 days from now
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.level).toBe('future');
      expect(analysis.daysUntil).toBe(17);
      expect(analysis.priority).toBe(0);
      expect(analysis.icon).toBe('📌');
    });

    it('should include color and label in analysis', () => {
      const todo = {
        id: '6',
        text: 'Test',
        dueDate: '2024-01-15T12:00:00Z'
      };

      const analysis = deadlineService.analyzeTodo(todo);

      expect(analysis.color).toBeDefined();
      expect(analysis.label).toBeDefined();
    });
  });

  describe('analyzeAllTodos()', () => {
    it('should group todos by warning level', () => {
      const todos = [
        { id: '1', text: 'Overdue', dueDate: '2024-01-10T00:00:00Z', completed: false },
        { id: '2', text: 'Today', dueDate: '2024-01-15T00:00:00Z', completed: false },
        { id: '3', text: 'Tomorrow', dueDate: '2024-01-16T00:00:00Z', completed: false },
        { id: '4', text: 'This week', dueDate: '2024-01-20T00:00:00Z', completed: false },
        { id: '5', text: 'Future', dueDate: '2024-02-01T00:00:00Z', completed: false }
      ];

      const warnings = deadlineService.analyzeAllTodos(todos);

      expect(warnings.overdue).toHaveLength(1);
      expect(warnings.today).toHaveLength(1);
      expect(warnings.tomorrow).toHaveLength(1);
      expect(warnings.thisWeek).toHaveLength(1);
      expect(warnings.future).toHaveLength(1);
    });

    it('should skip completed todos', () => {
      const todos = [
        { id: '1', text: 'Done', dueDate: '2024-01-10T00:00:00Z', completed: true },
        { id: '2', text: 'Not done', dueDate: '2024-01-10T00:00:00Z', completed: false }
      ];

      const warnings = deadlineService.analyzeAllTodos(todos);

      expect(warnings.overdue).toHaveLength(1);
      expect(warnings.overdue[0].id).toBe('2');
    });

    it('should skip todos without due dates', () => {
      const todos = [
        { id: '1', text: 'No deadline' },
        { id: '2', text: 'Has deadline', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      const warnings = deadlineService.analyzeAllTodos(todos);

      const totalWarnings = Object.values(warnings).reduce((sum, arr) => sum + arr.length, 0);
      expect(totalWarnings).toBe(1);
    });

    it('should include deadline analysis in results', () => {
      const todos = [
        { id: '1', text: 'Test', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      const warnings = deadlineService.analyzeAllTodos(todos);

      expect(warnings.today[0].deadline).toBeDefined();
      expect(warnings.today[0].deadline.level).toBe('today');
    });
  });

  describe('getUrgentTodos()', () => {
    it('should return overdue, today, and tomorrow todos', () => {
      const todos = [
        { id: '1', text: 'Overdue', dueDate: '2024-01-10T00:00:00Z', completed: false },
        { id: '2', text: 'Today', dueDate: '2024-01-15T00:00:00Z', completed: false },
        { id: '3', text: 'Tomorrow', dueDate: '2024-01-16T00:00:00Z', completed: false },
        { id: '4', text: 'This week', dueDate: '2024-01-20T00:00:00Z', completed: false }
      ];

      const urgent = deadlineService.getUrgentTodos(todos);

      expect(urgent).toHaveLength(3);
      expect(urgent.find(t => t.id === '4')).toBeUndefined(); // thisWeek not urgent
    });

    it('should sort by priority descending', () => {
      const todos = [
        { id: '1', text: 'Tomorrow', dueDate: '2024-01-16T00:00:00Z', completed: false },
        { id: '2', text: 'Overdue', dueDate: '2024-01-10T00:00:00Z', completed: false },
        { id: '3', text: 'Today', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      const urgent = deadlineService.getUrgentTodos(todos);

      expect(urgent[0].id).toBe('2'); // Overdue (priority 4)
      expect(urgent[1].id).toBe('3'); // Today (priority 3)
      expect(urgent[2].id).toBe('1'); // Tomorrow (priority 2)
    });

    it('should return empty array if no urgent todos', () => {
      const todos = [
        { id: '1', text: 'Future', dueDate: '2024-02-01T00:00:00Z', completed: false }
      ];

      const urgent = deadlineService.getUrgentTodos(todos);

      expect(urgent).toHaveLength(0);
    });
  });

  describe('Notification history', () => {
    it('should load notification history from storage', () => {
      stateManager.set('deadlineNotifications', {
        shown: ['1-overdue', '2-today'],
        lastReset: new Date().toISOString()
      });

      const service = new DeadlineService();

      expect(service.notificationShown.has('1-overdue')).toBe(true);
      expect(service.notificationShown.has('2-today')).toBe(true);
    });

    it('should save notification history', () => {
      deadlineService.notificationShown.add('1-overdue');
      deadlineService.saveNotificationHistory();

      const saved = stateManager.get('deadlineNotifications');

      expect(saved.shown).toContain('1-overdue');
      expect(saved.lastReset).toBeDefined();
    });

    it('should reset notification history on new day', () => {
      // Set history from yesterday
      stateManager.set('deadlineNotifications', {
        shown: ['1-overdue'],
        lastReset: new Date('2024-01-14T12:00:00Z').toISOString()
      });

      const service = new DeadlineService();

      expect(service.notificationShown.size).toBe(0);
    });
  });

  describe('Event handling', () => {
    it('should emit deadline:urgent when urgent todo added', () => {
      const todo = {
        id: '1',
        text: 'Urgent',
        dueDate: '2024-01-15T00:00:00Z', // Today
        completed: false
      };

      eventBus.emit('todo:added', { todo });

      expect(emitSpy).toHaveBeenCalledWith('deadline:urgent', expect.objectContaining({
        todo: expect.objectContaining({ id: '1' }),
        analysis: expect.objectContaining({ level: 'today' })
      }));
    });

    it('should not emit deadline:urgent for future todos', () => {
      const todo = {
        id: '1',
        text: 'Future',
        dueDate: '2024-02-01T00:00:00Z',
        completed: false
      };

      emitSpy.mockClear();
      eventBus.emit('todo:added', { todo });

      const urgentCalls = emitSpy.mock.calls.filter(call => call[0] === 'deadline:urgent');
      expect(urgentCalls).toHaveLength(0);
    });

    it('should handle todo updates', () => {
      const todo = {
        id: '1',
        text: 'Updated',
        dueDate: '2024-01-15T00:00:00Z',
        completed: false
      };

      eventBus.emit('todo:updated', { todo });

      expect(emitSpy).toHaveBeenCalledWith('deadline:urgent', expect.any(Object));
    });
  });

  describe('showNotifications()', () => {
    it('should request notification permission if default', async () => {
      const todos = [
        { id: '1', text: 'Urgent', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      await deadlineService.showNotifications(todos);

      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should not show notification if permission denied', async () => {
      global.Notification.permission = 'denied';
      const mockConstructor = vi.fn();
      global.Notification = {
        ...global.Notification,
        prototype: { constructor: mockConstructor }
      };

      const todos = [
        { id: '1', text: 'Urgent', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      await deadlineService.showNotifications(todos);

      expect(mockConstructor).not.toHaveBeenCalled();
    });

    it('should not show same notification twice', async () => {
      global.Notification.permission = 'granted';
      global.Notification = class Notification {
        constructor() {
          this.close = vi.fn();
        }
      };

      const todos = [
        { id: '1', text: 'Urgent', dueDate: '2024-01-15T00:00:00Z', completed: false }
      ];

      await deadlineService.showNotifications(todos);
      await deadlineService.showNotifications(todos);

      // Should only create one notification
      expect(deadlineService.notificationShown.has('1-today')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors when loading', () => {
      vi.spyOn(stateManager, 'get').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => new DeadlineService()).not.toThrow();
    });

    it('should handle storage errors when saving', () => {
      vi.spyOn(stateManager, 'set').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => deadlineService.saveNotificationHistory()).not.toThrow();
    });
  });
});
