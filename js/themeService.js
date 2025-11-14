/**
 * Theme Service - Hanterar ljust/mörkt tema
 * Sparar preferens i localStorage och respekterar systempreferenser
 */

import eventBus from './eventBus.js';
import stateManager from './stateManager.js';
import errorHandler, { ErrorCode } from './errorHandler.js';

class ThemeService {
    constructor() {
        this._init();
    }

    /**
     * Initialize theme service
     * @private
     */
    _init() {
        // Register schema
        stateManager.registerSchema('theme', {
            version: 1,
            validate: (data) => ['light', 'dark'].includes(data),
            migrate: (oldData) => oldData,
            default: null
        });

        // Ladda sparad preferens eller använd systempreferens
        const savedTheme = stateManager.get('theme');

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Använd systempreferens som standard
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }

        // Lyssna på systempreferens-ändringar
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Byt bara automatiskt om användaren inte har valt manuellt
            if (!stateManager.get('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Sätt upp toggle-knapp
        this.setupToggle();
    }

    /**
     * Set theme
     * @param {'light'|'dark'} theme - Theme to apply
     */
    setTheme(theme) {
        const body = document.body;
        const themeColor = document.getElementById('theme-color');
        const themeIcon = document.querySelector('.theme-icon');

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            if (themeColor) {themeColor.setAttribute('content', '#1a1a2e');}
            if (themeIcon) {themeIcon.textContent = '☀️';}
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            if (themeColor) {themeColor.setAttribute('content', '#3498db');}
            if (themeIcon) {themeIcon.textContent = '🌙';}
        }

        // Spara preferens
        try {
            stateManager.set('theme', theme);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving theme preference'
            });
        }

        // Emit event
        eventBus.emit('theme:changed', { theme });
    }

    /**
     * Get current theme
     * @returns {'light'|'dark'} Current theme
     */
    getTheme() {
        return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);

        // Animation för smooth transition
        this.animateToggle();
    }

    /**
     * Animate toggle button
     * @private
     */
    animateToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.classList.add('toggling');
            setTimeout(() => toggle.classList.remove('toggling'), 300);
        }
    }

    /**
     * Setup theme toggle button and keyboard shortcut
     * @private
     */
    setupToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleTheme());

            // Keyboard shortcut: Ctrl/Cmd + Shift + D
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
    }
}

// Initiera theme service
const themeService = new ThemeService();

// Exportera för att kunna användas av andra moduler
export default themeService;
