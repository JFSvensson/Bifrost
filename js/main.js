/**
 * Main application initialization
 * Optimized for performance with critical path first
 */

/* global performance */

// Mark initialization start
performance.mark('app-init-start');

// ===== CRITICAL IMPORTS (needed immediately) =====
import { todos, shortcuts } from './config/config.js';
import './config/uiConfig.js'; // Initialize UI with config values
import performanceMonitor from './services/performanceMonitor.js';
import eventBus from './core/eventBus.js';
import { keyboardShortcutService } from './services/keyboardShortcutService.js';
import { searchService } from './services/searchService.js';

// ===== DEFERRED IMPORTS (loaded after critical path) =====
let ObsidianTodoService;
let StatsService;
let DeadlineService;
let pomodoroService;
let calendarSyncService;
let recurringService;
let reminderService;

let obsidianService;
let statsService;
let deadlineService;
let currentTodos = [];

// ===== INITIALIZATION PHASES =====

/**
 * Phase 1: Critical path - Core functionality
 * Load immediately for fast initial render
 */
async function initCriticalServices() {
    performance.mark('critical-services-start');

    // Load todos first (blocking for UI)
    await loadTodos();
    renderTodos();
    updateTodoStatus();

    performance.mark('critical-services-end');
    performance.measure('critical-services', 'critical-services-start', 'critical-services-end');
}

/**
 * Phase 2: Essential services
 * Load services needed for core features
 */
async function initEssentialServices() {
    performance.mark('essential-services-start');

    // Dynamic imports for essential services
    const [obsidianModule, statsModule, recurringModule, reminderModule] = await Promise.all([
        import('./services/obsidianTodoService.js'),
        import('./services/statsService.js'),
        import('./services/recurringService.js'),
        import('./services/reminderService.js')
    ]);

    ObsidianTodoService = obsidianModule.ObsidianTodoService;
    StatsService = statsModule.StatsService;
    recurringService = recurringModule.recurringService;
    reminderService = reminderModule.default;

    // Initialize Obsidian if enabled
    if (todos.obsidian && todos.obsidian.enabled) {
        obsidianService = new ObsidianTodoService();
        console.log('🔗 Obsidian integration enabled');
    }

    // Initialize stats service
    statsService = new StatsService();
    console.log('📊 Statistics tracking enabled');

    // Setup service event listeners via eventBus
    eventBus.on('recurring:todoCreated', (data) => {
        handleRecurringEvent('todoCreated', data);
    });

    eventBus.on('reminder:triggered', (reminder) => {
        handleReminderTriggered(reminder);
    });

    eventBus.on('todo:snoozed', () => {
        renderTodos();
    });

    performance.mark('essential-services-end');
    performance.measure('essential-services', 'essential-services-start', 'essential-services-end');
}

/**
 * Phase 3: Non-critical services
 * Load services that aren't needed immediately (deferred)
 */
async function initDeferredServices() {
    performance.mark('deferred-services-start');

    // Load remaining services
    const [deadlineModule, pomodoroModule, calendarModule] = await Promise.all([
        import('./services/deadlineService.js'),
        import('./services/pomodoroService.js'),
        import('./services/calendarSync.js')
    ]);

    DeadlineService = deadlineModule.DeadlineService;
    pomodoroService = pomodoroModule.pomodoroService;
    calendarSyncService = calendarModule.calendarSyncService;

    // Initialize deadline service
    deadlineService = new DeadlineService();
    console.log('🔔 Deadline warnings enabled');
    startDeadlineMonitoring();

    console.log('⏱️ Pomodoro timer initialized');

    performance.mark('deferred-services-end');
    performance.measure('deferred-services', 'deferred-services-start', 'deferred-services-end');
}

/**
 * Phase 4: Widget listeners
 * Setup event listeners for lazy-loaded widgets
 */
function initWidgetListeners() {
    performance.mark('widget-listeners-start');

    // Quick Add widget (critical - loaded immediately)
    const quickAddWidget = document.querySelector('quick-add-widget');
    if (quickAddWidget) {
        quickAddWidget.addEventListener('todoAdded', (e) => {
            const customEvent = /** @type {CustomEvent} */ (e);
            handleQuickAdd(customEvent.detail);
        });
    }

    // Add Todo button (secure event listener instead of inline onclick)
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoInput = document.getElementById('new-todo');
    if (addTodoBtn && todoInput) {
        addTodoBtn.addEventListener('click', addTodo);
        // Also allow Enter key in input field
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }

    // Recurring widget (lazy loaded)
    const recurringWidget = document.querySelector('recurring-widget');
    if (recurringWidget) {
        recurringWidget.addEventListener('toast', (e) => {
            const customEvent = /** @type {CustomEvent} */ (e);
            showToast(customEvent.detail.message);
        });
    }

    // Reminder widget (lazy loaded)
    const reminderWidget = document.querySelector('reminder-widget');
    if (reminderWidget) {
        reminderWidget.addEventListener('show-toast', (e) => {
            const customEvent = /** @type {CustomEvent} */ (e);
            showToast(customEvent.detail.message);
        });
    }

    // Backup button
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const backupWidget = document.querySelector('backup-widget');
            if (backupWidget && backupWidget.toggle) {
                backupWidget.toggle();
            }
        });
    }

    performance.mark('widget-listeners-end');
    performance.measure('widget-listeners', 'widget-listeners-start', 'widget-listeners-end');
}

/**
 * Main initialization sequence
 * Executes phases in priority order for optimal performance
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Phase 1: Critical (blocking)
        await initCriticalServices();

        // Phase 2: Essential (parallel with Phase 4)
        const essentialPromise = initEssentialServices();

        // Phase 4: Widget listeners (can run immediately)
        initWidgetListeners();

        // Wait for essential services
        await essentialPromise;

        // Phase 3: Deferred (lowest priority, runs in background)
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => initDeferredServices());
        } else {
            setTimeout(() => initDeferredServices(), 100);
        }

        performance.mark('app-init-end');
        performance.measure('app-total-init', 'app-init-start', 'app-init-end');

        // Log performance metrics in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const measures = performance.getEntriesByType('measure');
            console.group('⚡ Performance Metrics');
            measures.forEach(measure => {
                console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
            });
            console.groupEnd();
        }
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Fel vid initialisering av appen', 'error');
    }
});

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
    const newTodoInput = /** @type {HTMLInputElement} */ (document.getElementById('new-todo'));
    const todoText = newTodoInput.value;
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

    newTodoInput.value = '';
    renderTodos();
    dispatchTodosUpdated();
}

/**
 * Setup event delegation for todo list actions
 * Single listener handles all todo item interactions
 */
function setupTodoListDelegation() {
    const todoList = document.getElementById('todo-items');
    if (!todoList) {return;}

    // Remove old listener if exists
    // @ts-ignore - Custom property for cleanup
    if (todoList._clickHandler) {
        // @ts-ignore
        todoList.removeEventListener('click', todoList._clickHandler);
    }

    // Single delegated click handler
    const clickHandler = (e) => {
        const target = e.target;
        const action = target.dataset.action;
        const todoItem = target.closest('.todo-item');
        
        if (!todoItem) {return;}
        
        const todoId = todoItem.dataset.todoId;
        
        switch (action) {
            case 'toggle':
                toggleTodo(todoId);
                break;
            case 'snooze':
                e.stopPropagation();
                showSnoozeDropdown(target, currentTodos.find(t => t.id === todoId));
                break;
            case 'remove':
                removeTodo(todoId);
                break;
        }
    };

    todoList.addEventListener('click', clickHandler);
    // @ts-ignore - Store for cleanup
    todoList._clickHandler = clickHandler;
}

function renderTodos() {
    performanceMonitor.start('render-todos');
    
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
        checkbox.dataset.action = 'toggle';
        checkbox.setAttribute('aria-label', `Markera "${todo.text}" som ${todo.completed ? 'ej klar' : 'klar'}`);
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
            snoozeBtn.dataset.action = 'snooze';
            snoozeBtn.setAttribute('aria-label', `Snooza "${todo.text}"`);
            li.appendChild(snoozeBtn);
        }

        // Add remove button for Bifrost todos only
        if (todo.source === 'bifrost') {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-todo';
            removeBtn.textContent = '✕';
            removeBtn.dataset.action = 'remove';
            removeBtn.setAttribute('aria-label', `Ta bort "${todo.text}"`);
            li.appendChild(removeBtn);
        }

        todoList.appendChild(li);
    });

    // Setup event delegation for todo list interactions
    setupTodoListDelegation();

    // Update status
    updateTodoStatus();
    performanceMonitor.end('render-todos');
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
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {return '📅 Idag';}
    if (diffDays === 1) {return '📅 Imorgon';}
    if (diffDays < 0) {return '📅 Försenad';}
    if (diffDays < 7) {return `📅 ${diffDays} dagar`;}

    return `📅 ${dueDate.toLocaleDateString('sv-SE')}`;
}

function formatCompletedTime(date) {
    const completed = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - completed.getTime();
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
    const diffMs = reminder.getTime() - now.getTime();
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
        const isSameButton = activeSnoozeDropdown.dataset.buttonId === (button.id || `btn-${Date.now()}`);
        activeSnoozeDropdown.remove();
        if (isSameButton) {
            activeSnoozeDropdown = null;
            return;
        }
    }

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'snooze-dropdown';
    // Store reference using data attribute instead of custom property
    dropdown.dataset.buttonId = button.id || `btn-${Date.now()}`;
    if (!button.id) button.id = dropdown.dataset.buttonId;

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
    performanceMonitor.start('save-todos');
    // Only save Bifrost todos to localStorage
    const bifrostTodos = currentTodos.filter(todo => todo.source === 'bifrost');
    localStorage.setItem(todos.storageKey, JSON.stringify(bifrostTodos));
    performanceMonitor.end('save-todos');
}

async function loadTodos() {
    performanceMonitor.start('load-todos');
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
    performanceMonitor.end('load-todos');
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

    const msUntilMidnight = tomorrow.getTime() - now.getTime();
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

// Expose functions globally for backward compatibility
// These are used by inline event handlers and external scripts
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.removeTodo = removeTodo;

// ===== KEYBOARD SHORTCUTS REGISTRATION =====
// Register link shortcuts (Ctrl+1-9)
if (shortcuts.linkShortcuts) {
    for (let i = 1; i <= 9; i++) {
        keyboardShortcutService.register({
            key: String(i),
            ctrl: true,
            description: `Open link ${i}`,
            category: 'Navigation',
            priority: 5,
            handler: () => {
                const links = document.querySelectorAll('#links a');
                const link = /** @type {HTMLAnchorElement} */ (links[i - 1]);
                if (link) { window.open(link.href, '_blank'); }
            },
            condition: () => shortcuts.enabled
        });
    }
}

// Register external search shortcut (Ctrl+/)
if (shortcuts.searchShortcuts) {
    keyboardShortcutService.register({
        key: '/',
        ctrl: true,
        description: 'Focus external search (DuckDuckGo)',
        category: 'Search',
        priority: 5,
        handler: () => {
            const searchInput = /** @type {HTMLInputElement} */ (document.querySelector('input[name="q"]'));
            if (searchInput) { searchInput.focus(); }
        },
        condition: () => shortcuts.enabled
    });
}

// Register todo shortcuts
if (shortcuts.todoShortcuts) {
    keyboardShortcutService.register({
        key: 'Enter',
        description: 'Add new todo',
        category: 'Todos',
        priority: 10,
        handler: () => {
            const todoInput = document.getElementById('new-todo');
            if (document.activeElement === todoInput) {
                addTodo();
            }
        },
        condition: () => shortcuts.enabled && document.activeElement?.id === 'new-todo'
    });
}

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
