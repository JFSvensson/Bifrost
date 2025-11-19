import { naturalLanguageParser } from '../utils/naturalLanguageParser.js';

/**
 * Quick Add Widget - Natural language todo input
 * Parses input like "Möt Anna imorgon 14:00 #arbete [!high]"
 */
export class QuickAddWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.parsed = null;
        this.suggestions = [];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-bottom: 2rem;
                }
                
                .quick-add-container {
                    background: var(--card-bg, #fff);
                    border: 2px solid var(--border-color, #e0e0e0);
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                .quick-add-container:focus-within {
                    border-color: var(--primary-color, #4a90e2);
                    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
                }
                
                .input-section {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                
                #quickAddInput {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 8px;
                    background: var(--input-bg, #fff);
                    color: var(--text-color, #333);
                    transition: all 0.2s ease;
                }
                
                #quickAddInput:focus {
                    outline: none;
                    border-color: var(--primary-color, #4a90e2);
                    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
                }
                
                #quickAddInput::placeholder {
                    color: var(--text-secondary, #888);
                }
                
                .add-button {
                    padding: 0.75rem 1.5rem;
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .add-button:hover {
                    background: var(--primary-hover, #357abd);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
                }
                
                .add-button:active {
                    transform: translateY(0);
                }
                
                .add-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .preview-section {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    min-height: 2rem;
                    align-items: center;
                }
                
                .preview-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    animation: badgeAppear 0.2s ease;
                }
                
                @keyframes badgeAppear {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .badge-date {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .badge-time {
                    background: #f3e5f5;
                    color: #7b1fa2;
                }
                
                .badge-tag {
                    background: #f3e5f5;
                    color: #8e24aa;
                }
                
                .badge-priority-high {
                    background: #ffebee;
                    color: #c62828;
                }
                
                .badge-priority-medium {
                    background: #fff3e0;
                    color: #e65100;
                }
                
                .badge-priority-low {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                .badge-text {
                    color: var(--text-secondary, #666);
                    font-style: italic;
                }
                
                .suggestions {
                    display: none;
                    position: absolute;
                    background: var(--card-bg, #fff);
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    margin-top: 0.5rem;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    min-width: 200px;
                }
                
                .suggestions.visible {
                    display: block;
                }
                
                .suggestion-item {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                
                .suggestion-item:hover {
                    background: var(--hover-bg, #f5f5f5);
                }
                
                .suggestion-item.selected {
                    background: var(--selected-bg, #e3f2fd);
                }
                
                .suggestion-type {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-secondary, #888);
                    margin-right: 0.5rem;
                }
                
                .help-text {
                    font-size: 0.875rem;
                    color: var(--text-secondary, #666);
                    margin-top: 0.5rem;
                }
                
                .help-examples {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-top: 0.5rem;
                }
                
                .help-example {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: var(--text-tertiary, #999);
                    padding: 0.25rem 0.5rem;
                    background: var(--bg-secondary, #f8f8f8);
                    border-radius: 4px;
                }
                
                /* Dark theme support */
                :host([theme="dark"]) .quick-add-container {
                    background: var(--card-bg-dark, #2a2a2a);
                    border-color: var(--border-dark, #444);
                }
                
                :host([theme="dark"]) #quickAddInput {
                    background: var(--input-bg-dark, #333);
                    border-color: var(--border-dark, #444);
                    color: var(--text-dark, #e0e0e0);
                }
                
                :host([theme="dark"]) .badge-date {
                    background: #1e3a5f;
                    color: #64b5f6;
                }
                
                :host([theme="dark"]) .badge-time {
                    background: #4a1f5f;
                    color: #ce93d8;
                }
                
                :host([theme="dark"]) .badge-tag {
                    background: #4a148c;
                    color: #ba68c8;
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .quick-add-container {
                        padding: 1rem;
                    }
                    
                    .input-section {
                        flex-direction: column;
                    }
                    
                    .add-button {
                        width: 100%;
                    }
                    
                    .help-examples {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                }
            </style>
            
            <div class="quick-add-container">
                <div class="input-section">
                    <input 
                        type="text" 
                        id="quickAddInput" 
                        placeholder="Lägg till uppgift... (t.ex. 'Möt Anna imorgon 14:00 #arbete [!high]')"
                        autocomplete="off"
                        aria-label="Quick add todo"
                    />
                    <button class="add-button" id="addButton" aria-label="Lägg till uppgift">
                        Lägg till
                    </button>
                </div>
                
                <div class="preview-section" id="previewSection"></div>
                
                <div class="suggestions" id="suggestions"></div>
                
                <div class="help-text">
                    <strong>Snabbtips:</strong> Tryck Ctrl+K för att fokusera, Enter för att lägga till
                </div>
                <div class="help-examples">
                    <span class="help-example">idag #shopping</span>
                    <span class="help-example">imorgon 14:00 [!high]</span>
                    <span class="help-example">fredag #arbete 🔥</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const input = this.shadowRoot.getElementById('quickAddInput');
        const button = this.shadowRoot.getElementById('addButton');
        const suggestions = this.shadowRoot.getElementById('suggestions');

        // Real-time parsing and preview
        input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        // Enter to submit
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            } else if (e.key === 'Escape') {
                this.clearInput();
                suggestions.classList.remove('visible');
            }
        });

        // Button click
        button.addEventListener('click', () => {
            this.handleSubmit();
        });

        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                suggestions.classList.remove('visible');
            }
        });
    }

    setupKeyboardShortcuts() {
        // Ctrl+K to focus input
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const input = this.shadowRoot.getElementById('quickAddInput');
                input.focus();
            }
        });
    }

    handleInput(value) {
        // Parse input
        this.parsed = naturalLanguageParser.parse(value);

        // Update preview
        this.updatePreview();

        // Get suggestions
        this.suggestions = naturalLanguageParser.getSuggestions(value);
        this.updateSuggestions();
    }

    updatePreview() {
        const previewSection = this.shadowRoot.getElementById('previewSection');

        if (!this.parsed) {
            previewSection.innerHTML = '';
            return;
        }

        const badges = [];

        // Date badge
        if (this.parsed.dueDate) {
            const dateObj = new Date(this.parsed.dueDate);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();

            let dateText = this.parsed.dueDate;
            if (isToday) {dateText = 'Idag';}
            else if (isTomorrow) {dateText = 'Imorgon';}

            badges.push(`<span class="preview-badge badge-date">📅 ${dateText}</span>`);
        }

        // Time badge
        if (this.parsed.dueTime) {
            badges.push(`<span class="preview-badge badge-time">⏰ ${this.parsed.dueTime}</span>`);
        }

        // Tag badges
        if (this.parsed.tags && this.parsed.tags.length > 0) {
            this.parsed.tags.forEach(tag => {
                badges.push(`<span class="preview-badge badge-tag">#${tag}</span>`);
            });
        }

        // Priority badge
        if (this.parsed.priority && this.parsed.priority !== 'normal') {
            const priorityClass = `badge-priority-${this.parsed.priority}`;
            const priorityIcon = {
                high: '🔥',
                medium: '⚠️',
                low: '🔽'
            }[this.parsed.priority];

            badges.push(`<span class="preview-badge ${priorityClass}">${priorityIcon} ${this.parsed.priority}</span>`);
        }

        // Cleaned text preview
        if (this.parsed.text) {
            badges.push(`<span class="preview-badge badge-text">"${this.parsed.text}"</span>`);
        }

        previewSection.innerHTML = badges.join('');
    }

    updateSuggestions() {
        const suggestionsEl = this.shadowRoot.getElementById('suggestions');

        if (this.suggestions.length === 0) {
            suggestionsEl.classList.remove('visible');
            return;
        }

        const html = this.suggestions.map(s => `
            <div class="suggestion-item" data-value="${s.value}">
                <span class="suggestion-type">${s.type}</span>
                ${s.text}
            </div>
        `).join('');

        suggestionsEl.innerHTML = html;
        suggestionsEl.classList.add('visible');

        // Add click handlers
        suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.applySuggestion(item.dataset.value);
            });
        });
    }

    applySuggestion(value) {
        const input = this.shadowRoot.getElementById('quickAddInput');
        input.value += ' ' + value;
        input.focus();
        this.handleInput(input.value);
    }

    handleSubmit() {
        if (!this.parsed || !this.parsed.text) {
            return;
        }

        // Validate
        const validation = naturalLanguageParser.validate(this.parsed);
        if (!validation.valid) {
            console.error('Validation errors:', validation.errors);
            this.showError(validation.errors.join(', '));
            return;
        }

        // Dispatch event with parsed data
        this.dispatchEvent(new CustomEvent('todoAdded', {
            detail: this.parsed,
            bubbles: true,
            composed: true
        }));

        // Clear input
        this.clearInput();

        // Show success feedback
        this.showSuccess();
    }

    clearInput() {
        const input = this.shadowRoot.getElementById('quickAddInput');
        input.value = '';
        this.parsed = null;
        this.updatePreview();

        const suggestions = this.shadowRoot.getElementById('suggestions');
        suggestions.classList.remove('visible');
    }

    showSuccess() {
        const button = this.shadowRoot.getElementById('addButton');
        const originalText = button.textContent;

        button.textContent = '✓ Tillagd!';
        button.style.background = '#4caf50';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1000);
    }

    showError(message) {
        const input = this.shadowRoot.getElementById('quickAddInput');
        input.style.borderColor = '#f44336';

        setTimeout(() => {
            input.style.borderColor = '';
        }, 2000);

        console.error('Quick Add Error:', message);
    }

    // Public API
    focus() {
        const input = this.shadowRoot.getElementById('quickAddInput');
        input.focus();
    }

    setValue(value) {
        const input = this.shadowRoot.getElementById('quickAddInput');
        input.value = value;
        this.handleInput(value);
    }
}

// Register custom element
customElements.define('quick-add-widget', QuickAddWidget);
