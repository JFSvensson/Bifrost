import { ui, todos, search } from './config.js';

/**
 * Initialize UI elements with config values
 */
function initializeUI() {
    // Update welcome message
    if (ui.showWelcomeMessage) {
        const welcomeElement = document.querySelector('h1');
        if (welcomeElement && ui.userName) {
            welcomeElement.textContent = `Hej ${ui.userName}! Vad vill du göra nu?`;
        }
    }
    
    // Update todo input placeholder
    const todoInput = document.getElementById('new-todo');
    if (todoInput) {
        todoInput.placeholder = todos.placeholder;
    }
    
    // Update search input placeholder
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        searchInput.placeholder = search.placeholder;
    }
    
    // Update search form action
    const searchForm = document.querySelector('.search form');
    if (searchForm) {
        searchForm.action = search.defaultEngine;
    }
    
    // Apply theme
    document.body.classList.toggle('dark-theme', ui.theme === 'dark');
    document.body.classList.toggle('compact-mode', ui.compactMode);
    
    console.log('Bifrost UI initialized with config');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
} else {
    initializeUI();
}

export { initializeUI };