import { todos, shortcuts, ui } from './config.js';
import { ObsidianTodoService } from './obsidianTodoService.js';
import './uiConfig.js'; // Initialize UI with config values

let obsidianService;
let currentTodos = [];

// Initialize Obsidian service if enabled
if (todos.obsidian && todos.obsidian.enabled) {
    obsidianService = new ObsidianTodoService();
    console.log('🔗 Obsidian integration enabled');
}

function addTodo() {
    const todoText = document.getElementById('new-todo').value;
    if (todoText === '') return;

    // Check max items limit
    if (currentTodos.length >= todos.maxItems) {
        alert(`Du kan bara ha max ${todos.maxItems} uppgifter`);
        return;
    }

    if (obsidianService) {
        // Add to local storage (Bifrost todos)
        const newTodo = obsidianService.addLocalTodo(todoText);
        currentTodos.push(newTodo);
    } else {
        // Legacy mode
        const newTodo = {
            text: todoText,
            completed: false,
            source: 'bifrost',
            priority: 'normal',
            id: Date.now().toString()
        };
        currentTodos.push(newTodo);
        saveTodos();
    }

    document.getElementById('new-todo').value = '';
    renderTodos();
}

function renderTodos() {
    const todoList = document.getElementById('todo-items');
    todoList.innerHTML = '';

    currentTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.source || 'bifrost'} priority-${todo.priority || 'normal'}`;
        li.dataset.todoId = todo.id;
        
        // Create todo content
        const content = document.createElement('div');
        content.className = 'todo-content';
        content.textContent = todo.text;
        
        // Add priority indicator
        if (todo.priority && todo.priority !== 'normal') {
            const priorityIcon = document.createElement('span');
            priorityIcon.className = `priority-icon priority-${todo.priority}`;
            priorityIcon.textContent = getPriorityIcon(todo.priority);
            li.appendChild(priorityIcon);
        }
        
        li.appendChild(content);
        
        // Add due date if exists
        if (todo.dueDate) {
            const dueDate = document.createElement('span');
            dueDate.className = 'due-date';
            dueDate.textContent = formatDueDate(todo.dueDate);
            li.appendChild(dueDate);
        }
        
        // Add source indicator
        if (todo.source === 'obsidian') {
            const sourceIcon = document.createElement('span');
            sourceIcon.className = 'source-icon obsidian';
            sourceIcon.textContent = '📝';
            sourceIcon.title = `Från ${todo.originalSource || 'Obsidian'}`;
            li.appendChild(sourceIcon);
        }
        
        // Add remove button for Bifrost todos only
        if (todo.source === 'bifrost') {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-todo';
            removeBtn.textContent = '✕';
            removeBtn.onclick = () => removeTodo(todo.id);
            li.appendChild(removeBtn);
        }
        
        todoList.appendChild(li);
    });
    
    // Update status
    updateTodoStatus();
}

function getPriorityIcon(priority) {
    const icons = {
        high: '🔥',
        medium: '⚠️',
        low: '🔽'
    };
    return icons[priority] || '';
}

function formatDueDate(date) {
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '📅 Idag';
    if (diffDays === 1) return '📅 Imorgon';
    if (diffDays < 0) return '📅 Försenad';
    if (diffDays < 7) return `📅 ${diffDays} dagar`;
    
    return `📅 ${dueDate.toLocaleDateString('sv-SE')}`;
}

function removeTodo(todoId) {
    if (obsidianService) {
        obsidianService.removeLocalTodo(todoId);
        currentTodos = currentTodos.filter(todo => todo.id !== todoId);
    } else {
        currentTodos = currentTodos.filter(todo => todo.id !== todoId);
        saveTodos();
    }
    renderTodos();
}

function updateTodoStatus() {
    const obsidianCount = currentTodos.filter(t => t.source === 'obsidian').length;
    const bifrostCount = currentTodos.filter(t => t.source === 'bifrost').length;
    
    // Update title or status indicator if needed
    const statusElement = document.querySelector('.todo-status');
    if (statusElement) {
        statusElement.textContent = `📝 ${obsidianCount} från Obsidian, 🏠 ${bifrostCount} lokala`;
    }
}

async function syncWithObsidian() {
    if (!obsidianService) return;
    
    try {
        const synced = await obsidianService.syncWithLocal();
        currentTodos = synced;
        renderTodos();
        
        console.log(`✅ Synced ${synced.length} todos (${synced.filter(t => t.source === 'obsidian').length} from Obsidian)`);
    } catch (error) {
        console.error('❌ Obsidian sync failed:', error);
        
        // Show error to user
        showSyncError(error.message);
    }
}

function showSyncError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'sync-error';
    errorElement.textContent = `⚠️ ${message}`;
    
    const todoList = document.getElementById('todo-items');
    todoList.insertBefore(errorElement, todoList.firstChild);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

function saveTodos() {
    // Only save Bifrost todos to localStorage
    const bifrostTodos = currentTodos.filter(todo => todo.source === 'bifrost');
    localStorage.setItem(todos.storageKey, JSON.stringify(bifrostTodos));
}

async function loadTodos() {
    if (obsidianService) {
        // Load and sync with Obsidian
        await syncWithObsidian();
        
        // Set up auto-sync
        setInterval(syncWithObsidian, todos.obsidian.updateInterval);
    } else {
        // Legacy mode - load from localStorage
        const saved = localStorage.getItem(todos.storageKey);
        if (saved) {
            currentTodos = JSON.parse(saved).map(todo => ({
                ...todo,
                source: 'bifrost',
                priority: todo.priority || 'normal',
                id: todo.id || Date.now().toString()
            }));
        }
        renderTodos();
    }
}

// Make addTodo globally available
window.addTodo = addTodo;

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
