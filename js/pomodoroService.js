/**
 * Pomodoro Timer Service
 * Manages work/break intervals, notifications, and session tracking
 */

export class PomodoroService {
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
        this.callbacks = new Set();
        
        // Load state from localStorage
        this.loadState();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Request notification permission
        this.requestNotificationPermission();
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('pomodoroState');
            if (saved) {
                const savedState = JSON.parse(saved);
                
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
            }
        } catch (error) {
            console.error('Failed to load pomodoro state:', error);
        }
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const today = new Date().toDateString();
            localStorage.setItem('pomodoroState', JSON.stringify({
                totalSessionsToday: this.state.totalSessionsToday,
                sessionsCompleted: this.state.sessionsCompleted,
                date: today
            }));
        } catch (error) {
            console.error('Failed to save pomodoro state:', error);
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
        if (this.state.isRunning) return;
        
        this.state.isRunning = true;
        this.state.startTime = Date.now();
        
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.notifyListeners();
    }
    
    /**
     * Pause the timer
     */
    pause() {
        if (!this.state.isRunning) return;
        
        this.state.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;
        
        this.notifyListeners();
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
        this.notifyListeners();
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
     */
    tick() {
        if (this.state.timeLeft > 0) {
            this.state.timeLeft--;
            this.notifyListeners();
        } else {
            // Timer complete
            this.completeSession();
        }
    }
    
    /**
     * Complete current session and switch mode
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
            
            // Dispatch event for stats integration
            window.dispatchEvent(new CustomEvent('pomodoroCompleted', {
                detail: {
                    sessionsCompleted: this.state.sessionsCompleted,
                    totalToday: this.state.totalSessionsToday
                }
            }));
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
        this.notifyListeners();
    }
    
    /**
     * Show notification when timer completes
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
     */
    playSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            console.log('Could not play sound:', error);
        }
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get formatted time (MM:SS)
     */
    getFormattedTime() {
        const minutes = Math.floor(this.state.timeLeft / 60);
        const seconds = this.state.timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get progress percentage
     */
    getProgress() {
        const total = this.duration[this.state.mode === 'work' ? 'work' : 
                                     this.state.sessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak'];
        return ((total - this.state.timeLeft) / total) * 100;
    }
    
    /**
     * Get mode display name
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
     * Subscribe to timer updates
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    
    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.callbacks.forEach(callback => {
            try {
                callback(this.getState());
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }
    
    /**
     * Get today's stats
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
     */
    setDurations(work, shortBreak, longBreak) {
        if (work) this.duration.work = work * 60;
        if (shortBreak) this.duration.shortBreak = shortBreak * 60;
        if (longBreak) this.duration.longBreak = longBreak * 60;
        
        // Reset if not running
        if (!this.state.isRunning) {
            this.reset();
        }
    }
}

// Export singleton instance
export const pomodoroService = new PomodoroService();
