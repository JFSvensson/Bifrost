/**
 * Backup Widget
 * Export/Import functionality for all app data
 */

import stateManager from '../core/stateManager.js';
import { keyboardShortcutService } from '../services/keyboardShortcutService.js';
import eventBus from '../core/eventBus.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

class BackupWidget extends HTMLElement {
    shadowRoot!: ShadowRoot;
    isOpen: boolean;
    unregister?: () => void;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.registerShortcut();
        logger.debug('Backup Widget initialized');
    }

    disconnectedCallback() {
        this.cleanup();
    }

    /**
     * Register keyboard shortcut
     * @private
     */
    registerShortcut() {
        // Ctrl+Shift+B to open backup
        this.unregister = keyboardShortcutService.register({
            key: 'b',
            ctrl: true,
            shift: true,
            description: 'Open backup & export',
            category: 'Actions',
            priority: 10,
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
        const _modal = this.shadowRoot.querySelector('#modal');
        const overlay = this.shadowRoot.querySelector('#overlay');
        const closeBtn = this.shadowRoot.querySelector('#close-btn');
        const exportBtn = this.shadowRoot.querySelector('#export-btn');
        const importBtn = this.shadowRoot.querySelector('#import-btn');
        const fileInput = /** @type {HTMLInputElement} */ (this.shadowRoot.querySelector('#file-input'));

        // Close on overlay click
        overlay.addEventListener('click', () => {
            this.close();
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Export button
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        // Import button
        importBtn.addEventListener('click', () => {
            (fileInput as HTMLInputElement).click();
        });

        // File input
        fileInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                this.importData(file);
            }
            // Reset input so same file can be selected again
            (fileInput as HTMLInputElement).value = '';
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

        this.updateStats();

        eventBus.emit('backup:opened', {});
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

        eventBus.emit('backup:closed', {});
    }

    /**
     * Update statistics
     * @private
     */
    updateStats() {
        const stats = this.shadowRoot.querySelector('#stats');

        try {
            const data = stateManager.exportAll();
            const dataSize = new Blob([JSON.stringify(data)]).size;
            const items = Object.keys(data).length;

            stats.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Lagrade nyckel-värde par:</span>
                    <span class="stat-value">${items}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total storlek:</span>
                    <span class="stat-value">${this.formatBytes(dataSize)}</span>
                </div>
            `;
        } catch (_error) {
            stats.innerHTML = '<p class="error">Kunde inte hämta statistik</p>';
        }
    }

    /**
     * Export data
     * @private
     */
    async exportData() {
        try {
            const data = stateManager.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bifrost-backup-${this.getTimestamp()}.json`;
            a.click();

            // Cleanup
            URL.revokeObjectURL(url);

            this.showMessage('✅ Data exporterad!', 'success');
            eventBus.emit('backup:exported', { size: blob.size });

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: 'Exporting backup data',
                showToast: true
            });
            this.showMessage('❌ Export misslyckades', 'error');
        }
    }

    /**
     * Import data
     * @private
     * @param {File} file
     */
    async importData(file) {
        if (!file.name.endsWith('.json')) {
            this.showMessage('❌ Endast JSON-filer stöds', 'error');
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Confirm before importing
            if (!confirm('Vill du verkligen importera denna backup? Detta kommer att ersätta all nuvarande data.')) {
                return;
            }

            stateManager.importAll(data);

            this.showMessage('✅ Data importerad! Laddar om...', 'success');
            eventBus.emit('backup:imported', { keys: Object.keys(data).length });

            // Reload page after short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: 'Importing backup data',
                showToast: true
            });
            this.showMessage('❌ Import misslyckades. Kontrollera att filen är giltig.', 'error');
        }
    }

    /**
     * Show message
     * @private
     * @param {string} text
     * @param {string} type
     */
    showMessage(text, type) {
        const message = this.shadowRoot!.querySelector('#message') as HTMLElement;
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';

        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }

    /**
     * Get timestamp for filename
     * @private
     * @returns {string}
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    /**
     * Format bytes
     * @private
     * @param {number} bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) {return '0 B';}
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    /**
     * Cleanup
     * @private
     */
    cleanup() {
        if (this.unregister) {this.unregister();}
    }

    /**
     * Render widget
     * @private
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: contents;
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
                    max-width: 500px;
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
                    padding: 1.5rem;
                }

                #stats {
                    background: var(--input-background, #f9f9f9);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                }

                .stat-label {
                    color: var(--text-muted, #666);
                }

                .stat-value {
                    font-weight: 600;
                    color: var(--text-color, #333);
                }

                .actions {
                    display: flex;
                    gap: 1rem;
                }

                .btn {
                    flex: 1;
                    padding: 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }

                #export-btn {
                    background: var(--accent-color, #3498db);
                    color: white;
                }

                #export-btn:hover {
                    background: var(--accent-hover, #2980b9);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                #import-btn {
                    background: var(--success-color, #27ae60);
                    color: white;
                }

                #import-btn:hover {
                    background: var(--success-hover, #229954);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .btn-icon {
                    font-size: 2rem;
                }

                .btn-text {
                    font-size: 0.875rem;
                }

                #file-input {
                    display: none;
                }

                #message {
                    display: none;
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                    text-align: center;
                }

                #message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                #message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color, #e0e0e0);
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--text-muted, #666);
                }

                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    color: #856404;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-top: 1rem;
                    font-size: 0.875rem;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .actions {
                        flex-direction: column;
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
                    <h2 class="modal-title">💾 Backup & Export</h2>
                    <button id="close-btn" aria-label="Stäng">✕</button>
                </div>
                <div class="modal-body">
                    <div id="stats"></div>
                    
                    <div class="actions">
                        <button id="export-btn" class="btn">
                            <span class="btn-icon">📥</span>
                            <span class="btn-text">Exportera Data</span>
                        </button>
                        <button id="import-btn" class="btn">
                            <span class="btn-icon">📤</span>
                            <span class="btn-text">Importera Data</span>
                        </button>
                    </div>

                    <div class="warning">
                        ⚠️ Import ersätter all nuvarande data. Se till att exportera en backup först!
                    </div>

                    <div id="message"></div>
                    <input type="file" id="file-input" accept=".json" />
                </div>
                <div class="modal-footer">
                    Tryck <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> för att öppna
                </div>
            </div>
        `;
    }
}

customElements.define('backup-widget', BackupWidget);
