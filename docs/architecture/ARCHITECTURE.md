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

Bifrost is a modern, progressive web application (PWA) built with **TypeScript** and Web Components. The application follows a **Service Layer Pattern** with a clear separation between business logic (services), presentation (widgets), and state management.

### Core Principles

- **TypeScript-First**: Strong typing with 0 compilation errors for robust development
- **Web Standards**: Uses native ES Modules, Web Components, and browser APIs
- **Progressive Enhancement**: Works offline with Service Workers
- **Clean Code**: Maintainable, documented, and tested code
- **Minimal Dependencies**: TypeScript compilation only, no runtime dependencies

---

## Technology Stack

### Runtime
- **TypeScript 5.9+**: Compiled to ES2020 JavaScript with source maps
- **ES Modules**: Native browser module support
- **Web Components**: Shadow DOM for widget encapsulation
- **PWA**: Service Workers for offline support and caching
- **localStorage**: Client-side persistence

### Development
- **TypeScript**: Full type safety with comprehensive interfaces
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Vitest**: Unit testing with 41+ tests
- **npm scripts**: Build, dev (watch mode), type-check

---

## Project Structure

```
bifrost/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── jsconfig.json           # VS Code/editor configuration
├── package.json            # NPM scripts and dev dependencies
│
├── css/                    # 🎨 Modular styles
│   ├── styles.css              # Main stylesheet with @imports
│   ├── base/
│   │   └── reset.css           # CSS reset and base styles
│   ├── layouts/
│   │   └── grid.css            # Grid layout and structure
│   ├── components/
│   │   ├── card.css            # Card component styles
│   │   ├── todo.css            # Todo list styles
│   │   ├── toasts.css          # Toast notification styles
│   │   └── widgets.css         # Widget component styles
│   ├── themes/
│   │   └── dark.css            # Dark theme overrides
│   └── utilities/
│       ├── responsive.css      # Media queries and responsive design
│       └── modes.css           # Compact mode and print styles
│
├── src/                    # 📝 TypeScript source code
│   ├── core/               # 🏗️ Core infrastructure
│   │   ├── errorHandler.ts     # Centralized error handling
│   │   ├── eventBus.ts         # Pub/sub event system
│   │   └── stateManager.ts     # State management with localStorage
│   │
│   ├── config/             # ⚙️ Configuration
│   │   ├── config.ts           # Application configuration
│   │   ├── types.ts            # Type definitions
│   │   └── uiConfig.ts         # UI configuration
│   │
│   ├── services/           # 🔧 Business logic services (16 files)
│   │   ├── calendarSync.ts
│   │   ├── clockService.ts
│   │   ├── deadlineService.ts
│   │   ├── googleCalendarService.ts
│   │   ├── keyboardShortcutService.ts
│   │   ├── linkService.ts
│   │   ├── menuService.ts
│   │   ├── obsidianTodoService.ts
│   │   ├── performanceMonitor.ts
│   │   ├── pomodoroService.ts
│   │   ├── recurringService.ts
│   │   ├── reminderService.ts
│   │   ├── searchService.ts
│   │   ├── statsService.ts
│   │   ├── themeService.ts
│   │   └── weatherService.ts
│   │
│   ├── widgets/            # 🎨 UI Web Components (14 files)
│   │   ├── backupWidget.ts
│   │   ├── calendarWidget.ts
│   │   ├── clockWidget.ts
│   │   ├── deadlineWidget.ts
│   │   ├── linkWidget.ts
│   │   ├── pomodoroWidget.ts
│   │   ├── quickAddWidget.ts
│   │   ├── recurringWidget.ts
│   │   ├── reminderWidget.ts
│   │   ├── schoolMenu.ts
│   │   ├── searchWidget.ts
│   │   ├── shortcutsHelpWidget.ts
│   │   ├── statsWidget.ts
│   │   └── weatherWidget.ts
│   │
│   ├── utils/              # 🛠️ Utilities & helpers (5 files)
│   │   ├── dateHelpers.ts
│   │   ├── debounce.ts
│   │   ├── logger.ts
│   │   ├── naturalLanguageParser.ts
│   │   └── sanitizer.ts
│   │
│   ├── integrations/       # 🔌 Integration scripts
│   │   ├── obsidianBridge.ts   # Obsidian vault bridge (Node.js)
│   │   └── proxy.ts            # CORS proxy server (Node.js)
│   │
│   ├── types.d.ts          # Global TypeScript definitions
│   ├── main.ts             # Application orchestrator
│   ├── widgetLoader.ts     # Lazy loading system
│   └── sw.ts               # Service Worker
│
├── dist/                   # 📦 Compiled JavaScript (gitignored)
│   └── [same structure as src/]
│       ├── *.js            # Compiled from TypeScript
│       └── *.js.map        # Source maps for debugging
│
├── assets/                 # 🎨 Static assets
│   └── icons/
│       ├── favicon.svg         # SVG favicon
│       └── favicon-data.txt    # Favicon generation notes
│
├── data/
│   ├── links.json          # Quick links configuration
│   └── examples/
│       └── example-TODO.md     # Obsidian todo format example
│
├── scripts/                # 🔧 Build & tooling scripts
│   ├── eslint.config.js        # ESLint configuration
│   └── generate-favicons.js    # Favicon generator
│
├── tests/                  # 🧪 Test files
│   ├── setup.js
│   ├── services/
│   │   ├── deadlineService.test.js
│   │   ├── pomodoroService.test.js
│   │   ├── recurringService.test.js
│   │   └── statsService.test.js
│   └── utilities/
│       ├── errorHandler.test.js
│       ├── eventBus.test.js
│       └── stateManager.test.js
│
└── docs/                   # 📚 Documentation
    ├── architecture/
    │   ├── ARCHITECTURE.md     # This file
    │   └── CONFIG.md           # Configuration guide
    ├── features/
    │   ├── DEADLINE_GUIDE.md
    │   ├── POMODORO_GUIDE.md
    │   ├── QUICK_ADD_GUIDE.md
    │   ├── RECURRING_GUIDE.md
    │   ├── REMINDER_GUIDE.md
    │   └── STATS_GUIDE.md
    ├── guides/
    │   ├── DARK_THEME.md
    │   ├── FAVICON_README.md
    │   ├── GOOGLE_CALENDAR_GUIDE.md
    │   └── OBSIDIAN_SETUP.md
    └── contributing/
        ├── CONTRIBUTING.md
        └── IMPLEMENTATION_SUMMARY.md
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
import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

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
import eventBus from '../core/eventBus.js';
import myService from '../services/myService.js';

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
| **keyboardShortcutService** | Centralized keyboard shortcut management | (no storage) |
| **searchService** | Multi-source search with fuzzy matching | (no storage) |
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
import stateManager from '../core/stateManager.js';

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
import eventBus from '../core/eventBus.js';

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
- `shortcut` - Keyboard shortcut events
- `search` - Search operations
- `backup` - Backup/import operations
- `shortcuts-help` - Shortcuts help widget events
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
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

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

## Assets & Resources

### Assets Organization

Static assets are organized in the `/assets` directory:

```
assets/
└── icons/
    ├── favicon.svg         # SVG favicon (32x32)
    ├── favicon.ico         # ICO fallback
    ├── apple-touch-icon.png # iOS home screen icon
    └── favicon-data.txt    # Generation notes
```

**Favicon Strategy:**
- Primary: SVG favicon for modern browsers
- Fallback: ICO for legacy support
- PWA: Multiple sizes in manifest.json
- Generation: Use `node scripts/generate-favicons.js`

### Integration Scripts

External integration scripts in `/js/integrations`:

```
js/integrations/
├── obsidianBridge.js  # Obsidian vault synchronization
└── proxy.js           # CORS proxy for external APIs
```

**ObsidianBridge:**
- Node.js server on port 8081
- Watches vault files for changes
- Provides REST API for todo sync
- Real-time file system monitoring

**Proxy:**
- Node.js CORS proxy on port 8787
- Proxies school menu API requests
- Bypasses CORS restrictions
- Caches responses

### Build Scripts

Development and build tools in `/scripts`:

```
scripts/
├── eslint.config.js      # ESLint configuration
└── generate-favicons.js  # Favicon generation utility
```

---

## CSS Architecture

### Modular CSS Structure

The application uses a modular CSS architecture with organized imports for maintainability:

```
css/
├── styles.css          # Main entry point with @import statements
├── base/
│   └── reset.css       # CSS reset, box-sizing, body defaults
├── layouts/
│   └── grid.css        # Container grid layout, header, sidebar
├── components/
│   ├── card.css        # Card component base styles
│   ├── todo.css        # Todo list, priorities, icons, inputs
│   ├── toasts.css      # Notification toasts (Pomodoro, Deadline)
│   └── widgets.css     # Widget-specific styles (theme toggle, search, links)
├── themes/
│   └── dark.css        # Dark theme overrides with .dark-theme class
└── utilities/
    ├── responsive.css  # Media queries (tablet, mobile, small mobile)
    └── modes.css       # Compact mode, print styles
```

**Import Order:**
1. **Base** - Foundational styles
2. **Layouts** - Page structure
3. **Components** - Reusable UI components
4. **Themes** - Theme overrides
5. **Utilities** - Responsive and special modes

**Benefits:**
- **Separation of Concerns** - Each file has a single responsibility
- **Maintainability** - Easy to locate and modify styles
- **Performance** - Browser caches individual modules
- **Scalability** - Add new modules without touching existing code
- **Team Collaboration** - Multiple developers can work on different modules

**Conventions:**
- Use CSS custom properties for theming where appropriate
- Keep component styles co-located with their concerns
- Dark theme uses `.dark-theme` class with cascade overrides
- Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile)

---

## Code Conventions

### File Naming

- **Services**: `camelCaseService.js` in `js/services/` (e.g., `services/reminderService.js`)
- **Widgets**: `camelCaseWidget.js` in `js/widgets/` (e.g., `widgets/reminderWidget.js`)
- **Utilities**: `camelCase.js` in `js/utils/` (e.g., `utils/dateHelpers.js`)
- **Core**: `camelCase.js` in `js/core/` (e.g., `core/errorHandler.js`)
- **Config**: `camelCase.js` in `js/config/` (e.g., `config/types.js`)
- **CSS Modules**: `kebab-case.css` in category folders (e.g., `components/todo.css`)
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

**TypeScript interfaces** defined in `src/types.d.ts`:

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  recurring?: RecurringConfig;
}

interface RecurringConfig {
  type: 'daily' | 'weekly' | 'monthly';
  frequency: number;
  daysOfWeek?: number[];
  endDate?: string;
}
```

Import types in TypeScript files:

```typescript
import type { Todo, RecurringConfig } from './types.d.ts';

function processTodo(todo: Todo): void {
    // Full type safety and IntelliSense
    console.log(todo.text);
}
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": false,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Build System

```bash
npm run build      # Compile TypeScript → dist/
npm run dev        # Watch mode for development  
npm run type-check # Type check without emit
```

**Migration Status:** ✅ 0 errors, 46 compiled files, full type safety achieved.

---

## Testing

### Testing Strategy

**Vitest** for unit testing with 41+ tests:

```typescript
import { describe, it, expect } from 'vitest';
import reminderService from '../dist/services/reminderService.js';

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
├── setup.js
├── services/
│   ├── calendarSync.test.js
│   ├── clockService.test.js
│   ├── deadlineService.test.js
│   ├── pomodoroService.test.js
│   ├── recurringService.test.js
│   └── statsService.test.js
└── utilities/
    ├── errorHandler.test.js
    ├── eventBus.test.js
    └── stateManager.test.js
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Interactive test UI
npm run test:coverage # Coverage report
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
   import eventBus from '../core/eventBus.js';
   import stateManager from '../core/stateManager.js';
   import errorHandler, { ErrorCode } from '../core/errorHandler.js';
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

**Last Updated**: 2025-11-17
**Version**: 2.0

