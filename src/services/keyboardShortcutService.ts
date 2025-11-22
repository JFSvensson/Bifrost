/**
 * Keyboard Shortcut Service
 * Centralized keyboard shortcut management with conflict detection and priority system
 */

import eventBus from '../core/eventBus.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class KeyboardShortcutService {
    shortcuts: Map<string, any>;
    enabled: boolean;
    categories: Map<string, any>;
    _boundHandler: (e: KeyboardEvent) => void;

    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.categories = new Map();
        this._boundHandler = this._handleKeydown.bind(this);
        
        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Listen for keyboard events at document level
        document.addEventListener('keydown', this._boundHandler);
        
        // Listen for config changes
        eventBus.on('config:changed', ({ key, value }) => {
            if (key === 'shortcuts.enabled') {
                this.enabled = value;
            }
        });

        logger.debug('Keyboard Shortcut Service initialized');
    }

    /**
     * Register a keyboard shortcut
     * @param {Object} options - Shortcut configuration
     * @param {string} options.key - Key to press (e.g., 'k', '/', 'Escape')
     * @param {boolean} [options.ctrl=false] - Require Ctrl/Cmd modifier
     * @param {boolean} [options.shift=false] - Require Shift modifier
     * @param {boolean} [options.alt=false] - Require Alt modifier
     * @param {Function} options.handler - Function to execute
     * @param {string} options.description - Human-readable description
     * @param {string} [options.category='General'] - Category for grouping
     * @param {number} [options.priority=0] - Higher priority executes first
     * @param {boolean} [options.preventDefault=true] - Prevent default browser behavior
     * @param {Function} [options.condition] - Optional condition function to check before executing
     * @returns {Function} Unregister function
     */
    register(options) {
        try {
            errorHandler.validateRequired(options, ['key', 'handler', 'description'], 'KeyboardShortcutService.register');

            const {
                key,
                ctrl = false,
                shift = false,
                alt = false,
                handler,
                description,
                category = 'General',
                priority = 0,
                preventDefault = true,
                condition = () => true
            } = options;

            const shortcutKey = this._generateKey({ key, ctrl, shift, alt });

            // Check for conflicts
            if (this.shortcuts.has(shortcutKey)) {
                const existing = this.shortcuts.get(shortcutKey);
                logger.warn(`Shortcut conflict: ${shortcutKey} already registered (${existing.description})`);
                
                // If new shortcut has higher priority, replace
                if (priority <= existing.priority) {
                    throw new Error(`Shortcut ${shortcutKey} already registered with higher or equal priority`);
                }
            }

            // Store shortcut
            const shortcutData = {
                key,
                ctrl,
                shift,
                alt,
                handler,
                description,
                category,
                priority,
                preventDefault,
                condition,
                shortcutKey
            };

            this.shortcuts.set(shortcutKey, shortcutData);

            // Add to category map
            if (!this.categories.has(category)) {
                this.categories.set(category, []);
            }
            this.categories.get(category).push(shortcutData);

            // Emit registration event
            eventBus.emit('shortcut:registered', { 
                shortcut: shortcutKey, 
                description,
                category 
            });

            logger.debug(`Registered shortcut: ${this._formatShortcut(shortcutData)}`);

            // Return unregister function
            return () => this.unregister(shortcutKey);

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: 'Registering keyboard shortcut'
            });
            throw error;
        }
    }

    /**
     * Unregister a keyboard shortcut
     * @param {string} shortcutKey - Generated shortcut key
     */
    unregister(shortcutKey) {
        const shortcut = this.shortcuts.get(shortcutKey);
        if (!shortcut) return;

        // Remove from category
        const categoryShortcuts = this.categories.get(shortcut.category);
        if (categoryShortcuts) {
            const index = categoryShortcuts.findIndex(s => s.shortcutKey === shortcutKey);
            if (index !== -1) {
                categoryShortcuts.splice(index, 1);
            }
        }

        this.shortcuts.delete(shortcutKey);
        
        eventBus.emit('shortcut:unregistered', { shortcut: shortcutKey });
        
        logger.debug(`Unregistered shortcut: ${shortcutKey}`);
    }

    /**
     * Get all registered shortcuts
     * @returns {Array} Array of shortcut objects
     */
    getAll() {
        return Array.from(this.shortcuts.values()).sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get shortcuts by category
     * @param {string} category - Category name
     * @returns {Array} Array of shortcut objects
     */
    getByCategory(category) {
        return this.categories.get(category) || [];
    }

    /**
     * Get all categories
     * @returns {Array} Array of category names
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.enabled = true;
        eventBus.emit('shortcuts:enabled', {});
        logger.info('Keyboard shortcuts enabled');
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.enabled = false;
        eventBus.emit('shortcuts:disabled', {});
        logger.info('Keyboard shortcuts disabled');
    }

    /**
     * Check if shortcuts are enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Handle keydown event
     * @private
     * @param {KeyboardEvent} event
     */
    _handleKeydown(event) {
        if (!this.enabled) return;

        // Check if user is typing in an input field
        if (this._isTyping(event.target)) {
            // Allow Escape key even in inputs
            if (event.key !== 'Escape') return;
        }

        const key = event.key;
        const ctrl = event.ctrlKey || event.metaKey; // Support Mac Cmd key
        const shift = event.shiftKey;
        const alt = event.altKey;

        const shortcutKey = this._generateKey({ key, ctrl, shift, alt });

        const shortcut = this.shortcuts.get(shortcutKey);
        
        if (shortcut) {
            // Check condition
            if (!shortcut.condition()) return;

            // Prevent default browser behavior if specified
            if (shortcut.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            }

            try {
                // Execute handler
                shortcut.handler(event);
                
                // Emit triggered event
                eventBus.emit('shortcut:triggered', {
                    shortcut: shortcutKey,
                    description: shortcut.description,
                    category: shortcut.category
                });

            } catch (error) {
                errorHandler.handle(error, {
                    code: ErrorCode.UNKNOWN_ERROR,
                    context: `Executing shortcut: ${shortcutKey}`,
                    showToast: false
                });
            }
        }
    }

    /**
     * Generate unique key for shortcut
     * @private
     * @param {Object} options
     * @returns {string}
     */
    _generateKey({ key, ctrl, shift, alt }) {
        const parts = [];
        if (ctrl) parts.push('ctrl');
        if (alt) parts.push('alt');
        if (shift) parts.push('shift');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Format shortcut for display
     * @private
     * @param {Object} shortcut
     * @returns {string}
     */
    _formatShortcut(shortcut) {
        const parts = [];
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
        if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
        if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
        
        // Format key name
        let keyName = shortcut.key;
        if (keyName === ' ') keyName = 'Space';
        else if (keyName.length === 1) keyName = keyName.toUpperCase();
        
        parts.push(keyName);
        
        return parts.join('+');
    }

    /**
     * Check if user is typing in an input field
     * @private
     * @param {Element} target
     * @returns {boolean}
     */
    _isTyping(target) {
        const tagName = target.tagName.toLowerCase();
        const isEditable = target.isContentEditable;
        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
        
        return isInput || isEditable;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        document.removeEventListener('keydown', this._boundHandler);
        this.shortcuts.clear();
        this.categories.clear();
        logger.debug('Keyboard Shortcut Service destroyed');
    }
}

// Export singleton instance
export const keyboardShortcutService = new KeyboardShortcutService();
