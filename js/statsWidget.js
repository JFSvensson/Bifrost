/**
 * Statistics Widget - Visar produktivitetsstatistik
 * Inkluderar grafer, streaks, och insikter
 */

import { StatsService } from './statsService.js';

class StatsWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.statsService = new StatsService();
        this.currentTodos = [];
    }

    connectedCallback() {
        this.render();
        
        // Lyssna på todo-ändringar
        window.addEventListener('todosUpdated', (e) => {
            this.currentTodos = e.detail.todos || [];
            this.updateStats();
        });
        
        // Lyssna på tema-ändringar
        window.addEventListener('themechange', () => {
            this.render();
        });
    }

    updateStats() {
        this.render();
    }

    render() {
        const stats = this.statsService.getFullStats(this.currentTodos);
        const isDark = document.body.classList.contains('dark-theme');
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .stats-container {
                    font-family: 'Segoe UI', sans-serif;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .stat-card {
                    background: ${isDark ? '#2d2d44' : '#f8f9fa'};
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    transition: transform 0.2s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                }
                
                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: ${isDark ? '#64b5f6' : '#3498db'};
                    margin: 0;
                }
                
                .stat-label {
                    font-size: 0.85rem;
                    color: ${isDark ? '#aaa' : '#666'};
                    margin-top: 0.25rem;
                }
                
                .stat-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .streak-card {
                    background: linear-gradient(135deg, 
                        ${isDark ? '#4d2d2d 0%, #5d3d2d 100%' : '#fff5f5 0%, #fee2e2 100%'});
                    border-left: 4px solid ${isDark ? '#ef5350' : '#e74c3c'};
                }
                
                .chart-container {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: ${isDark ? '#2d2d44' : '#f8f9fa'};
                    border-radius: 8px;
                }
                
                .chart-title {
                    font-weight: 600;
                    margin-bottom: 1rem;
                    color: ${isDark ? '#e0e0e0' : '#333'};
                }
                
                .bar-chart {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    height: 150px;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .bar-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .bar {
                    width: 100%;
                    background: ${isDark ? '#64b5f6' : '#3498db'};
                    border-radius: 4px 4px 0 0;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .bar:hover {
                    background: ${isDark ? '#42a5f5' : '#2980b9'};
                    transform: scaleY(1.05);
                }
                
                .bar-value {
                    position: absolute;
                    top: -20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: ${isDark ? '#64b5f6' : '#3498db'};
                }
                
                .bar-label {
                    font-size: 0.7rem;
                    color: ${isDark ? '#aaa' : '#666'};
                    text-align: center;
                }
                
                .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                
                .tag-badge {
                    background: ${isDark ? '#3d2d5a' : '#e8f4f8'};
                    color: ${isDark ? '#9575cd' : '#7c3aed'};
                    padding: 0.4rem 0.8rem;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .tag-count {
                    background: ${isDark ? '#4d3d6a' : '#d0e7f0'};
                    padding: 0.2rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                
                .weekly-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                    gap: 0.75rem;
                    margin-top: 1rem;
                }
                
                .day-card {
                    background: ${isDark ? '#2d2d44' : '#fff'};
                    padding: 0.75rem;
                    border-radius: 6px;
                    text-align: center;
                    border: 2px solid ${isDark ? '#3a3a52' : '#e9ecef'};
                }
                
                .day-name {
                    font-size: 0.75rem;
                    color: ${isDark ? '#aaa' : '#666'};
                    margin-bottom: 0.5rem;
                }
                
                .day-value {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: ${isDark ? '#66bb6a' : '#27ae60'};
                }
                
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: ${isDark ? '#3a3a52' : '#e9ecef'};
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                
                .progress-fill {
                    height: 100%;
                    background: ${isDark ? '#66bb6a' : '#27ae60'};
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                
                .no-data {
                    text-align: center;
                    padding: 2rem;
                    color: ${isDark ? '#666' : '#999'};
                    font-style: italic;
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .chart-container {
                        padding: 0.75rem;
                    }
                    
                    .bar-chart {
                        height: 120px;
                    }
                }
            </style>
            
            <div class="stats-container">
                <!-- Quick Stats -->
                <div class="stats-grid">
                    <div class="stat-card streak-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${stats.currentStreak}</div>
                        <div class="stat-label">Dagars streak</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${stats.today.completed}</div>
                        <div class="stat-label">Klara idag</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📝</div>
                        <div class="stat-value">${stats.activeTodos}</div>
                        <div class="stat-label">Aktiva</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${stats.completionRate}%</div>
                        <div class="stat-label">Slutförda</div>
                    </div>
                </div>
                
                <!-- 7 Days Activity Chart -->
                <div class="chart-container">
                    <div class="chart-title">📈 Senaste 7 dagarna</div>
                    ${this.renderActivityChart(stats.last7Days)}
                </div>
                
                <!-- Top Tags -->
                ${stats.topTags.length > 0 ? `
                    <div class="chart-container">
                        <div class="chart-title">🏷️ Mest använda tags</div>
                        <div class="tags-list">
                            ${stats.topTags.map(tag => `
                                <div class="tag-badge">
                                    <span>#${tag.tag}</span>
                                    <span class="tag-count">${tag.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Weekly Overview -->
                <div class="chart-container">
                    <div class="chart-title">📅 Veckoöversikt</div>
                    ${this.renderWeeklyStats(stats.weeklyStats)}
                </div>
                
                <!-- Additional Stats -->
                <div class="stats-grid" style="margin-top: 1rem;">
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${stats.longestStreak}</div>
                        <div class="stat-label">Längsta streak</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">✨</div>
                        <div class="stat-value">${stats.totalCompleted}</div>
                        <div class="stat-label">Totalt klara</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${stats.averageCompletionTime.toFixed(1)}h</div>
                        <div class="stat-label">Genomsnitt tid</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📌</div>
                        <div class="stat-value">${stats.totalCreated}</div>
                        <div class="stat-label">Totalt skapade</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivityChart(data) {
        if (!data || data.length === 0) {
            return '<div class="no-data">Ingen aktivitet ännu</div>';
        }
        
        const maxValue = Math.max(...data.map(d => d.completed), 1);
        
        return `
            <div class="bar-chart">
                ${data.map(day => `
                    <div class="bar-wrapper">
                        <div class="bar" style="height: ${(day.completed / maxValue) * 100}%">
                            ${day.completed > 0 ? `<span class="bar-value">${day.completed}</span>` : ''}
                        </div>
                        <div class="bar-label">${day.date}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderWeeklyStats(weeklyStats) {
        const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
        
        return `
            <div class="weekly-grid">
                ${days.map(day => {
                    const stats = weeklyStats[day] || { completed: 0, created: 0 };
                    const progress = stats.created > 0 ? (stats.completed / stats.created * 100) : 0;
                    
                    return `
                        <div class="day-card">
                            <div class="day-name">${day.substring(0, 3)}</div>
                            <div class="day-value">${stats.completed}</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

customElements.define('stats-widget', StatsWidget);
