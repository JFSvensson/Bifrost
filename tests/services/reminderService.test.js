import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import reminderService from '../../js/services/reminderService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/core/stateManager.js';

describe('ReminderService', () => {
    beforeEach(() => {
        // Clear state before each test
        stateManager.clear();
        reminderService.reminders = [];
        
        // Stop monitoring during tests
        reminderService.stopMonitoring();
        
        // Clear all event listeners
        eventBus._listeners = {};
    });

    afterEach(() => {
        // Clean up after each test
        reminderService.stopMonitoring();
        reminderService.reminders = [];
        stateManager.clear();
    });

    describe('Initialization', () => {
        it('should initialize with empty reminders array', () => {
            expect(reminderService.reminders).toEqual([]);
        });

        it('should have snooze presets configured', () => {
            expect(reminderService.snoozePresets).toBeDefined();
            expect(reminderService.snoozePresets['10min']).toBe(10 * 60 * 1000);
            expect(reminderService.snoozePresets['1h']).toBe(60 * 60 * 1000);
            expect(reminderService.snoozePresets['1day']).toBe(24 * 60 * 60 * 1000);
        });

        it('should have default notification permission', () => {
            // Permission can be 'default', 'granted', or 'denied' depending on environment
            expect(['default', 'granted', 'denied']).toContain(reminderService.notificationPermission);
        });
    });

    describe('createReminder()', () => {
        it('should create a reminder with required fields', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test reminder',
                remindAt: futureDate
            });

            expect(reminder).toBeDefined();
            expect(reminder.todoId).toBe('todo1');
            expect(reminder.text).toBe('Test reminder');
            expect(reminder.remindAt).toEqual(futureDate);
            expect(reminder.id).toMatch(/^reminder_/);
        });

        it('should set default type to manual', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            expect(reminder.type).toBe('manual');
        });

        it('should set default priority to medium', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            expect(reminder.priority).toBe('medium');
        });

        it('should accept custom type and priority', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate,
                type: 'deadline-relative',
                priority: 'high',
                tags: ['urgent', 'work']
            });

            expect(reminder.type).toBe('deadline-relative');
            expect(reminder.priority).toBe('high');
            expect(reminder.tags).toEqual(['urgent', 'work']);
        });

        it('should add reminder to reminders array', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            expect(reminderService.reminders).toHaveLength(1);
        });

        it('should save to StateManager', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            const stored = stateManager.get('reminders');
            expect(stored).toHaveLength(1);
        });

        it('should emit reminder:created event', () => {
            const handler = vi.fn();
            eventBus.on('reminder:created', handler);

            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            // EventBus passes (data, eventName) to handlers
            expect(handler).toHaveBeenCalledWith(reminder, 'reminder:created');
        });

        it('should throw error when todoId is missing', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            expect(() => {
                reminderService.createReminder({
                    text: 'Test',
                    remindAt: futureDate
                });
            }).toThrow();
        });

        it('should throw error when text is missing', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            expect(() => {
                reminderService.createReminder({
                    todoId: 'todo1',
                    remindAt: futureDate
                });
            }).toThrow();
        });

        it('should throw error when remindAt is missing', () => {
            expect(() => {
                reminderService.createReminder({
                    todoId: 'todo1',
                    text: 'Test'
                });
            }).toThrow();
        });

        it('should throw error when remindAt is not a Date', () => {
            expect(() => {
                reminderService.createReminder({
                    todoId: 'todo1',
                    text: 'Test',
                    remindAt: 'not a date'
                });
            }).toThrow();
        });

        it('should handle past dates with warning', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const pastDate = new Date(Date.now() - 60 * 60 * 1000);
            
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: pastDate
            });

            expect(reminder).toBeDefined();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('snoozeTodo()', () => {
        it('should create snoozed reminder with preset', () => {
            const reminder = reminderService.snoozeTodo('todo1', '10min', {
                text: 'Test todo',
                priority: 'high',
                tags: ['work']
            });

            expect(reminder).toBeDefined();
            expect(reminder.type).toBe('snoozed');
            expect(reminder.todoId).toBe('todo1');
            expect(reminder.text).toBe('Test todo');
            expect(reminder.priority).toBe('high');
        });

        it('should calculate correct snooze time for 10min', () => {
            const now = Date.now();
            const reminder = reminderService.snoozeTodo('todo1', '10min', {
                text: 'Test'
            });

            const expectedTime = now + (10 * 60 * 1000);
            const actualTime = reminder.remindAt.getTime();
            
            // Allow 1 second tolerance
            expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
        });

        it('should calculate correct snooze time for 1h', () => {
            const now = Date.now();
            const reminder = reminderService.snoozeTodo('todo1', '1h', {
                text: 'Test'
            });

            const expectedTime = now + (60 * 60 * 1000);
            const actualTime = reminder.remindAt.getTime();
            
            expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
        });

        it('should remove previous reminders for same todo', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            
            // Create first reminder
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'First',
                remindAt: futureDate
            });

            expect(reminderService.reminders).toHaveLength(1);

            // Snooze same todo
            reminderService.snoozeTodo('todo1', '10min', {
                text: 'Snoozed'
            });

            expect(reminderService.reminders).toHaveLength(1);
            expect(reminderService.reminders[0].type).toBe('snoozed');
        });

        it('should increment snooze count', () => {
            reminderService.snoozeTodo('todo1', '10min', {
                text: 'Test'
            });

            const first = reminderService.reminders[0];
            expect(first.snoozeCount).toBe(1);

            // Snooze again
            reminderService.snoozeTodo('todo1', '10min', {
                text: 'Test'
            });

            const second = reminderService.reminders[0];
            expect(second.snoozeCount).toBe(2);
        });

        it('should emit reminder:todoSnoozed event', () => {
            const handler = vi.fn();
            eventBus.on('reminder:todoSnoozed', handler);

            reminderService.snoozeTodo('todo1', '10min', {
                text: 'Test'
            });

            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0]).toMatchObject({
                todoId: 'todo1',
                preset: '10min'
            });
        });

        it('should throw error when todoId is missing', () => {
            expect(() => {
                reminderService.snoozeTodo(null, '10min', { text: 'Test' });
            }).toThrow();
        });

        it('should throw error when preset is missing', () => {
            expect(() => {
                reminderService.snoozeTodo('todo1', null, { text: 'Test' });
            }).toThrow();
        });

        it('should throw error when todo is missing', () => {
            expect(() => {
                reminderService.snoozeTodo('todo1', '10min', null);
            }).toThrow();
        });
    });

    describe('calculateSnoozeTime()', () => {
        it('should calculate tomorrow9am correctly', () => {
            const result = reminderService.calculateSnoozeTime('tomorrow9am');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            expect(result.getHours()).toBe(9);
            expect(result.getMinutes()).toBe(0);
        });

        it('should calculate nextweek correctly', () => {
            const now = new Date();
            const result = reminderService.calculateSnoozeTime('nextweek');

            // Next week at 9am should be 6-7 days away depending on current time
            const daysDiff = Math.round((result - now) / (1000 * 60 * 60 * 24));
            expect(daysDiff).toBeGreaterThanOrEqual(6);
            expect(daysDiff).toBeLessThanOrEqual(7);
            expect(result.getHours()).toBe(9);
            expect(result.getMinutes()).toBe(0);
        });

        it('should handle custom preset +2h', () => {
            const now = Date.now();
            const result = reminderService.calculateSnoozeTime('+2h');
            const expected = now + (2 * 60 * 60 * 1000);

            expect(Math.abs(result.getTime() - expected)).toBeLessThan(1000);
        });

        it('should handle custom preset +45min', () => {
            const now = Date.now();
            const result = reminderService.calculateSnoozeTime('+45min');
            const expected = now + (45 * 60 * 1000);

            expect(Math.abs(result.getTime() - expected)).toBeLessThan(1000);
        });

        it('should handle custom preset +3d', () => {
            const now = Date.now();
            const result = reminderService.calculateSnoozeTime('+3d');
            const expected = now + (3 * 24 * 60 * 60 * 1000);

            expect(Math.abs(result.getTime() - expected)).toBeLessThan(1000);
        });

        it('should fallback to 1h for unknown preset', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const now = Date.now();
            const result = reminderService.calculateSnoozeTime('unknown');
            const expected = now + (60 * 60 * 1000);

            expect(Math.abs(result.getTime() - expected)).toBeLessThan(1000);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getActiveReminders()', () => {
        it('should return only future reminders', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const pastDate = new Date(Date.now() - 60 * 60 * 1000);

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Future',
                remindAt: futureDate
            });

            reminderService.createReminder({
                todoId: 'todo2',
                text: 'Past',
                remindAt: pastDate
            });

            const active = reminderService.getActiveReminders();
            expect(active).toHaveLength(1);
            expect(active[0].text).toBe('Future');
        });

        it('should exclude triggered reminders', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Active',
                remindAt: futureDate
            });

            reminderService.createReminder({
                todoId: 'todo2',
                text: 'Triggered',
                remindAt: futureDate
            });

            reminderService.reminders[1].triggered = true;

            const active = reminderService.getActiveReminders();
            expect(active).toHaveLength(1);
            expect(active[0].text).toBe('Active');
        });

        it('should sort by remindAt ascending', () => {
            const date1 = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
            const date2 = new Date(Date.now() + 60 * 60 * 1000);  // 1 hour
            const date3 = new Date(Date.now() + 180 * 60 * 1000); // 3 hours

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Second',
                remindAt: date1
            });

            reminderService.createReminder({
                todoId: 'todo2',
                text: 'First',
                remindAt: date2
            });

            reminderService.createReminder({
                todoId: 'todo3',
                text: 'Third',
                remindAt: date3
            });

            const active = reminderService.getActiveReminders();
            expect(active[0].text).toBe('First');
            expect(active[1].text).toBe('Second');
            expect(active[2].text).toBe('Third');
        });
    });

    describe('cancelReminder()', () => {
        it('should remove reminder by id', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            expect(reminderService.reminders).toHaveLength(1);

            reminderService.cancelReminder(reminder.id);

            expect(reminderService.reminders).toHaveLength(0);
        });

        it('should emit reminder:cancelled event', () => {
            const handler = vi.fn();
            eventBus.on('reminder:cancelled', handler);

            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const reminder = reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            reminderService.cancelReminder(reminder.id);

            // EventBus passes (data, eventName) to handlers
            expect(handler).toHaveBeenCalledWith(reminder, 'reminder:cancelled');
        });

        it('should do nothing for non-existent id', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            expect(reminderService.reminders).toHaveLength(1);

            reminderService.cancelReminder('nonexistent');

            expect(reminderService.reminders).toHaveLength(1);
        });
    });

    describe('cancelRemindersForTodo()', () => {
        it('should remove all reminders for todo', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'First',
                remindAt: futureDate
            });

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Second',
                remindAt: futureDate
            });

            reminderService.createReminder({
                todoId: 'todo2',
                text: 'Different',
                remindAt: futureDate
            });

            expect(reminderService.reminders).toHaveLength(3);

            reminderService.cancelRemindersForTodo('todo1');

            expect(reminderService.reminders).toHaveLength(1);
            expect(reminderService.reminders[0].todoId).toBe('todo2');
        });

        it('should emit reminder:todoCancelled event', () => {
            const handler = vi.fn();
            eventBus.on('reminder:todoCancelled', handler);

            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            reminderService.cancelRemindersForTodo('todo1');

            // EventBus passes (data, eventName) to handlers
            expect(handler).toHaveBeenCalledWith({
                todoId: 'todo1',
                count: 1
            }, 'reminder:todoCancelled');
        });
    });

    describe('cleanupOldReminders()', () => {
        it('should remove triggered reminders older than 7 days', () => {
            const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
            const recentDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Old',
                remindAt: oldDate
            });

            reminderService.createReminder({
                todoId: 'todo2',
                text: 'Recent',
                remindAt: recentDate
            });

            reminderService.reminders[0].triggered = true;
            reminderService.reminders[1].triggered = true;

            reminderService.cleanupOldReminders();

            expect(reminderService.reminders).toHaveLength(1);
            expect(reminderService.reminders[0].text).toBe('Recent');
        });

        it('should keep untriggered old reminders', () => {
            const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Old but not triggered',
                remindAt: oldDate
            });

            reminderService.cleanupOldReminders();

            expect(reminderService.reminders).toHaveLength(1);
        });
    });

    describe('getStats()', () => {
        it('should return correct statistics', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const pastDate = new Date(Date.now() - 60 * 60 * 1000);

            // Active reminder
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Active',
                remindAt: futureDate,
                type: 'manual'
            });

            // Snoozed reminder
            reminderService.snoozeTodo('todo2', '10min', {
                text: 'Snoozed'
            });

            // Triggered reminder
            reminderService.createReminder({
                todoId: 'todo3',
                text: 'Triggered',
                remindAt: pastDate
            });
            reminderService.reminders[2].triggered = true;

            const stats = reminderService.getStats();

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(2);
            expect(stats.snoozed).toBe(1);
            expect(stats.triggered).toBe(1);
        });
    });

    describe('loadReminders() / saveReminders()', () => {
        it('should persist reminders to StateManager', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            
            reminderService.createReminder({
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate
            });

            const stored = stateManager.get('reminders');
            expect(stored).toHaveLength(1);
            expect(stored[0].text).toBe('Test');
        });

        it('should load reminders from StateManager', () => {
            const futureDate = new Date(Date.now() + 60 * 60 * 1000);
            const testReminder = {
                id: 'test_id',
                todoId: 'todo1',
                text: 'Test',
                remindAt: futureDate.toISOString(),
                createdAt: new Date().toISOString(),
                type: 'manual',
                priority: 'medium',
                tags: [],
                triggered: false,
                snoozeCount: 0
            };

            stateManager.set('reminders', [testReminder]);

            reminderService.loadReminders();

            expect(reminderService.reminders).toHaveLength(1);
            expect(reminderService.reminders[0].text).toBe('Test');
            expect(reminderService.reminders[0].remindAt).toBeInstanceOf(Date);
        });

        it('should handle empty storage', () => {
            reminderService.loadReminders();
            expect(reminderService.reminders).toEqual([]);
        });
    });

    describe('Monitoring', () => {
        it('should start monitoring with interval', () => {
            reminderService.startMonitoring(100);
            expect(reminderService.checkInterval).toBeDefined();
            reminderService.stopMonitoring();
        });

        it('should stop monitoring', () => {
            reminderService.startMonitoring(100);
            reminderService.stopMonitoring();
            expect(reminderService.checkInterval).toBeNull();
        });

        it('should not start monitoring twice', () => {
            reminderService.startMonitoring(100);
            const firstInterval = reminderService.checkInterval;
            
            reminderService.startMonitoring(100);
            const secondInterval = reminderService.checkInterval;
            
            expect(secondInterval).not.toBe(firstInterval);
            reminderService.stopMonitoring();
        });
    });
});
