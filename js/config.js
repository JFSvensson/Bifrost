/**
 * Bifrost Configuration
 * Centralized settings for the application
 */

export const config = {
    // School menu settings
    schoolMenu: {
        apiUrl: 'http://localhost:8787/api/school-menu',
        updateInterval: 15 * 60 * 1000, // 15 minutes
        timeout: 8000, // 8 seconds
        fallbackData: {
            days: [
                { dayName: 'Måndag', meals: [{ name: 'Meny ej tillgänglig' }] },
                { dayName: 'Tisdag', meals: [{ name: 'Meny ej tillgänglig' }] },
                { dayName: 'Onsdag', meals: [{ name: 'Meny ej tillgänglig' }] },
                { dayName: 'Torsdag', meals: [{ name: 'Meny ej tillgänglig' }] },
                { dayName: 'Fredag', meals: [{ name: 'Meny ej tillgänglig' }] }
            ]
        }
    },

    // Todo list settings
    todos: {
        maxItems: 20,
        storageKey: 'bifrost-todos',
        placeholder: 'Lägg till en ny uppgift',
        autoSave: true,
        obsidian: {
            enabled: true,
            bridgeUrl: 'http://localhost:8081/obsidian/todos',
            updateInterval: 30 * 1000, // 30 sekunder
            syncBidirectional: false, // Bara läsa från Obsidian, inte skriva
            showSource: true, // Visa vilken fil todo:n kommer från
            priorityColors: {
                high: '#e74c3c',
                medium: '#f39c12', 
                normal: '#3498db',
                low: '#95a5a6'
            }
        }
    },

    // Links settings
    links: {
        dataFile: './data/links.json',
        fallbackMessage: 'Inga länkar konfigurerade',
        categories: ['Dev', 'Mail', 'Social', 'News', 'Tools', 'Work'],
        maxPerCategory: 10
    },

    // Keyboard shortcuts
    shortcuts: {
        enabled: true,
        linkShortcuts: true, // Ctrl+1-9 for links
        todoShortcuts: true, // Enter to add todo, etc.
        searchShortcuts: true // Ctrl+/ to focus search
    },

    // UI settings
    ui: {
        theme: 'light', // 'light' or 'dark'
        animations: true,
        compactMode: false,
        showWelcomeMessage: true,
        userName: 'Fredrik'
    },

    // Service Worker & PWA
    serviceWorker: {
        enabled: true,
        cacheVersion: 'bifrost-v1',
        offlineMessage: 'Du är offline - visar cachad data',
        updateCheckInterval: 24 * 60 * 60 * 1000 // 24 hours
    },

    // Search settings
    search: {
        defaultEngine: 'https://duckduckgo.com/',
        engines: {
            'duckduckgo': 'https://duckduckgo.com/?q=',
            'google': 'https://google.com/search?q=',
            'bing': 'https://bing.com/search?q='
        },
        placeholder: 'Sök på DuckDuckGo'
    },

    // Weather settings
    weather: {
        enabled: true,
        updateInterval: 10 * 60 * 1000, // 10 minutes
        location: {
            latitude: 56.5940,  // Vassmolösa
            longitude: 16.1536,
            name: 'Vassmolösa'
        },
        showForecast: true,
        showDetails: true
    },

    // Clock settings
    clock: {
        enabled: true,
        updateInterval: 1000, // 1 second
        format: '24h', // '12h' or '24h'
        showSeconds: false,
        showMultipleTimezones: true,
        timezones: [
            { name: 'Stockholm', timezone: 'Europe/Stockholm' },
            { name: 'New York', timezone: 'America/New_York' },
            { name: 'Tokyo', timezone: 'Asia/Tokyo' },
            { name: 'London', timezone: 'Europe/London' }
        ]
    },

    // Development settings
    dev: {
        debug: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        mockData: false
    }
};

// Helper functions for config access
export function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], config);
}

export function updateConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], config);
    target[lastKey] = value;
}

// Export individual sections for convenience
export const {
    schoolMenu,
    todos,
    links,
    shortcuts,
    ui,
    serviceWorker,
    search,
    weather,
    clock,
    dev
} = config;