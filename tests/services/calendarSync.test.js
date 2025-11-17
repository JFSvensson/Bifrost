/**
 * Tests for CalendarSyncService
 * Comprehensive test coverage for calendar synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalendarSyncService } from '../../js/services/calendarSync.js';
import { googleCalendarService } from '../../js/services/googleCalendarService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/core/stateManager.js';

describe('CalendarSyncService', () => {
    let service;
    let mockGoogleCalendarService;
    let mockEventBus;
    let mockStateManager;
    let mockGetTodos;

    beforeEach(() => {
        vi.clearAllTimers();
        vi.useFakeTimers();

        // Mock googleCalendarService
        mockGoogleCalendarService = {
            isAuthenticated: vi.fn(() => true),
            createEventFromTodo: vi.fn(),
            updateEvent: vi.fn(),
            deleteEvent: vi.fn(),
            getUpcomingEvents: vi.fn(),
            formatEvent: vi.fn()
        };
        Object.assign(googleCalendarService, mockGoogleCalendarService);

        // Mock eventBus
        mockEventBus = {
            emit: vi.fn()
        };
        Object.assign(eventBus, mockEventBus);

        // Mock stateManager
        mockStateManager = {
            registerSchema: vi.fn(),
            get: vi.fn(() => ({})),
            set: vi.fn()
        };
        Object.assign(stateManager, mockStateManager);

        // Mock getTodos callback
        mockGetTodos = vi.fn(() => []);

        // Create service instance
        service = new CalendarSyncService();
    });

    afterEach(() => {
        if (service) {
            service.destroy();
        }
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(service.syncEnabled).toBe(false);
            expect(service.syncInterval).toBeNull();
            expect(service.syncFrequency).toBe(5 * 60 * 1000); // 5 minutes
            expect(service.lastSync).toBeNull();
            expect(service.syncedTodos).toBeInstanceOf(Map);
            expect(service.syncedTodos.size).toBe(0);
        });

        it('should register StateManager schema', () => {
            expect(mockStateManager.registerSchema).toHaveBeenCalledWith(
                'calendarSyncMappings',
                expect.objectContaining({
                    version: 1,
                    validate: expect.any(Function),
                    migrate: expect.any(Function),
                    default: {}
                })
            );
        });

        it('should load sync mappings on initialization', () => {
            expect(mockStateManager.get).toHaveBeenCalledWith('calendarSyncMappings');
        });

        it('should load existing mappings from storage', () => {
            mockStateManager.get.mockReturnValue({
                'todo1': 'event1',
                'todo2': 'event2'
            });

            const newService = new CalendarSyncService();
            expect(newService.syncedTodos.size).toBe(2);
            expect(newService.syncedTodos.get('todo1')).toBe('event1');
            expect(newService.syncedTodos.get('todo2')).toBe('event2');
        });

        it('should handle empty storage gracefully', () => {
            mockStateManager.get.mockReturnValue(null);

            const newService = new CalendarSyncService();
            expect(newService.syncedTodos.size).toBe(0);
        });
    });

    describe('loadSyncMappings()', () => {
        it('should load mappings from StateManager', () => {
            mockStateManager.get.mockReturnValue({
                'todo1': 'event1',
                'todo2': 'event2'
            });

            service.loadSyncMappings();

            expect(service.syncedTodos.size).toBe(2);
            expect(service.syncedTodos.get('todo1')).toBe('event1');
        });

        it('should handle storage errors gracefully', () => {
            mockStateManager.get.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => service.loadSyncMappings()).not.toThrow();
        });

        it('should handle null data', () => {
            mockStateManager.get.mockReturnValue(null);

            service.loadSyncMappings();

            expect(service.syncedTodos.size).toBe(0);
        });

        it('should handle empty object', () => {
            mockStateManager.get.mockReturnValue({});

            service.loadSyncMappings();

            expect(service.syncedTodos.size).toBe(0);
        });
    });

    describe('saveSyncMappings()', () => {
        it('should save mappings to StateManager', () => {
            service.syncedTodos.set('todo1', 'event1');
            service.syncedTodos.set('todo2', 'event2');

            service.saveSyncMappings();

            expect(mockStateManager.set).toHaveBeenCalledWith(
                'calendarSyncMappings',
                {
                    'todo1': 'event1',
                    'todo2': 'event2'
                }
            );
        });

        it('should save empty object when no mappings', () => {
            service.saveSyncMappings();

            expect(mockStateManager.set).toHaveBeenCalledWith(
                'calendarSyncMappings',
                {}
            );
        });

        it('should handle storage errors gracefully', () => {
            mockStateManager.set.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => service.saveSyncMappings()).not.toThrow();
        });
    });

    describe('enableSync()', () => {
        it('should enable sync with callback', () => {
            service.enableSync(mockGetTodos);

            expect(service.syncEnabled).toBe(true);
            expect(service.getTodosCallback).toBe(mockGetTodos);
        });

        it('should start periodic sync', () => {
            service.enableSync(mockGetTodos);

            expect(service.syncInterval).not.toBeNull();
        });

        it('should emit calendar:syncEnabled event', () => {
            service.enableSync(mockGetTodos);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:syncEnabled',
                { frequency: 5 * 60 * 1000 }
            );
        });

        it('should perform initial sync', async () => {
            const performSyncSpy = vi.spyOn(service, 'performSync');

            service.enableSync(mockGetTodos);

            expect(performSyncSpy).toHaveBeenCalled();
        });

        it('should not enable sync twice', () => {
            service.enableSync(mockGetTodos);
            const firstInterval = service.syncInterval;

            service.enableSync(mockGetTodos);
            const secondInterval = service.syncInterval;

            expect(firstInterval).toBe(secondInterval);
        });

        it('should trigger sync every 5 minutes', async () => {
            const performSyncSpy = vi.spyOn(service, 'performSync');
            performSyncSpy.mockResolvedValue();

            service.enableSync(mockGetTodos);

            // Clear initial sync call
            performSyncSpy.mockClear();

            // Advance time by 5 minutes
            vi.advanceTimersByTime(5 * 60 * 1000);

            expect(performSyncSpy).toHaveBeenCalledTimes(1);

            // Advance time by another 5 minutes
            vi.advanceTimersByTime(5 * 60 * 1000);

            expect(performSyncSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('disableSync()', () => {
        beforeEach(() => {
            service.enableSync(mockGetTodos);
            mockEventBus.emit.mockClear();
        });

        it('should disable sync', () => {
            service.disableSync();

            expect(service.syncEnabled).toBe(false);
            expect(service.syncInterval).toBeNull();
        });

        it('should clear sync interval', () => {
            const intervalId = service.syncInterval;

            service.disableSync();

            expect(service.syncInterval).toBeNull();
        });

        it('should emit calendar:syncDisabled event', () => {
            service.disableSync();

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:syncDisabled',
                {}
            );
        });

        it('should not error if already disabled', () => {
            service.disableSync();

            expect(() => service.disableSync()).not.toThrow();
        });
    });

    describe('performSync()', () => {
        beforeEach(() => {
            service.getTodosCallback = mockGetTodos;
        });

        it('should skip sync if not authenticated', async () => {
            mockGoogleCalendarService.isAuthenticated.mockReturnValue(false);

            await service.performSync();

            expect(mockGetTodos).not.toHaveBeenCalled();
        });

        it('should skip sync if no getTodosCallback', async () => {
            service.getTodosCallback = null;

            await service.performSync();

            // Should return early without errors
            expect(mockGoogleCalendarService.isAuthenticated).toHaveBeenCalled();
        });

        it('should call getTodosCallback', async () => {
            await service.performSync();

            expect(mockGetTodos).toHaveBeenCalled();
        });

        it('should sync todos to calendar', async () => {
            const syncSpy = vi.spyOn(service, 'syncTodosToCalendar').mockResolvedValue();

            await service.performSync();

            expect(syncSpy).toHaveBeenCalled();
        });

        it('should update lastSync timestamp', async () => {
            const beforeSync = new Date();

            await service.performSync();

            expect(service.lastSync).toBeInstanceOf(Date);
            expect(service.lastSync.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
        });

        it('should emit calendar:synced event', async () => {
            await service.performSync();

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:synced',
                expect.objectContaining({ timestamp: expect.any(Date) })
            );
        });

        it('should handle sync errors gracefully', async () => {
            mockGetTodos.mockImplementation(() => {
                throw new Error('Sync error');
            });

            await expect(service.performSync()).resolves.not.toThrow();
        });
    });

    describe('syncTodosToCalendar()', () => {
        it('should sync todos with due dates', async () => {
            const todos = [
                { id: 'todo1', text: 'Test 1', dueDate: '2025-12-01', completed: false, source: 'bifrost' },
                { id: 'todo2', text: 'Test 2', dueDate: '2025-12-02', completed: false, source: 'bifrost' }
            ];

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.syncTodosToCalendar(todos);

            expect(mockGoogleCalendarService.createEventFromTodo).toHaveBeenCalledTimes(2);
        });

        it('should skip todos without due dates', async () => {
            const todos = [
                { id: 'todo1', text: 'No date', completed: false, source: 'bifrost' }
            ];

            await service.syncTodosToCalendar(todos);

            expect(mockGoogleCalendarService.createEventFromTodo).not.toHaveBeenCalled();
        });

        it('should skip completed todos', async () => {
            const todos = [
                { id: 'todo1', text: 'Completed', dueDate: '2025-12-01', completed: true, source: 'bifrost' }
            ];

            await service.syncTodosToCalendar(todos);

            expect(mockGoogleCalendarService.createEventFromTodo).not.toHaveBeenCalled();
        });

        it('should skip calendar-sourced todos', async () => {
            const todos = [
                { id: 'todo1', text: 'From calendar', dueDate: '2025-12-01', completed: false, source: 'calendar' }
            ];

            await service.syncTodosToCalendar(todos);

            expect(mockGoogleCalendarService.createEventFromTodo).not.toHaveBeenCalled();
        });

        it('should update existing synced todos', async () => {
            const todos = [
                { id: 'todo1', text: 'Updated', dueDate: '2025-12-01', completed: false, source: 'bifrost' }
            ];

            service.syncedTodos.set('todo1', 'event1');
            const updateSpy = vi.spyOn(service, 'updateCalendarEvent').mockResolvedValue();

            await service.syncTodosToCalendar(todos);

            expect(updateSpy).toHaveBeenCalledWith(todos[0]);
        });

        it('should create events for new todos', async () => {
            const todos = [
                { id: 'todo1', text: 'New', dueDate: '2025-12-01', completed: false, source: 'bifrost' }
            ];

            const createSpy = vi.spyOn(service, 'createCalendarEvent').mockResolvedValue({ id: 'event1' });

            await service.syncTodosToCalendar(todos);

            expect(createSpy).toHaveBeenCalledWith(todos[0]);
        });

        it('should cleanup deleted todos', async () => {
            const todos = [];

            const cleanupSpy = vi.spyOn(service, 'cleanupDeletedTodos').mockResolvedValue();

            await service.syncTodosToCalendar(todos);

            expect(cleanupSpy).toHaveBeenCalledWith(todos);
        });

        it('should handle sync errors for individual todos', async () => {
            const todos = [
                { id: 'todo1', text: 'Error', dueDate: '2025-12-01', completed: false, source: 'bifrost' },
                { id: 'todo2', text: 'Success', dueDate: '2025-12-02', completed: false, source: 'bifrost' }
            ];

            mockGoogleCalendarService.createEventFromTodo
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce({ id: 'event2' });

            await expect(service.syncTodosToCalendar(todos)).resolves.not.toThrow();
        });
    });

    describe('createCalendarEvent()', () => {
        it('should create calendar event from todo', async () => {
            const todo = {
                id: 'todo1',
                text: 'Test todo',
                dueDate: '2025-12-01',
                priority: 'high'
            };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            const event = await service.createCalendarEvent(todo);

            expect(mockGoogleCalendarService.createEventFromTodo).toHaveBeenCalledWith(todo);
            expect(event.id).toBe('event1');
        });

        it('should store mapping after creation', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.createCalendarEvent(todo);

            expect(service.syncedTodos.get('todo1')).toBe('event1');
        });

        it('should save mappings after creation', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.createCalendarEvent(todo);

            expect(mockStateManager.set).toHaveBeenCalled();
        });

        it('should emit calendar:todoSynced event', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };
            const event = { id: 'event1' };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue(event);

            await service.createCalendarEvent(todo);

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:todoSynced',
                { todo, event }
            );
        });

        it('should handle API errors', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            mockGoogleCalendarService.createEventFromTodo.mockRejectedValue(new Error('API Error'));

            await expect(service.createCalendarEvent(todo)).rejects.toThrow('API Error');
        });
    });

    describe('updateCalendarEvent()', () => {
        it('should update existing calendar event', async () => {
            const todo = {
                id: 'todo1',
                text: 'Updated todo',
                dueDate: '2025-12-01',
                priority: 'high'
            };

            service.syncedTodos.set('todo1', 'event1');

            await service.updateCalendarEvent(todo);

            expect(mockGoogleCalendarService.updateEvent).toHaveBeenCalledWith(
                'event1',
                expect.objectContaining({
                    summary: 'Updated todo',
                    description: expect.stringContaining('Priority: high'),
                    start: { date: '2025-12-01' },
                    end: { date: '2025-12-01' }
                })
            );
        });

        it('should return early if todo not synced', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            await service.updateCalendarEvent(todo);

            expect(mockGoogleCalendarService.updateEvent).not.toHaveBeenCalled();
        });

        it('should handle priority in description', async () => {
            const todo = {
                id: 'todo1',
                text: 'Test',
                dueDate: '2025-12-01',
                priority: 'low'
            };

            service.syncedTodos.set('todo1', 'event1');

            await service.updateCalendarEvent(todo);

            expect(mockGoogleCalendarService.updateEvent).toHaveBeenCalledWith(
                'event1',
                expect.objectContaining({
                    description: expect.stringContaining('Priority: low')
                })
            );
        });

        it('should default priority to normal', async () => {
            const todo = {
                id: 'todo1',
                text: 'Test',
                dueDate: '2025-12-01'
            };

            service.syncedTodos.set('todo1', 'event1');

            await service.updateCalendarEvent(todo);

            expect(mockGoogleCalendarService.updateEvent).toHaveBeenCalledWith(
                'event1',
                expect.objectContaining({
                    description: expect.stringContaining('Priority: normal')
                })
            );
        });

        it('should remove mapping if event deleted (404)', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            service.syncedTodos.set('todo1', 'event1');

            mockGoogleCalendarService.updateEvent.mockRejectedValue({ status: 404 });

            await service.updateCalendarEvent(todo);

            expect(service.syncedTodos.has('todo1')).toBe(false);
        });

        it('should save mappings after removing 404 event', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            service.syncedTodos.set('todo1', 'event1');

            mockGoogleCalendarService.updateEvent.mockRejectedValue({ status: 404 });

            await service.updateCalendarEvent(todo);

            expect(mockStateManager.set).toHaveBeenCalled();
        });

        it('should handle other API errors gracefully', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01' };

            service.syncedTodos.set('todo1', 'event1');

            mockGoogleCalendarService.updateEvent.mockRejectedValue({ status: 500 });

            await expect(service.updateCalendarEvent(todo)).resolves.not.toThrow();
        });
    });

    describe('cleanupDeletedTodos()', () => {
        it('should delete calendar events for removed todos', async () => {
            service.syncedTodos.set('todo1', 'event1');
            service.syncedTodos.set('todo2', 'event2');

            const currentTodos = [
                { id: 'todo1', text: 'Still here' }
            ];

            await service.cleanupDeletedTodos(currentTodos);

            expect(mockGoogleCalendarService.deleteEvent).toHaveBeenCalledWith('event2');
        });

        it('should remove mappings for deleted todos', async () => {
            service.syncedTodos.set('todo1', 'event1');
            service.syncedTodos.set('todo2', 'event2');

            const currentTodos = [
                { id: 'todo1', text: 'Still here' }
            ];

            await service.cleanupDeletedTodos(currentTodos);

            expect(service.syncedTodos.has('todo2')).toBe(false);
            expect(service.syncedTodos.has('todo1')).toBe(true);
        });

        it('should save mappings after cleanup', async () => {
            service.syncedTodos.set('todo1', 'event1');

            const currentTodos = [];

            await service.cleanupDeletedTodos(currentTodos);

            expect(mockStateManager.set).toHaveBeenCalled();
        });

        it('should handle delete errors gracefully', async () => {
            service.syncedTodos.set('todo1', 'event1');

            const currentTodos = [];

            mockGoogleCalendarService.deleteEvent.mockRejectedValue(new Error('Delete error'));

            await expect(service.cleanupDeletedTodos(currentTodos)).resolves.not.toThrow();
        });

        it('should do nothing if all todos still exist', async () => {
            service.syncedTodos.set('todo1', 'event1');
            service.syncedTodos.set('todo2', 'event2');

            const currentTodos = [
                { id: 'todo1', text: 'Test 1' },
                { id: 'todo2', text: 'Test 2' }
            ];

            await service.cleanupDeletedTodos(currentTodos);

            expect(mockGoogleCalendarService.deleteEvent).not.toHaveBeenCalled();
        });
    });

    describe('syncTodoToCalendar()', () => {
        it('should throw error if todo has no due date', async () => {
            const todo = { id: 'todo1', text: 'No date' };

            await expect(service.syncTodoToCalendar(todo)).rejects.toThrow('must have a due date');
        });

        it('should delete event if todo is completed', async () => {
            const todo = { id: 'todo1', text: 'Done', dueDate: '2025-12-01', completed: true };

            service.syncedTodos.set('todo1', 'event1');

            await service.syncTodoToCalendar(todo);

            expect(mockGoogleCalendarService.deleteEvent).toHaveBeenCalledWith('event1');
            expect(service.syncedTodos.has('todo1')).toBe(false);
        });

        it('should not delete if completed todo not synced', async () => {
            const todo = { id: 'todo1', text: 'Done', dueDate: '2025-12-01', completed: true };

            await service.syncTodoToCalendar(todo);

            expect(mockGoogleCalendarService.deleteEvent).not.toHaveBeenCalled();
        });

        it('should update event if already synced', async () => {
            const todo = { id: 'todo1', text: 'Update', dueDate: '2025-12-01', completed: false };

            service.syncedTodos.set('todo1', 'event1');

            const updateSpy = vi.spyOn(service, 'updateCalendarEvent').mockResolvedValue();

            await service.syncTodoToCalendar(todo);

            expect(updateSpy).toHaveBeenCalledWith(todo);
        });

        it('should create event if not synced', async () => {
            const todo = { id: 'todo1', text: 'New', dueDate: '2025-12-01', completed: false };

            const createSpy = vi.spyOn(service, 'createCalendarEvent').mockResolvedValue({ id: 'event1' });

            await service.syncTodoToCalendar(todo);

            expect(createSpy).toHaveBeenCalledWith(todo);
        });
    });

    describe('unsyncTodo()', () => {
        it('should delete calendar event', async () => {
            service.syncedTodos.set('todo1', 'event1');

            await service.unsyncTodo('todo1');

            expect(mockGoogleCalendarService.deleteEvent).toHaveBeenCalledWith('event1');
        });

        it('should remove mapping', async () => {
            service.syncedTodos.set('todo1', 'event1');

            await service.unsyncTodo('todo1');

            expect(service.syncedTodos.has('todo1')).toBe(false);
        });

        it('should save mappings', async () => {
            service.syncedTodos.set('todo1', 'event1');

            await service.unsyncTodo('todo1');

            expect(mockStateManager.set).toHaveBeenCalled();
        });

        it('should return early if todo not synced', async () => {
            await service.unsyncTodo('nonexistent');

            expect(mockGoogleCalendarService.deleteEvent).not.toHaveBeenCalled();
        });

        it('should handle delete errors gracefully', async () => {
            service.syncedTodos.set('todo1', 'event1');

            mockGoogleCalendarService.deleteEvent.mockRejectedValue(new Error('Delete error'));

            await expect(service.unsyncTodo('todo1')).resolves.not.toThrow();
        });
    });

    describe('isSynced()', () => {
        it('should return true if todo is synced', () => {
            service.syncedTodos.set('todo1', 'event1');

            expect(service.isSynced('todo1')).toBe(true);
        });

        it('should return false if todo is not synced', () => {
            expect(service.isSynced('nonexistent')).toBe(false);
        });
    });

    describe('getEventId()', () => {
        it('should return event ID for synced todo', () => {
            service.syncedTodos.set('todo1', 'event1');

            expect(service.getEventId('todo1')).toBe('event1');
        });

        it('should return undefined for unsynced todo', () => {
            expect(service.getEventId('nonexistent')).toBeUndefined();
        });
    });

    describe('getSyncStatus()', () => {
        it('should return sync status when disabled', () => {
            const status = service.getSyncStatus();

            expect(status).toEqual({
                enabled: false,
                lastSync: null,
                syncedCount: 0,
                authenticated: true
            });
        });

        it('should return sync status when enabled', () => {
            service.enableSync(mockGetTodos);
            service.lastSync = new Date('2025-12-01');
            service.syncedTodos.set('todo1', 'event1');

            const status = service.getSyncStatus();

            expect(status).toEqual({
                enabled: true,
                lastSync: new Date('2025-12-01'),
                syncedCount: 1,
                authenticated: true
            });
        });

        it('should reflect authentication status', () => {
            mockGoogleCalendarService.isAuthenticated.mockReturnValue(false);

            const status = service.getSyncStatus();

            expect(status.authenticated).toBe(false);
        });
    });

    describe('createTodoFromEvent()', () => {
        it('should create todo from calendar event', async () => {
            const event = {
                id: 'event1',
                summary: 'Meeting',
                description: 'Important meeting',
                start: { dateTime: '2025-12-01T10:00:00Z' }
            };

            mockGoogleCalendarService.formatEvent.mockReturnValue({
                title: 'Meeting',
                description: 'Important meeting',
                start: new Date('2025-12-01T10:00:00Z'),
                end: new Date('2025-12-01T11:00:00Z')
            });

            const todo = await service.createTodoFromEvent(event);

            expect(todo).toEqual({
                text: 'Meeting',
                completed: false,
                source: 'calendar',
                priority: 'normal',
                dueDate: '2025-12-01',
                id: 'calendar-event1',
                calendarEventId: 'event1',
                description: 'Important meeting',
                createdAt: expect.any(Date)
            });
        });

        it('should call formatEvent', async () => {
            const event = { id: 'event1' };

            mockGoogleCalendarService.formatEvent.mockReturnValue({
                title: 'Test',
                start: new Date('2025-12-01'),
                end: new Date('2025-12-01')
            });

            await service.createTodoFromEvent(event);

            expect(mockGoogleCalendarService.formatEvent).toHaveBeenCalledWith(event);
        });
    });

    describe('syncCalendarToTodos()', () => {
        it('should get upcoming events', async () => {
            mockGoogleCalendarService.getUpcomingEvents.mockResolvedValue([]);

            await service.syncCalendarToTodos();

            expect(mockGoogleCalendarService.getUpcomingEvents).toHaveBeenCalledWith(7);
        });

        it('should filter out already synced events', async () => {
            service.syncedTodos.set('todo1', 'event1');

            mockGoogleCalendarService.getUpcomingEvents.mockResolvedValue([
                { id: 'event1', summary: 'Synced' },
                { id: 'event2', summary: 'New' }
            ]);

            const newEvents = await service.syncCalendarToTodos();

            expect(newEvents).toHaveLength(1);
            expect(newEvents[0].id).toBe('event2');
        });

        it('should emit calendar:newEvents for new events', async () => {
            mockGoogleCalendarService.getUpcomingEvents.mockResolvedValue([
                { id: 'event1', summary: 'New Event' }
            ]);

            await service.syncCalendarToTodos();

            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:newEvents',
                { events: [{ id: 'event1', summary: 'New Event' }] }
            );
        });

        it('should not emit if no new events', async () => {
            mockGoogleCalendarService.getUpcomingEvents.mockResolvedValue([]);

            await service.syncCalendarToTodos();

            expect(mockEventBus.emit).not.toHaveBeenCalledWith(
                'calendar:newEvents',
                expect.any(Object)
            );
        });

        it('should handle API errors', async () => {
            mockGoogleCalendarService.getUpcomingEvents.mockRejectedValue(new Error('API Error'));

            await expect(service.syncCalendarToTodos()).rejects.toThrow('API Error');
        });
    });

    describe('destroy()', () => {
        it('should disable sync', () => {
            service.enableSync(mockGetTodos);

            service.destroy();

            expect(service.syncEnabled).toBe(false);
            expect(service.syncInterval).toBeNull();
        });

        it('should be safe to call multiple times', () => {
            service.destroy();

            expect(() => service.destroy()).not.toThrow();
        });
    });

    describe('Integration tests', () => {
        it('should complete full sync cycle', async () => {
            const todos = [
                { id: 'todo1', text: 'Test 1', dueDate: '2025-12-01', completed: false, source: 'bifrost' },
                { id: 'todo2', text: 'Test 2', dueDate: '2025-12-02', completed: false, source: 'bifrost' }
            ];

            mockGetTodos.mockReturnValue(todos);
            mockGoogleCalendarService.createEventFromTodo
                .mockResolvedValueOnce({ id: 'event1' })
                .mockResolvedValueOnce({ id: 'event2' });

            service.enableSync(mockGetTodos);

            // Wait for initial sync to complete (avoid infinite loop from setInterval)
            await vi.runOnlyPendingTimersAsync();

            expect(service.syncedTodos.size).toBe(2);
            expect(mockEventBus.emit).toHaveBeenCalledWith(
                'calendar:synced',
                expect.any(Object)
            );
        });

        it('should handle sync disable during sync', async () => {
            mockGetTodos.mockReturnValue([]);

            service.enableSync(mockGetTodos);
            service.disableSync();

            await vi.runAllTimersAsync();

            expect(service.syncEnabled).toBe(false);
        });

        it('should persist mappings across sessions', async () => {
            const todo = { id: 'todo1', text: 'Test', dueDate: '2025-12-01', completed: false, source: 'bifrost' };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.createCalendarEvent(todo);

            expect(mockStateManager.set).toHaveBeenCalledWith(
                'calendarSyncMappings',
                { 'todo1': 'event1' }
            );

            // Simulate new session
            mockStateManager.get.mockReturnValue({ 'todo1': 'event1' });
            const newService = new CalendarSyncService();

            expect(newService.syncedTodos.get('todo1')).toBe('event1');
        });

        it('should handle mixed todo states', async () => {
            const todos = [
                { id: 'todo1', text: 'Active', dueDate: '2025-12-01', completed: false, source: 'bifrost' },
                { id: 'todo2', text: 'No date', completed: false, source: 'bifrost' },
                { id: 'todo3', text: 'Completed', dueDate: '2025-12-03', completed: true, source: 'bifrost' },
                { id: 'todo4', text: 'From calendar', dueDate: '2025-12-04', completed: false, source: 'calendar' }
            ];

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.syncTodosToCalendar(todos);

            // Only todo1 should be synced
            expect(mockGoogleCalendarService.createEventFromTodo).toHaveBeenCalledTimes(1);
            expect(mockGoogleCalendarService.createEventFromTodo).toHaveBeenCalledWith(todos[0]);
        });
    });

    describe('Edge cases', () => {
        it('should handle very large sync mappings', async () => {
            const largeMappings = {};
            for (let i = 0; i < 1000; i++) {
                largeMappings[`todo${i}`] = `event${i}`;
            }

            mockStateManager.get.mockReturnValue(largeMappings);

            const newService = new CalendarSyncService();

            expect(newService.syncedTodos.size).toBe(1000);
        });

        it('should handle rapid enable/disable cycles', () => {
            for (let i = 0; i < 10; i++) {
                service.enableSync(mockGetTodos);
                service.disableSync();
            }

            expect(service.syncEnabled).toBe(false);
            expect(service.syncInterval).toBeNull();
        });

        it('should handle todos with invalid dates', async () => {
            const todos = [
                { id: 'todo1', text: 'Invalid', dueDate: 'invalid-date', completed: false, source: 'bifrost' }
            ];

            mockGoogleCalendarService.createEventFromTodo.mockRejectedValue(new Error('Invalid date'));

            await expect(service.syncTodosToCalendar(todos)).resolves.not.toThrow();
        });

        it('should handle concurrent sync operations', async () => {
            mockGetTodos.mockReturnValue([]);
            service.getTodosCallback = mockGetTodos;

            const sync1 = service.performSync();
            const sync2 = service.performSync();

            await Promise.all([sync1, sync2]);

            expect(mockGetTodos).toHaveBeenCalledTimes(2);
        });

        it('should handle todos with special characters', async () => {
            const todo = {
                id: 'todo1',
                text: 'Special chars: é, ñ, 中文, 🎉',
                dueDate: '2025-12-01',
                completed: false,
                source: 'bifrost'
            };

            mockGoogleCalendarService.createEventFromTodo.mockResolvedValue({ id: 'event1' });

            await service.createCalendarEvent(todo);

            expect(mockGoogleCalendarService.createEventFromTodo).toHaveBeenCalledWith(todo);
        });

        it('should handle null/undefined in storage', () => {
            mockStateManager.get.mockReturnValue(null);

            service.loadSyncMappings();

            expect(service.syncedTodos.size).toBe(0);
        });

        it('should handle empty todos array', async () => {
            await service.syncTodosToCalendar([]);

            expect(mockGoogleCalendarService.createEventFromTodo).not.toHaveBeenCalled();
        });
    });
});
