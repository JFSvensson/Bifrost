import { recurringService } from '../services/recurringService.js';
import eventBus from '../core/eventBus.js';

/**
 * Recurring Widget - Manage recurring todo patterns
 */
export class RecurringWidget extends HTMLElement {
    shadowRoot!: ShadowRoot;
    patterns: any[];
    showEditor: boolean;
    editingPattern: any;
    unsubscribe?: () => void;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.patterns = [];
        this.showEditor = false;
        this.editingPattern = null;
    }

    connectedCallback() {
        this.render();
        this.loadPatterns();

        // Subscribe to recurring service events via eventBus
        eventBus.on('recurring:pattern-created', (data: any) => {
            this.handleRecurringEvent('pattern-created', data);
        });
        eventBus.on('recurring:pattern-updated', (data: any) => {
            this.handleRecurringEvent('pattern-updated', data);
        });
        eventBus.on('recurring:pattern-deleted', (data: any) => {
            this.handleRecurringEvent('pattern-deleted', data);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    loadPatterns() {
        this.patterns = recurringService.getAllPatterns();
        this.updatePatternsList();
        this.updateStats();
    }

    handleRecurringEvent(event, data) {
        switch (event) {
            case 'patternCreated':
            case 'patternUpdated':
            case 'patternDeleted':
            case 'cleared':
                this.loadPatterns();
                break;
            case 'todoCreated':
            case 'nextInstanceCreated':
                this.showToast('✓ Återkommande uppgift skapad!');
                this.loadPatterns();
                break;
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .recurring-container {
                    background: var(--card-bg, #fff);
                    border-radius: 8px;
                    padding: 1rem;
                }
                
                .stats-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }
                
                .stat-card {
                    flex: 1;
                    min-width: 80px;
                    background: var(--bg-secondary, #f5f5f5);
                    padding: 0.75rem;
                    border-radius: 6px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: var(--primary-color, #4a90e2);
                }
                
                .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary, #666);
                    margin-top: 0.25rem;
                }
                
                .actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                
                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                }
                
                .btn-primary:hover {
                    background: var(--primary-hover, #357abd);
                }
                
                .btn-secondary {
                    background: var(--bg-secondary, #f0f0f0);
                    color: var(--text-color, #333);
                }
                
                .btn-secondary:hover {
                    background: var(--hover-bg, #e0e0e0);
                }
                
                .patterns-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .pattern-card {
                    background: var(--bg-secondary, #f8f8f8);
                    border: 1px solid var(--border-color, #e0e0e0);
                    border-radius: 8px;
                    padding: 1rem;
                    transition: all 0.2s ease;
                }
                
                .pattern-card:hover {
                    border-color: var(--primary-color, #4a90e2);
                    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
                }
                
                .pattern-card.paused {
                    opacity: 0.6;
                    background: var(--bg-tertiary, #fafafa);
                }
                
                .pattern-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 0.5rem;
                }
                
                .pattern-text {
                    font-weight: 500;
                    color: var(--text-color, #333);
                    flex: 1;
                }
                
                .pattern-badges {
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }
                
                .badge {
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .badge-daily { background: #e3f2fd; color: #1976d2; }
                .badge-weekly { background: #f3e5f5; color: #7b1fa2; }
                .badge-monthly { background: #fff3e0; color: #e65100; }
                .badge-paused { background: #fafafa; color: #999; }
                .badge-active { background: #e8f5e9; color: #2e7d32; }
                
                .pattern-description {
                    font-size: 0.875rem;
                    color: var(--text-secondary, #666);
                    margin-bottom: 0.5rem;
                }
                
                .pattern-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #999);
                    flex-wrap: wrap;
                }
                
                .pattern-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }
                
                .btn-small {
                    padding: 0.25rem 0.75rem;
                    font-size: 0.75rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-pause {
                    background: #fff3e0;
                    color: #e65100;
                }
                
                .btn-resume {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                .btn-edit {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .btn-delete {
                    background: #ffebee;
                    color: #c62828;
                }
                
                .btn-small:hover {
                    opacity: 0.8;
                    transform: translateY(-1px);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-secondary, #666);
                }
                
                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .editor-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .editor-modal {
                    background: var(--card-bg, #fff);
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .editor-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-color, #333);
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-secondary, #666);
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-color, #333);
                    margin-bottom: 0.5rem;
                }
                
                .form-input,
                .form-select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 6px;
                    font-size: 0.875rem;
                    background: var(--input-bg, #fff);
                    color: var(--text-color, #333);
                }
                
                .form-input:focus,
                .form-select:focus {
                    outline: none;
                    border-color: var(--primary-color, #4a90e2);
                }
                
                .weekdays {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                .weekday-btn {
                    padding: 0.5rem;
                    min-width: 40px;
                    border: 2px solid var(--border-color, #ddd);
                    border-radius: 6px;
                    background: var(--bg-secondary, #f5f5f5);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .weekday-btn.selected {
                    border-color: var(--primary-color, #4a90e2);
                    background: var(--primary-color, #4a90e2);
                    color: white;
                }
                
                .editor-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                }
                
                .hidden {
                    display: none;
                }
                
                /* Dark theme support */
                :host([theme="dark"]) .recurring-container {
                    background: var(--card-bg-dark, #2a2a2a);
                }
                
                :host([theme="dark"]) .pattern-card {
                    background: var(--bg-secondary-dark, #333);
                    border-color: var(--border-dark, #444);
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .stats-row {
                        flex-direction: column;
                    }
                    
                    .stat-card {
                        min-width: 100%;
                    }
                    
                    .editor-modal {
                        width: 95%;
                        padding: 1.5rem;
                    }
                }
            </style>
            
            <div class="recurring-container">
                <div class="stats-row" id="statsRow"></div>
                
                <div class="actions">
                    <button class="btn btn-primary" id="addPatternBtn" aria-label="Skapa ny återkommande uppgift">
                        ➕ Ny återkommande uppgift
                    </button>
                    <button class="btn btn-secondary" id="checkNowBtn" aria-label="Kontrollera återkommande uppgifter nu">
                        🔄 Kontrollera nu
                    </button>
                </div>
                
                <div class="patterns-list" id="patternsList"></div>
            </div>
            
            <div class="editor-overlay hidden" id="editorOverlay">
                <div class="editor-modal">
                    <div class="editor-header">
                        <h3 class="editor-title" id="editorTitle">Ny återkommande uppgift</h3>
                        <button class="close-btn" id="closeEditorBtn" aria-label="Stäng redigeraren">✕</button>
                    </div>
                    
                    <form id="patternForm">
                        <div class="form-group">
                            <label class="form-label">Uppgift</label>
                            <input type="text" class="form-input" id="patternText" placeholder="T.ex. Träna" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Typ</label>
                            <select class="form-select" id="patternType">
                                <option value="daily">Dagligen</option>
                                <option value="weekly">Veckovis</option>
                                <option value="monthly">Månadsvis</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Frekvens</label>
                            <input type="number" class="form-input" id="patternFrequency" min="1" value="1">
                        </div>
                        
                        <div class="form-group hidden" id="weekdaysGroup">
                            <label class="form-label">Veckodagar</label>
                            <div class="weekdays" id="weekdaysContainer" role="group" aria-label="Välj veckodagar">
                                <button type="button" class="weekday-btn" data-day="1" aria-label="Måndag">Mån</button>
                                <button type="button" class="weekday-btn" data-day="2" aria-label="Tisdag">Tis</button>
                                <button type="button" class="weekday-btn" data-day="3" aria-label="Onsdag">Ons</button>
                                <button type="button" class="weekday-btn" data-day="4" aria-label="Torsdag">Tors</button>
                                <button type="button" class="weekday-btn" data-day="5" aria-label="Fredag">Fre</button>
                                <button type="button" class="weekday-btn" data-day="6" aria-label="Lördag">Lör</button>
                                <button type="button" class="weekday-btn" data-day="0" aria-label="Söndag">Sön</button>
                            </div>
                        </div>
                        
                        <div class="form-group hidden" id="dayOfMonthGroup">
                            <label class="form-label">Dag i månaden</label>
                            <input type="number" class="form-input" id="patternDayOfMonth" min="1" max="31" value="1">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tid (valfritt)</label>
                            <input type="time" class="form-input" id="patternTime">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Prioritet</label>
                            <select class="form-select" id="patternPriority">
                                <option value="normal">Normal</option>
                                <option value="high">Hög</option>
                                <option value="medium">Medel</option>
                                <option value="low">Låg</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Taggar (kommaseparerade)</label>
                            <input type="text" class="form-input" id="patternTags" placeholder="arbete, träning">
                        </div>
                        
                        <div class="editor-actions">
                            <button type="submit" class="btn btn-primary">Spara</button>
                            <button type="button" class="btn btn-secondary" id="cancelEditorBtn">Avbryt</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const addBtn = this.shadowRoot.getElementById('addPatternBtn');
        const checkBtn = this.shadowRoot.getElementById('checkNowBtn');
        const closeBtn = this.shadowRoot.getElementById('closeEditorBtn');
        const cancelBtn = this.shadowRoot.getElementById('cancelEditorBtn');
        const form = this.shadowRoot.getElementById('patternForm');
        const typeSelect = this.shadowRoot.getElementById('patternType');
        const overlay = this.shadowRoot.getElementById('editorOverlay');

        addBtn.addEventListener('click', () => this.openEditor());
        checkBtn.addEventListener('click', () => this.checkNow());
        closeBtn.addEventListener('click', () => this.closeEditor());
        cancelBtn.addEventListener('click', () => this.closeEditor());
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        typeSelect.addEventListener('change', () => this.updateEditorVisibility());

        // Weekday buttons
        const weekdayBtns = this.shadowRoot.querySelectorAll('.weekday-btn');
        weekdayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeEditor();
            }
        });
    }

    openEditor(pattern = null) {
        this.editingPattern = pattern;
        const overlay = this.shadowRoot.getElementById('editorOverlay');
        const title = this.shadowRoot.getElementById('editorTitle');

        if (pattern) {
            title.textContent = 'Redigera återkommande uppgift';
            this.populateEditor(pattern);
        } else {
            title.textContent = 'Ny återkommande uppgift';
            this.resetEditor();
        }

        overlay.classList.remove('hidden');
        this.updateEditorVisibility();
    }

    closeEditor() {
        const overlay = this.shadowRoot.getElementById('editorOverlay');
        overlay.classList.add('hidden');
        this.editingPattern = null;
        this.resetEditor();
    }

    resetEditor() {
        const form = this.shadowRoot.getElementById('pattern-form') as HTMLFormElement;
        form.reset();

        // Deselect all weekdays
        const weekdayBtns = this.shadowRoot.querySelectorAll('.weekday-btn');
        weekdayBtns.forEach(btn => btn.classList.remove('selected'));
    }

    populateEditor(pattern) {
        (this.shadowRoot.getElementById('patternText') as HTMLInputElement).value = pattern.text;
        (this.shadowRoot.getElementById('patternType') as HTMLSelectElement).value = pattern.type;
        (this.shadowRoot.getElementById('patternFrequency') as HTMLInputElement).value = pattern.frequency;
        (this.shadowRoot.getElementById('patternTime') as HTMLInputElement).value = pattern.time || '';
        (this.shadowRoot.getElementById('patternPriority') as HTMLSelectElement).value = pattern.priority;
        (this.shadowRoot.getElementById('patternTags') as HTMLInputElement).value = (pattern.tags || []).join(', ');

        if (pattern.type === 'weekly' && pattern.daysOfWeek) {
            pattern.daysOfWeek.forEach(day => {
                const btn = this.shadowRoot.querySelector(`[data-day="${day}"]`);
                if (btn) {btn.classList.add('selected');}
            });
        }

        if (pattern.type === 'monthly') {
            (this.shadowRoot.getElementById('patternDayOfMonth') as HTMLInputElement).value = (pattern.dayOfMonth || 1).toString();
        }
    }

    updateEditorVisibility() {
        const type = (this.shadowRoot.getElementById('patternType') as HTMLSelectElement).value;
        const weekdaysGroup = this.shadowRoot.getElementById('weekdaysGroup');
        const dayOfMonthGroup = this.shadowRoot.getElementById('dayOfMonthGroup');

        weekdaysGroup.classList.toggle('hidden', type !== 'weekly');
        dayOfMonthGroup.classList.toggle('hidden', type !== 'monthly');
    }

    handleSubmit(e) {
        e.preventDefault();

        const text = (this.shadowRoot.getElementById('patternText') as HTMLInputElement).value.trim();
        const type = (this.shadowRoot.getElementById('patternType') as HTMLSelectElement).value;
        const frequency = parseInt((this.shadowRoot.getElementById('patternFrequency') as HTMLInputElement).value);
        const time = (this.shadowRoot.getElementById('patternTime') as HTMLInputElement).value || null;
        const priority = (this.shadowRoot.getElementById('patternPriority') as HTMLSelectElement).value;
        const tagsInput = (this.shadowRoot.getElementById('patternTags') as HTMLInputElement).value;
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        const pattern: any = {
            text,
            type,
            frequency,
            time,
            priority,
            tags
        };

        if (type === 'weekly') {
            const selectedDays = Array.from(this.shadowRoot.querySelectorAll('.weekday-btn.selected'))
                .map(btn => parseInt((btn as HTMLElement).dataset!.day));
            pattern.daysOfWeek = selectedDays;
        }

        if (type === 'monthly') {
            pattern.dayOfMonth = parseInt((this.shadowRoot.getElementById('patternDayOfMonth') as HTMLInputElement).value);
        }

        if (this.editingPattern) {
            recurringService.updatePattern(this.editingPattern.id, pattern);
        } else {
            recurringService.createPattern(pattern);
        }

        this.closeEditor();
        this.showToast('✓ Mönster sparat!');
    }

    updateStats() {
        const stats = recurringService.getStats();
        const statsRow = this.shadowRoot.getElementById('statsRow');

        statsRow.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.active}</div>
                <div class="stat-label">Aktiva</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.paused}</div>
                <div class="stat-label">Pausade</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.upcoming}</div>
                <div class="stat-label">Kommande</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalCompletions}</div>
                <div class="stat-label">Totalt skapade</div>
            </div>
        `;
    }

    updatePatternsList() {
        const listEl = this.shadowRoot.getElementById('patternsList');

        if (this.patterns.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔄</div>
                    <p>Inga återkommande uppgifter än</p>
                    <p style="font-size: 0.875rem;">Skapa din första för att komma igång!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = this.patterns.map(pattern => this.renderPattern(pattern)).join('');

        // Add event listeners to buttons
        this.patterns.forEach(pattern => {
            const pauseBtn = this.shadowRoot.getElementById(`pause-${pattern.id}`);
            const resumeBtn = this.shadowRoot.getElementById(`resume-${pattern.id}`);
            const editBtn = this.shadowRoot.getElementById(`edit-${pattern.id}`);
            const deleteBtn = this.shadowRoot.getElementById(`delete-${pattern.id}`);

            if (pauseBtn) {pauseBtn.addEventListener('click', () => this.pausePattern(pattern.id));}
            if (resumeBtn) {resumeBtn.addEventListener('click', () => this.resumePattern(pattern.id));}
            if (editBtn) {editBtn.addEventListener('click', () => this.openEditor(pattern));}
            if (deleteBtn) {deleteBtn.addEventListener('click', () => this.deletePattern(pattern.id));}
        });
    }

    renderPattern(pattern) {
        const statusBadge = pattern.active
            ? '<span class="badge badge-active">Aktiv</span>'
            : '<span class="badge badge-paused">Pausad</span>';

        const typeBadge = `<span class="badge badge-${pattern.type}">${this.getTypeLabel(pattern.type)}</span>`;

        const nextDueText = pattern.nextDue
            ? this.formatDate(pattern.nextDue)
            : 'Beräknas...';

        const lastCreatedText = pattern.lastCreated
            ? this.formatDate(pattern.lastCreated)
            : 'Aldrig';

        return `
            <div class="pattern-card ${pattern.active ? '' : 'paused'}">
                <div class="pattern-header">
                    <div class="pattern-text">${pattern.text}</div>
                    <div class="pattern-badges">
                        ${statusBadge}
                        ${typeBadge}
                    </div>
                </div>
                <div class="pattern-description">
                    ${recurringService.getPatternDescription(pattern)}
                </div>
                <div class="pattern-meta">
                    <span>📅 Nästa: ${nextDueText}</span>
                    <span>✓ Senast skapad: ${lastCreatedText}</span>
                    <span>🔢 Skapade: ${pattern.completionCount || 0}</span>
                </div>
                <div class="pattern-actions">
                    ${pattern.active
        ? `<button class="btn-small btn-pause" id="pause-${pattern.id}" aria-label="Pausa ${pattern.text}">⏸️ Pausa</button>`
        : `<button class="btn-small btn-resume" id="resume-${pattern.id}" aria-label="Återuppta ${pattern.text}">▶️ Återuppta</button>`
}
                    <button class="btn-small btn-edit" id="edit-${pattern.id}" aria-label="Redigera ${pattern.text}">✏️ Redigera</button>
                    <button class="btn-small btn-delete" id="delete-${pattern.id}" aria-label="Ta bort ${pattern.text}">🗑️ Ta bort</button>
                </div>
            </div>
        `;
    }

    getTypeLabel(type) {
        const labels = {
            daily: 'Dagligen',
            weekly: 'Veckovis',
            monthly: 'Månadsvis',
            custom: 'Anpassat'
        };
        return labels[type] || type;
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {return 'Idag';}
        if (diffDays === 1) {return 'Imorgon';}
        if (diffDays === -1) {return 'Igår';}

        return d.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    pausePattern(id) {
        recurringService.pausePattern(id);
        this.showToast('⏸️ Mönster pausat');
    }

    resumePattern(id) {
        recurringService.resumePattern(id);
        this.showToast('▶️ Mönster återupptaget');
    }

    deletePattern(id) {
        if (confirm('Är du säker på att du vill ta bort detta mönster?')) {
            recurringService.deletePattern(id);
            this.showToast('🗑️ Mönster borttaget');
        }
    }

    checkNow() {
        const dueTodos = recurringService.checkDuePatterns();
        if (dueTodos.length > 0) {
            this.showToast(`✓ ${dueTodos.length} uppgift(er) skapad(e)!`);
        } else {
            this.showToast('✓ Inga nya uppgifter att skapa just nu');
        }
    }

    showToast(message) {
        // Dispatch event for main app to show toast
        this.dispatchEvent(new CustomEvent('toast', {
            detail: { message },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('recurring-widget', RecurringWidget);
