/**
 * Search Widget
 * Expandable card with multi-source search and keyboard navigation
 */

import { searchService } from '../services/searchService.js';
import { keyboardShortcutService } from '../services/keyboardShortcutService.js';
import eventBus from '../core/eventBus.js';
import { debounce } from '../utils/debounce.js';
import { logger } from '../utils/logger.js';

class SearchWidget extends HTMLElement {
    private isExpanded: boolean;
    private results: SearchResult[];
    private selectedIndex: number;
    private currentQuery: string;
    private debouncedSearch?: DebouncedFunction<(query: string) => void>;
    private unregisterSearch?: () => void;
    private unregisterEscape?: () => void;
    declare shadowRoot: ShadowRoot;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isExpanded = false;
        this.results = [];
        this.selectedIndex = -1;
        this.currentQuery = '';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.registerShortcuts();
        logger.debug('Search Widget initialized');
    }

    disconnectedCallback() {
        this.cleanup();
    }

    /**
     * Register keyboard shortcuts
     * @private
     */
    registerShortcuts() {
        // Ctrl+F to focus search
        this.unregisterSearch = keyboardShortcutService.register({
            key: 'f',
            ctrl: true,
            description: 'Open global search',
            category: 'Search',
            priority: 10,
            handler: () => {
                this.expand();
                this.focusInput();
            }
        });

        // Escape to close search
        this.unregisterEscape = keyboardShortcutService.register({
            key: 'Escape',
            description: 'Close search',
            category: 'Search',
            priority: 15,
            handler: () => {
                if (this.isExpanded) {
                    this.collapse();
                }
            },
            condition: () => this.isExpanded
        });
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        const input = this.shadowRoot.querySelector('#search-input');
        const clearBtn = this.shadowRoot.querySelector('#clear-btn');

        // Debounced search
        this.debouncedSearch = debounce((query) => {
            this.performSearch(query);
        }, 300);

        input.addEventListener('input', (e) => {
            this.currentQuery = (e.target as HTMLInputElement).value;
            if (this.currentQuery.trim()) {
                this.debouncedSearch(this.currentQuery);
                this.expand();
            } else {
                this.clearResults();
                this.collapse();
            }
        });

        input.addEventListener('focus', () => {
            if (this.currentQuery.trim() && this.results.length > 0) {
                this.expand();
            }
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Keyboard navigation in input
        input.addEventListener('keydown', (e) => {
            if (!this.isExpanded || this.results.length === 0) return;

            switch ((e as KeyboardEvent).key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.activateSelected();
                    break;
            }
        });

        // Listen for index updates
        eventBus.on('search:indexUpdated', () => {
            if (this.currentQuery.trim()) {
                this.performSearch(this.currentQuery);
            }
        });
    }

    /**
     * Perform search
     * @private
     * @param {string} query
     */
    performSearch(query) {
        this.results = searchService.search(query, {
            limit: 20,
            fuzzy: true,
            threshold: 0.4
        });

        this.renderResults();
    }

    /**
     * Expand search results
     * @private
     */
    expand() {
        this.isExpanded = true;
        const resultsContainer = this.shadowRoot.querySelector('#results-container');
        resultsContainer.classList.add('expanded');
    }

    /**
     * Collapse search results
     * @private
     */
    collapse() {
        this.isExpanded = false;
        const resultsContainer = this.shadowRoot.querySelector('#results-container');
        resultsContainer.classList.remove('expanded');
        this.selectedIndex = -1;
    }

    /**
     * Clear search
     * @private
     */
    clearSearch() {
        const input = this.shadowRoot.querySelector('#search-input') as HTMLInputElement;
        input.value = '';
        this.currentQuery = '';
        this.clearResults();
        this.collapse();
        input.focus();
    }

    /**
     * Clear results
     * @private
     */
    clearResults() {
        this.results = [];
        this.selectedIndex = -1;
        this.renderResults();
    }

    /**
     * Focus search input
     * @private
     */
    focusInput() {
        const input = this.shadowRoot.querySelector('#search-input') as HTMLInputElement;
        input?.focus();
    }

    /**
     * Select next result
     * @private
     */
    selectNext() {
        if (this.results.length === 0) return;
        this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        this.updateSelection();
    }

    /**
     * Select previous result
     * @private
     */
    selectPrevious() {
        if (this.results.length === 0) return;
        this.selectedIndex = this.selectedIndex <= 0 
            ? this.results.length - 1 
            : this.selectedIndex - 1;
        this.updateSelection();
    }

    /**
     * Update visual selection
     * @private
     */
    updateSelection() {
        const items = this.shadowRoot.querySelectorAll('.result-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Activate selected result
     * @private
     */
    activateSelected() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
            const result = this.results[this.selectedIndex];
            this.handleResultClick(result);
        }
    }

    /**
     * Handle result click
     * @private
     * @param {Object} result
     */
    handleResultClick(result) {
        switch (result.type) {
            case 'link':
                window.open(result.url, '_blank');
                break;
            case 'todo':
            case 'deadline':
            case 'recurring':
            case 'reminder':
                // Emit event for other widgets to handle
                eventBus.emit(`${result.type}:selected`, result.metadata);
                // Scroll to widget
                const widgetName = result.type === 'todo' ? 'quick-add' : result.type;
                const widget = document.querySelector(`${widgetName}-widget`);
                widget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
        }

        this.collapse();
    }

    /**
     * Render results
     * @private
     */
    renderResults() {
        const resultsContainer = this.shadowRoot.querySelector('#results-list');
        
        if (this.results.length === 0) {
            if (this.currentQuery.trim()) {
                resultsContainer.innerHTML = '<div class="no-results">Inga resultat hittades</div>';
            } else {
                resultsContainer.innerHTML = '';
            }
            return;
        }

        resultsContainer.innerHTML = this.results.map((result, index) => `
            <div class="result-item ${index === this.selectedIndex ? 'selected' : ''}" 
                 data-index="${index}">
                <div class="result-icon">${result.sourceIcon}</div>
                <div class="result-content">
                    <div class="result-title">${this.highlightText(result.title, result.highlights)}</div>
                    <div class="result-meta">
                        <span class="result-source">${result.source}</span>
                        ${this.getResultMetadata(result)}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners
        const items = resultsContainer.querySelectorAll('.result-item');
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this.activateSelected();
            });
        });

        this.selectedIndex = -1; // Reset selection
    }

    /**
     * Highlight matching text
     * @private
     * @param {string} text
     * @param {Array} highlights
     * @returns {string}
     */
    highlightText(text, highlights) {
        if (!highlights || highlights.length === 0) {
            return this.escapeHtml(text);
        }

        let result = '';
        let lastIndex = 0;

        highlights.forEach(highlight => {
            result += this.escapeHtml(text.substring(lastIndex, highlight.start));
            result += `<mark>${this.escapeHtml(highlight.text)}</mark>`;
            lastIndex = highlight.end;
        });

        result += this.escapeHtml(text.substring(lastIndex));
        return result;
    }

    /**
     * Get result metadata
     * @private
     * @param {Object} result
     * @returns {string}
     */
    getResultMetadata(result) {
        switch (result.type) {
            case 'todo':
                return result.completed ? '• Klar' : '• Aktiv';
            case 'deadline':
                return result.dueDate ? `• ${new Date(result.dueDate).toLocaleDateString('sv-SE')}` : '';
            case 'reminder':
                return result.remindAt ? `• ${new Date(result.remindAt).toLocaleString('sv-SE')}` : '';
            case 'recurring':
                return result.schedule ? `• ${result.schedule}` : '';
            default:
                return '';
        }
    }

    /**
     * Escape HTML
     * @private
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup
     * @private
     */
    cleanup() {
        if (this.unregisterSearch) this.unregisterSearch();
        if (this.unregisterEscape) this.unregisterEscape();
    }

    /**
     * Render widget
     * @private
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .search-container {
                    background: var(--card-background);
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .search-input-wrapper {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                #search-input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 2px solid var(--border-color, #ddd);
                    border-radius: 6px;
                    font-size: 1rem;
                    background: var(--input-background, #fff);
                    color: var(--text-color, #333);
                    transition: border-color 0.2s;
                }

                #search-input:focus {
                    outline: none;
                    border-color: var(--accent-color, #3498db);
                }

                #clear-btn {
                    padding: 0.75rem 1rem;
                    background: var(--button-background, #e0e0e0);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background 0.2s;
                }

                #clear-btn:hover {
                    background: var(--button-hover-background, #d0d0d0);
                }

                .keyboard-hint {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-muted, #95a5a6);
                }

                #results-container {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }

                #results-container.expanded {
                    max-height: 400px;
                    margin-top: 1rem;
                }

                #results-list {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 6px;
                    background: var(--input-background, #fff);
                }

                .result-item {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color, #eee);
                    transition: background 0.2s;
                }

                .result-item:last-child {
                    border-bottom: none;
                }

                .result-item:hover,
                .result-item.selected {
                    background: var(--hover-background, #f5f5f5);
                }

                .result-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .result-content {
                    flex: 1;
                    min-width: 0;
                }

                .result-title {
                    font-weight: 600;
                    color: var(--text-color, #333);
                    margin-bottom: 0.25rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .result-title mark {
                    background: var(--highlight-background, #fff3cd);
                    padding: 0 0.2em;
                    border-radius: 2px;
                }

                .result-meta {
                    font-size: 0.875rem;
                    color: var(--text-muted, #666);
                    display: flex;
                    gap: 0.5rem;
                }

                .result-source {
                    font-weight: 500;
                }

                .no-results {
                    padding: 2rem;
                    text-align: center;
                    color: var(--text-muted, #999);
                    font-style: italic;
                }

                /* Scrollbar styling */
                #results-list::-webkit-scrollbar {
                    width: 8px;
                }

                #results-list::-webkit-scrollbar-track {
                    background: var(--scrollbar-track, #f1f1f1);
                    border-radius: 4px;
                }

                #results-list::-webkit-scrollbar-thumb {
                    background: var(--scrollbar-thumb, #888);
                    border-radius: 4px;
                }

                #results-list::-webkit-scrollbar-thumb:hover {
                    background: var(--scrollbar-thumb-hover, #555);
                }
            </style>

            <div class="search-container">
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Sök i allt... (Ctrl+F)"
                        aria-label="Sök i alla källor"
                    />
                    <button id="clear-btn" aria-label="Rensa sökning">✕</button>
                </div>
                <div class="keyboard-hint">
                    💡 Ctrl+F för att öppna, ↑↓ för att navigera, Enter för att välja, Esc för att stänga
                </div>
                <div id="results-container">
                    <div id="results-list"></div>
                </div>
            </div>
        `;
    }
}

customElements.define('search-widget', SearchWidget);
