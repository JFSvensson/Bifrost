/**
 * Recurring Todos Service
 * Manages recurring todo patterns and automatic creation of next instances
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

export class RecurringService {
    storageKey: string;
    recurringPatterns: any[];
    checkInterval: number | null;
    monitoringInterval: number | null;

    constructor() {
        this.storageKey = 'recurringPatterns';
        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Register schema
        stateManager.registerSchema(this.storageKey, {
            version: 1,
            validate: (data) => Array.isArray(data),
            default: []
        });

        this.recurringPatterns = this.loadPatterns();

        // Check for due recurring todos every hour
        this.startMonitoring();
    }

    /**
     * Load recurring patterns from storage
     * @returns {Array<Object>} Array of recurring patterns
     */
    loadPatterns() {
        try {
            const patterns = stateManager.get(this.storageKey, []);
            return patterns.map(pattern => ({
                ...pattern,
                createdAt: new Date(pattern.createdAt),
                lastCreated: pattern.lastCreated ? new Date(pattern.lastCreated) : null,
                nextDue: pattern.nextDue ? new Date(pattern.nextDue) : null
            }));
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_PARSE_ERROR,
                context: 'Loading recurring patterns',
                showToast: false
            });
            return [];
        }
    }

    /**
     * Save recurring patterns to storage
     * @returns {void}
     */
    savePatterns() {
        try {
            stateManager.set(this.storageKey, this.recurringPatterns);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving recurring patterns',
                showToast: true
            });
        }
    }

    /**
     * Create a new recurring pattern
     * @param {Object} pattern - Pattern configuration
     * @param {string} pattern.text - Todo text template
     * @param {string} pattern.type - Pattern type: 'daily', 'weekly', 'monthly', 'custom'
     * @param {number} [pattern.frequency=1] - Repeat every N days/weeks/months
     * @param {Array<number>} [pattern.daysOfWeek] - For weekly: [0-6] (Sunday=0)
     * @param {number} [pattern.dayOfMonth] - For monthly: 1-31
     * @param {string} [pattern.time] - Optional HH:MM
     * @param {Array<string>} [pattern.tags] - Tags for created todos
     * @param {string} [pattern.priority] - Priority level
     * @param {string} [pattern.source] - Source identifier
     * @returns {Object} Created pattern
     */
    createPattern(pattern) {
        try {
            // Validate required fields
            errorHandler.validateRequired(
                pattern,
                ['text', 'type'],
                'RecurringService.createPattern'
            );

            const newPattern = {
                id: Date.now().toString(),
                text: pattern.text,
                type: pattern.type,
                frequency: pattern.frequency || 1,
                daysOfWeek: pattern.daysOfWeek || [],
                dayOfMonth: pattern.dayOfMonth || 1,
                time: pattern.time || null,
                tags: pattern.tags || [],
                priority: pattern.priority || 'normal',
                active: true,
                createdAt: new Date(),
                lastCreated: null,
                nextDue: this.calculateNextOccurrence(pattern),
                source: pattern.source || 'bifrost',
                completionCount: 0
            };

            this.recurringPatterns.push(newPattern);
            this.savePatterns();
            eventBus.emit('recurring:patternCreated', newPattern);

            return newPattern;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: 'Creating recurring pattern',
                showToast: true
            });
            throw error;
        }
    }

    /**
     * Update existing recurring pattern
     * @param {string} patternId - Pattern ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated pattern or null
     */
    updatePattern(patternId, updates) {
        const pattern = this.recurringPatterns.find(p => p.id === patternId);
        if (!pattern) {
            errorHandler.warning(
                'PATTERN_NOT_FOUND',
                `Pattern ${patternId} not found`,
                { patternId }
            );
            return null;
        }

        Object.assign(pattern, updates);

        // Recalculate next due date if pattern changed
        if (updates.type || updates.frequency || updates.daysOfWeek || updates.dayOfMonth) {
            pattern.nextDue = this.calculateNextOccurrence(pattern);
        }

        this.savePatterns();
        eventBus.emit('recurring:patternUpdated', pattern);

        return pattern;
    }

    /**
     * Delete recurring pattern
     * @param {string} patternId - Pattern ID
     * @returns {boolean} True if deleted
     */
    deletePattern(patternId) {
        const index = this.recurringPatterns.findIndex(p => p.id === patternId);
        if (index === -1) {
            return false;
        }

        const pattern = this.recurringPatterns[index];
        this.recurringPatterns.splice(index, 1);
        this.savePatterns();
        eventBus.emit('recurring:patternDeleted', pattern);

        return true;
    }

    /**
     * Pause recurring pattern
     * @param {string} patternId - Pattern ID
     * @returns {Object|null} Updated pattern or null
     */
    pausePattern(patternId) {
        return this.updatePattern(patternId, { active: false });
    }

    /**
     * Resume recurring pattern
     * @param {string} patternId - Pattern ID
     * @returns {Object|null} Updated pattern or null
     */
    resumePattern(patternId) {
        const pattern = this.updatePattern(patternId, { active: true });
        if (pattern) {
            pattern.nextDue = this.calculateNextOccurrence(pattern);
            this.savePatterns();
        }
        return pattern;
    }

    /**
     * Toggle pattern active state
     * @param {string} patternId - Pattern ID
     * @returns {Object|null} Updated pattern or null
     */
    togglePattern(patternId) {
        const pattern = this.recurringPatterns.find(p => p.id === patternId);
        if (!pattern) {
            return null;
        }
        return pattern.active ? this.pausePattern(patternId) : this.resumePattern(patternId);
    }

    /**
     * Calculate next due date for pattern (alias for calculateNextOccurrence)
     * @param {Object} pattern - Pattern object
     * @param {Date} [fromDate] - Base date
     * @returns {Date} Next due date
     */
    calculateNextDue(pattern, fromDate) {
        return this.calculateNextOccurrence(pattern, fromDate);
    }

    /**
     * Generate todo from pattern (alias for createTodoFromPattern)
     * @param {Object} pattern - Pattern object
     * @returns {Object} Created todo
     */
    generateTodo(pattern) {
        return this.createTodoFromPattern(pattern);
    }

    /**
     * Calculate next occurrence date based on pattern
     * @param {Object} pattern - Recurring pattern
     * @param {Date} [fromDate=null] - Base date for calculation
     * @returns {Date} Next occurrence date
     */
    calculateNextOccurrence(pattern, fromDate = null) {
        const baseDate = fromDate || new Date();
        let nextDate = new Date(baseDate);

        switch (pattern.type) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + pattern.frequency);
                break;

            case 'weekly':
                if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
                    nextDate = this.getNextWeekday(baseDate, pattern.daysOfWeek, pattern.frequency);
                } else {
                    nextDate.setDate(nextDate.getDate() + (7 * pattern.frequency));
                }
                break;

            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + pattern.frequency);
                if (pattern.dayOfMonth) {
                    nextDate.setDate(Math.min(pattern.dayOfMonth, this.getDaysInMonth(nextDate)));
                }
                break;

            case 'custom':
                // Custom pattern logic (can be extended)
                if (pattern.customCalculator) {
                    nextDate = pattern.customCalculator(baseDate);
                }
                break;

            default:
                logger.warn('Unknown recurring pattern type:', pattern.type);
        }

        // Set time if specified
        if (pattern.time) {
            const [hours, minutes] = pattern.time.split(':');
            nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            nextDate.setHours(0, 0, 0, 0);
        }

        return nextDate;
    }

    /**
     * Get next occurrence of specific weekday(s)
     * @param {Date} fromDate - Base date
     * @param {Array<number>} daysOfWeek - Array of days (0-6, Sunday=0)
     * @param {number} [weeksInterval=1] - Week interval
     * @returns {Date} Next weekday occurrence
     */
    getNextWeekday(fromDate, daysOfWeek, weeksInterval = 1) {
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        const currentDay = fromDate.getDay();

        // Find next day in current week
        for (const targetDay of sortedDays) {
            if (targetDay > currentDay) {
                const daysUntil = targetDay - currentDay;
                const nextDate = new Date(fromDate);
                nextDate.setDate(nextDate.getDate() + daysUntil);
                return nextDate;
            }
        }

        // No matching day this week, go to next cycle
        const firstTargetDay = sortedDays[0];
        const daysUntilNextWeek = (7 - currentDay) + firstTargetDay + (7 * (weeksInterval - 1));
        const nextDate = new Date(fromDate);
        nextDate.setDate(nextDate.getDate() + daysUntilNextWeek);
        return nextDate;
    }

    /**
     * Get days in month
     * @param {Date} date - Date to check
     * @returns {number} Number of days in month
     */
    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    /**
     * Create todo instance from recurring pattern
     * @param {Object} pattern - Recurring pattern
     * @returns {Object} Created todo object
     */
    createTodoFromPattern(pattern) {
        const todo = {
            text: pattern.text,
            completed: false,
            source: pattern.source,
            priority: pattern.priority,
            tags: pattern.tags || [],
            dueDate: this.formatDate(pattern.nextDue),
            dueTime: pattern.time || null,
            id: Date.now().toString(),
            createdAt: new Date(),
            recurringPatternId: pattern.id,
            isRecurring: true
        };

        // Update pattern
        pattern.lastCreated = new Date();
        pattern.completionCount++;
        pattern.nextDue = this.calculateNextOccurrence(pattern, pattern.nextDue);
        this.savePatterns();

        eventBus.emit('recurring:todoCreated', { pattern, todo });

        return todo;
    }

    /**
     * Check if any recurring patterns are due and create todos
     * @returns {Array<Object>} Array of created todos
     */
    checkDuePatterns() {
        const now = new Date();
        const dueTodos = [];

        for (const pattern of this.recurringPatterns) {
            if (!pattern.active) {continue;}

            if (pattern.nextDue && pattern.nextDue <= now) {
                const todo = this.createTodoFromPattern(pattern);
                dueTodos.push(todo);
            }
        }

        if (dueTodos.length > 0) {
            eventBus.emit('recurring:duePatterns', dueTodos);
        }

        return dueTodos;
    }

    /**
     * Handle todo completion - if it's from recurring pattern, create next instance
     * @param {Object} todo - Completed todo
     * @returns {Object|undefined} Next todo instance or undefined
     */
    onTodoCompleted(todo) {
        if (!todo.recurringPatternId) {return;}

        const pattern = this.recurringPatterns.find(p => p.id === todo.recurringPatternId);
        if (!pattern || !pattern.active) {return;}

        // Auto-create next instance if pattern is still active
        const nextTodo = this.createTodoFromPattern(pattern);
        eventBus.emit('recurring:nextInstanceCreated', { completedTodo: todo, nextTodo, pattern });

        return nextTodo;
    }

    /**
     * Start monitoring for due recurring patterns
     * @param {number} [interval=3600000] - Check interval in ms (default: 1 hour)
     */
    startMonitoring(interval = 60 * 60 * 1000) { // Default: 1 hour
        // Check immediately
        this.checkDuePatterns();

        // Then check periodically
        this.monitoringInterval = setInterval(() => {
            this.checkDuePatterns();
        }, interval) as unknown as number;
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Get all active recurring patterns
     * @returns {Array<Object>} Active patterns
     */
    getActivePatterns() {
        return this.recurringPatterns.filter(p => p.active);
    }

    /**
     * Get all recurring patterns (active + paused)
     * @returns {Array<Object>} All patterns
     */
    getAllPatterns() {
        return [...this.recurringPatterns];
    }

    /**
     * Get pattern by ID
     * @param {string} patternId - Pattern ID
     * @returns {Object|undefined} Pattern or undefined
     */
    getPattern(patternId) {
        return this.recurringPatterns.find(p => p.id === patternId);
    }

    /**
     * Get patterns by type
     * @param {string} type - Pattern type
     * @returns {Array<Object>} Matching patterns
     */
    getPatternsByType(type) {
        return this.recurringPatterns.filter(p => p.type === type);
    }

    /**
     * Get upcoming recurring todos (next N days)
     * @param {number} [days=7] - Number of days to look ahead
     * @returns {Array<Object>} Upcoming patterns sorted by due date
     */
    getUpcomingRecurring(days = 7) {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + days);

        return this.recurringPatterns
            .filter(p => p.active && p.nextDue && p.nextDue <= futureDate)
            .sort((a, b) => a.nextDue - b.nextDue);
    }

    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date to format
     * @returns {string|null} Formatted date or null
     */
    formatDate(date) {
        if (!date) {return null;}
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get human-readable description of pattern
     * @param {Object} pattern - Recurring pattern
     * @returns {string} Swedish description
     */
    getPatternDescription(pattern) {
        let desc = '';

        switch (pattern.type) {
            case 'daily':
                if (pattern.frequency === 1) {
                    desc = 'Varje dag';
                } else {
                    desc = `Var ${pattern.frequency}:e dag`;
                }
                break;

            case 'weekly':
                if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
                    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör'];
                    const days = pattern.daysOfWeek.map(d => dayNames[d]).join(', ');

                    if (pattern.frequency === 1) {
                        desc = `Varje ${days}`;
                    } else {
                        desc = `Var ${pattern.frequency}:e vecka på ${days}`;
                    }
                } else {
                    if (pattern.frequency === 1) {
                        desc = 'Varje vecka';
                    } else {
                        desc = `Var ${pattern.frequency}:e vecka`;
                    }
                }
                break;

            case 'monthly':
                if (pattern.frequency === 1) {
                    desc = `Varje månad den ${pattern.dayOfMonth}:e`;
                } else {
                    desc = `Var ${pattern.frequency}:e månad den ${pattern.dayOfMonth}:e`;
                }
                break;

            case 'custom':
                desc = 'Anpassat mönster';
                break;

            default:
                desc = 'Okänt mönster';
        }

        if (pattern.time) {
            desc += ` kl. ${pattern.time}`;
        }

        return desc;
    }

    /**
     * Get statistics about recurring patterns
     * @returns {Object} Stats object with pattern counts and metrics
     * @property {number} total - Total number of patterns
     * @property {number} active - Active patterns
     * @property {number} paused - Paused patterns
     * @property {number} daily - Daily patterns
     * @property {number} weekly - Weekly patterns
     * @property {number} monthly - Monthly patterns
     * @property {number} totalCompletions - Total completions across all patterns
     * @property {number} upcoming - Upcoming patterns in next 7 days
     */
    getStats() {
        return {
            total: this.recurringPatterns.length,
            active: this.recurringPatterns.filter(p => p.active).length,
            paused: this.recurringPatterns.filter(p => !p.active).length,
            daily: this.recurringPatterns.filter(p => p.type === 'daily').length,
            weekly: this.recurringPatterns.filter(p => p.type === 'weekly').length,
            monthly: this.recurringPatterns.filter(p => p.type === 'monthly').length,
            totalCompletions: this.recurringPatterns.reduce((sum, p) => sum + (p.completionCount || 0), 0),
            upcoming: this.getUpcomingRecurring(7).length
        };
    }

    /**
     * Clear all recurring patterns (for testing/reset)
     */
    clearAll() {
        this.recurringPatterns = [];
        this.savePatterns();
        eventBus.emit('recurring:cleared', null);
    }
}

// Export singleton instance
export const recurringService = new RecurringService();
