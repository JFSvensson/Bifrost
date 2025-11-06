/**
 * Statistics Service - Hanterar statistik för todos
 * Spårar produktivitet, streaks, och annan användbar data
 */

import { todos as todoConfig } from './config.js';

export class StatsService {
    constructor() {
        this.storageKey = 'bifrost-stats';
        this.statsHistoryKey = 'bifrost-stats-history';
        this.init();
    }

    init() {
        // Ladda eller initiera statistik
        const saved = localStorage.getItem(this.storageKey);
        this.stats = saved ? JSON.parse(saved) : this.getDefaultStats();
        
        // Ladda historik (för grafer)
        const history = localStorage.getItem(this.statsHistoryKey);
        this.history = history ? JSON.parse(history) : [];
    }

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

    getEmptyWeeklyStats() {
        const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
        return days.reduce((acc, day) => {
            acc[day] = { completed: 0, created: 0 };
            return acc;
        }, {});
    }

    // Spåra när en todo skapas
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
        
        this.save();
    }

    // Spåra när en todo markeras som klar
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
            const timeInHours = (completed - created) / (1000 * 60 * 60);
            
            // Update running average
            const totalTodos = this.stats.totalCompleted;
            const currentAvg = this.stats.averageCompletionTime;
            this.stats.averageCompletionTime = 
                ((currentAvg * (totalTodos - 1)) + timeInHours) / totalTodos;
        }
        
        // Spara i historik för grafer
        this.saveToHistory(today);
        
        this.save();
    }

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
        
        localStorage.setItem(this.statsHistoryKey, JSON.stringify(this.history));
    }

    getDayName(date) {
        const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        return days[date.getDay()];
    }

    // Hämta dagens statistik
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

    // Hämta veckans statistik
    getWeeklyStats() {
        return this.stats.weeklyStats;
    }

    // Hämta mest använda tags
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

    // Hämta senaste 7 dagarnas aktivitet för graf
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

    // Hämta fullständig statistik
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

    // Återställ veckostatistik (körs varje måndag)
    resetWeeklyStats() {
        this.stats.weeklyStats = this.getEmptyWeeklyStats();
        this.save();
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    }

    // Exportera statistik (för backup)
    exportStats() {
        return {
            stats: this.stats,
            history: this.history,
            exportDate: new Date().toISOString()
        };
    }

    // Importera statistik (från backup)
    importStats(data) {
        if (data.stats) this.stats = data.stats;
        if (data.history) this.history = data.history;
        this.save();
        localStorage.setItem(this.statsHistoryKey, JSON.stringify(this.history));
    }

    // Återställ all statistik
    reset() {
        this.stats = this.getDefaultStats();
        this.history = [];
        this.save();
        localStorage.removeItem(this.statsHistoryKey);
    }
}
