# Keyboard Shortcuts Guide

En omfattande guide för Bifrosts centraliserade tangentbordshantering med konfliktdetektering och prioritetssystem.

## Översikt

KeyboardShortcutService tillhandahåller:
- **Centraliserad registrering** av alla genvägar
- **Konfliktdetektering** med prioritetssystem
- **Kategorigruppering** för organisation
- **Plattformsmedveten formatering** (Mac ⌘ vs Windows Ctrl)
- **Input field-detektering** för att undvika interferens
- **Condition functions** för kontextberoende genvägar

---

## Snabbstart

### Visa alla genvägar

```
Tryck Ctrl+? (Ctrl+Shift+/)
    ↓
Modal visas med alla genvägar
    ↓
Grupperade efter kategori
    ↓
Tryck Escape för att stänga
```

---

## Registrerade Genvägar

### Allmänt

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + ?` | Visa alla tangentbordsgenvägar | 20 |
| `Escape` | Stäng modals/rensa inmatning | 15 |

### Sökning

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + F` | Öppna global sökning | 10 |
| `Ctrl + /` | Fokusera extern sökning (DuckDuckGo) | 5 |
| `↑` | Föregående sökresultat | 10 |
| `↓` | Nästa sökresultat | 10 |
| `Enter` | Välj sökresultat | 10 |
| `Escape` | Stäng sökning | 15 |

### Todos

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + K` | Fokusera Quick Add | 10 |
| `Enter` | Lägg till todo / Submit Quick Add | 10 |
| `Escape` | Rensa Quick Add | 10 |

### Navigation

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + 1` | Öppna länk 1 | 5 |
| `Ctrl + 2` | Öppna länk 2 | 5 |
| `Ctrl + 3` | Öppna länk 3 | 5 |
| `Ctrl + 4` | Öppna länk 4 | 5 |
| `Ctrl + 5` | Öppna länk 5 | 5 |
| `Ctrl + 6` | Öppna länk 6 | 5 |
| `Ctrl + 7` | Öppna länk 7 | 5 |
| `Ctrl + 8` | Öppna länk 8 | 5 |
| `Ctrl + 9` | Öppna länk 9 | 5 |

### Widgets

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + Shift + P` | Start/Pause Pomodoro timer | 10 |
| `Ctrl + Shift + R` | Reset Pomodoro timer | 10 |
| `Ctrl + Shift + D` | Toggle dark/light theme | 10 |

### Actions

| Genväg | Funktion | Prioritet |
|--------|----------|-----------|
| `Ctrl + Shift + B` | Öppna backup & export | 10 |

---

## API

### Registrera genväg

```javascript
import { keyboardShortcutService } from './services/keyboardShortcutService.js';

// Grundläggande registrering
const unregister = keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    description: 'Open Quick Add',
    category: 'Todos',
    handler: () => {
        document.querySelector('quick-add-widget')?.focus();
    }
});

// Fullständiga alternativ
keyboardShortcutService.register({
    key: 's',                  // Tangent (a-z, 0-9, Escape, Enter, etc.)
    ctrl: true,                // Kräv Ctrl/Cmd
    shift: false,              // Kräv Shift
    alt: false,                // Kräv Alt
    description: 'Save data', // Beskrivning för hjälp
    category: 'Actions',       // Kategori för gruppering
    priority: 10,              // Högre = prioriteras vid konflikt
    preventDefault: true,      // Förhindra webbläsarens default
    condition: () => true,     // Condition function
    handler: (event) => {      // Handler-funktion
        // Din kod här
    }
});
```

### Avregistrera genväg

```javascript
// Alternativ 1: Använd returnerad unregister-funktion
const unregister = keyboardShortcutService.register({...});
unregister(); // Anropa för att ta bort

// Alternativ 2: Manuellt via shortcutKey
keyboardShortcutService.unregister('ctrl+k');
```

### Hämta genvägar

```javascript
// Alla genvägar
const all = keyboardShortcutService.getAll();
// [{ key: 'k', ctrl: true, ... }, ...]

// Efter kategori
const todoShortcuts = keyboardShortcutService.getByCategory('Todos');

// Alla kategorier
const categories = keyboardShortcutService.getCategories();
// ['General', 'Search', 'Todos', 'Navigation', ...]
```

### Aktivera/Inaktivera

```javascript
// Inaktivera alla genvägar
keyboardShortcutService.disable();

// Aktivera igen
keyboardShortcutService.enable();

// Kontrollera status
const enabled = keyboardShortcutService.isEnabled();
```

---

## Prioritetssystem

Vid konflikter mellan genvägar vinner den med **högst prioritet**:

```javascript
// Prioritet 5 (registrerad först)
keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    priority: 5,
    handler: () => console.log('Low priority')
});

// Prioritet 10 (registrerad senare, ERSÄTTER första)
keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    priority: 10,
    handler: () => console.log('High priority')
});

// Resultat: Endast "High priority" körs vid Ctrl+K
```

**Rekommenderade prioritetsnivåer:**
- `20` - Kritiska system-genvägar (Ctrl+?, Escape)
- `15` - Viktig funktionalitet (stäng modals)
- `10` - Normal funktionalitet (sök, quick add)
- `5` - Lägre prioritet (länkar, mindre funktioner)
- `0` - Default (om inget anges)

---

## Condition Functions

Använd condition functions för kontextberoende genvägar:

```javascript
// Endast när sökning är öppen
keyboardShortcutService.register({
    key: 'Escape',
    handler: () => closeSearch(),
    condition: () => isSearchOpen()  // Körs endast om true
});

// Endast när todo-input är fokuserad
keyboardShortcutService.register({
    key: 'Enter',
    handler: () => addTodo(),
    condition: () => document.activeElement?.id === 'new-todo'
});

// Endast när shortcuts är aktiverade
keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    handler: () => openQuickAdd(),
    condition: () => config.shortcuts.enabled
});
```

---

## Input Field Detection

KeyboardShortcutService **skippar automatiskt genvägar** när användaren skriver i:
- `<input>` element
- `<textarea>` element
- `<select>` element
- Contenteditable element

**Undantag:** `Escape` fungerar alltid, även i input-fält.

```javascript
// Fungerar INTE när användaren skriver i input
keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    handler: () => console.log('Triggered')
});

// Fungerar ALLTID, även i input
keyboardShortcutService.register({
    key: 'Escape',
    handler: () => console.log('Always works')
});
```

---

## Plattformsmedveten Formatering

Service detekterar automatiskt plattform och formaterar genvägar:

**Mac:**
```
Ctrl → ⌘ (Cmd)
Alt  → ⌥ (Option)
Shift → ⇧
```

**Windows/Linux:**
```
Ctrl → Ctrl
Alt  → Alt
Shift → Shift
```

```javascript
// Intern formatering
const formatted = keyboardShortcutService._formatShortcut({
    key: 'k',
    ctrl: true,
    shift: true
});

// Mac: ⌘⇧K
// Windows: Ctrl+Shift+K
```

---

## EventBus Integration

KeyboardShortcutService emitterar events via EventBus:

```javascript
import eventBus from './core/eventBus.js';

// Lyssna på registrering
eventBus.on('shortcut:registered', ({ shortcut, description, category }) => {
    console.log(`Ny genväg: ${shortcut} - ${description}`);
});

// Lyssna på avregistrering
eventBus.on('shortcut:unregistered', ({ shortcut }) => {
    console.log(`Genväg borttagen: ${shortcut}`);
});

// Lyssna på triggar
eventBus.on('shortcut:triggered', ({ shortcut, description, category }) => {
    console.log(`Körde: ${shortcut}`);
});

// Lyssna på enable/disable
eventBus.on('shortcuts:enabled', () => {
    console.log('Genvägar aktiverade');
});

eventBus.on('shortcuts:disabled', () => {
    console.log('Genvägar inaktiverade');
});
```

---

## Kategoriering

Organisera genvägar i kategorier för bättre översikt:

**Tillgängliga kategorier:**
- `General` - Allmänna genvägar
- `Search` - Sök-relaterat
- `Todos` - Todo-hantering
- `Navigation` - Navigation mellan vyer/länkar
- `Widgets` - Widget-specifika genvägar
- `Actions` - Åtgärder (backup, export, etc.)
- `Help` - Hjälp och dokumentation

```javascript
// Registrera med kategori
keyboardShortcutService.register({
    key: 'b',
    ctrl: true,
    shift: true,
    description: 'Open backup',
    category: 'Actions',
    handler: () => openBackup()
});

// Hämta efter kategori
const actionShortcuts = keyboardShortcutService.getByCategory('Actions');
```

---

## ShortcutsHelpWidget

Widget som visar alla genvägar i en modal:

### Användning

```
Tryck Ctrl+?
    ↓
Modal öppnas
    ↓
Genvägar visas grupperade efter kategori
    ↓
Plattformsmedveten formatering
    ↓
Tryck Escape eller ✕ för att stänga
```

### Programmatisk kontroll

```javascript
const helpWidget = document.querySelector('shortcuts-help-widget');

// Öppna
helpWidget.open();

// Stäng
helpWidget.close();

// Toggle
helpWidget.toggle();
```

### Auto-uppdatering

Widget lyssnar automatiskt på EventBus och uppdaterar när genvägar registreras/avregistreras:

```javascript
eventBus.on('shortcut:registered', () => {
    if (helpWidget.isOpen) {
        helpWidget.renderShortcuts(); // Auto-uppdatera
    }
});
```

---

## Best Practices

### 1. Använd beskrivande kategorier

```javascript
// ✅ Bra
category: 'Todos'
category: 'Search'

// ❌ Undvik
category: 'Misc'
category: 'Other'
```

### 2. Sätt rimliga prioriteter

```javascript
// ✅ Bra - Kritisk funktion får hög prioritet
keyboardShortcutService.register({
    key: 'Escape',
    priority: 15,
    handler: closeModal
});

// ❌ Undvik - Mindre viktiga funktioner med hög prioritet
keyboardShortcutService.register({
    key: '9',
    ctrl: true,
    priority: 20,  // För högt för en länk
    handler: openLink9
});
```

### 3. Använd condition functions

```javascript
// ✅ Bra - Kontextberoende
keyboardShortcutService.register({
    key: 'Enter',
    handler: submitForm,
    condition: () => isFormActive()
});

// ❌ Undvik - Alltid aktiv kan störa
keyboardShortcutService.register({
    key: 'Enter',
    handler: submitForm
    // Triggas överallt, även när användaren skriver
});
```

### 4. Avregistrera vid cleanup

```javascript
// ✅ Bra - Spara unregister-funktionen
class MyWidget extends HTMLElement {
    connectedCallback() {
        this.unregisterShortcut = keyboardShortcutService.register({...});
    }
    
    disconnectedCallback() {
        this.unregisterShortcut();
    }
}

// ❌ Undvik - Glöm inte cleanup
class MyWidget extends HTMLElement {
    connectedCallback() {
        keyboardShortcutService.register({...});
        // Inget cleanup = memory leak
    }
}
```

---

## Migration från direkta lyssnare

### Före (direkta event listeners)

```javascript
// main.js
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        openQuickAdd();
    }
});

// quickAddWidget.js
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        this.focus();
    }
});
```

**Problem:**
- ❌ Ingen konfliktdetektering
- ❌ Ingen centraliserad översikt
- ❌ Svårt att inaktivera alla genvägar
- ❌ Ingen hjälp för användaren

### Efter (KeyboardShortcutService)

```javascript
// main.js
keyboardShortcutService.register({
    key: 'k',
    ctrl: true,
    description: 'Focus Quick Add',
    category: 'Todos',
    priority: 10,
    handler: () => {
        document.querySelector('quick-add-widget')?.focus();
    }
});
```

**Fördelar:**
- ✅ Centraliserad hantering
- ✅ Konfliktdetektering med prioritet
- ✅ Kategorigruppering
- ✅ Auto-genererad hjälp (Ctrl+?)
- ✅ Enkel enable/disable

---

## Felsökning

**Genväg fungerar inte:**
- Kontrollera att KeyboardShortcutService är importerad i main.js
- Verifiera att genvägen är registrerad: `keyboardShortcutService.getAll()`
- Kolla att `enabled: true`
- Testa condition function returnerar `true`

**Konflikt mellan genvägar:**
- Kontrollera prioriteter med `keyboardShortcutService.getAll()`
- Öka prioritet för den genväg som ska vinna
- Använd condition functions för att separera kontexter

**Genväg triggas när jag skriver:**
- KeyboardShortcutService skippar automatiskt input-fält
- Kontrollera att `_isTyping()` fungerar korrekt
- Escape är undantag och fungerar alltid

**Hjälp-modal visar inte alla genvägar:**
- Kontrollera att `shortcuts-help-widget` är registrerad i HTML
- Verifiera att widget lyssnar på EventBus
- Öppna DevTools och kolla konsolen för fel

---

## Exempel

### Registrera flera genvägar

```javascript
// Länk-genvägar (Ctrl+1-9)
for (let i = 1; i <= 9; i++) {
    keyboardShortcutService.register({
        key: String(i),
        ctrl: true,
        description: `Open link ${i}`,
        category: 'Navigation',
        priority: 5,
        handler: () => {
            const links = document.querySelectorAll('#links a');
            const link = links[i - 1];
            if (link) window.open(link.href, '_blank');
        }
    });
}
```

### Kontextberoende genvägar

```javascript
// Escape stänger olika saker beroende på kontext
keyboardShortcutService.register({
    key: 'Escape',
    description: 'Close search',
    category: 'Search',
    priority: 15,
    handler: () => closeSearch(),
    condition: () => isSearchOpen()
});

keyboardShortcutService.register({
    key: 'Escape',
    description: 'Close modal',
    category: 'General',
    priority: 15,
    handler: () => closeModal(),
    condition: () => isModalOpen()
});

keyboardShortcutService.register({
    key: 'Escape',
    description: 'Clear Quick Add',
    category: 'Todos',
    priority: 10,
    handler: () => clearQuickAdd(),
    condition: () => isQuickAddFocused()
});
```

---

## Se även

- [SEARCH_GUIDE.md](SEARCH_GUIDE.md) - Global sökning
- [QUICK_ADD_GUIDE.md](QUICK_ADD_GUIDE.md) - Quick Add parser
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Teknisk arkitektur

---

**Version:** 1.0  
**Senast uppdaterad:** 2025-11-20
