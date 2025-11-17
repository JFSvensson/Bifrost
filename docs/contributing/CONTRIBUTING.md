# Contributing to Bifrost

Tack för att du vill bidra till Bifrost! Detta dokument beskriver riktlinjer och arbetsflöde för att bidra till projektet.

## Table of Contents

- [Kom igång](#kom-igång)
- [Development Workflow](#development-workflow)
- [Kodkonventioner](#kodkonventioner)
- [Arkitektur](#arkitektur)
- [Testing](#testing)
- [Pull Requests](#pull-requests)

---

## Kom igång

### Förutsättningar

- Modern webbläsare (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (för dev tools)
- Code editor med JavaScript-stöd (VS Code rekommenderas)

### Installation

```bash
# Klona projektet
git clone https://github.com/yourusername/bifrost.git
cd bifrost

# Installera dev dependencies
npm install

# Öppna i VS Code (optional)
code .
```

### Kör Applikationen

Bifrost kräver ingen build-process. Öppna helt enkelt `index.html` i en webbläsare eller använd en lokal server:

```bash
# Med VS Code Live Server extension: Right-click index.html → "Open with Live Server"

# Eller använd Python:
python -m http.server 8000

# Eller Node:
npx serve
```

---

## Development Workflow

### 1. Skapa en Branch

```bash
git checkout -b feature/my-new-feature
# eller
git checkout -b fix/bug-description
```

### 2. Gör Ändringar

- Följ kodkonventionerna nedan
- Skriv JSDoc för publika metoder
- Använd ErrorHandler, EventBus, StateManager

### 3. Testa Lokalt

- Testa i webbläsaren manuellt
- Kör linting och formatting:

```bash
npm run lint:fix
npm run format
```

### 4. Commit

Använd beskrivande commit-meddelanden på svenska eller engelska:

```bash
git add .
git commit -m "Lägg till snooze-funktion för todos"
# eller
git commit -m "Add snooze functionality for todos"
```

### 5. Push och Skapa PR

```bash
git push origin feature/my-new-feature
```

Skapa sedan en Pull Request på GitHub med:
- Beskrivning av ändringarna
- Screenshots (om UI-ändringar)
- Testinstruktioner

---

## Kodkonventioner

### Namngivning

**Filer**:
- Services: `camelCaseService.js` (t.ex. `reminderService.js`)
- Widgets: `camelCaseWidget.js` (t.ex. `reminderWidget.js`)
- Utilities: `camelCase.js` (t.ex. `dateHelpers.js`)

**Klasser**:
- Services: `PascalCaseService` (t.ex. `ReminderService`)
- Widgets: `PascalCaseWidget` (t.ex. `ReminderWidget`)

**Metoder**:
- Publika: `camelCase` (t.ex. `createReminder()`)
- Privata: `_camelCase` med underscore (t.ex. `_init()`)

**Variabler**:
- Konstanter: `SCREAMING_SNAKE_CASE` (t.ex. `MAX_RETRIES`)
- Vanliga: `camelCase` (t.ex. `reminderData`)
- Boolean: `isXxx` eller `hasXxx` (t.ex. `isActive`)

### Code Style

Enforced by ESLint och Prettier:

```javascript
// ✅ Bra
const myFunction = (param1, param2) => {
    if (param1 === 'test') {
        return param2;
    }
    return null;
};

// ❌ Dåligt
const myFunction=(param1,param2)=>{
  if(param1=='test'){
    return param2
  }
  return null
}
```

**Regler**:
- 4 spaces indentation
- Single quotes `'`
- Semicolons `;` alltid
- Spaces runt operators
- Max 100 tecken per rad

### JSDoc

Alla publika metoder ska ha JSDoc:

```javascript
/**
 * Skapar en ny påminnelse
 * 
 * @param {Object} reminderData - Påminnelsedata
 * @param {string} reminderData.todoId - ID för associerad todo
 * @param {Date} reminderData.remindAt - När påminnelsen ska triggas
 * @returns {Object} Skapad påminnelse
 * @throws {Error} Om required fields saknas
 */
createReminder(reminderData) {
    // Implementation
}
```

---

## Arkitektur

### Service Layer Pattern

Services innehåller business logic och hanterar data:

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
    }
    
    load() {
        this.data = stateManager.get(this.storageKey, []);
    }
    
    save() {
        stateManager.set(this.storageKey, this.data);
    }
    
    createItem(itemData) {
        // Validate
        errorHandler.validateRequired(itemData, ['name'], 'MyService.createItem');
        
        // Create
        const item = { ...itemData, id: this._generateId() };
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

const myService = new MyService();
export default myService;
```

### Widget System

Widgets är Web Components med Shadow DOM:

```javascript
import eventBus from './eventBus.js';
import myService from './myService.js';

class MyWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }
    
    _setupEventListeners() {
        eventBus.on('myservice:created', () => {
            this.render();
        });
    }
    
    render() {
        const data = myService.getData();
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .item { 
                    background: var(--bg-color);
                    color: var(--text-color);
                }
            </style>
            
            <div class="container">
                ${data.map(item => `<div class="item">${item.name}</div>`).join('')}
            </div>
        `;
    }
}

customElements.define('my-widget', MyWidget);
```

### State Management

Använd alltid StateManager för localStorage:

```javascript
import stateManager from './stateManager.js';

// Registrera schema (en gång)
stateManager.registerSchema('todos', {
    version: 1,
    validate: (data) => Array.isArray(data),
    default: []
});

// Spara/läsa
stateManager.set('todos', myTodos);
const todos = stateManager.get('todos', []);

// Lyssna på ändringar
stateManager.subscribe('todos', (data) => {
    console.log('Todos updated:', data);
});
```

### Event System

Använd EventBus för kommunikation mellan services och widgets:

```javascript
import eventBus from './eventBus.js';

// Prenumerera
eventBus.on('todo:created', (data) => {
    console.log('New todo:', data);
});

// Publicera
eventBus.emit('todo:created', { id: '123', text: 'Buy milk' });
```

**Event naming**: `namespace:action` (t.ex. `todo:created`, `reminder:triggered`)

### Error Handling

Använd ErrorHandler för all felhantering:

```javascript
import errorHandler, { ErrorCode } from './errorHandler.js';

try {
    // Operation
} catch (error) {
    errorHandler.handle(error, {
        code: ErrorCode.STORAGE_ERROR,
        context: 'Saving todos',
        showToast: true
    });
}
```

---

## Testing

### Manuell Testning

Innan du commitar, testa:

1. ✅ Fungerar i Chrome, Firefox, och Safari
2. ✅ Dark theme fungerar korrekt
3. ✅ Inga console errors
4. ✅ localStorage sparar korrekt
5. ✅ Notifikationer fungerar (om relevant)

### Automatisk Testning (Kommande)

När Vitest är setup:

```bash
npm test
```

Skriv tester för:
- Service metoder
- Edge cases
- Error handling

---

## Pull Requests

### Innan du skickar en PR

Kör följande checklist:

```bash
# 1. Lint och fixa issues
npm run lint:fix

# 2. Formattera kod
npm run format

# 3. Testa manuellt i webbläsare

# 4. Commit och push
git add .
git commit -m "Description"
git push origin feature/my-feature
```

### PR Checklist

När du skapar en PR, se till att:

- [ ] Koden följer conventions i `ARCHITECTURE.md`
- [ ] Alla publika metoder har JSDoc
- [ ] Inga ESLint warnings
- [ ] Kod är formaterad med Prettier
- [ ] Testat i minst 2 webbläsare
- [ ] Screenshots tillagda (om UI-ändringar)
- [ ] Dokumentation uppdaterad (om nödvändigt)

### PR Mall

```markdown
## Beskrivning
Kort beskrivning av ändringarna

## Typ av ändring
- [ ] Bugfix
- [ ] Ny feature
- [ ] Breaking change
- [ ] Dokumentation

## Testning
Hur har du testat ändringarna?

## Screenshots (om relevant)
Lägg till screenshots här

## Checklist
- [ ] Kod följer conventions
- [ ] JSDoc tillagd
- [ ] Linting passerar
- [ ] Testat i flera webbläsare
```

---

## Kod Review Process

1. **Automatic Checks**: ESLint och Prettier körs automatiskt (framtida CI/CD)
2. **Manual Review**: Minst en reviewer granskar koden
3. **Testing**: Reviewer testar funktionaliteten lokalt
4. **Feedback**: Reviewer ger feedback via kommentarer
5. **Merge**: Efter godkännande mergas PR:en

### Som Reviewer

När du reviewar en PR:

- ✅ Följer koden arkitekturguiden?
- ✅ Är JSDoc komplett och korrekt?
- ✅ Hanteras fel korrekt?
- ✅ Används ErrorHandler, EventBus, StateManager?
- ✅ Fungerar det i flera webbläsare?
- ✅ Är koden lättläst och välstrukturerad?

---

## Vanliga Frågor

### Hur lägger jag till en ny service?

1. Skapa `js/myService.js` enligt Service template i `ARCHITECTURE.md`
2. Importera i `main.js`
3. Registrera schema med StateManager
4. Lägg till event namespace i EventBus
5. Dokumentera i `ARCHITECTURE.md`

### Hur lägger jag till en ny widget?

1. Skapa `js/myWidget.js` enligt Widget template i `ARCHITECTURE.md`
2. Importera i `index.html`
3. Lägg till `<my-widget></my-widget>` i HTML
4. Styla i `css/styles.css` (dark theme support)
5. Dokumentera i `ARCHITECTURE.md`

### Ska jag använda TypeScript?

Nej, Bifrost använder vanilla JavaScript med JSDoc för type-hints. Detta ger:
- Zero-build philosophy
- Editor IntelliSense
- Ingen compilation step

### Hur testar jag notifikationer?

```javascript
// Begär permission först
await Notification.requestPermission();

// Testa notifikation
new Notification('Test', {
    body: 'This is a test notification',
    icon: '/favicon-32x32.png'
});
```

### Hur debuggar jag EventBus?

```javascript
// Aktivera debug mode
eventBus.setDebugMode(true);

// Se alla events i console
// Deaktivera när klar
eventBus.setDebugMode(false);
```

---

## Resurser

- **Architecture Guide**: `ARCHITECTURE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Feature Guides**: `REMINDER_GUIDE.md`, `RECURRING_GUIDE.md`, etc.

### Externa Resurser

- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [ES Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [JSDoc Reference](https://jsdoc.app/)

---

## Support

Om du har frågor:
1. Kolla `ARCHITECTURE.md` för arkitekturfrågor
2. Kolla `IMPLEMENTATION_SUMMARY.md` för exempel
3. Öppna en issue på GitHub

---

**Tack för ditt bidrag till Bifrost! 🌈**
