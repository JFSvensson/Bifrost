/**
 * Theme Service - Hanterar ljust/mörkt tema
 * Sparar preferens i localStorage och respekterar systempreferenser
 */

class ThemeService {
    constructor() {
        this.storageKey = 'bifrost-theme';
        this.init();
    }

    init() {
        // Ladda sparad preferens eller använd systempreferens
        const savedTheme = localStorage.getItem(this.storageKey);
        
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
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Sätt upp toggle-knapp
        this.setupToggle();
    }

    setTheme(theme) {
        const body = document.body;
        const themeColor = document.getElementById('theme-color');
        const themeIcon = document.querySelector('.theme-icon');

        if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
            if (themeColor) themeColor.setAttribute('content', '#1a1a2e');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            if (themeColor) themeColor.setAttribute('content', '#3498db');
            if (themeIcon) themeIcon.textContent = '🌙';
        }

        // Spara preferens
        localStorage.setItem(this.storageKey, theme);
        
        // Trigger custom event för andra komponenter
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    getTheme() {
        return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    }

    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Animation för smooth transition
        this.animateToggle();
    }

    animateToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.classList.add('toggling');
            setTimeout(() => toggle.classList.remove('toggling'), 300);
        }
    }

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
