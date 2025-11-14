/**
 * Recurring Todos Service
 * Manages recurring todo patterns and automatic creation of next instances
 */

export class RecurringService {
    constructor() {
        this.recurringPatterns = this.loadPatterns();
        this.listeners = [];

        // Check for due recurring todos every hour
        this.startMonitoring();
    }

    /**
     * Load recurring patterns from localStorage
     */
    loadPatterns() {
        const saved = localStorage.getItem('recurringPatterns');
        if (saved) {
            try {
                return JSON.parse(saved).map(pattern => ({
                    ...pattern,
                    createdAt: new Date(pattern.createdAt),
                    lastCreated: pattern.lastCreated ? new Date(pattern.lastCreated) : null,
                    nextDue: pattern.nextDue ? new Date(pattern.nextDue) : null
                }));
            } catch (e) {
                console.error('Failed to load recurring patterns:', e);
                return [];
            }
        }
        return [];
    }

    /**
     * Save recurring patterns to localStorage
     */
    savePatterns() {
        localStorage.setItem('recurringPatterns', JSON.stringify(this.recurringPatterns));
    }

    /**
     * Create a new recurring pattern
     */
    createPattern(pattern) {
        const newPattern = {
            id: Date.now().toString(),
            text: pattern.text,
            type: pattern.type, // 'daily', 'weekly', 'monthly', 'custom'
            frequency: pattern.frequency || 1, // Every N days/weeks/months
            daysOfWeek: pattern.daysOfWeek || [], // For weekly: [0-6] (Sunday=0)
            dayOfMonth: pattern.dayOfMonth || 1, // For monthly: 1-31
            time: pattern.time || null, // Optional HH:MM
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
        this.notifyListeners('patternCreated', newPattern);

        return newPattern;
    }

    /**
     * Update existing recurring pattern
     */
    updatePattern(patternId, updates) {
        const pattern = this.recurringPatterns.find(p => p.id === patternId);
        if (!pattern) {return null;}

        Object.assign(pattern, updates);

        // Recalculate next due date if pattern changed
        if (updates.type || updates.frequency || updates.daysOfWeek || updates.dayOfMonth) {
            pattern.nextDue = this.calculateNextOccurrence(pattern);
        }

        this.savePatterns();
        this.notifyListeners('patternUpdated', pattern);

        return pattern;
    }

    /**
     * Delete recurring pattern
     */
    deletePattern(patternId) {
        const index = this.recurringPatterns.findIndex(p => p.id === patternId);
        if (index === -1) {return false;}

        const pattern = this.recurringPatterns[index];
        this.recurringPatterns.splice(index, 1);
        this.savePatterns();
        this.notifyListeners('patternDeleted', pattern);

        return true;
    }

    /**
     * Pause recurring pattern
     */
    pausePattern(patternId) {
        return this.updatePattern(patternId, { active: false });
    }

    /**
     * Resume recurring pattern
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
     * Calculate next occurrence date based on pattern
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
                console.warn('Unknown recurring pattern type:', pattern.type);
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
     */
    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    /**
     * Create todo instance from recurring pattern
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

        this.notifyListeners('todoCreated', { pattern, todo });

        return todo;
    }

    /**
     * Check if any recurring patterns are due and create todos
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
            this.notifyListeners('duePatterns', dueTodos);
        }

        return dueTodos;
    }

    /**
     * Handle todo completion - if it's from recurring pattern, create next instance
     */
    onTodoCompleted(todo) {
        if (!todo.recurringPatternId) {return;}

        const pattern = this.recurringPatterns.find(p => p.id === todo.recurringPatternId);
        if (!pattern || !pattern.active) {return;}

        // Auto-create next instance if pattern is still active
        const nextTodo = this.createTodoFromPattern(pattern);
        this.notifyListeners('nextInstanceCreated', { completedTodo: todo, nextTodo, pattern });

        return nextTodo;
    }

    /**
     * Start monitoring for due recurring patterns
     */
    startMonitoring(interval = 60 * 60 * 1000) { // Default: 1 hour
        // Check immediately
        this.checkDuePatterns();

        // Then check periodically
        this.monitoringInterval = setInterval(() => {
            this.checkDuePatterns();
        }, interval);
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
     */
    getActivePatterns() {
        return this.recurringPatterns.filter(p => p.active);
    }

    /**
     * Get all recurring patterns (active + paused)
     */
    getAllPatterns() {
        return [...this.recurringPatterns];
    }

    /**
     * Get pattern by ID
     */
    getPattern(patternId) {
        return this.recurringPatterns.find(p => p.id === patternId);
    }

    /**
     * Get patterns by type
     */
    getPatternsByType(type) {
        return this.recurringPatterns.filter(p => p.type === type);
    }

    /**
     * Get upcoming recurring todos (next 7 days)
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
     * Subscribe to recurring service events
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (e) {
                console.error('Error in recurring service listener:', e);
            }
        });
    }

    /**
     * Clear all recurring patterns (for testing/reset)
     */
    clearAll() {
        this.recurringPatterns = [];
        this.savePatterns();
        this.notifyListeners('cleared', null);
    }
}

// Export singleton instance
export const recurringService = new RecurringService();
