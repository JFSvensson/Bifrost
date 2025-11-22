/**
 * Calendar Sync Service
 * Handles bilateral synchronization between Bifrost todos and Google Calendar events
 */

import { googleCalendarService } from './googleCalendarService.js';
import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

export class CalendarSyncService {
    syncEnabled: boolean;
    syncInterval: number | null;
    syncFrequency: number;
    lastSync: Date | null;
    syncedTodos: Map<string, string>;
    getTodosCallback: (() => any[]) | null;

    constructor() {
        this.syncEnabled = false;
        this.syncInterval = null;
        this.syncFrequency = 5 * 60 * 1000; // 5 minutes
        this.lastSync = null;
        this.syncedTodos = new Map(); // todoId -> eventId mapping
        this.getTodosCallback = null;

        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Register StateManager schema
        stateManager.registerSchema('calendarSyncMappings', {
            version: 1,
            validate: (data) => typeof data === 'object',
            migrate: (oldData) => oldData,
            default: {}
        });

        // Load sync mappings
        this.loadSyncMappings();
    }

    /**
     * Load sync mappings from StateManager
     */
    loadSyncMappings() {
        try {
            const mappings = stateManager.get('calendarSyncMappings', []);
            if (mappings && Object.keys(mappings).length > 0) {
                this.syncedTodos = new Map(Object.entries(mappings));
                logger.debug(`Loaded ${this.syncedTodos.size} sync mappings`);
            }
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading calendar sync mappings'
            });
        }
    }

    /**
     * Save sync mappings to StateManager
     */
    saveSyncMappings() {
        try {
            const mappings = Object.fromEntries(this.syncedTodos);
            stateManager.set('calendarSyncMappings', mappings);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving calendar sync mappings'
            });
        }
    }

    /**
     * Enable automatic synchronization
     * @param {Function} getTodosCallback - Callback to get current todos
     */
    enableSync(getTodosCallback) {
        if (this.syncEnabled) {return;}

        this.getTodosCallback = getTodosCallback;
        this.syncEnabled = true;

        // Initial sync
        this.performSync();

        // Set up periodic sync
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, this.syncFrequency);

        logger.info('Calendar sync enabled');
        eventBus.emit('calendar:syncEnabled', { frequency: this.syncFrequency });
    }

    /**
     * Disable automatic synchronization
     */
    disableSync() {
        if (!this.syncEnabled) {return;}

        this.syncEnabled = false;

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        logger.info('Calendar sync disabled');
        eventBus.emit('calendar:syncDisabled', {});
    }

    /**
     * Perform synchronization
     */
    async performSync() {
        if (!googleCalendarService.isAuthenticated()) {
            logger.warn('Not authenticated with Google Calendar, skipping sync');
            return;
        }

        if (!this.getTodosCallback) {
            logger.error('No getTodosCallback provided');
            return;
        }

        try {
            logger.info('Starting calendar sync...');

            const todos = this.getTodosCallback();

            // Sync todos to calendar
            await this.syncTodosToCalendar(todos);

            // Sync calendar to todos (future feature)
            // await this.syncCalendarToTodos();

            this.lastSync = new Date();
            logger.info('Calendar sync complete');

            // Emit sync event
            eventBus.emit('calendar:synced', { timestamp: this.lastSync });

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Calendar sync'
            });
        }
    }

    /**
     * Sync todos with due dates to Google Calendar
     */
    async syncTodosToCalendar(todos) {
        const todosWithDates = todos.filter(todo =>
            todo.dueDate && !todo.completed && todo.source === 'bifrost'
        );

        logger.info(`Syncing ${todosWithDates.length} todos to calendar...`);

        for (const todo of todosWithDates) {
            try {
                if (this.syncedTodos.has(todo.id)) {
                    // Update existing event
                    await this.updateCalendarEvent(todo);
                } else {
                    // Create new event
                    await this.createCalendarEvent(todo);
                }
            } catch (error) {
                errorHandler.handle(error, {
                    code: ErrorCode.API_ERROR,
                    context: `Syncing todo "${todo.text}" to calendar`,
                    showToast: false
                });
            }
        }

        // Clean up deleted todos
        await this.cleanupDeletedTodos(todos);
    }

    /**
     * Create calendar event from todo
     */
    async createCalendarEvent(todo) {
        try {
            const event = await googleCalendarService.createEventFromTodo(todo);

            // Store mapping
            this.syncedTodos.set(todo.id, event.id);
            this.saveSyncMappings();

            logger.info(`Created calendar event for todo "${todo.text}"`);

            // Emit event
            eventBus.emit('calendar:todoSynced', { todo, event });

            return event;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: `Creating calendar event for todo "${todo.text}"`
            });
            throw error;
        }
    }

    /**
     * Update calendar event from todo
     */
    async updateCalendarEvent(todo) {
        const eventId = this.syncedTodos.get(todo.id);
        if (!eventId) {return;}

        try {
            const dueDate = new Date(todo.dueDate);
            const updates = {
                summary: todo.text,
                description: `Updated from Bifrost todo\nPriority: ${todo.priority || 'normal'}`,
                start: {
                    date: dueDate.toISOString().split('T')[0]
                },
                end: {
                    date: dueDate.toISOString().split('T')[0]
                }
            };

            await googleCalendarService.updateEvent(eventId, updates);
            logger.info(`Updated calendar event for todo "${todo.text}"`);
        } catch (error) {
            // Event might have been deleted, remove mapping
            if (error.status === 404) {
                this.syncedTodos.delete(todo.id);
                this.saveSyncMappings();
            }
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: `Updating calendar event for todo "${todo.text}"`,
                showToast: false
            });
        }
    }

    /**
     * Clean up calendar events for deleted todos
     */
    async cleanupDeletedTodos(currentTodos) {
        const currentTodoIds = new Set(currentTodos.map(t => t.id));
        const syncedTodoIds = Array.from(this.syncedTodos.keys());

        for (const todoId of syncedTodoIds) {
            if (!currentTodoIds.has(todoId)) {
                // Todo was deleted, remove calendar event
                const eventId = this.syncedTodos.get(todoId);

                try {
                    await googleCalendarService.deleteEvent(eventId);
                    logger.info('Deleted calendar event for removed todo');
                } catch (error) {
                    logger.error('Failed to delete calendar event:', error);
                }

                // Remove mapping
                this.syncedTodos.delete(todoId);
            }
        }

        this.saveSyncMappings();
    }

    /**
     * Manually sync a specific todo to calendar
     */
    async syncTodoToCalendar(todo) {
        if (!todo.dueDate) {
            throw new Error('Todo must have a due date to sync to calendar');
        }

        if (todo.completed) {
            // If completed and synced, delete from calendar
            if (this.syncedTodos.has(todo.id)) {
                const eventId = this.syncedTodos.get(todo.id);
                await googleCalendarService.deleteEvent(eventId);
                this.syncedTodos.delete(todo.id);
                this.saveSyncMappings();
            }
            return;
        }

        if (this.syncedTodos.has(todo.id)) {
            return this.updateCalendarEvent(todo);
        } else {
            return this.createCalendarEvent(todo);
        }
    }

    /**
     * Remove sync for a todo
     */
    async unsyncTodo(todoId) {
        if (!this.syncedTodos.has(todoId)) {return;}

        const eventId = this.syncedTodos.get(todoId);

        try {
            await googleCalendarService.deleteEvent(eventId);
            logger.info('Removed calendar event for todo');
        } catch (error) {
            logger.error('Failed to delete calendar event:', error);
        }

        this.syncedTodos.delete(todoId);
        this.saveSyncMappings();
    }

    /**
     * Check if a todo is synced to calendar
     */
    isSynced(todoId) {
        return this.syncedTodos.has(todoId);
    }

    /**
     * Get calendar event ID for a todo
     */
    getEventId(todoId) {
        return this.syncedTodos.get(todoId);
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            lastSync: this.lastSync,
            syncedCount: this.syncedTodos.size,
            authenticated: googleCalendarService.isAuthenticated()
        };
    }

    /**
     * Create todo from calendar event
     * (Future feature - for bilateral sync)
     */
    async createTodoFromEvent(event) {
        const formattedEvent = googleCalendarService.formatEvent(event);

        return {
            text: formattedEvent.title,
            completed: false,
            source: 'calendar',
            priority: 'normal',
            dueDate: formattedEvent.start.toISOString().split('T')[0],
            id: `calendar-${event.id}`,
            calendarEventId: event.id,
            description: formattedEvent.description,
            createdAt: new Date()
        };
    }

    /**
     * Sync calendar events to todos
     * (Future feature - optional bilateral sync)
     */
    async syncCalendarToTodos() {
        try {
            const events = await googleCalendarService.getUpcomingEvents(7);

            // Filter events that aren't already synced from todos
            const syncedEventIds = new Set(Array.from(this.syncedTodos.values()));
            const newEvents = events.filter(e => !syncedEventIds.has(e.id));

            logger.info(`Found ${newEvents.length} new calendar events`);

            // Emit event with new calendar events
            if (newEvents.length > 0) {
                eventBus.emit('calendar:newEvents', { events: newEvents });
            }

            return newEvents;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Syncing calendar to todos'
            });
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.disableSync();
    }
}

/**
 * Events emitted by CalendarSyncService:
 * - calendar:syncEnabled - When automatic sync is enabled
 * - calendar:syncDisabled - When automatic sync is disabled
 * - calendar:synced - After successful sync (timestamp)
 * - calendar:todoSynced - When a todo is synced to calendar (todo, event)
 * - calendar:newEvents - When new calendar events are found (events)
 */

// Export singleton instance
export const calendarSyncService = new CalendarSyncService();
