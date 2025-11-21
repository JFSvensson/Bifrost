/**
 * Shortcuts Help Widget
 * Modal displaying all registered keyboard shortcuts grouped by category
 */

import { keyboardShortcutService } from '../services/keyboardShortcutService.js';
import eventBus from '../core/eventBus.js';
import { logger } from '../utils/logger.js';

class ShortcutsHelpWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.registerShortcut();
        logger.debug('Shortcuts Help Widget initialized');
    }

    disconnectedCallback() {
        this.cleanup();
    }

    /**
     * Register keyboard shortcut
     * @private
     */
    registerShortcut() {
        // Ctrl+? (Ctrl+Shift+/) to open help
        this.unregister = keyboardShortcutService.register({
            key: '?',
            ctrl: true,
            shift: true,
            description: 'Show keyboard shortcuts help',
            category: 'Help',
            priority: 20,
            handler: () => {
                this.toggle();
            }
        });
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        const modal = this.shadowRoot.querySelector('#modal');
        const overlay = this.shadowRoot.querySelector('#overlay');
        const closeBtn = this.shadowRoot.querySelector('#close-btn');

        // Close on overlay click
        overlay.addEventListener('click', () => {
            this.close();
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Listen for shortcut registrations to update display
        eventBus.on('shortcut:registered', () => {
            if (this.isOpen) {
                this.renderShortcuts();
            }
        });

        eventBus.on('shortcut:unregistered', () => {
            if (this.isOpen) {
                this.renderShortcuts();
            }
        });
    }

    /**
     * Toggle modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open modal
     */
    open() {
        this.isOpen = true;
        const modal = this.shadowRoot.querySelector('#modal');
        const overlay = this.shadowRoot.querySelector('#overlay');
        
        overlay.classList.add('visible');
        modal.classList.add('visible');
        
        this.renderShortcuts();
        
        eventBus.emit('shortcuts-help:opened', {});
    }

    /**
     * Close modal
     */
    close() {
        this.isOpen = false;
        const modal = this.shadowRoot.querySelector('#modal');
        const overlay = this.shadowRoot.querySelector('#overlay');
        
        overlay.classList.remove('visible');
        modal.classList.remove('visible');
        
        eventBus.emit('shortcuts-help:closed', {});
    }

    /**
     * Render shortcuts
     * @private
     */
    renderShortcuts() {
        const content = this.shadowRoot.querySelector('#shortcuts-content');
        const categories = keyboardShortcutService.getCategories();
        
        if (categories.length === 0) {
            content.innerHTML = '<p class="no-shortcuts">Inga genvägar registrerade</p>';
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        const html = categories.map(category => {
            const shortcuts = keyboardShortcutService.getByCategory(category);
            
            return `
                <div class="category">
                    <h3 class="category-title">${category}</h3>
                    <div class="shortcuts-list">
                        ${shortcuts.map(shortcut => `
                            <div class="shortcut-item">
                                <span class="shortcut-keys">
                                    ${this.formatShortcut(shortcut, isMac)}
                                </span>
                                <span class="shortcut-description">${shortcut.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = html;
    }

    /**
     * Format shortcut for display
     * @private
     * @param {Object} shortcut
     * @param {boolean} isMac
     * @returns {string}
     */
    formatShortcut(shortcut, isMac) {
        const parts = [];
        
        if (shortcut.ctrl) parts.push(`<kbd>${isMac ? '⌘' : 'Ctrl'}</kbd>`);
        if (shortcut.alt) parts.push(`<kbd>${isMac ? '⌥' : 'Alt'}</kbd>`);
        if (shortcut.shift) parts.push(`<kbd>${isMac ? '⇧' : 'Shift'}</kbd>`);
        
        // Format key name
        let keyName = shortcut.key;
        if (keyName === ' ') keyName = 'Space';
        else if (keyName === 'Escape') keyName = 'Esc';
        else if (keyName.length === 1) keyName = keyName.toUpperCase();
        
        parts.push(`<kbd>${keyName}</kbd>`);
        
        return parts.join(' + ');
    }

    /**
     * Cleanup
     * @private
     */
    cleanup() {
        if (this.unregister) this.unregister();
    }

    /**
     * Render widget
     * @private
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                }

                #overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9998;
                    backdrop-filter: blur(2px);
                }

                #overlay.visible {
                    display: block;
                }

                #modal {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.9);
                    max-width: 700px;
                    max-height: 80vh;
                    width: 90%;
                    background: var(--card-background, #fff);
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    z-index: 9999;
                    opacity: 0;
                    transition: opacity 0.2s, transform 0.2s;
                }

                #modal.visible {
                    display: flex;
                    flex-direction: column;
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color, #e0e0e0);
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-color, #333);
                    margin: 0;
                }

                #close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    color: var(--text-muted, #666);
                    transition: color 0.2s;
                    line-height: 1;
                }

                #close-btn:hover {
                    color: var(--text-color, #333);
                }

                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                #shortcuts-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .category {
                    background: var(--input-background, #f9f9f9);
                    border-radius: 8px;
                    padding: 1rem;
                }

                .category-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--accent-color, #3498db);
                    margin: 0 0 0.75rem 0;
                }

                .shortcuts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .shortcut-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    gap: 1rem;
                }

                .shortcut-keys {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                kbd {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    font-size: 0.875rem;
                    line-height: 1;
                    color: var(--text-color, #333);
                    background: var(--card-background, #fff);
                    border: 1px solid var(--border-color, #ccc);
                    border-radius: 4px;
                    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
                    font-weight: 600;
                }

                .shortcut-description {
                    flex: 1;
                    color: var(--text-color, #555);
                    font-size: 0.9rem;
                }

                .no-shortcuts {
                    text-align: center;
                    color: var(--text-muted, #999);
                    font-style: italic;
                    padding: 2rem;
                }

                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color, #e0e0e0);
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--text-muted, #666);
                }

                /* Scrollbar styling */
                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }

                .modal-body::-webkit-scrollbar-track {
                    background: var(--scrollbar-track, #f1f1f1);
                    border-radius: 4px;
                }

                .modal-body::-webkit-scrollbar-thumb {
                    background: var(--scrollbar-thumb, #888);
                    border-radius: 4px;
                }

                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: var(--scrollbar-thumb-hover, #555);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    #modal {
                        width: 95%;
                        max-height: 90vh;
                    }

                    .shortcut-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .modal-header {
                        padding: 1rem;
                    }

                    .modal-body {
                        padding: 1rem;
                    }
                }
            </style>

            <div id="overlay"></div>
            <div id="modal">
                <div class="modal-header">
                    <h2 class="modal-title">⌨️ Tangentbordsgenvägar</h2>
                    <button id="close-btn" aria-label="Stäng">✕</button>
                </div>
                <div class="modal-body">
                    <div id="shortcuts-content"></div>
                </div>
                <div class="modal-footer">
                    Tryck <kbd>Ctrl</kbd> + <kbd>?</kbd> för att visa denna hjälp
                </div>
            </div>
        `;
    }
}

customElements.define('shortcuts-help-widget', ShortcutsHelpWidget);
