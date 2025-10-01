import { todos, shortcuts, ui } from './config.js';
import './uiConfig.js'; // Initialize UI with config values

function addTodo() {
    const todoText = document.getElementById('new-todo').value;
    if (todoText === '') return;

    // Check max items limit
    const currentTodos = document.querySelectorAll('#todo-items li');
    if (currentTodos.length >= todos.maxItems) {
        alert(`Du kan bara ha max ${todos.maxItems} uppgifter`);
        return;
    }

    const li = document.createElement('li');
    li.textContent = todoText;
    document.getElementById('todo-items').appendChild(li);

    document.getElementById('new-todo').value = '';

    if (todos.autoSave) {
        saveTodos();
    }
}

function saveTodos() {
    const todoItems = Array.from(document.querySelectorAll('#todo-items li'))
        .map(li => li.textContent);
    localStorage.setItem(todos.storageKey, JSON.stringify(todoItems));
}

function loadTodos() {
    const saved = localStorage.getItem(todos.storageKey);
    if (saved) {
        JSON.parse(saved).forEach(addTodoItem);
    }
}

function addTodoItem(todoText) {
    const li = document.createElement('li');
    li.textContent = todoText;
    document.getElementById('todo-items').appendChild(li);
}

document.addEventListener('keydown', (e) => {
    if (!shortcuts.enabled) return;
    
    // Link shortcuts (Ctrl+1-9)
    if (shortcuts.linkShortcuts && e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const links = document.querySelectorAll('#links a');
        const link = links[parseInt(e.key) - 1];
        if (link) window.open(link.href, '_blank');
    }
    
    // Search shortcut (Ctrl+/)
    if (shortcuts.searchShortcuts && e.ctrlKey && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) searchInput.focus();
    }
    
    // Todo shortcuts
    if (shortcuts.todoShortcuts) {
        const todoInput = document.getElementById('new-todo');
        if (e.key === 'Enter' && document.activeElement === todoInput) {
            addTodo();
        }
    }
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(registrationError => {
                console.log('Service Worker registration failed:', registrationError);
            });
    });
}

// Load todos when page loads
window.addEventListener('load', loadTodos);
