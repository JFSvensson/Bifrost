import { ClockService } from '../services/clockService.js';
import { clock as clockConfig } from '../config/config.js';

class ClockWidget extends HTMLElement {
    private clockService: ClockService;
    private updateInterval: number;
    private intervalId: number | null;
    private showMultipleTimezones: boolean;
    declare shadowRoot: ShadowRoot;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.clockService = new ClockService();
        this.updateInterval = clockConfig.updateInterval;
        this.intervalId = null;
        this.showMultipleTimezones = clockConfig.showMultipleTimezones;
    }

    connectedCallback() {
        this.updateTime();
        this.startClock();
    }

    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    updateTime() {
        if (this.showMultipleTimezones) {
            const timezones = this.clockService.getAllTimezones();
            this.render('multiple', timezones);
        } else {
            const mainTime = this.clockService.getCurrentTime();
            this.render('single', mainTime);
        }
    }

    startClock() {
        this.intervalId = setInterval(() => {
            this.updateTime();
        }, this.updateInterval) as unknown as number;
    }

    render(mode, data) {
        this.shadowRoot.innerHTML = this.renderHTML(mode, data);
    }

    renderHTML(mode, data) {
        const styles = this.getStyles();

        switch (mode) {
            case 'single':
                return `${styles}${this.getSingleClockHTML(data)}`;
            case 'multiple':
                return `${styles}${this.getMultipleClockHTML(data)}`;
            default:
                return `${styles}<div class="error">Okänt klockläge</div>`;
        }
    }

    getSingleClockHTML(timeData) {
        const isWorkingHours = this.clockService.isWorkingHours(timeData.timezone);
        const workingClass = isWorkingHours ? 'working-hours' : 'off-hours';

        return `
            <div class="clock-widget single">
                <div class="main-clock ${workingClass}">
                    <div class="time-display">
                        <div class="time">${timeData.time}</div>
                        <div class="date">${timeData.date}</div>
                    </div>
                    
                    <div class="timezone-info">
                        <div class="timezone-name">${this.clockService.getTimezoneName(timeData.timezone)}</div>
                        ${isWorkingHours ?
        '<div class="status working">🕒 Arbetstid</div>' :
        '<div class="status off">🌙 Ledigt</div>'
}
                    </div>
                </div>
            </div>
        `;
    }

    getMultipleClockHTML(timezonesData) {
        const mainTimezone = timezonesData[0];
        const otherTimezones = timezonesData.slice(1);

        const mainClockHTML = `
            <div class="main-clock">
                <div class="time-display">
                    <div class="time">${mainTimezone.time}</div>
                    <div class="date">${mainTimezone.date}</div>
                </div>
                <div class="timezone-name">${mainTimezone.name}</div>
            </div>
        `;

        const otherClocksHTML = otherTimezones.map(tz => {
            const timeDiff = this.clockService.getTimeDifference('Europe/Stockholm', tz.timezone);
            const diffText = timeDiff === 0 ? '' :
                timeDiff > 0 ? `+${timeDiff}h` : `${timeDiff}h`;
            const isWorking = this.clockService.isWorkingHours(tz.timezone);

            return `
                <div class="other-clock ${isWorking ? 'working' : 'off'}">
                    <div class="tz-header">
                        <span class="tz-name">${tz.name}</span>
                        ${diffText ? `<span class="tz-diff">${diffText}</span>` : ''}
                    </div>
                    <div class="tz-time">${tz.time}</div>
                    <div class="tz-status">
                        ${isWorking ? '🕒' : '🌙'}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="clock-widget multiple">
                ${mainClockHTML}
                
                ${otherTimezones.length > 0 ? `
                    <div class="other-timezones">
                        <h4>Andra tidszoner</h4>
                        <div class="timezone-grid">
                            ${otherClocksHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    font-family: inherit;
                }
                
                .clock-widget {
                    padding: 0;
                }
                
                .main-clock {
                    text-align: center;
                    margin-bottom: 1rem;
                }
                
                .time-display {
                    margin-bottom: 0.75rem;
                }
                
                .time {
                    font-size: 2.5rem;
                    font-weight: 300;
                    color: #2c3e50;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0.1em;
                    line-height: 1;
                }
                
                .date {
                    font-size: 1rem;
                    color: #666;
                    margin-top: 0.25rem;
                    text-transform: capitalize;
                }
                
                .timezone-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.75rem;
                    font-size: 0.9rem;
                }
                
                .timezone-name {
                    color: #666;
                    font-weight: 500;
                }
                
                .status {
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                }
                
                .status.working {
                    background: #e8f5e8;
                    color: #27ae60;
                }
                
                .status.off {
                    background: #f0f0f0;
                    color: #666;
                }
                
                .working-hours .time {
                    color: #27ae60;
                }
                
                .off-hours .time {
                    color: #666;
                }
                
                /* Multiple timezones styles */
                .multiple .main-clock {
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                }
                
                .multiple .time {
                    font-size: 2rem;
                }
                
                .other-timezones {
                    margin-top: 1rem;
                }
                
                .other-timezones h4 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.9rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .timezone-grid {
                    display: grid;
                    gap: 0.75rem;
                }
                
                .other-clock {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                
                .other-clock.working {
                    background: #e8f5e8;
                }
                
                .other-clock.off {
                    background: #f0f0f0;
                    opacity: 0.8;
                }
                
                .tz-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                }
                
                .tz-name {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .tz-diff {
                    font-size: 0.8rem;
                    color: #666;
                }
                
                .tz-time {
                    font-family: 'Courier New', monospace;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .tz-status {
                    font-size: 1.2rem;
                }
                
                .error {
                    padding: 1rem;
                    text-align: center;
                    color: #d00;
                    font-style: italic;
                }
                
                @media (max-width: 480px) {
                    .time {
                        font-size: 2rem !important;
                    }
                    
                    .timezone-info {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .other-clock {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 0.25rem;
                    }
                    
                    .tz-header {
                        align-items: center;
                    }
                }
            </style>
        `;
    }

    // Public methods
    toggleMultipleTimezones() {
        this.showMultipleTimezones = !this.showMultipleTimezones;
        this.updateTime();
    }

    addTimezone(timezone, name) {
        (this.clockService as any).timezones.push({ timezone, name });
        if (this.showMultipleTimezones) {
            this.updateTime();
        }
    }
}

customElements.define('clock-widget', ClockWidget);