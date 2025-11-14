/**
 * ReminderWidget - Custom Element
 *
 * Visar aktiva påminnelser med countdown-timers, snooze-knappar och statistik.
 *
 * Features:
 * - Lista med kommande påminnelser (sorterad efter tid)
 * - Live countdown till varje påminnelse
 * - Snooze-knapp med dropdown-presets
 * - Avbryt påminnelse-knapp
 * - Notification permission request
 * - Statistik (aktiva, snoozed, kommande 24h)
 * - Dark theme support
 *
 * @example
 * <reminder-widget></reminder-widget>
 */

import reminderService from './reminderService.js';

class ReminderWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.updateInterval = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.startLiveUpdates();

        // Subscribe till reminderService events
        reminderService.subscribe('reminderCreated', () => this.updateReminders());
        reminderService.subscribe('todoSnoozed', () => this.updateReminders());
        reminderService.subscribe('reminderCancelled', () => this.updateReminders());
        reminderService.subscribe('remindersChecked', () => this.updateReminders());
        reminderService.subscribe('notificationPermissionChanged', () => this.updatePermissionUI());
    }

    disconnectedCallback() {
        this.stopLiveUpdates();
    }

    render() {
        const stats = reminderService.getStats();
        const reminders = reminderService.getActiveReminders();
        const permission = reminderService.notificationPermission;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .stats-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }
                
                .stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1f2937;
                }
                
                .stat.active .stat-value { color: #3b82f6; }
                .stat.snoozed .stat-value { color: #8b5cf6; }
                .stat.upcoming .stat-value { color: #f59e0b; }
                
                .permission-banner {
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .permission-banner.denied {
                    background: #fee2e2;
                    border-color: #ef4444;
                }
                
                .permission-text {
                    flex: 1;
                    font-size: 14px;
                    color: #78350f;
                }
                
                .permission-banner.denied .permission-text {
                    color: #7f1d1d;
                }
                
                .permission-btn {
                    padding: 6px 12px;
                    background: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background 0.2s;
                }
                
                .permission-btn:hover {
                    background: #d97706;
                }
                
                .reminders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .reminder-card {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    position: relative;
                }
                
                .reminder-card.snoozed {
                    background: #faf5ff;
                    border-color: #c4b5fd;
                }
                
                .reminder-card.urgent {
                    background: #fef2f2;
                    border-color: #fecaca;
                }
                
                .reminder-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .reminder-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: #1f2937;
                    word-break: break-word;
                }
                
                .reminder-type {
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .reminder-type.manual {
                    background: #dbeafe;
                    color: #1e40af;
                }
                
                .reminder-type.snoozed {
                    background: #ede9fe;
                    color: #6b21a8;
                }
                
                .reminder-type.deadline-relative {
                    background: #fef3c7;
                    color: #92400e;
                }
                
                .reminder-meta {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    font-size: 13px;
                    color: #6b7280;
                }
                
                .countdown {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 500;
                }
                
                .countdown.urgent {
                    color: #dc2626;
                }
                
                .countdown.soon {
                    color: #f59e0b;
                }
                
                .reminder-time {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .reminder-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 4px;
                }
                
                .action-btn {
                    padding: 4px 10px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    color: #374151;
                    transition: all 0.2s;
                }
                
                .action-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }
                
                .action-btn.cancel {
                    color: #dc2626;
                    border-color: #fecaca;
                }
                
                .action-btn.cancel:hover {
                    background: #fee2e2;
                    border-color: #dc2626;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #9ca3af;
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }
                
                .empty-text {
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                
                .empty-hint {
                    font-size: 12px;
                    color: #d1d5db;
                }
                
                /* Dark theme */
                :host(.dark-theme) .container {
                    background: #1f2937;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                
                :host(.dark-theme) h3 {
                    color: #f3f4f6;
                }
                
                :host(.dark-theme) .stat-label {
                    color: #9ca3af;
                }
                
                :host(.dark-theme) .stat-value {
                    color: #f3f4f6;
                }
                
                :host(.dark-theme) .stat.active .stat-value { color: #60a5fa; }
                :host(.dark-theme) .stat.snoozed .stat-value { color: #a78bfa; }
                :host(.dark-theme) .stat.upcoming .stat-value { color: #fbbf24; }
                
                :host(.dark-theme) .reminder-card {
                    background: #374151;
                    border-color: #4b5563;
                }
                
                :host(.dark-theme) .reminder-card.snoozed {
                    background: #312e81;
                    border-color: #6366f1;
                }
                
                :host(.dark-theme) .reminder-card.urgent {
                    background: #7f1d1d;
                    border-color: #dc2626;
                }
                
                :host(.dark-theme) .reminder-text {
                    color: #f3f4f6;
                }
                
                :host(.dark-theme) .reminder-meta {
                    color: #9ca3af;
                }
                
                :host(.dark-theme) .action-btn {
                    background: #4b5563;
                    border-color: #6b7280;
                    color: #f3f4f6;
                }
                
                :host(.dark-theme) .action-btn:hover {
                    background: #6b7280;
                    border-color: #9ca3af;
                }
                
                :host(.dark-theme) .empty-state {
                    color: #6b7280;
                }
                
                :host(.dark-theme) .empty-hint {
                    color: #4b5563;
                }
            </style>
            
            <div class="container">
                <div class="header">
                    <h3>
                        <span>🔔</span>
                        <span>Påminnelser</span>
                    </h3>
                </div>
                
                ${this.renderPermissionBanner(permission)}
                
                <div class="stats-row">
                    <div class="stat active">
                        <div class="stat-label">Aktiva</div>
                        <div class="stat-value">${stats.active}</div>
                    </div>
                    <div class="stat snoozed">
                        <div class="stat-label">Snoozade</div>
                        <div class="stat-value">${stats.snoozed}</div>
                    </div>
                    <div class="stat upcoming">
                        <div class="stat-label">Kommande 24h</div>
                        <div class="stat-value">${stats.upcoming24h}</div>
                    </div>
                </div>
                
                <div class="reminders-list">
                    ${reminders.length > 0
        ? reminders.map(r => this.renderReminderCard(r)).join('')
        : this.renderEmptyState()}
                </div>
            </div>
        `;
    }

    renderPermissionBanner(permission) {
        if (permission === 'granted') {
            return '';
        }

        if (permission === 'denied') {
            return `
                <div class="permission-banner denied">
                    <span>⚠️</span>
                    <div class="permission-text">
                        <strong>Notifications blockerade.</strong> 
                        Aktivera i webbläsarinställningar för att få desktop-notiser.
                    </div>
                </div>
            `;
        }

        return `
            <div class="permission-banner">
                <span>🔔</span>
                <div class="permission-text">
                    Aktivera notifications för att få påminnelser även när fliken är i bakgrunden.
                </div>
                <button class="permission-btn" id="requestPermissionBtn">
                    Aktivera
                </button>
            </div>
        `;
    }

    renderReminderCard(reminder) {
        const timeUntil = this.calculateTimeUntil(reminder.remindAt);
        const isUrgent = timeUntil.totalMinutes <= 10;
        const isSoon = timeUntil.totalMinutes <= 60 && !isUrgent;

        const cardClass = reminder.type === 'snoozed' ? 'snoozed' : (isUrgent ? 'urgent' : '');
        const countdownClass = isUrgent ? 'urgent' : (isSoon ? 'soon' : '');

        return `
            <div class="reminder-card ${cardClass}" data-reminder-id="${reminder.id}">
                <div class="reminder-header">
                    <div class="reminder-text">${this.escapeHtml(reminder.text)}</div>
                    <div class="reminder-type ${reminder.type}">${this.getTypeLabel(reminder.type)}</div>
                </div>
                <div class="reminder-meta">
                    <div class="countdown ${countdownClass}">
                        <span>${isUrgent ? '⚡' : '⏰'}</span>
                        <span>${timeUntil.display}</span>
                    </div>
                    <div class="reminder-time">
                        <span>📅</span>
                        <span>${this.formatDateTime(reminder.remindAt)}</span>
                    </div>
                    ${reminder.type === 'snoozed' && reminder.snoozeCount ? `
                        <div>
                            <span>💤</span>
                            <span>Snoozad ${reminder.snoozeCount}x</span>
                        </div>
                    ` : ''}
                </div>
                <div class="reminder-actions">
                    <button class="action-btn cancel" data-action="cancel">
                        Avbryt
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔕</div>
                <div class="empty-text">Inga aktiva påminnelser</div>
                <div class="empty-hint">Snooze en todo eller skapa en påminnelse med Quick Add</div>
            </div>
        `;
    }

    calculateTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));

        let display;
        if (totalMinutes < 0) {
            display = 'Nu!';
        } else if (totalMinutes < 1) {
            display = 'Mindre än 1 min';
        } else if (totalMinutes < 60) {
            display = `${totalMinutes} min`;
        } else if (totalHours < 24) {
            const mins = totalMinutes % 60;
            display = `${totalHours}h ${mins}min`;
        } else {
            display = `${totalDays} dag${totalDays !== 1 ? 'ar' : ''}`;
        }

        return { totalMinutes, totalHours, totalDays, display };
    }

    formatDateTime(date) {
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return `Idag ${timeStr}`;
        } else if (isTomorrow) {
            return `Imorgon ${timeStr}`;
        } else {
            return date.toLocaleString('sv-SE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    getTypeLabel(type) {
        const labels = {
            'manual': 'Manuell',
            'snoozed': 'Snoozad',
            'deadline-relative': 'Deadline'
        };
        return labels[type] || type;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        // Permission button
        const permBtn = this.shadowRoot.getElementById('requestPermissionBtn');
        if (permBtn) {
            permBtn.addEventListener('click', async () => {
                await reminderService.requestNotificationPermission();
            });
        }

        // Action buttons
        this.shadowRoot.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (!actionBtn) {return;}

            const card = actionBtn.closest('.reminder-card');
            const reminderId = card?.dataset.reminderId;
            if (!reminderId) {return;}

            const action = actionBtn.dataset.action;

            if (action === 'cancel') {
                this.handleCancelReminder(reminderId);
            }
        });
    }

    handleCancelReminder(reminderId) {
        if (confirm('Vill du avbryta denna påminnelse?')) {
            reminderService.cancelReminder(reminderId);

            // Toast
            this.dispatchEvent(new CustomEvent('show-toast', {
                bubbles: true,
                composed: true,
                detail: {
                    message: 'Påminnelse avbruten',
                    type: 'info'
                }
            }));
        }
    }

    updateReminders() {
        this.render();
        this.setupEventListeners();
    }

    updatePermissionUI() {
        this.render();
        this.setupEventListeners();
    }

    startLiveUpdates() {
        // Uppdatera countdown-timers varje minut
        this.updateInterval = setInterval(() => {
            this.updateCountdowns();
        }, 60000);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    updateCountdowns() {
        const reminders = reminderService.getActiveReminders();

        reminders.forEach(reminder => {
            const card = this.shadowRoot.querySelector(`[data-reminder-id="${reminder.id}"]`);
            if (!card) {return;}

            const timeUntil = this.calculateTimeUntil(reminder.remindAt);
            const isUrgent = timeUntil.totalMinutes <= 10;
            const isSoon = timeUntil.totalMinutes <= 60 && !isUrgent;

            const countdown = card.querySelector('.countdown');
            if (countdown) {
                countdown.className = `countdown ${isUrgent ? 'urgent' : (isSoon ? 'soon' : '')}`;
                const icon = countdown.querySelector('span:first-child');
                const text = countdown.querySelector('span:last-child');
                if (icon) {icon.textContent = isUrgent ? '⚡' : '⏰';}
                if (text) {text.textContent = timeUntil.display;}
            }

            // Uppdatera card class
            if (isUrgent && !card.classList.contains('urgent')) {
                card.classList.add('urgent');
            }
        });
    }
}

customElements.define('reminder-widget', ReminderWidget);
