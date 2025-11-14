# Bifrost Architecture

This document describes the architecture, patterns, and conventions used in the Bifrost application.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture Patterns](#architecture-patterns)
- [Service Layer](#service-layer)
- [Widget System](#widget-system)
- [State Management](#state-management)
- [Event System](#event-system)
- [Error Handling](#error-handling)
- [Code Conventions](#code-conventions)
- [Type Safety](#type-safety)
- [Testing](#testing)
- [Performance](#performance)

---

## Overview

Bifrost is a modern, progressive web application (PWA) built with vanilla JavaScript and Web Components. The application follows a **Service Layer Pattern** with a clear separation between business logic (services), presentation (widgets), and state management.

### Core Principles

- **Zero-Build Philosophy**: No bundlers or transpilers - runs directly in modern browsers
- **Web Standards**: Uses native ES Modules, Web Components, and browser APIs
- **Progressive Enhancement**: Works offline with Service Workers
- **Clean Code**: Maintainable, documented, and tested code
- **Minimal Dependencies**: Only external dependencies are development tools (ESLint, Prettier)

---

## Technology Stack

### Runtime
- **JavaScript**: ES2022+ with native ES Modules
- **Web Components**: Shadow DOM for widget encapsulation
- **PWA**: Service Workers for offline support and caching
- **localStorage**: Client-side persistence

### Development
- **JSDoc**: Type-hints for editor IntelliSense
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Vitest**: Unit testing (planned)

---

## Project Structure

```
bifrost/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── jsconfig.json           # VS Code/editor configuration
├── package.json            # NPM scripts and dev dependencies
│
├── css/
│   └── styles.css          # All application styles
│
├── js/
│   ├── types.js            # JSDoc type definitions
│   ├── errorHandler.js     # Centralized error handling
│   ├── eventBus.js         # Pub/sub event system
│   ├── stateManager.js     # Centralized state management
│   │
│   ├── *Service.js         # Business logic services
│   │   ├── reminderService.js
│   │   ├── recurringService.js
│   │   ├── deadlineService.js
│   │   ├── statsService.js
│   │   ├── pomodoroService.js
│   │   ├── obsidianTodoService.js
│   │   ├── googleCalendarService.js
│   │   ├── weatherService.js
│   │   ├── menuService.js
│   │   ├── themeService.js
│   │   └── clockService.js
│   │
│   ├── *Widget.js          # UI Web Components
│   │   ├── reminderWidget.js
│   │   ├── recurringWidget.js
│   │   ├── deadlineWidget.js
│   │   ├── statsWidget.js
│   │   ├── pomodoroWidget.js
│   │   ├── calendarWidget.js
│   │   ├── weatherWidget.js
│   │   ├── clockWidget.js
│   │   └── quickAddWidget.js
│   │
│   ├── main.js             # Application orchestrator
│   ├── naturalLanguageParser.js
│   ├── dateHelpers.js
│   └── sw.js               # Service Worker
│
├── data/
│   └── links.json          # Quick links configuration
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md     # This file
    ├── REMINDER_GUIDE.md
    ├── RECURRING_GUIDE.md
    ├── POMODORO_GUIDE.md
    ├── STATS_GUIDE.md
    └── ...
```

---

## Architecture Patterns

### Service Layer Pattern

All business logic is organized into **Service** classes that:

1. **Encapsulate domain logic** (todos, reminders, stats, etc.)
2. **Manage persistence** via StateManager
3. **Emit events** via EventBus for UI updates
4. **Provide API methods** for other services and UI

#### Service Template

```javascript
import eventBus from './eventBus.js';
import stateManager from './stateManager.js';
import errorHandler, { ErrorCode } from './errorHandler.js';

class MyService {
    constructor() {
        this.data = [];
        this.storageKey = 'myservice';
        this._init();
    }
    
    _init() {
        this.load();
        this._setupEventListeners();
    }
    
    load() {
        this.data = stateManager.get(this.storageKey, []);
    }
    
    save() {
        stateManager.set(this.storageKey, this.data);
    }
    
    _setupEventListeners() {
        eventBus.on('app:ready', () => {
            // Initialize when app is ready
        });
    }
    
    // Public API methods
    getSomething() {
        return this.data;
    }
    
    createSomething(data) {
        // Validate
        errorHandler.validateRequired(data, ['field1', 'field2'], 'MyService.createSomething');
        
        // Create
        const item = { ...data, id: this._generateId() };
        this.data.push(item);
        
        // Persist
        this.save();
        
        // Emit event
        eventBus.emit('myservice:created', item);
        
        return item;
    }
    
    _generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton export
const myService = new MyService();
export default myService;
```

### Widget System (Web Components)

Widgets are **custom HTML elements** that:

1. **Render UI** in isolated Shadow DOM
2. **Subscribe to events** from services
3. **Call service methods** for actions
4. **Support dark theme** via CSS variables

#### Widget Template

```javascript
import eventBus from './eventBus.js';
import myService from './myService.js';

class MyWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.data = [];
    }
    
    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }
    
    disconnectedCallback() {
        // Cleanup if needed
    }
    
    _setupEventListeners() {
        eventBus.on('myservice:created', (item) => {
            this.data.push(item);
            this.render();
        });
        
        eventBus.on('theme:changed', () => {
            this.render();
        });
    }
    
    render() {
        this.data = myService.getSomething();
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                /* Styles using CSS variables for theming */
                .container {
                    background: var(--bg-color);
                    color: var(--text-color);
                }
            </style>
            
            <div class="container">
                ${this.data.map(item => `
                    <div class="item">${item.name}</div>
                `).join('')}
            </div>
        `;
        
        this._attachEventHandlers();
    }
    
    _attachEventHandlers() {
        // Attach click handlers etc
    }
}

customElements.define('my-widget', MyWidget);
```

---

## Service Layer

### Core Services

| Service | Responsibility | Storage Key |
|---------|---------------|-------------|
| **reminderService** | Scheduled reminders, snooze functionality | `reminders` |
| **recurringService** | Recurring todo patterns | `recurringPatterns` |
| **deadlineService** | Deadline management | (uses todos) |
| **statsService** | Completion statistics, streaks | `stats` |
| **pomodoroService** | Pomodoro timer sessions | `pomodoroSessions` |
| **obsidianTodoService** | Obsidian vault sync | `obsidianTodos` |
| **googleCalendarService** | Google Calendar integration | `calendarEvents` |
| **weatherService** | Weather data | `weather` (cached) |
| **menuService** | School menu | `menu` |
| **themeService** | Dark/light theme | `theme` |
| **clockService** | Time display | (no storage) |

### Service Lifecycle

1. **Constructor**: Initialize properties, call `_init()`
2. **_init()**: Load data, setup event listeners
3. **load()**: Load data from StateManager
4. **save()**: Persist data to StateManager
5. **Public methods**: API for other services and UI
6. **Event emission**: Notify subscribers of changes

### Service Communication

Services communicate via **EventBus** to avoid tight coupling:

```javascript
// Service A emits event
eventBus.emit('todo:created', todoData);

// Service B listens
eventBus.on('todo:created', (todoData) => {
    // React to new todo
});
```

---

## Widget System

### Web Components

Widgets are registered as custom elements and rendered with Shadow DOM:

```javascript
customElements.define('reminder-widget', ReminderWidget);
```

```html
<reminder-widget></reminder-widget>
```

### Widget Lifecycle

1. **Constructor**: Call `super()`, attach shadow root
2. **connectedCallback()**: Render initial UI, setup listeners
3. **render()**: Generate HTML and styles
4. **disconnectedCallback()**: Cleanup listeners (if needed)

### Dark Theme Support

Widgets use CSS variables for theming:

```css
:host {
    --bg-color: var(--widget-bg, #fff);
    --text-color: var(--text-primary, #000);
}
```

Theme variables are defined in `styles.css` with `:root` and `body.dark-theme`.

---

## State Management

### StateManager

**StateManager** centralizes all localStorage operations:

```javascript
import stateManager from './stateManager.js';

// Register schema with validation
stateManager.registerSchema('todos', {
    version: 1,
    validate: (data) => Array.isArray(data),
    default: []
});

// Save data
stateManager.set('todos', myTodos);

// Load data
const todos = stateManager.get('todos', []);

// Subscribe to changes
stateManager.subscribe('todos', (data) => {
    console.log('Todos updated:', data);
});
```

### Features

- **Schema validation**: Validate data before saving
- **Migrations**: Auto-migrate old data formats
- **TTL support**: Expire cached data automatically
- **Backups**: Auto-backup before destructive operations
- **Quota monitoring**: Warn when storage is nearly full

### Storage Keys Convention

Use descriptive, singular or plural keys:
- `todos` - Array of todos
- `reminders` - Array of reminders
- `recurringPatterns` - Array of patterns
- `stats` - Object with statistics
- `theme` - String ('light' or 'dark')

---

## Event System

### EventBus

**EventBus** provides pub/sub pattern for decoupled communication:

```javascript
import eventBus from './eventBus.js';

// Subscribe
const unsubscribe = eventBus.on('todo:created', (data) => {
    console.log('New todo:', data);
});

// Emit
eventBus.emit('todo:created', { id: '123', text: 'Buy milk' });

// Once (auto-unsubscribe after first call)
eventBus.once('app:ready', () => {
    console.log('App initialized');
});

// Unsubscribe
unsubscribe();
```

### Event Naming Convention

Events use **namespace:action** format:

- `todo:created` - New todo created
- `todo:updated` - Todo updated
- `todo:deleted` - Todo deleted
- `reminder:triggered` - Reminder triggered
- `theme:changed` - Theme toggled
- `app:ready` - Application initialized
- `state:updated` - StateManager saved data

### Registered Namespaces

- `todo` - Todo operations
- `reminder` - Reminder operations
- `recurring` - Recurring patterns
- `pomodoro` - Pomodoro timer
- `stats` - Statistics
- `theme` - Theme changes
- `weather` - Weather updates
- `calendar` - Calendar events
- `obsidian` - Obsidian sync
- `app` - Application lifecycle
- `ui` - UI interactions
- `menu` - School menu

### Wildcard Subscriptions

Listen to all events in a namespace:

```javascript
eventBus.on('todo:*', (data, eventName) => {
    console.log(`Todo event: ${eventName}`, data);
});
```

---

## Error Handling

### ErrorHandler

**ErrorHandler** centralizes error management:

```javascript
import errorHandler, { ErrorCode } from './errorHandler.js';

// Handle errors with toast
try {
    // Some operation
} catch (error) {
    errorHandler.handle(error, {
        code: ErrorCode.STORAGE_ERROR,
        context: 'Saving todos',
        showToast: true
    });
}

// Log warnings
errorHandler.warning(
    ErrorCode.API_TIMEOUT,
    'Weather API timeout',
    { url: 'https://...' }
);

// Critical errors
errorHandler.critical(
    ErrorCode.SERVICE_INIT_FAILED,
    'ReminderService failed to initialize'
);
```

### Error Codes

Defined in `errorHandler.js`:

- `STORAGE_ERROR` - localStorage failure
- `STORAGE_QUOTA_EXCEEDED` - Storage full
- `API_ERROR` - Network/API error
- `VALIDATION_ERROR` - Invalid input
- `SERVICE_INIT_FAILED` - Service initialization failure
- `NOTIFICATION_PERMISSION_DENIED` - Notifications blocked

### User-Friendly Messages

ErrorHandler translates technical errors to user-friendly Swedish messages:

```javascript
STORAGE_ERROR → "Kunde inte spara data"
API_TIMEOUT → "Servern svarar inte - försök igen"
```

---

## Code Conventions

### File Naming

- **Services**: `camelCaseService.js` (e.g., `reminderService.js`)
- **Widgets**: `camelCaseWidget.js` (e.g., `reminderWidget.js`)
- **Utilities**: `camelCase.js` (e.g., `dateHelpers.js`)
- **Constants**: `SCREAMING_SNAKE_CASE` in files (e.g., `ErrorCode.STORAGE_ERROR`)

### Class Naming

- **Services**: `PascalCaseService` (e.g., `ReminderService`)
- **Widgets**: `PascalCaseWidget` (e.g., `ReminderWidget`)
- **Utilities**: Functions or singleton objects

### Method Naming

- **Public methods**: `camelCase` (e.g., `createReminder()`)
- **Private methods**: `_camelCase` with underscore prefix (e.g., `_init()`)
- **Event handlers**: `handleEventName` (e.g., `handleReminderClick`)

### Variable Naming

- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Regular variables**: `camelCase` (e.g., `reminderData`)
- **Boolean variables**: `isXxx` or `hasXxx` (e.g., `isActive`, `hasDeadline`)

### Code Style

Enforced by ESLint and Prettier:

- **Indentation**: 4 spaces
- **Quotes**: Single quotes `'` (except for avoiding escapes)
- **Semicolons**: Always
- **Trailing commas**: None
- **Line length**: 100 characters max
- **Spacing**: Spaces around operators, after keywords

---

## Type Safety

### JSDoc Type Hints

Use JSDoc for type-safety without TypeScript:

```javascript
/**
 * Creates a new reminder
 * 
 * @param {Object} reminderData - Reminder data
 * @param {string} reminderData.todoId - Todo ID
 * @param {string} reminderData.text - Reminder text
 * @param {Date} reminderData.remindAt - Trigger time
 * @param {string} [reminderData.type='manual'] - Reminder type
 * @returns {Object} Created reminder
 */
createReminder(reminderData) {
    // Implementation
}
```

### Type Definitions

Core types defined in `types.js`:

```javascript
/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} text
 * @property {boolean} done
 * @property {number} created
 * @property {string} [deadline]
 */
```

Import types in other files:

```javascript
/// <reference path="./types.js" />

/**
 * @param {Todo} todo
 */
function doSomething(todo) {
    // Editor provides IntelliSense for todo properties
}
```

### jsconfig.json

Enables VS Code type checking:

```json
{
  "compilerOptions": {
    "module": "ES6",
    "target": "ES6",
    "checkJs": true
  }
}
```

---

## Testing

### Testing Strategy (Planned)

**Vitest** for unit testing:

```javascript
import { describe, it, expect } from 'vitest';
import reminderService from './reminderService.js';

describe('ReminderService', () => {
    it('creates reminder with valid data', () => {
        const reminder = reminderService.createReminder({
            todoId: '123',
            text: 'Test',
            remindAt: new Date(Date.now() + 3600000)
        });
        
        expect(reminder).toHaveProperty('id');
        expect(reminder.text).toBe('Test');
    });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── reminderService.test.js
│   │   ├── recurringService.test.js
│   │   └── statsService.test.js
│   └── utilities/
│       ├── errorHandler.test.js
│       ├── eventBus.test.js
│       └── stateManager.test.js
└── integration/
    └── todoFlow.test.js
```

---

## Performance

### Optimization Strategies

1. **Lazy Loading**: Load widgets on-demand (not all at page load)
2. **Debouncing**: Debounce save operations (e.g., 300ms delay)
3. **Event Throttling**: Throttle frequent events (e.g., scroll, resize)
4. **Shadow DOM**: Isolate widget styles to avoid recalculations
5. **Service Workers**: Cache static assets for instant loading

### Memory Management

- **Cleanup listeners**: Unsubscribe in `disconnectedCallback()`
- **Limit history**: Cap event history and error logs (e.g., 100 items)
- **Clear intervals**: Stop timers when widgets are removed

### localStorage Optimization

- **Compression**: Consider compressing large objects (planned)
- **Quota monitoring**: Warn users when storage is 80% full
- **Cleanup**: Remove expired data (TTL) and old backups

---

## Best Practices

### 1. Single Responsibility

Each service/widget has **one clear purpose**:
- ✅ `reminderService` handles reminders
- ❌ Don't mix reminder logic with todo CRUD

### 2. Dependency Injection

Use EventBus instead of direct service imports when possible:
- ✅ `eventBus.emit('todo:created', todo)`
- ❌ `statsService.incrementCount()` from todoService

### 3. Error Handling

Always use ErrorHandler for consistency:
- ✅ `errorHandler.handle(error, { code, context })`
- ❌ `console.error(error)` or `alert(error)`

### 4. Type Documentation

Document all public methods with JSDoc:
- ✅ Full JSDoc with `@param`, `@returns`, `@throws`
- ❌ No documentation or inline comments only

### 5. Testing

Write tests for business logic (services):
- ✅ Test service methods, edge cases, error handling
- ❌ Skip testing or only test widgets

### 6. State Management

Use StateManager for all persistence:
- ✅ `stateManager.set('key', data)`
- ❌ `localStorage.setItem('key', JSON.stringify(data))`

### 7. Event Naming

Use namespace:action convention:
- ✅ `todo:created`, `reminder:triggered`
- ❌ `todoCreated`, `onReminderTrigger`

### 8. Private Methods

Prefix private methods with underscore:
- ✅ `_init()`, `_validateData()`
- ❌ `init()` (public-looking but intended private)

---

## Migration Guide

### Migrating Existing Services to New Architecture

1. **Import utilities**:
   ```javascript
   import eventBus from './eventBus.js';
   import stateManager from './stateManager.js';
   import errorHandler, { ErrorCode } from './errorHandler.js';
   ```

2. **Replace localStorage with StateManager**:
   ```javascript
   // Before
   localStorage.setItem('todos', JSON.stringify(todos));
   const todos = JSON.parse(localStorage.getItem('todos') || '[]');
   
   // After
   stateManager.set('todos', todos);
   const todos = stateManager.get('todos', []);
   ```

3. **Replace ad-hoc events with EventBus**:
   ```javascript
   // Before
   if (this.subscribers['created']) {
       this.subscribers['created'].forEach(cb => cb(todo));
   }
   
   // After
   eventBus.emit('todo:created', todo);
   ```

4. **Replace error handling**:
   ```javascript
   // Before
   try {
       // ...
   } catch (error) {
       console.error('Error:', error);
       showToast('Ett fel uppstod');
   }
   
   // After
   try {
       // ...
   } catch (error) {
       errorHandler.handle(error, {
           code: ErrorCode.STORAGE_ERROR,
           context: 'Saving todo',
           showToast: true
       });
   }
   ```

5. **Add JSDoc**:
   ```javascript
   /**
    * Creates a new todo
    * 
    * @param {Object} todoData - Todo data
    * @param {string} todoData.text - Todo text
    * @returns {Object} Created todo
    */
   createTodo(todoData) {
       // ...
   }
   ```

---

## Contributing

### Before Submitting Code

1. Run linter: `npm run lint:fix`
2. Format code: `npm run format`
3. Add JSDoc to public methods
4. Write tests for new features
5. Update documentation if needed

### Pull Request Checklist

- [ ] Code follows conventions in this document
- [ ] All methods have JSDoc comments
- [ ] Tests added for new features
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] Documentation updated
- [ ] Tested in Chrome, Firefox, Safari

---

## Resources

- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [ES Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [JSDoc Reference](https://jsdoc.app/)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated**: 2024-11-14
**Version**: 1.0
