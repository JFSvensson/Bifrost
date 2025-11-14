/**
 * Google Calendar Widget
 * Visual component displaying calendar events
 */

import { googleCalendarService } from './googleCalendarService.js';

class CalendarWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.events = [];
        this.isAuthenticated = false;
        this.isLoading = false;
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        // Subscribe to auth changes
        this.unsubscribe = googleCalendarService.subscribe((data) => {
            this.isAuthenticated = data.authenticated;
            this.render();

            if (data.authenticated) {
                this.loadEvents();
            }
        });

        // Initialize service
        this.initializeService();
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async initializeService() {
        try {
            await googleCalendarService.initialize();

            if (googleCalendarService.isAuthenticated()) {
                this.isAuthenticated = true;
                this.render();
                await this.loadEvents();
            }
        } catch (error) {
            console.error('Failed to initialize calendar service:', error);
            this.showError(error.message);
        }
    }

    async loadEvents() {
        if (!this.isAuthenticated) {return;}

        this.isLoading = true;
        this.render();

        try {
            const events = await googleCalendarService.getTodaysEvents();
            this.events = events.map(e => googleCalendarService.formatEvent(e));
            this.isLoading = false;
            this.render();
        } catch (error) {
            console.error('Failed to load events:', error);
            this.isLoading = false;
            this.showError('Failed to load calendar events');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .calendar-container {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .calendar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                
                .calendar-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .auth-section {
                    text-align: center;
                    padding: 2rem;
                }
                
                .auth-btn {
                    background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                }
                
                .auth-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
                }
                
                .sign-out-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .sign-out-btn:hover {
                    background: #c82333;
                }
                
                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #7f8c8d;
                }
                
                .loading-spinner {
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #4285f4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .events-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .event-card {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-left: 4px solid #4285f4;
                    border-radius: 8px;
                    padding: 1rem;
                    transition: all 0.2s ease;
                }
                
                .event-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .event-card.all-day {
                    border-left-color: #34a853;
                }
                
                .event-time {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #4285f4;
                    margin-bottom: 0.25rem;
                }
                
                .event-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.25rem;
                }
                
                .event-description {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                    margin-top: 0.5rem;
                    line-height: 1.4;
                }
                
                .event-location {
                    font-size: 0.85rem;
                    color: #7f8c8d;
                    margin-top: 0.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: #7f8c8d;
                }
                
                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .error-message {
                    background: #fee;
                    border-left: 4px solid #e74c3c;
                    padding: 1rem;
                    border-radius: 8px;
                    color: #c0392b;
                    margin-top: 1rem;
                }
                
                .sync-status {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #7f8c8d;
                }
                
                .sync-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #34a853;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .refresh-btn {
                    background: none;
                    border: none;
                    color: #4285f4;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.25rem;
                    transition: transform 0.2s ease;
                }
                
                .refresh-btn:hover {
                    transform: rotate(180deg);
                }
                
                /* Dark theme */
                :host(.dark-theme) .calendar-container {
                    background: #2d3748;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                
                :host(.dark-theme) .calendar-title {
                    color: #e2e8f0;
                }
                
                :host(.dark-theme) .event-card {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                }
                
                :host(.dark-theme) .event-title {
                    color: #e2e8f0;
                }
                
                :host(.dark-theme) .event-time,
                :host(.dark-theme) .event-description,
                :host(.dark-theme) .event-location {
                    color: #a0aec0;
                }
                
                :host(.dark-theme) .empty-state,
                :host(.dark-theme) .loading {
                    color: #a0aec0;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .calendar-container {
                        padding: 1rem;
                    }
                    
                    .event-card {
                        padding: 0.75rem;
                    }
                }
            </style>
            
            <div class="calendar-container">
                ${this.renderContent()}
            </div>
        `;
    }

    renderContent() {
        if (!this.isAuthenticated) {
            return `
                <div class="auth-section">
                    <div class="empty-icon">📅</div>
                    <h3 style="margin-bottom: 1rem; color: #2c3e50;">Connect Google Calendar</h3>
                    <p style="color: #7f8c8d; margin-bottom: 1.5rem;">
                        Sign in to view your calendar events and sync todos
                    </p>
                    <button class="auth-btn" id="sign-in-btn">
                        <span>📧</span>
                        <span>Sign in with Google</span>
                    </button>
                </div>
            `;
        }

        if (this.isLoading) {
            return `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 1rem;">Loading events...</p>
                </div>
            `;
        }

        return `
            <div class="calendar-header">
                <h3 class="calendar-title">
                    <span>📅</span>
                    <span>Today's Events (${this.events.length})</span>
                </h3>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="refresh-btn" id="refresh-btn" title="Refresh events">🔄</button>
                    <button class="sign-out-btn" id="sign-out-btn">Sign Out</button>
                </div>
            </div>
            
            <div class="sync-status">
                <div class="sync-indicator"></div>
                <span>Connected to Google Calendar</span>
            </div>
            
            ${this.renderEvents()}
        `;
    }

    renderEvents() {
        if (this.events.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <p>No events today. Enjoy your free time!</p>
                </div>
            `;
        }

        return `
            <div class="events-list">
                ${this.events.map(event => this.renderEvent(event)).join('')}
            </div>
        `;
    }

    renderEvent(event) {
        const timeStr = event.allDay
            ? 'All day'
            : `${this.formatTime(event.start)} - ${this.formatTime(event.end)}`;

        return `
            <div class="event-card ${event.allDay ? 'all-day' : ''}">
                <div class="event-time">${timeStr}</div>
                <div class="event-title">${this.escapeHtml(event.title)}</div>
                ${event.description ? `<div class="event-description">${this.escapeHtml(event.description)}</div>` : ''}
                ${event.location ? `<div class="event-location">📍 ${this.escapeHtml(event.location)}</div>` : ''}
            </div>
        `;
    }

    formatTime(date) {
        return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        this.shadowRoot.addEventListener('click', async (e) => {
            if (e.target.id === 'sign-in-btn' || e.target.closest('#sign-in-btn')) {
                console.log('Initiating Google Calendar sign-in...');
                console.log();
                await googleCalendarService.signIn();
            }

            if (e.target.id === 'sign-out-btn' || e.target.closest('#sign-out-btn')) {
                googleCalendarService.signOut();
                this.events = [];
                this.render();
            }

            if (e.target.id === 'refresh-btn' || e.target.closest('#refresh-btn')) {
                await this.loadEvents();
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `⚠️ ${message}`;

        const container = this.shadowRoot.querySelector('.calendar-container');
        container.appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }
}

customElements.define('calendar-widget', CalendarWidget);
