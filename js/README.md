# Modulära Komponenter

Denna mapp innehåller de modulära JavaScript-komponenterna för Bifrost-projektet.

## Filstruktur

```
js/
├── config/
│   ├── config.js             # Centraliserad konfiguration
│   ├── types.js              # Type definitions
│   └── uiConfig.js           # UI-konfiguration
├── core/
│   ├── errorHandler.js       # Global felhantering
│   ├── eventBus.js           # Pub/sub event system
│   └── stateManager.js       # State management med localStorage
├── services/
│   ├── calendarSync.js       # Bilateral sync todos ↔ calendar
│   ├── clockService.js       # Tidshantering och tidszoner
│   ├── deadlineService.js    # Deadline-analys och notifications
│   ├── googleCalendarService.js # Google Calendar API och OAuth
│   ├── keyboardShortcutService.js # Centraliserad tangentbordshantering
│   ├── linkService.js        # Länkhantering
│   ├── menuService.js        # API-service för skolmat
│   ├── obsidianTodoService.js # Obsidian-synkronisering
│   ├── pomodoroService.js    # Pomodoro timer-logik
│   ├── recurringService.js   # Recurring todos service
│   ├── reminderService.js    # Reminders & snooze service
│   ├── searchService.js      # Multi-source sök med fuzzy matching
│   ├── statsService.js       # Statistik-spårning
│   ├── themeService.js       # Tema-hantering
│   └── weatherService.js     # SMHI API-service
├── widgets/
│   ├── backupWidget.js       # Export/Import funktionalitet
│   ├── calendarWidget.js     # Calendar-visualisering
│   ├── clockWidget.js        # Klockkomponent
│   ├── deadlineWidget.js     # Deadline-visualisering
│   ├── linkWidget.js         # Snabblänkar widget
│   ├── pomodoroWidget.js     # Pomodoro timer-widget
│   ├── quickAddWidget.js     # Quick Add UI-komponent
│   ├── recurringWidget.js    # Recurring todos widget
│   ├── reminderWidget.js     # Reminders widget
│   ├── schoolMenu.js         # Skolmatskomponent
│   ├── searchWidget.js       # Global sök-widget
│   ├── shortcutsHelpWidget.js # Tangentbordsgenvägar hjälp
│   ├── statsWidget.js        # Statistik-visualisering
│   └── weatherWidget.js      # Väderkomponent
├── utils/
│   ├── dateHelpers.js        # Datumfunktioner
│   ├── debounce.js           # Debounce utility
│   ├── naturalLanguageParser.js # Natural language parser
│   └── sanitizer.js          # HTML sanitization
├── integrations/
│   ├── obsidianBridge.js     # Obsidian vault bridge
│   └── proxy.js              # CORS proxy-server
├── main.js                   # Huvudapplikation
├── widgetLoader.js           # Lazy loading system
└── sw.js                     # Service Worker
```

## Tjänster

### KeyboardShortcutService
- Centraliserad tangentbordshantering
- Konfliktdetektering med prioritetssystem
- Kategorigruppering av genvägar
- Plattformsmedveten formatering (Mac/Windows)
- Input field-detektering för att undvika interferens

### SearchService
- Multi-source indexering (todos, länkar, deadlines, påminnelser, återkommande)
- Fuzzy matching med konfigurerbar threshold
- Realtidsuppdateringar via EventBus
- Smart ranking (exakt → starts with → contains → fuzzy)
- Highlight-extraktion för UI-rendering

### RecurringService
- Mönsterhantering för återkommande uppgifter
- Dagliga/veckovisa/månadsvisa intervaller
- Automatiskt skapande av nya todos
- Cron-liknande schemaläggning

### ReminderService
- Schemalagda påminnelser
- Snooze-funktionalitet (10min - 1 dag)
- Desktop notifications med fallback
- Deadline-relativa påminnelser

### DeadlineService
- Smart deadline-kategorisering
- Automatisk monitoring varje minut
- Desktop och toast notifications
- Färgkodade varningsnivåer

### PomodoroService
- 25/5/15 min fokus/paus-intervaller
- Session-spårning
- Ljudnotifikationer
- Keyboard shortcuts (Ctrl+Shift+P/R)

## Widgets

### SearchWidget
- Expanderande card med sökfält
- Max-höjd 400px med scroll
- Tangentbordsnavigering (↑↓ Enter Escape)
- Realtidsuppdatering av resultat
- Ctrl+F genväg för att öppna

### BackupWidget
- Export/Import av all appdata
- JSON-nedladdning med timestamp
- Modal UI med statistik
- Ctrl+Shift+B genväg
- Sidfots-knapp för enkel åtkomst

### ShortcutsHelpWidget
- Modal som visar alla registrerade genvägar
- Grupperade efter kategori
- Plattformsmedveten formatering (⌘/Ctrl)
- Ctrl+? (Ctrl+Shift+/) genväg
- Auto-uppdatering vid nya registreringar

### QuickAddWidget
- Natural language parsing
- Smart datum- och tidsextraktion
- Tag och prioritetsdetektering
- Live preview
- Ctrl+K genväg

### StatsWidget
- Produktivitetsspårning
- Streaks och completion rate
- 7-dagars aktivitetsgraf
- Top tags-visualisering

## Utilities

### DateUtils
- Datumberäkningar och formatering
- Svenskt språkstöd
- Dagens-matchning
- Veckonummerberäkning

### DomUtils
- DOM-manipulation och säkerhet
- HTML-escaping
- Element creation helpers
- Animation och visibility utilities

## Stilar

### schoolMenu.css.js
- CSS-in-JS för SchoolMenu-komponenten
- Responsiv design
- Accessibility-stöd (high contrast, reduced motion)
- Print-stilar

## Användning

```html
<!-- I index.html -->
<script type="module" src="js/components/SchoolMenu.js" defer></script>

<!-- I HTML body -->
<school-menu></school-menu>
```

## API

### SchoolMenu Public Methods
```javascript
const menu = document.querySelector('school-menu');

// Uppdatera menydata
await menu.refresh();

// Hämta aktuell menydata
const data = menu.getMenuData();

// Kontrollera service-hälsa
const isHealthy = await menu.getHealthStatus();
```

### Events
```javascript
menu.addEventListener('menuLoaded', (event) => {
    console.log('Menu loaded:', event.detail);
});

menu.addEventListener('menuError', (event) => {
    console.error('Menu error:', event.detail);
});
```

## Fördelar med denna struktur

1. **Separation of Concerns** - Varje fil har ett specifikt ansvar
2. **Testbarhet** - Små, isolerade moduler är lätta att testa
3. **Återanvändbarhet** - BaseComponent kan användas för andra komponenter
4. **Underhållbarhet** - Tydlig struktur gör koden lättare att förstå
5. **Skalbarhet** - Enkelt att lägga till nya komponenter
6. **Modern JavaScript** - ES6 modules, klasser och moderna API:er