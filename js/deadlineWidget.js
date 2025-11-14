/**
 * Deadline Warnings Widget - Visar upcoming och överdue deadlines
 */

import { DeadlineService } from './deadlineService.js';

class DeadlineWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.deadlineService = new DeadlineService();
        this.todos = [];
    }

    connectedCallback() {
        this.render();

        // Lyssna på todo-uppdateringar
        window.addEventListener('todosUpdated', (e) => {
            this.todos = e.detail.todos || [];
            this.updateWarnings();
        });

        // Lyssna på tema-ändringar
        window.addEventListener('themechange', () => {
            this.render();
        });
    }

    updateWarnings() {
        this.render();
    }

    render() {
        const isDark = document.body.classList.contains('dark-theme');
        const warnings = this.deadlineService.analyzeAllTodos(this.todos);
        const stats = this.deadlineService.getDeadlineStats(this.todos);

        // Visa bara om det finns urgent deadlines
        const hasUrgent = stats.urgent > 0;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .warnings-container {
                    font-family: 'Segoe UI', sans-serif;
                }
                
                .warning-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid ${isDark ? '#3a3a52' : '#e9ecef'};
                }
                
                .warning-badge {
                    background: ${isDark ? '#4d2d2d' : '#fee2e2'};
                    color: ${isDark ? '#ef5350' : '#e74c3c'};
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: bold;
                }
                
                .warning-section {
                    margin-bottom: 1.5rem;
                }
                
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    color: ${isDark ? '#e0e0e0' : '#333'};
                }
                
                .warning-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .warning-item {
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    transition: transform 0.2s ease;
                }
                
                .warning-item:hover {
                    transform: translateX(4px);
                }
                
                .warning-item.overdue {
                    background: ${isDark ? 'linear-gradient(90deg, #4d2d2d 0%, #5d3d3d 100%)' : 'linear-gradient(90deg, #fff5f5 0%, #fee2e2 100%)'};
                    border-left: 4px solid #e74c3c;
                }
                
                .warning-item.today {
                    background: ${isDark ? 'linear-gradient(90deg, #4d3d2d 0%, #5d4d2d 100%)' : 'linear-gradient(90deg, #fffbf0 0%, #fef3c7 100%)'};
                    border-left: 4px solid #f39c12;
                }
                
                .warning-item.tomorrow {
                    background: ${isDark ? 'linear-gradient(90deg, #3d3d4d 0%, #4d4d5d 100%)' : 'linear-gradient(90deg, #f0f9ff 0%, #dbeafe 100%)'};
                    border-left: 4px solid #3498db;
                }
                
                .warning-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                
                .warning-content {
                    flex: 1;
                }
                
                .warning-text {
                    color: ${isDark ? '#e0e0e0' : '#333'};
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                }
                
                .warning-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: ${isDark ? '#aaa' : '#666'};
                }
                
                .priority-badge {
                    padding: 0.2rem 0.5rem;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                
                .priority-high {
                    background: ${isDark ? '#5d2d2d' : '#fee2e2'};
                    color: #e74c3c;
                }
                
                .priority-medium {
                    background: ${isDark ? '#5d4d2d' : '#fef3c7'};
                    color: #f39c12;
                }
                
                .no-warnings {
                    text-align: center;
                    padding: 2rem;
                    color: ${isDark ? '#66bb6a' : '#27ae60'};
                    font-size: 1.1rem;
                }
                
                .no-warnings-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                }
                
                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 0.75rem;
                    margin-top: 1rem;
                }
                
                .stat-pill {
                    background: ${isDark ? '#2d2d44' : '#f8f9fa'};
                    padding: 0.5rem;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: ${isDark ? '#64b5f6' : '#3498db'};
                }
                
                .stat-label {
                    font-size: 0.75rem;
                    color: ${isDark ? '#aaa' : '#666'};
                    margin-top: 0.25rem;
                }
                
                @media (max-width: 768px) {
                    .warning-item {
                        padding: 0.5rem;
                    }
                    
                    .warning-icon {
                        font-size: 1.25rem;
                    }
                }
            </style>
            
            <div class="warnings-container">
                ${hasUrgent ? `
                    <div class="warning-header">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <strong>Deadlines att uppmärksamma</strong>
                        <span class="warning-badge">${stats.urgent} urgent${stats.urgent !== 1 ? 'a' : ''}</span>
                    </div>
                ` : ''}
                
                ${this.renderWarningSection('overdue', warnings.overdue, '🚨 Försenade')}
                ${this.renderWarningSection('today', warnings.today, '⚡ Idag')}
                ${this.renderWarningSection('tomorrow', warnings.tomorrow, '📅 Imorgon')}
                
                ${!hasUrgent && warnings.thisWeek.length === 0 ? `
                    <div class="no-warnings">
                        <div class="no-warnings-icon">✅</div>
                        <div>Inga urgenta deadlines!</div>
                        <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
                            Fortsätt det goda arbetet! 🎉
                        </div>
                    </div>
                ` : ''}
                
                ${stats.total > 0 ? `
                    <div class="summary-stats">
                        ${stats.overdue > 0 ? `
                            <div class="stat-pill">
                                <div class="stat-value" style="color: #e74c3c;">${stats.overdue}</div>
                                <div class="stat-label">Försenade</div>
                            </div>
                        ` : ''}
                        ${stats.thisWeek > 0 ? `
                            <div class="stat-pill">
                                <div class="stat-value">${stats.thisWeek}</div>
                                <div class="stat-label">Denna vecka</div>
                            </div>
                        ` : ''}
                        <div class="stat-pill">
                            <div class="stat-value">${stats.total}</div>
                            <div class="stat-label">Totalt med deadline</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderWarningSection(level, todos, title) {
        if (todos.length === 0) {return '';}

        return `
            <div class="warning-section">
                <div class="section-title">
                    <span>${title}</span>
                    <span style="opacity: 0.6;">(${todos.length})</span>
                </div>
                <ul class="warning-list">
                    ${todos.map(todo => `
                        <li class="warning-item ${level}">
                            <span class="warning-icon">${todo.deadline.icon}</span>
                            <div class="warning-content">
                                <div class="warning-text">${this.escapeHtml(todo.text)}</div>
                                <div class="warning-meta">
                                    ${todo.priority && todo.priority !== 'normal' ? `
                                        <span class="priority-badge priority-${todo.priority}">
                                            ${this.getPriorityText(todo.priority)}
                                        </span>
                                    ` : ''}
                                    ${todo.source === 'obsidian' ? '<span>📝 Obsidian</span>' : ''}
                                    ${todo.tags && todo.tags.length > 0 ? `
                                        <span>${todo.tags.map(t => `#${t}`).join(' ')}</span>
                                    ` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    getPriorityText(priority) {
        const map = {
            high: '🔥 Hög',
            medium: '⚠️ Medel',
            low: '🔽 Låg'
        };
        return map[priority] || priority;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('deadline-widget', DeadlineWidget);
