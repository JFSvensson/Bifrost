/**
 * Pomodoro Timer Widget
 * Visual component for the Pomodoro timer with circular progress
 */

import { pomodoroService } from '../services/pomodoroService.js';

class PomodoroWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        // Subscribe to timer updates
        this.unsubscribe = pomodoroService.subscribe((state) => {
            this.updateDisplay(state);
        });

        // Initial update
        this.updateDisplay(pomodoroService.getState());
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .pomodoro-container {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                
                .pomodoro-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                
                .pomodoro-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .pomodoro-sessions {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                
                .timer-display {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    margin: 2rem auto;
                }
                
                .circular-progress {
                    transform: rotate(-90deg);
                }
                
                .progress-bg {
                    fill: none;
                    stroke: #f0f0f0;
                    stroke-width: 10;
                }
                
                .progress-bar {
                    fill: none;
                    stroke: #667eea;
                    stroke-width: 10;
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.3s ease, stroke 0.3s ease;
                }
                
                .progress-bar.work {
                    stroke: #667eea;
                }
                
                .progress-bar.break {
                    stroke: #48bb78;
                }
                
                .timer-content {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                
                .time-text {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #2c3e50;
                    font-family: 'Courier New', monospace;
                    margin: 0;
                }
                
                .mode-text {
                    font-size: 0.9rem;
                    color: #7f8c8d;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }
                
                .controls {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 1.5rem;
                }
                
                .control-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .control-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                
                .control-btn:active {
                    transform: translateY(0);
                }
                
                .control-btn.secondary {
                    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                }
                
                .control-btn.secondary:hover {
                    box-shadow: 0 4px 12px rgba(127, 140, 141, 0.4);
                }
                
                .control-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .stats-row {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 2px solid #f0f0f0;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #667eea;
                }
                
                .stat-label {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                    margin-top: 0.25rem;
                }
                
                .keyboard-hint {
                    font-size: 0.75rem;
                    color: #95a5a6;
                    margin-top: 1rem;
                }
                
                /* Dark theme */
                :host(.dark-theme) .pomodoro-container {
                    background: #2d3748;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                
                :host(.dark-theme) .pomodoro-title {
                    color: #e2e8f0;
                }
                
                :host(.dark-theme) .time-text {
                    color: #e2e8f0;
                }
                
                :host(.dark-theme) .mode-text {
                    color: #a0aec0;
                }
                
                :host(.dark-theme) .progress-bg {
                    stroke: #4a5568;
                }
                
                :host(.dark-theme) .stats-row {
                    border-top-color: #4a5568;
                }
                
                :host(.dark-theme) .stat-label {
                    color: #a0aec0;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .timer-display {
                        width: 180px;
                        height: 180px;
                    }
                    
                    .time-text {
                        font-size: 2rem;
                    }
                    
                    .controls {
                        flex-wrap: wrap;
                    }
                    
                    .control-btn {
                        padding: 0.6rem 1.2rem;
                        font-size: 0.9rem;
                    }
                }
            </style>
            
            <div class="pomodoro-container">
                <div class="pomodoro-header">
                    <h3 class="pomodoro-title">
                        <span>⏱️</span>
                        <span>Pomodoro Timer</span>
                    </h3>
                    <div class="pomodoro-sessions">
                        <span id="sessions-count">0/4</span>
                    </div>
                </div>
                
                <div class="timer-display">
                    <svg class="circular-progress" width="200" height="200" viewBox="0 0 200 200">
                        <circle class="progress-bg" cx="100" cy="100" r="90"></circle>
                        <circle class="progress-bar work" 
                                cx="100" cy="100" r="90"
                                id="progress-circle"
                                stroke-dasharray="565.48"
                                stroke-dashoffset="0"></circle>
                    </svg>
                    
                    <div class="timer-content">
                        <div class="time-text" id="time-display" role="timer" aria-live="polite" aria-atomic="true">25:00</div>
                        <div class="mode-text" id="mode-display" aria-live="polite">Focus Time</div>
                    </div>
                </div>
                
                <div class="controls">
                    <button class="control-btn" id="start-btn" aria-label="Starta timer">
                        <span>▶️</span>
                        <span>Start</span>
                    </button>
                    <button class="control-btn secondary" id="reset-btn" aria-label="Återställ timer">
                        <span>🔄</span>
                        <span>Reset</span>
                    </button>
                    <button class="control-btn secondary" id="skip-btn" aria-label="Hoppa över session">
                        <span>⏭️</span>
                        <span>Skip</span>
                    </button>
                </div>
                
                <div class="stats-row">
                    <div class="stat-item">
                        <div class="stat-value" id="today-sessions">0</div>
                        <div class="stat-label">Today</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="focus-minutes">0</div>
                        <div class="stat-label">Minutes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="streak-sessions">0</div>
                        <div class="stat-label">Streak</div>
                    </div>
                </div>
                
                <div class="keyboard-hint">
                    Ctrl+Shift+P: Start/Pause | Ctrl+Shift+R: Reset
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const startBtn = this.shadowRoot.getElementById('start-btn');
        const resetBtn = this.shadowRoot.getElementById('reset-btn');
        const skipBtn = this.shadowRoot.getElementById('skip-btn');

        startBtn.addEventListener('click', () => {
            pomodoroService.toggle();
        });

        resetBtn.addEventListener('click', () => {
            pomodoroService.reset();
        });

        skipBtn.addEventListener('click', () => {
            pomodoroService.skip();
        });
    }

    updateDisplay(state) {
        // Update time display
        const timeDisplay = this.shadowRoot.getElementById('time-display');
        timeDisplay.textContent = pomodoroService.getFormattedTime();

        // Update mode display
        const modeDisplay = this.shadowRoot.getElementById('mode-display');
        modeDisplay.textContent = pomodoroService.getModeName();

        // Update progress circle
        const progressCircle = this.shadowRoot.getElementById('progress-circle');
        const progress = pomodoroService.getProgress();
        const circumference = 565.48;
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;

        // Update circle color based on mode
        progressCircle.className = `progress-bar ${state.mode === 'work' ? 'work' : 'break'}`;

        // Update start button
        const startBtn = this.shadowRoot.getElementById('start-btn');
        if (state.isRunning) {
            startBtn.innerHTML = '<span>⏸️</span><span>Pause</span>';
        } else {
            startBtn.innerHTML = '<span>▶️</span><span>Start</span>';
        }

        // Update sessions count
        const sessionsCount = this.shadowRoot.getElementById('sessions-count');
        const currentInCycle = state.sessionsCompleted % 4;
        sessionsCount.textContent = `${currentInCycle}/4`;

        // Update stats
        const stats = pomodoroService.getTodayStats();
        this.shadowRoot.getElementById('today-sessions').textContent = stats.totalSessions;
        this.shadowRoot.getElementById('focus-minutes').textContent = stats.focusMinutes;
        this.shadowRoot.getElementById('streak-sessions').textContent = stats.streakSessions;
    }
}

customElements.define('pomodoro-widget', PomodoroWidget);
