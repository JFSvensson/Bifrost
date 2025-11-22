/**
 * Pomodoro Timer Service
 * Manages work/break intervals, notifications, and session tracking
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

export class PomodoroService {
    duration: any;
    state: any;
    interval: number | null;

    constructor() {
        this.duration = {
            work: 25 * 60, // 25 minutes in seconds
            shortBreak: 5 * 60, // 5 minutes
            longBreak: 15 * 60 // 15 minutes after 4 sessions
        };

        this.state = {
            mode: 'work', // 'work', 'shortBreak', 'longBreak'
            timeLeft: this.duration.work,
            isRunning: false,
            sessionsCompleted: 0,
            totalSessionsToday: 0,
            startTime: null
        };

        this.interval = null;
        this._init();
    }

    /**
     * Initialize pomodoro service
     * @private
     */
    _init() {
        // Register schema
        stateManager.registerSchema('pomodoroState', {
            version: 1,
            validate: (data) => {
                return typeof data.totalSessionsToday === 'number' &&
                       typeof data.sessionsCompleted === 'number' &&
                       typeof data.date === 'string';
            },
            migrate: (oldData) => oldData,
            default: {
                totalSessionsToday: 0,
                sessionsCompleted: 0,
                date: new Date().toDateString()
            }
        });

        // Load state from storage
        this.loadState();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Request notification permission
        this.requestNotificationPermission();
    }

    /**
     * Load state from storage
     * @private
     */
    loadState() {
        try {
            const savedState = stateManager.get('pomodoroState', null);

            // Check if it's from today
            const today = new Date().toDateString();
            const savedDate = savedState.date;

            if (savedDate === today) {
                this.state.totalSessionsToday = savedState.totalSessionsToday || 0;
                this.state.sessionsCompleted = savedState.sessionsCompleted || 0;
            } else {
                // New day, reset
                this.state.totalSessionsToday = 0;
                this.state.sessionsCompleted = 0;
            }
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading pomodoro state'
            });
        }
    }

    /**
     * Save state to storage
     * @private
     */
    saveState() {
        try {
            const today = new Date().toDateString();
            stateManager.set('pomodoroState', {
                totalSessionsToday: this.state.totalSessionsToday,
                sessionsCompleted: this.state.sessionsCompleted,
                date: today
            });
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving pomodoro state',
                showToast: true
            });
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+P - Toggle timer
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }

            // Ctrl+Shift+R - Reset timer
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.reset();
            }
        });
    }

    /**
     * Start the timer
     */
    start() {
        if (this.state.isRunning) {return;}

        this.state.isRunning = true;
        this.state.startTime = Date.now();

        this.interval = setInterval(() => {
            this.tick();
        }, 1000) as unknown as number;

        eventBus.emit('pomodoro:started', { state: this.getState() });
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.state.isRunning) {return;}

        this.state.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;

        eventBus.emit('pomodoro:paused', { state: this.getState() });
    }

    /**
     * Toggle timer (start/pause)
     */
    toggle() {
        if (this.state.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    /**
     * Reset current timer
     */
    reset() {
        this.pause();
        this.state.timeLeft = this.duration[this.state.mode === 'work' ? 'work' :
            this.state.sessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak'];
        eventBus.emit('pomodoro:reset', { state: this.getState() });
    }

    /**
     * Skip to next mode
     */
    skip() {
        this.pause();
        this.completeSession();
    }

    /**
     * Timer tick (1 second)
     * @private
     */
    tick() {
        if (this.state.timeLeft > 0) {
            this.state.timeLeft--;
            eventBus.emit('pomodoro:tick', { state: this.getState() });
        } else {
            // Timer complete
            this.completeSession();
        }
    }

    /**
     * Complete current session and switch mode
     * @private
     */
    completeSession() {
        const wasWork = this.state.mode === 'work';

        // Show notification
        this.showNotification(wasWork);

        // Play sound (optional)
        this.playSound();

        // Update stats
        if (wasWork) {
            this.state.sessionsCompleted++;
            this.state.totalSessionsToday++;
            this.saveState();

            // Emit event for stats integration
            eventBus.emit('pomodoro:completed', {
                sessionsCompleted: this.state.sessionsCompleted,
                totalToday: this.state.totalSessionsToday
            });
        }

        // Switch mode
        if (wasWork) {
            // Check if it's time for long break
            if (this.state.sessionsCompleted % 4 === 0 && this.state.sessionsCompleted > 0) {
                this.state.mode = 'longBreak';
                this.state.timeLeft = this.duration.longBreak;
            } else {
                this.state.mode = 'shortBreak';
                this.state.timeLeft = this.duration.shortBreak;
            }
        } else {
            this.state.mode = 'work';
            this.state.timeLeft = this.duration.work;
        }

        // Auto-start next session (optional)
        // this.start();

        this.pause();
        eventBus.emit('pomodoro:modeChanged', { state: this.getState() });
    }

    /**
     * Show notification when timer completes
     * @param {boolean} wasWork - Whether it was a work session
     * @private
     */
    showNotification(wasWork) {
        const title = wasWork ? '🎉 Pomodoro Complete!' : '✅ Break Over!';
        const body = wasWork
            ? `Great work! Time for a ${this.state.sessionsCompleted % 4 === 0 ? '15' : '5'} minute break.`
            : 'Break time is over. Ready to focus again?';

        // Desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'pomodoro',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Toast notification
        this.showToast(title, wasWork ? 'work' : 'break');
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} [type='work'] - Toast type ('work' or 'break')
     * @private
     */
    showToast(message, type = 'work') {
        // Remove existing toasts
        const existing = document.querySelectorAll('.pomodoro-toast');
        existing.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `pomodoro-toast pomodoro-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'work' ? '🎉' : '✅'}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" aria-label="Close">✕</button>
        `;

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Play completion sound
     * @private
     */
    playSound() {
        try {
            // Create a simple beep sound using Web Audio API
            // @ts-ignore - webkitAudioContext is legacy but still needed for some browsers
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioCtx();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            logger.debug('Could not play sound:', error);
        }
    }

    /**
     * Get current state
     * @returns {Object} Current pomodoro state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get formatted time (MM:SS)
     * @returns {string} Formatted time string
     */
    getFormattedTime() {
        const minutes = Math.floor(this.state.timeLeft / 60);
        const seconds = this.state.timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get progress percentage
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        const total = this.duration[this.state.mode === 'work' ? 'work' :
            this.state.sessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak'];
        return ((total - this.state.timeLeft) / total) * 100;
    }

    /**
     * Get mode display name
     * @returns {string} Human-readable mode name
     */
    getModeName() {
        const names = {
            work: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        return names[this.state.mode] || this.state.mode;
    }

    /**
     * Get today's stats
     * @returns {Object} Today's pomodoro statistics
     * @property {number} sessionsCompleted - Sessions completed in current streak
     * @property {number} totalSessions - Total sessions today
     * @property {number} focusMinutes - Total focus time today
     * @property {number} streakSessions - Current streak
     */
    getTodayStats() {
        return {
            sessionsCompleted: this.state.sessionsCompleted,
            totalSessions: this.state.totalSessionsToday,
            focusMinutes: this.state.totalSessionsToday * 25,
            streakSessions: this.state.sessionsCompleted
        };
    }

    /**
     * Set custom durations (in minutes)
     * @param {number} work - Work duration in minutes
     * @param {number} shortBreak - Short break duration in minutes
     * @param {number} longBreak - Long break duration in minutes
     */
    setDurations(work, shortBreak, longBreak) {
        if (work) {this.duration.work = work * 60;}
        if (shortBreak) {this.duration.shortBreak = shortBreak * 60;}
        if (longBreak) {this.duration.longBreak = longBreak * 60;}

        // Reset if not running
        if (!this.state.isRunning) {
            this.reset();
        }

        eventBus.emit('pomodoro:durationsChanged', { duration: this.duration });
    }
}

// Export singleton instance
export const pomodoroService = new PomodoroService();
