/**
 * Deadline Service - Hanterar deadline-varningar för todos
 * Visar notifications och färgkodning baserat på hur nära deadline
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

export class DeadlineService {
    warningLevels: any;
    notificationShown: Set<string>;
    checkInterval: number | null;

    constructor() {
        this.warningLevels = {
            overdue: {
                color: '#e74c3c',
                icon: '🚨',
                label: 'Försenad',
                priority: 4
            },
            today: {
                color: '#f39c12',
                icon: '⚡',
                label: 'Idag',
                priority: 3
            },
            tomorrow: {
                color: '#f39c12',
                icon: '📅',
                label: 'Imorgon',
                priority: 2
            },
            thisWeek: {
                color: '#3498db',
                icon: '📆',
                label: 'Denna vecka',
                priority: 1
            },
            future: {
                color: '#95a5a6',
                icon: '📌',
                label: 'Kommande',
                priority: 0
            }
        };

        this.notificationShown = new Set();
        this.checkInterval = null;
        this._init();
    }

    /**
     * Initialize deadline service
     * @private
     */
    _init() {
        // Register schema for notification tracking
        stateManager.registerSchema('deadlineNotifications', {
            version: 1,
            validate: (data) => {
                return Array.isArray(data.shown) && typeof data.lastReset === 'string';
            },
            migrate: (oldData) => oldData,
            default: { shown: [], lastReset: new Date().toISOString() }
        });

        // Load notification history
        this.loadNotificationHistory();

        // Subscribe to todo events
        eventBus.on('todo:added', this._onTodoChanged.bind(this));
        eventBus.on('todo:updated', this._onTodoChanged.bind(this));
        eventBus.on('todo:completed', this._onTodoChanged.bind(this));
    }

    /**
     * Load notification history from storage
     * @private
     */
    loadNotificationHistory() {
        try {
            const data = stateManager.get('deadlineNotifications', null);
            this.notificationShown = new Set(data.shown || []);
            
            // Reset if it's a new day
            const lastReset = new Date(data.lastReset);
            const now = new Date();
            if (lastReset.toDateString() !== now.toDateString()) {
                this.resetNotificationHistory();
            }
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading deadline notification history'
            });
        }
    }

    /**
     * Save notification history to storage
     * @private
     */
    saveNotificationHistory() {
        try {
            stateManager.set('deadlineNotifications', {
                shown: Array.from(this.notificationShown),
                lastReset: new Date().toISOString()
            });
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving deadline notification history'
            });
        }
    }

    /**
     * Handle todo changes
     * @private
     * @param {Object} data - Event data
     */
    _onTodoChanged(data) {
        if (data?.todo) {
            const analysis = this.analyzeTodo(data.todo);
            if (analysis && analysis.priority >= 2) {
                eventBus.emit('deadline:urgent', { todo: data.todo, analysis });
            }
        }
    }

    /**
     * Analysera en todo och returnera dess deadline-status
     * @param {Object} todo - Todo to analyze
     * @returns {Object|null} Deadline analysis or null if no due date
     * @property {string} level - Warning level (overdue/today/tomorrow/thisWeek/future)
     * @property {number} daysUntil - Days until due date (negative if overdue)
     * @property {string} color - Color code for display
     * @property {string} icon - Icon for display
     * @property {string} label - Swedish label
     * @property {number} priority - Priority level (0-4)
     */
    analyzeTodo(todo) {
        if (!todo.dueDate) {
            return null;
        }

        const now = new Date();
        const due = new Date(todo.dueDate);

        // Nollställ tid för att jämföra endast datum
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        const diffTime = dueDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let level;
        if (diffDays < 0) {
            level = 'overdue';
        } else if (diffDays === 0) {
            level = 'today';
        } else if (diffDays === 1) {
            level = 'tomorrow';
        } else if (diffDays <= 7) {
            level = 'thisWeek';
        } else {
            level = 'future';
        }

        return {
            level,
            daysUntil: diffDays,
            ...this.warningLevels[level]
        };
    }

    /**
     * Analysera alla todos och returnera de som behöver varningar
     * @param {Array<Object>} todos - Todos to analyze
     * @returns {Object} Warnings grouped by level
     * @property {Array<Object>} overdue - Overdue todos
     * @property {Array<Object>} today - Todos due today
     * @property {Array<Object>} tomorrow - Todos due tomorrow
     * @property {Array<Object>} thisWeek - Todos due this week
     * @property {Array<Object>} future - Future todos
     */
    analyzeAllTodos(todos) {
        const warnings = {
            overdue: [],
            today: [],
            tomorrow: [],
            thisWeek: [],
            future: []
        };

        todos.forEach(todo => {
            if (todo.completed) {return;} // Skip färdiga todos

            const analysis = this.analyzeTodo(todo);
            if (analysis) {
                warnings[analysis.level].push({
                    ...todo,
                    deadline: analysis
                });
            }
        });

        return warnings;
    }

    /**
     * Hämta todos som behöver akuta varningar (försenad, idag, imorgon)
     * @param {Array<Object>} todos - Todos to check
     * @returns {Array<Object>} Urgent todos sorted by priority
     */
    getUrgentTodos(todos) {
        const warnings = this.analyzeAllTodos(todos);
        return [
            ...warnings.overdue,
            ...warnings.today,
            ...warnings.tomorrow
        ].sort((a, b) => b.deadline.priority - a.deadline.priority);
    }

    /**
     * Visa desktop notification för urgent todos
     * @param {Array<Object>} todos - Todos to check for notifications
     */
    async showNotifications(todos) {
        if (!('Notification' in window)) {
            logger.warn('Browser stöder inte notifications');
            return;
        }

        // Be om permission om inte redan given
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') {
            return;
        }

        const urgent = this.getUrgentTodos(todos);

        urgent.forEach(todo => {
            const notificationKey = `${todo.id}-${todo.deadline.level}`;

            // Visa varje notification bara en gång per dag
            if (this.notificationShown.has(notificationKey)) {
                return;
            }

            const notification = new Notification(`${todo.deadline.icon} ${todo.deadline.label}`, {
                body: todo.text,
                icon: '/favicon.svg',
                tag: notificationKey,
                requireInteraction: todo.deadline.level === 'overdue'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            this.notificationShown.add(notificationKey);
            this.saveNotificationHistory();
            eventBus.emit('deadline:notificationShown', { todo, level: todo.deadline.level });
        });
    }

    /**
     * Visa in-app toast notification
     * @param {string} message - Message to display
     * @param {string} [level='info'] - Warning level
     * @param {number} [duration=5000] - Display duration in ms
     * @returns {HTMLElement} Toast element
     */
    showToast(message, level = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `deadline-toast deadline-toast-${level}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.warningLevels[level]?.icon || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        document.body.appendChild(toast);

        // Auto-remove efter duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        return toast;
    }

    /**
     * Visa daglig sammanfattning av deadlines
     * @param {Array<Object>} todos - Todos to summarize
     */
    showDailySummary(todos) {
        const warnings = this.analyzeAllTodos(todos);
        const urgent = this.getUrgentTodos(todos);

        if (urgent.length === 0) {
            return;
        }

        let message = '';

        if (warnings.overdue.length > 0) {
            message += `🚨 ${warnings.overdue.length} försenade todos\n`;
        }
        if (warnings.today.length > 0) {
            message += `⚡ ${warnings.today.length} deadline idag\n`;
        }
        if (warnings.tomorrow.length > 0) {
            message += `📅 ${warnings.tomorrow.length} deadline imorgon`;
        }

        if (message) {
            this.showToast(message.trim(), warnings.overdue.length > 0 ? 'overdue' : 'today', 8000);
            eventBus.emit('deadline:summaryShown', { warnings, urgent });
        }
    }

    /**
     * Starta periodisk koll av deadlines
     * @param {Function} getTodosCallback - Callback to get current todos
     * @param {number} [interval=60000] - Check interval in ms (default: 1 minute)
     */
    startMonitoring(getTodosCallback, interval = 60000) {
        // Initial check
        const todos = getTodosCallback();
        this.showDailySummary(todos);

        // Periodisk check (default varje minut)
        this.checkInterval = setInterval(() => {
            const currentTodos = getTodosCallback();
            const urgent = this.getUrgentTodos(currentTodos);

            // Visa notification om det finns nya urgenta todos
            if (urgent.length > 0) {
                this.showNotifications(currentTodos);
            }
        }, interval);
    }

    /**
     * Stoppa periodisk monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Återställ vilka notifications som har visats (körs dagligen)
     */
    resetNotificationHistory() {
        this.notificationShown.clear();
        this.saveNotificationHistory();
        eventBus.emit('deadline:historyReset', null);
    }

    /**
     * Formattera deadline för visning
     * @param {string|Date} dueDate - Due date to format
     * @returns {string} Formatted deadline string with icon
     */
    formatDeadline(dueDate) {
        const analysis = this.analyzeTodo({ dueDate });
        if (!analysis) {return '';}

        const date = new Date(dueDate);
        const dateStr = date.toLocaleDateString('sv-SE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        if (analysis.level === 'overdue') {
            return `🚨 Försenad (${dateStr})`;
        } else if (analysis.level === 'today') {
            return '⚡ Idag';
        } else if (analysis.level === 'tomorrow') {
            return '📅 Imorgon';
        } else {
            return `📆 ${dateStr}`;
        }
    }

    /**
     * Hämta CSS-klass för deadline-level
     * @param {Object} todo - Todo to get class for
     * @returns {string} CSS class name
     */
    getDeadlineClass(todo) {
        const analysis = this.analyzeTodo(todo);
        return analysis ? `deadline-${analysis.level}` : '';
    }

    /**
     * Sortera todos med deadlines först
     * @param {Array<Object>} todos - Todos to sort
     * @returns {Array<Object>} Sorted todos (urgent first)
     */
    sortByDeadline(todos) {
        return todos.sort((a, b) => {
            const aAnalysis = this.analyzeTodo(a);
            const bAnalysis = this.analyzeTodo(b);

            // Todos utan deadline kommer sist
            if (!aAnalysis && !bAnalysis) {return 0;}
            if (!aAnalysis) {return 1;}
            if (!bAnalysis) {return -1;}

            // Sortera efter priority (högre = mer urgent)
            if (aAnalysis.priority !== bAnalysis.priority) {
                return bAnalysis.priority - aAnalysis.priority;
            }

            // Inom samma priority-level, sortera efter datum
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }

    /**
     * Hämta statistik för deadlines
     * @param {Array<Object>} todos - Todos to analyze
     * @returns {Object} Statistics object
     * @property {number} overdue - Overdue count
     * @property {number} today - Due today count
     * @property {number} tomorrow - Due tomorrow count
     * @property {number} thisWeek - Due this week count
     * @property {number} total - Total todos with deadlines
     * @property {number} urgent - Total urgent todos
     */
    getDeadlineStats(todos) {
        const warnings = this.analyzeAllTodos(todos);

        return {
            overdue: warnings.overdue.length,
            today: warnings.today.length,
            tomorrow: warnings.tomorrow.length,
            thisWeek: warnings.thisWeek.length,
            total: todos.filter(t => !t.completed && t.dueDate).length,
            urgent: warnings.overdue.length + warnings.today.length + warnings.tomorrow.length
        };
    }
}
