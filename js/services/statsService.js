/**
 * Statistics Service - Hanterar statistik för todos
 * Spårar produktivitet, streaks, och annan användbar data
 */

import { todos as todoConfig } from '../config/config.js';
import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

export class StatsService {
    constructor() {
        this._init();
    }

    /**
     * Initialize stats service
     * @private
     */
    _init() {
        // Register schemas
        stateManager.registerSchema('stats', {
            version: 1,
            validate: (data) => {
                return typeof data.totalCompleted === 'number' &&
                       typeof data.totalCreated === 'number';
            },
            migrate: (oldData) => oldData,
            default: this.getDefaultStats()
        });

        stateManager.registerSchema('statsHistory', {
            version: 1,
            validate: (data) => Array.isArray(data),
            migrate: (oldData) => oldData,
            default: []
        });

        // Load stats
        this.loadStats();

        // Subscribe to todo events
        eventBus.on('todo:added', (data) => this.trackTodoCreated(data.todo));
        eventBus.on('todo:completed', (data) => this.trackTodoCompleted(data.todo));
    }

    /**
     * Load stats from storage
     * @private
     */
    loadStats() {
        try {
            this.stats = stateManager.get('stats');
            this.history = stateManager.get('statsHistory');
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading stats data'
            });
            this.stats = this.getDefaultStats();
            this.history = [];
        }
    }

    /**
     * Save stats to storage
     * @private
     */
    saveStats() {
        try {
            stateManager.set('stats', this.stats);
            stateManager.set('statsHistory', this.history);
            eventBus.emit('stats:updated', { stats: this.stats });
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving stats data',
                showToast: true
            });
        }
    }

    /**
     * Get default stats structure
     * @returns {Object} Default stats object
     */
    getDefaultStats() {
        return {
            totalCompleted: 0,
            totalCreated: 0,
            currentStreak: 0,
            longestStreak: 0,
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
            weeklyStats: this.getEmptyWeeklyStats()
        };
    }

    /**
     * Get empty weekly stats structure
     * @returns {Object} Weekly stats object with all days initialized to 0
     */
    getEmptyWeeklyStats() {
        const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
        return days.reduce((acc, day) => {
            acc[day] = { completed: 0, created: 0 };
            return acc;
        }, {});
    }

    /**
     * Track when a todo is created
     * @param {Object} todo - Created todo
     */
    trackTodoCreated(todo) {
        const today = new Date().toDateString();

        this.stats.totalCreated++;
        this.stats.lastActivityDate = today;

        // Priority stats
        const priority = todo.priority || 'normal';
        if (this.stats.priorityStats[priority]) {
            this.stats.priorityStats[priority].created++;
        }

        // Source stats
        const source = todo.source || 'bifrost';
        if (this.stats.sourceStats[source]) {
            this.stats.sourceStats[source].created++;
        }

        // Weekly stats
        const dayName = this.getDayName(new Date());
        if (this.stats.weeklyStats[dayName]) {
            this.stats.weeklyStats[dayName].created++;
        }

        // Tag stats
        if (todo.tags && Array.isArray(todo.tags)) {
            todo.tags.forEach(tag => {
                if (!this.stats.tagStats[tag]) {
                    this.stats.tagStats[tag] = { count: 0, completed: 0 };
                }
                this.stats.tagStats[tag].count++;
            });
        }

        this.saveStats();
    }

    /**
     * Track when a todo is completed
     * @param {Object} todo - Completed todo
     */
    trackTodoCompleted(todo) {
        const today = new Date().toDateString();

        this.stats.totalCompleted++;
        this.stats.lastCompletionDate = today;
        this.stats.lastActivityDate = today;

        // Update streak
        this.updateStreak(today);

        // Priority stats
        const priority = todo.priority || 'normal';
        if (this.stats.priorityStats[priority]) {
            this.stats.priorityStats[priority].completed++;
        }

        // Source stats
        const source = todo.source || 'bifrost';
        if (this.stats.sourceStats[source]) {
            this.stats.sourceStats[source].completed++;
        }

        // Weekly stats
        const dayName = this.getDayName(new Date());
        if (this.stats.weeklyStats[dayName]) {
            this.stats.weeklyStats[dayName].completed++;
        }

        // Tag stats
        if (todo.tags && Array.isArray(todo.tags)) {
            todo.tags.forEach(tag => {
                if (this.stats.tagStats[tag]) {
                    this.stats.tagStats[tag].completed++;
                }
            });
        }

        // Completion time (om todo har createdAt)
        if (todo.createdAt && todo.completedAt) {
            const created = new Date(todo.createdAt);
            const completed = new Date(todo.completedAt);
            const timeInHours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);

            // Update running average
            const totalTodos = this.stats.totalCompleted;
            const currentAvg = this.stats.averageCompletionTime;
            this.stats.averageCompletionTime =
                ((currentAvg * (totalTodos - 1)) + timeInHours) / totalTodos;
        }

        // Spara i historik för grafer
        this.saveToHistory(today);

        this.saveStats();
    }

    /**
     * Update completion streak
     * @param {string} today - Today's date string
     */
    updateStreak(today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (this.stats.lastCompletionDate === yesterdayStr) {
            // Fortsätt streak
            this.stats.currentStreak++;
        } else if (this.stats.lastCompletionDate !== today) {
            // Ny streak
            this.stats.currentStreak = 1;
        }
        // Om lastCompletionDate === today, fortsätt samma dag

        // Update longest streak
        if (this.stats.currentStreak > this.stats.longestStreak) {
            this.stats.longestStreak = this.stats.currentStreak;
        }
    }

    /**
     * Save completion to history for graphs
     * @param {string} date - Date string
     */
    saveToHistory(date) {
        // Hitta eller skapa dagens entry
        let entry = this.history.find(h => h.date === date);

        if (!entry) {
            entry = { date, completed: 0 };
            this.history.push(entry);
        }

        entry.completed++;

        // Behåll bara senaste 30 dagarna
        if (this.history.length > 30) {
            this.history = this.history.slice(-30);
        }

        stateManager.set('statsHistory', this.history);
    }

    /**
     * Get Swedish day name from date
     * @param {Date} date - Date object
     * @returns {string} Swedish day name
     */
    getDayName(date) {
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        return days[date.getDay()];
    }

    /**
     * Get today's statistics
     * @param {Array<Object>} todos - All todos
     * @returns {Object} Today's stats (created, completed, remaining)
     */
    getTodayStats(todos) {
        const today = new Date().toDateString();
        const todayTodos = todos.filter(t => {
            if (t.createdAt) {
                return new Date(t.createdAt).toDateString() === today;
            }
            return false;
        });

        const todayCompleted = todos.filter(t => {
            if (t.completed && t.completedAt) {
                return new Date(t.completedAt).toDateString() === today;
            }
            return false;
        });

        return {
            created: todayTodos.length,
            completed: todayCompleted.length,
            remaining: todos.filter(t => !t.completed).length
        };
    }

    /**
     * Get weekly statistics
     * @returns {Object} Weekly stats by day name
     */
    getWeeklyStats() {
        return this.stats.weeklyStats;
    }

    /**
     * Get most used tags
     * @param {number} [limit=5] - Number of tags to return
     * @returns {Array<Object>} Top tags with stats
     */
    getTopTags(limit = 5) {
        return Object.entries(this.stats.tagStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([tag, stats]) => ({
                tag,
                count: stats.count,
                completed: stats.completed,
                completionRate: stats.count > 0 ? (stats.completed / stats.count * 100).toFixed(1) : 0
            }));
    }

    /**
     * Get last 7 days activity for graphs
     * @returns {Array<Object>} Activity data for each day
     */
    getLast7DaysActivity() {
        const result = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const entry = this.history.find(h => h.date === dateStr);

            result.push({
                date: date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }),
                completed: entry ? entry.completed : 0
            });
        }

        return result;
    }

    /**
     * Get complete statistics
     * @param {Array<Object>} currentTodos - Current todos list
     * @returns {Object} Full stats object with all metrics
     */
    getFullStats(currentTodos) {
        const todayStats = this.getTodayStats(currentTodos);

        return {
            ...this.stats,
            today: todayStats,
            topTags: this.getTopTags(),
            last7Days: this.getLast7DaysActivity(),
            completionRate: this.stats.totalCreated > 0
                ? (this.stats.totalCompleted / this.stats.totalCreated * 100).toFixed(1)
                : 0,
            activeTodos: currentTodos.filter(t => !t.completed).length,
            completedTodos: currentTodos.filter(t => t.completed).length
        };
    }

    /**
     * Reset weekly statistics (run every Monday)
     */
    resetWeeklyStats() {
        this.stats.weeklyStats = this.getEmptyWeeklyStats();
        this.saveStats();
        eventBus.emit('stats:weeklyReset', null);
    }

    /**
     * Export statistics for backup
     * @returns {Object} Exported stats data
     */
    exportStats() {
        return {
            stats: this.stats,
            history: this.history,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import statistics from backup
     * @param {Object} data - Exported stats data
     */
    importStats(data) {
        if (data.stats) {this.stats = data.stats;}
        if (data.history) {this.history = data.history;}
        this.saveStats();
        eventBus.emit('stats:imported', { stats: this.stats });
    }

    /**
     * Reset all statistics
     */
    reset() {
        this.stats = this.getDefaultStats();
        this.history = [];
        this.saveStats();
        eventBus.emit('stats:reset', null);
    }

    /**
     * Get current statistics
     * @returns {Object} Copy of stats object
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Get completion rate percentage
     * @returns {number} Completion rate (0-100)
     */
    getCompletionRate() {
        if (this.stats.totalCreated === 0) {
            return 0;
        }
        return Math.round((this.stats.totalCompleted / this.stats.totalCreated) * 100);
    }

    /**
     * Get priority breakdown statistics
     * @returns {Object} Priority stats
     */
    getPriorityBreakdown() {
        return { ...this.stats.priorityStats };
    }

    /**
     * Get source breakdown statistics
     * @returns {Object} Source stats
     */
    getSourceBreakdown() {
        return { ...this.stats.sourceStats };
    }

    /**
     * Get weekly breakdown statistics
     * @returns {Object} Weekly stats
     */
    getWeeklyBreakdown() {
        return { ...this.stats.weeklyStats };
    }

    /**
     * Reset statistics (alias for reset)
     */
    resetStats() {
        this.reset();
    }
}
