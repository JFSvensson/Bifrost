/**
 * Calendar Sync Service
 * Handles bilateral synchronization between Bifrost todos and Google Calendar events
 */

import { googleCalendarService } from './googleCalendarService.js';

export class CalendarSyncService {
    constructor() {
        this.syncEnabled = false;
        this.syncInterval = null;
        this.syncFrequency = 5 * 60 * 1000; // 5 minutes
        this.lastSync = null;
        this.syncedTodos = new Map(); // todoId -> eventId mapping

        // Load sync mappings from localStorage
        this.loadSyncMappings();
    }

    /**
     * Load sync mappings from localStorage
     */
    loadSyncMappings() {
        try {
            const stored = localStorage.getItem('calendarSyncMappings');
            if (stored) {
                const mappings = JSON.parse(stored);
                this.syncedTodos = new Map(Object.entries(mappings));
                console.log(`✅ Loaded ${this.syncedTodos.size} sync mappings`);
            }
        } catch (error) {
            console.error('Failed to load sync mappings:', error);
        }
    }

    /**
     * Save sync mappings to localStorage
     */
    saveSyncMappings() {
        try {
            const mappings = Object.fromEntries(this.syncedTodos);
            localStorage.setItem('calendarSyncMappings', JSON.stringify(mappings));
        } catch (error) {
            console.error('Failed to save sync mappings:', error);
        }
    }

    /**
     * Enable automatic synchronization
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

        console.log('✅ Calendar sync enabled');
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

        console.log('✅ Calendar sync disabled');
    }

    /**
     * Perform synchronization
     */
    async performSync() {
        if (!googleCalendarService.isAuthenticated()) {
            console.log('⚠️ Not authenticated with Google Calendar, skipping sync');
            return;
        }

        if (!this.getTodosCallback) {
            console.error('❌ No getTodosCallback provided');
            return;
        }

        try {
            console.log('🔄 Starting calendar sync...');

            const todos = this.getTodosCallback();

            // Sync todos to calendar
            await this.syncTodosToCalendar(todos);

            // Sync calendar to todos (future feature)
            // await this.syncCalendarToTodos();

            this.lastSync = new Date();
            console.log('✅ Calendar sync complete');

            // Dispatch sync event
            window.dispatchEvent(new CustomEvent('calendarSynced', {
                detail: { timestamp: this.lastSync }
            }));

        } catch (error) {
            console.error('❌ Calendar sync failed:', error);
        }
    }

    /**
     * Sync todos with due dates to Google Calendar
     */
    async syncTodosToCalendar(todos) {
        const todosWithDates = todos.filter(todo =>
            todo.dueDate && !todo.completed && todo.source === 'bifrost'
        );

        console.log(`📅 Syncing ${todosWithDates.length} todos to calendar...`);

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
                console.error(`Failed to sync todo "${todo.text}":`, error);
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

            console.log(`✅ Created calendar event for todo "${todo.text}"`);

            // Dispatch event
            window.dispatchEvent(new CustomEvent('todoSyncedToCalendar', {
                detail: { todo, event }
            }));

            return event;
        } catch (error) {
            console.error(`Failed to create event for todo "${todo.text}":`, error);
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
            console.log(`✅ Updated calendar event for todo "${todo.text}"`);
        } catch (error) {
            // Event might have been deleted, remove mapping
            if (error.status === 404) {
                this.syncedTodos.delete(todo.id);
                this.saveSyncMappings();
            }
            console.error(`Failed to update event for todo "${todo.text}":`, error);
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
                    console.log('✅ Deleted calendar event for removed todo');
                } catch (error) {
                    console.error('Failed to delete calendar event:', error);
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
            console.log('✅ Removed calendar event for todo');
        } catch (error) {
            console.error('Failed to delete calendar event:', error);
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

            console.log(`📅 Found ${newEvents.length} new calendar events`);

            // Dispatch event with new calendar events
            if (newEvents.length > 0) {
                window.dispatchEvent(new CustomEvent('newCalendarEvents', {
                    detail: { events: newEvents }
                }));
            }

            return newEvents;
        } catch (error) {
            console.error('Failed to sync calendar to todos:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const calendarSyncService = new CalendarSyncService();
