import { todos, shortcuts, ui } from './config/config.js';
import { ObsidianTodoService } from './services/obsidianTodoService.js';
import { StatsService } from './services/statsService.js';
import { DeadlineService } from './services/deadlineService.js';
import { pomodoroService } from './services/pomodoroService.js';
import { calendarSyncService } from './services/calendarSync.js';
import { recurringService } from './services/recurringService.js';
import reminderService from './services/reminderService.js';
import './config/uiConfig.js'; // Initialize UI with config values

let obsidianService;
let statsService;
let deadlineService;
let currentTodos = [];

// Quick Add widget setup
document.addEventListener('DOMContentLoaded', () => {
    const quickAddWidget = document.querySelector('quick-add-widget');
    if (quickAddWidget) {
        quickAddWidget.addEventListener('todoAdded', (e) => {
            handleQuickAdd(e.detail);
        });
    }

    // Recurring widget setup
    const recurringWidget = document.querySelector('recurring-widget');
    if (recurringWidget) {
        recurringWidget.addEventListener('toast', (e) => {
            showToast(e.detail.message);
        });
    }

    // Reminder widget setup
    const reminderWidget = document.querySelector('reminder-widget');
    if (reminderWidget) {
        reminderWidget.addEventListener('show-toast', (e) => {
            showToast(e.detail.message);
        });
    }

    // Subscribe to recurring service events
    recurringService.subscribe((event, data) => {
        handleRecurringEvent(event, data);
    });

    // Subscribe to reminder service events
    reminderService.subscribe('reminderTriggered', (reminder) => {
        handleReminderTriggered(reminder);
    });

    reminderService.subscribe('todoSnoozed', () => {
        renderTodos(); // Update snooze indicators
    });
});

// Initialize services
if (todos.obsidian && todos.obsidian.enabled) {
    obsidianService = new ObsidianTodoService();
    console.log('🔗 Obsidian integration enabled');
}

statsService = new StatsService();
console.log('📊 Statistics tracking enabled');

deadlineService = new DeadlineService();
console.log('🔔 Deadline warnings enabled');

console.log('⏱️ Pomodoro timer initialized');

// Enable calendar sync when authenticated
window.addEventListener('calendarAuthenticated', () => {
    calendarSyncService.enableSync(() => currentTodos);
    console.log('📅 Calendar sync enabled');
});

// Handle Quick Add submissions
function handleQuickAdd(parsed) {
    if (!parsed || !parsed.text) {return;}

    // Check if this is a recurring pattern
    if (parsed.recurring) {
        // Create recurring pattern instead of single todo
        const pattern = {
            text: parsed.text,
            type: parsed.recurring.type,
            frequency: parsed.recurring.frequency || 1,
            daysOfWeek: parsed.recurring.daysOfWeek || [],
            dayOfMonth: parsed.recurring.dayOfMonth || 1,
            time: parsed.dueTime || null,
            tags: parsed.tags || [],
            priority: parsed.priority || 'normal',
            source: parsed.source || 'bifrost'
        };

        recurringService.createPattern(pattern);
        showToast('🔄 Återkommande uppgift skapad!');
        return;
    }

    // Normal single todo
    const todoData = {
        text: parsed.text,
        completed: false,
        source: parsed.source || 'bifrost',
        priority: parsed.priority || 'normal',
        tags: parsed.tags || [],
        dueDate: parsed.dueDate || null,
        dueTime: parsed.dueTime || null,
        id: Date.now().toString(),
        createdAt: new Date()
    };

    if (obsidianService) {
        // Add via Obsidian service
        const newTodo = obsidianService.addLocalTodo(todoData.text);
        // Merge parsed data
        Object.assign(newTodo, todoData);
        currentTodos.push(newTodo);

        // Track in stats with tags
        statsService.trackTodoCreated(newTodo);
    } else {
        // Legacy mode
        currentTodos.push(todoData);
        saveTodos();

        // Track in stats
        statsService.trackTodoCreated(todoData);
    }

    // Handle reminder creation if reminder pattern found
    if (parsed.reminder) {
        createReminderFromParsed(todoData, parsed.reminder);
    }

    renderTodos();
    dispatchTodosUpdated();

    // Show toast notification
    const reminderMsg = parsed.reminder ? ' med påminnelse' : '';
    showToast(`✓ Uppgift tillagd${parsed.dueDate ? ' med deadline' : ''}${reminderMsg}!`);
}

function createReminderFromParsed(todo, reminderData) {
    let remindAt;

    if (reminderData.type === 'in-time') {
        // "påminn mig om 1h" - create reminder X time from now
        const offset = reminderService.parseTimeOffset(reminderData.offset);
        remindAt = new Date(Date.now() + offset);
    } else if (reminderData.type === 'before-deadline' && todo.dueDate) {
        // "påminn 1h innan" - create reminder X before deadline
        reminderService.createDeadlineReminder(todo, reminderData.offset);
        return;
    } else if (reminderData.type === 'at-time') {
        // "påminn mig imorgon 09:00"
        remindAt = new Date();
        if (reminderData.when === 'tomorrow') {
            remindAt.setDate(remindAt.getDate() + 1);
        }
        const [hours, minutes] = reminderData.time.split(':');
        remindAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
        console.warn('Could not create reminder - invalid data:', reminderData);
        return;
    }

    reminderService.createReminder({
        todoId: todo.id,
        text: todo.text,
        remindAt,
        type: 'manual',
        priority: todo.priority,
        tags: todo.tags
    });
}

// Handle recurring service events
function handleRecurringEvent(event, data) {
    if (event === 'todoCreated' || event === 'duePatterns') {
        // Add todos created by recurring service to the list
        const todos = Array.isArray(data) ? data : [data.todo];

        todos.forEach(todo => {
            currentTodos.push(todo);
            statsService.trackTodoCreated(todo);
        });

        renderTodos();
        dispatchTodosUpdated();
        saveTodos();
    } else if (event === 'nextInstanceCreated') {
        // Handle auto-creation on completion
        const { nextTodo } = data;
        currentTodos.push(nextTodo);
        statsService.trackTodoCreated(nextTodo);
        renderTodos();
        dispatchTodosUpdated();
        saveTodos();

        showToast('🔄 Nästa återkommande uppgift skapad!');
    }
}

function handleReminderTriggered(reminder) {
    // Find the corresponding todo
    const todo = currentTodos.find(t => t.id === reminder.todoId);
    if (!todo) {return;}

    // Show toast notification as fallback (browser notifications handled by service)
    const message = `🔔 Påminnelse: ${reminder.text}`;
    showToast(message, 'reminder');

    // Highlight the todo briefly
    const todoElement = document.querySelector(`[data-todo-id="${reminder.todoId}"]`);
    if (todoElement) {
        todoElement.classList.add('reminder-highlight');
        setTimeout(() => {
            todoElement.classList.remove('reminder-highlight');
        }, 3000);
    }
}


function addTodo() {
    const todoText = document.getElementById('new-todo').value;
    if (todoText === '') {return;}

    // Check max items limit
    if (currentTodos.length >= todos.maxItems) {
        alert(`Du kan bara ha max ${todos.maxItems} uppgifter`);
        return;
    }

    if (obsidianService) {
        // Add to local storage (Bifrost todos)
        const newTodo = obsidianService.addLocalTodo(todoText);
        newTodo.createdAt = new Date();
        currentTodos.push(newTodo);

        // Track in stats
        statsService.trackTodoCreated(newTodo);
    } else {
        // Legacy mode
        const newTodo = {
            text: todoText,
            completed: false,
            source: 'bifrost',
            priority: 'normal',
            id: Date.now().toString(),
            createdAt: new Date()
        };
        currentTodos.push(newTodo);
        saveTodos();

        // Track in stats
        statsService.trackTodoCreated(newTodo);
    }

    document.getElementById('new-todo').value = '';
    renderTodos();
    dispatchTodosUpdated();
}

function renderTodos() {
    const todoList = document.getElementById('todo-items');
    todoList.innerHTML = '';

    currentTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.source || 'bifrost'} priority-${todo.priority || 'normal'}`;
        if (todo.completed) {
            li.className += ' completed';
        }
        li.dataset.todoId = todo.id;

        // Add checkbox for toggling completion
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        checkbox.onclick = () => toggleTodo(todo.id);
        li.appendChild(checkbox);

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

        // Add completed timestamp if completed
        if (todo.completed && todo.completedAt) {
            const completedTime = document.createElement('span');
            completedTime.className = 'completed-time';
            completedTime.textContent = `✓ ${formatCompletedTime(todo.completedAt)}`;
            li.appendChild(completedTime);
        }

        // Add source indicator
        if (todo.source === 'obsidian') {
            const sourceIcon = document.createElement('span');
            sourceIcon.className = 'source-icon obsidian';
            sourceIcon.textContent = '📝';
            sourceIcon.title = `Från ${todo.originalSource || 'Obsidian'}`;
            li.appendChild(sourceIcon);
        }

        // Add recurring indicator
        if (todo.isRecurring || todo.recurringPatternId) {
            const recurringIcon = document.createElement('span');
            recurringIcon.className = 'source-icon recurring';
            recurringIcon.textContent = '🔄';
            recurringIcon.title = 'Återkommande uppgift';
            li.appendChild(recurringIcon);
        }

        // Add snoozed indicator if todo has active reminder
        const snoozedReminder = reminderService?.getSnoozedReminder(todo.id);
        if (snoozedReminder) {
            const snoozedIcon = document.createElement('span');
            snoozedIcon.className = 'source-icon snoozed';
            snoozedIcon.textContent = '💤';
            const timeUntil = formatTimeUntilReminder(snoozedReminder.remindAt);
            snoozedIcon.title = `Snoozad - påminnelse ${timeUntil}`;
            li.appendChild(snoozedIcon);
        }

        // Add snooze button for incomplete todos (only for Bifrost todos)
        if (!todo.completed && todo.source === 'bifrost') {
            const snoozeBtn = document.createElement('button');
            snoozeBtn.className = 'snooze-todo';
            snoozeBtn.textContent = '💤';
            snoozeBtn.title = 'Snooze';
            snoozeBtn.onclick = (e) => {
                e.stopPropagation();
                showSnoozeDropdown(snoozeBtn, todo);
            };
            li.appendChild(snoozeBtn);
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

    if (diffDays === 0) {return '📅 Idag';}
    if (diffDays === 1) {return '📅 Imorgon';}
    if (diffDays < 0) {return '📅 Försenad';}
    if (diffDays < 7) {return `📅 ${diffDays} dagar`;}

    return `📅 ${dueDate.toLocaleDateString('sv-SE')}`;
}

function formatCompletedTime(date) {
    const completed = new Date(date);
    const now = new Date();
    const diffMs = now - completed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {return 'nyss';}
    if (diffMins < 60) {return `${diffMins}min sedan`;}
    if (diffHours < 24) {return `${diffHours}h sedan`;}
    if (diffDays < 7) {return `${diffDays}d sedan`;}

    return completed.toLocaleDateString('sv-SE');
}

function formatTimeUntilReminder(date) {
    const reminder = new Date(date);
    const now = new Date();
    const diffMs = reminder - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 0) {return 'nu';}
    if (diffMins < 60) {return `om ${diffMins}min`;}
    if (diffHours < 24) {return `om ${diffHours}h`;}

    const isToday = reminder.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = reminder.toDateString() === tomorrow.toDateString();

    const timeStr = reminder.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {return `idag ${timeStr}`;}
    if (isTomorrow) {return `imorgon ${timeStr}`;}

    return reminder.toLocaleDateString('sv-SE');
}

// Snooze dropdown functionality
let activeSnoozeDropdown = null;

function showSnoozeDropdown(button, todo) {
    // Close any existing dropdown
    if (activeSnoozeDropdown) {
        activeSnoozeDropdown.remove();
        if (activeSnoozeDropdown.targetButton === button) {
            activeSnoozeDropdown = null;
            return;
        }
    }

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'snooze-dropdown';
    dropdown.targetButton = button;

    const presets = [
        { label: '10 minuter', value: '10min' },
        { label: '30 minuter', value: '30min' },
        { label: '1 timme', value: '1h' },
        { label: '3 timmar', value: '3h' },
        { label: 'Imorgon 09:00', value: 'tomorrow9am' },
        { label: '1 dag', value: '1day' }
    ];

    presets.forEach(preset => {
        const option = document.createElement('button');
        option.className = 'snooze-option';
        option.textContent = preset.label;
        option.onclick = (e) => {
            e.stopPropagation();
            snoozeTodo(todo, preset.value);
            dropdown.remove();
            activeSnoozeDropdown = null;
        };
        dropdown.appendChild(option);
    });

    // Position dropdown
    const rect = button.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;

    document.body.appendChild(dropdown);
    activeSnoozeDropdown = dropdown;

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeSnoozeDropdown);
    }, 0);
}

function closeSnoozeDropdown() {
    if (activeSnoozeDropdown) {
        activeSnoozeDropdown.remove();
        activeSnoozeDropdown = null;
    }
    document.removeEventListener('click', closeSnoozeDropdown);
}

function snoozeTodo(todo, preset) {
    try {
        const reminder = reminderService.snoozeTodo(todo.id, preset, todo);

        const timeDisplay = formatTimeUntilReminder(reminder.remindAt);
        showToast(`💤 Snoozad - påminnelse ${timeDisplay}`);

        // Re-render to show snoozed indicator
        renderTodos();
    } catch (error) {
        console.error('Snooze error:', error);
        showToast('⚠️ Kunde inte snooze todo');
    }
}

function toggleTodo(todoId) {
    const todo = currentTodos.find(t => t.id === todoId);
    if (!todo) {return;}

    // Obsidian todos kan inte toggles från Bifrost
    if (todo.source === 'obsidian') {
        alert('⚠️ Obsidian-todos måste markeras som klara i Obsidian');
        return;
    }

    const wasCompleted = todo.completed;
    todo.completed = !todo.completed;

    if (todo.completed) {
        todo.completedAt = new Date();
        // Track completion in stats
        statsService.trackTodoCompleted(todo);

        // Handle recurring todos - create next instance
        if (todo.recurringPatternId) {
            recurringService.onTodoCompleted(todo);
        }
    } else {
        delete todo.completedAt;
    }

    saveTodos();
    renderTodos();
    dispatchTodosUpdated();
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
    const obsidianCount = currentTodos.filter(t => t.source === 'obsidian' && !t.completed).length;
    const bifrostCount = currentTodos.filter(t => t.source === 'bifrost' && !t.completed).length;
    const completedCount = currentTodos.filter(t => t.completed).length;

    // Update title or status indicator if needed
    const statusElement = document.querySelector('.todo-status');
    if (statusElement) {
        statusElement.textContent = `📝 ${obsidianCount} från Obsidian, 🏠 ${bifrostCount} lokala, ✓ ${completedCount} klara`;
    }
}

async function syncWithObsidian() {
    if (!obsidianService) {return;}

    try {
        const synced = await obsidianService.syncWithLocal();
        currentTodos = synced;
        renderTodos();
        dispatchTodosUpdated();

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
                priority: todo.priority || 'normal'
            }));
            renderTodos();
            dispatchTodosUpdated();
        }
    }

    // Starta deadline monitoring
    startDeadlineMonitoring();
}

function startDeadlineMonitoring() {
    // Visa daglig sammanfattning vid första laddning
    deadlineService.showDailySummary(currentTodos);

    // Starta periodisk monitoring
    deadlineService.startMonitoring(() => currentTodos, 60000); // Check varje minut

    // Återställ notification-historik varje dag kl 00:00
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow - now;
    setTimeout(() => {
        deadlineService.resetNotificationHistory();
        // Återställ varje dag
        setInterval(() => deadlineService.resetNotificationHistory(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

// Toast notification helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Expose functions globally
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.removeTodo = removeTodo;
window.filterTodos = filterTodos;
window.sortTodos = sortTodos;
window.searchTodos = searchTodos;
// Make addTodo globally available
window.addTodo = addTodo;

document.addEventListener('keydown', (e) => {
    if (!shortcuts.enabled) {return;}

    // Link shortcuts (Ctrl+1-9)
    if (shortcuts.linkShortcuts && e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const links = document.querySelectorAll('#links a');
        const link = links[parseInt(e.key) - 1];
        if (link) {window.open(link.href, '_blank');}
    }

    // Search shortcut (Ctrl+/)
    if (shortcuts.searchShortcuts && e.ctrlKey && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) {searchInput.focus();}
    }

    // Todo shortcuts
    if (shortcuts.todoShortcuts) {
        const todoInput = document.getElementById('new-todo');
        if (e.key === 'Enter' && document.activeElement === todoInput) {
            addTodo();
        }
    }
});

// Dispatch custom event when todos update
function dispatchTodosUpdated() {
    window.dispatchEvent(new CustomEvent('todosUpdated', {
        detail: { todos: currentTodos }
    }));
}

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
