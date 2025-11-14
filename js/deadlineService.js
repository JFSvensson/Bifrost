/**
 * Deadline Service - Hanterar deadline-varningar för todos
 * Visar notifications och färgkodning baserat på hur nära deadline
 */

export class DeadlineService {
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
    }

    /**
     * Analysera en todo och returnera dess deadline-status
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

        const diffTime = dueDay - today;
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
     */
    async showNotifications(todos) {
        if (!('Notification' in window)) {
            console.warn('Browser stöder inte notifications');
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
        });
    }

    /**
     * Visa in-app toast notification
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
        }
    }

    /**
     * Starta periodisk koll av deadlines
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
    }

    /**
     * Formattera deadline för visning
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
     */
    getDeadlineClass(todo) {
        const analysis = this.analyzeTodo(todo);
        return analysis ? `deadline-${analysis.level}` : '';
    }

    /**
     * Sortera todos med deadlines först
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
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    /**
     * Hämta statistik för deadlines
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
