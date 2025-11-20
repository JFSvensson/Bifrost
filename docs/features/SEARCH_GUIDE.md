# Global Search Guide

En omfattande guide för Bifrosts globala sökfunktionalitet med multi-source indexering och fuzzy matching.

## Översikt

Global Search tillhandahåller snabb sökning över alla data i applikationen:
- **Todos** (aktiva och färdiga)
- **Länkar** (snabblänkar)
- **Återkommande uppgifter**
- **Deadlines**
- **Påminnelser**

### Nyckeltal

- **Ctrl+F** för att öppna sökning
- **Realtidsindexering** via EventBus
- **Fuzzy matching** med konfigurerbar threshold
- **Max 400px höjd** med scroll vid många resultat
- **Tangentbordsnavigering** (↑↓ Enter Escape)

---

## Snabbstart

### Öppna sökning

```
Tryck Ctrl+F
    ↓
Skriv sökterm
    ↓
Se resultat i realtid
    ↓
Navigera med ↑↓
    ↓
Välj med Enter
```

### Exempel

```
Sökterm: "möte"
    ↓
Resultat:
  ✓ Möt Anna (Todo)
  🔗 Teams-möte länk (Länk)
  ⏰ Projektmöte fredag (Deadline)
  🔔 Påminn om möte (Påminnelse)
```

---

## Funktioner

### 1. Multi-Source Sökning

SearchService indexerar 5 datakällor:

| Källa | Ikon | Innehåll |
|-------|------|----------|
| **Tasks** | ✓ | Todos från Obsidian och lokala |
| **Links** | 🔗 | Snabblänkar från links.json |
| **Recurring Tasks** | 🔄 | Återkommande uppgifter |
| **Deadlines** | ⏰ | Todos med deadlines |
| **Reminders** | 🔔 | Aktiva påminnelser |

### 2. Smart Ranking

Resultat rankas efter relevans:

1. **Exakt matchning i titel** → 1000 poäng
2. **Börjar med sökterm** → 900 poäng
3. **Innehåller i titel** → 800 poäng
4. **Exakt matchning i tags** → 700 poäng
5. **Innehåller i tags** → 600 poäng
6. **Innehåller i innehåll** → 500 poäng
7. **Fuzzy match** → 0-400 poäng

### 3. Fuzzy Matching

Hittar resultat även med felstavningar eller ofullständig text:

```javascript
// Sökning: "prjkt"
// Hittar: "Projekt"

// Sökning: "gym"
// Hittar: "Gympa", "Gympakort", "Gym pass"
```

**Konfigurerbar threshold:**
- `0.4` (default) - Balanserad precision
- Lägre värde = striktare matchning
- Högre värde = fler resultat

### 4. Highlight

Söktermer markeras i resultaten:

```html
Sökning: "köp"
Resultat: <mark>Köp</mark> mjölk
```

### 5. Metadata

Visa relevant metadata per typ:

- **Todo**: Status (Aktiv/Klar)
- **Deadline**: Datum (YYYY-MM-DD)
- **Reminder**: Tid (YYYY-MM-DD HH:MM)
- **Recurring**: Schema (varje måndag, etc.)
- **Link**: URL

---

## Användning

### Tangentbordsgenvägar

| Genväg | Funktion |
|--------|----------|
| `Ctrl + F` | Öppna sökning |
| `↑` | Föregående resultat |
| `↓` | Nästa resultat |
| `Enter` | Välj markerat resultat |
| `Escape` | Stäng sökning |
| `✕ (knapp)` | Rensa sökning |

### Sök-interface

```
┌─────────────────────────────────┐
│  [Sökfält]  [✕]                │
│  💡 Ctrl+F, ↑↓, Enter, Esc     │
├─────────────────────────────────┤
│  [Resultat 1] ← Selected        │
│  [Resultat 2]                   │
│  [Resultat 3]                   │
│  ...                            │
│  [Scroll vid >10 resultat]     │
└─────────────────────────────────┘
```

### Expanderat läge

Widget expanderar automatiskt när:
1. Du skriver i sökfältet
2. Det finns resultat att visa

Widget kollapsar när:
1. Sökfältet är tomt
2. Du trycker Escape
3. Du väljer ett resultat

---

## API

### SearchService

```javascript
import { searchService } from './services/searchService.js';

// Utför sökning
const results = searchService.search('projekt', {
    sources: ['todos', 'deadlines'], // Valfritt: begränsa källor
    limit: 20,                        // Max antal resultat
    fuzzy: true,                      // Aktivera fuzzy matching
    threshold: 0.4                    // Fuzzy threshold
});

// Resultatstruktur
[
    {
        id: '123',
        title: 'Projektredovisning',
        content: 'Projektredovisning fredag',
        type: 'deadline',
        source: 'Deadlines',
        sourceId: 'deadlines',
        sourceIcon: '⏰',
        score: 900,
        highlights: [
            { start: 0, end: 7, text: 'Projekt' }
        ],
        dueDate: '2025-11-25',
        metadata: { /* Original data */ }
    }
]

// Hämta statistik
const stats = searchService.getStats();
// {
//     totalItems: 42,
//     lastUpdate: Date,
//     sources: {
//         todos: { name: 'Tasks', count: 15 },
//         links: { name: 'Links', count: 10 },
//         ...
//     }
// }

// Rebuilda index manuellt (sker automatiskt vid data-ändringar)
searchService.rebuildIndex();

// Uppdatera specifik källa
searchService.updateIndex('todos');
```

### SearchWidget

```javascript
const searchWidget = document.querySelector('search-widget');

// Öppna och fokusera
searchWidget.expand();
searchWidget.focusInput();

// Stäng
searchWidget.collapse();

// Rensa sökning
searchWidget.clearSearch();

// Events
searchWidget.addEventListener('result-selected', (e) => {
    console.log('Selected:', e.detail);
});
```

---

## Integration med andra widgets

### När du väljer ett resultat:

**Links:**
```javascript
// Öppnar länken i ny flik
window.open(result.url, '_blank');
```

**Todos, Deadlines, Recurring, Reminders:**
```javascript
// 1. Emitterar event
eventBus.emit('todo:selected', result.metadata);

// 2. Scrollar till widget
const widget = document.querySelector('deadline-widget');
widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

---

## Realtidsuppdatering

SearchService lyssnar på EventBus för att hålla index uppdaterat:

```javascript
// Todo-events
eventBus.on('todo:created', () => updateIndex('todos'));
eventBus.on('todo:updated', () => updateIndex('todos'));
eventBus.on('todo:deleted', () => updateIndex('todos'));

// Link-events
eventBus.on('links:added', () => updateIndex('links'));
eventBus.on('links:updated', () => updateIndex('links'));

// Recurring-events
eventBus.on('recurring:created', () => updateIndex('recurring'));

// Deadline-events
eventBus.on('deadline:created', () => updateIndex('deadlines'));

// Reminder-events
eventBus.on('reminder:created', () => updateIndex('reminders'));
```

---

## Anpassning

### Lägg till ny datakälla

```javascript
// I searchService.js
searchService.registerSource({
    id: 'notes',
    name: 'Anteckningar',
    icon: '📝',
    fetch: () => {
        const notes = stateManager.get('notes', []);
        return notes.map(note => ({
            id: note.id,
            title: note.title,
            content: note.body,
            type: 'note',
            metadata: { ...note }
        }));
    }
});
```

### Anpassa fuzzy threshold

```javascript
// I searchWidget.js eller vid API-anrop
const results = searchService.search(query, {
    fuzzy: true,
    threshold: 0.3  // Striktare (färre resultat)
});
```

### Justera max resultat

```javascript
const results = searchService.search(query, {
    limit: 50  // Visa fler resultat
});
```

---

## Styling

### CSS-variabler

SearchWidget använder CSS-variabler för teman:

```css
:host {
    --card-background: #fff;
    --border-color: #ddd;
    --input-background: #fff;
    --text-color: #333;
    --text-muted: #666;
    --accent-color: #3498db;
    --hover-background: #f5f5f5;
    --highlight-background: #fff3cd;
}
```

### Dark theme

Dark theme stöds automatiskt via CSS-variabler från `body.dark-theme`.

---

## Prestandaoptimering

### Debouncing

Sökning är debouncad med 300ms för att undvika onödiga anrop:

```javascript
this.debouncedSearch = debounce((query) => {
    this.performSearch(query);
}, 300);
```

### Max höjd med scroll

Resultatområdet har max-höjd 400px och scrollbar vid många resultat för att undvika att sidan växer okontrollerat.

### Lazy indexing

Index byggs endast när data ändras, inte vid varje sökning.

---

## Felsökning

**Inga resultat visas:**
- Kontrollera att data finns i respektive källa
- Verifiera att searchService är importerad i main.js
- Kolla konsolen för fel

**Fuzzy matching hittar för mycket:**
- Sänk threshold-värdet (t.ex. 0.3 istället för 0.4)
- Inaktivera fuzzy: `fuzzy: false`

**Widget expanderar inte:**
- Kontrollera att `isExpanded` sätts till true
- Verifiera CSS-klass `.expanded` appliceras
- Kolla att resultat finns (`results.length > 0`)

**Tangentbordsnavigering fungerar inte:**
- Kontrollera att `keydown`-lyssnare är registrerad på input
- Verifiera att `selectedIndex` uppdateras korrekt
- Kolla att `.selected`-klass appliceras

---

## Exempel

### Grundläggande sökning

```javascript
// Användaren trycker Ctrl+F
keyboardShortcutService.register({
    key: 'f',
    ctrl: true,
    handler: () => {
        searchWidget.expand();
        searchWidget.focusInput();
    }
});

// Användaren skriver "gym"
searchWidget.performSearch('gym');

// Resultat:
// ✓ Träna på gym (Todo)
// 🔄 Träna varje måndag #gym (Recurring)
// 🔗 Gym hemsida (Link)
```

### Programmatisk sökning

```javascript
// Sök efter alla todos med hög prioritet
const results = searchService.search('high priority', {
    sources: ['todos'],
    limit: 10
});

// Visa första resultatet
if (results.length > 0) {
    const todo = results[0];
    console.log(`Hittade: ${todo.title} (${todo.score} poäng)`);
}
```

---

## Best Practices

1. **Använd Ctrl+F** för snabb åtkomst
2. **Navigera med tangentbordet** för effektivitet
3. **Fuzzy matching** för flexibilitet
4. **Rensa sökning** (✕) istället för att radera manuellt
5. **Välj resultat** med Enter istället för mus

---

## Se även

- [KEYBOARD_SHORTCUTS_GUIDE.md](KEYBOARD_SHORTCUTS_GUIDE.md) - Tangentbordsgenvägar
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Teknisk arkitektur
- [CONFIG.md](../architecture/CONFIG.md) - Konfiguration

---

**Version:** 1.0  
**Senast uppdaterad:** 2025-11-20
