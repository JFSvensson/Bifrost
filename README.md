# Bifrost Starting Page

En modern startsida med att‑göra‑lista, sök, länkar, väder, klocka samt veckans skolmat. Byggd med TypeScript och modulär JavaScript-arkitektur, Service Worker för offline-stöd och PWA-funktionalitet.

## 🚀 Teknisk Stack

- **TypeScript** - Typ-säkerhet och förbättrad utvecklarupplevelse
- **ES6 Modules** - Modern import/export och tree-shaking
- **Web Components** - Custom elements med Shadow DOM
- **Service Worker** - Offline-stöd och intelligent cachning
- **PWA** - Installationsbar med manifest
- **Vitest** - Enhetstestning med 41+ tester
- **No Dependencies** - Vanilla implementation, inga externa bibliotek

## Funktioner

✅ **Quick Add** - Natural language parser för snabb todo-skapning (t.ex. "Möt Anna imorgon 14:00 #arbete [!high]")  
✅ **Recurring Todos** - Återkommande uppgifter med dagliga/veckovisa/månadsvisa mönster  
✅ **Reminders & Snooze** - Schemalagda påminnelser med desktop notifications och snooze-funktionalitet  
✅ **Global Search** - Multi-source sökning med fuzzy matching och Ctrl+F genväg  
✅ **Keyboard Shortcuts** - Centraliserad tangentbordshantering med konfliktdetektering  
✅ **Shortcuts Help** - Modal (Ctrl+?) som visar alla tillgängliga genvägar  
✅ **Backup & Export** - JSON export/import av all data med Ctrl+Shift+B  
✅ **Todo-lista** - Persisterande i localStorage med tangentbordsgenvägar  
✅ **Obsidian-synk** - Automatisk synkronisering med Obsidian.md vault  
✅ **Statistik Dashboard** - Spårar produktivitet, streaks, och visar grafer  
✅ **Deadline Warnings** - Smarta varningar för kommande och försenade todos med notifications  
✅ **Pomodoro Timer** - 25/5 min fokus/paus-intervaller med cirkulär progress och notifications  
✅ **Google Calendar** - Synka todos med datum till Google Calendar, visa dagens händelser  
✅ **Extern sökning** - DuckDuckGo med Ctrl+/ för fokus  
✅ **Snabblänkar** - Från JSON-fil med Ctrl+1-9 genvägar  
✅ **Väderprognos** - SMHI-data med temperatur och nederbördssannolikhet  
✅ **Klockwidget** - Aktuell tid och flera tidszoner med arbetstidsindikator  
✅ **Skolmat** - Veckans meny med dagens dag markerad  
✅ **Service Worker** - Offline-stöd och cachning  
✅ **PWA** - Kan installeras som app  
✅ **Mörkt tema** - Toggle mellan ljust/mörkt med Ctrl+Shift+D, auto-detection av systempreferens  
✅ **Responsiv design** - Fungerar på mobil och desktop  
✅ **Konfigurationsystem** - Centraliserade inställningar  
✅ **Favicon** - Nordisk regnbågsbro-tema (Bifrost mythology)  

## Arkitektur

```
Bifrost/
├── index.html              # Huvudsida med grid-layout
├── manifest.json           # PWA-manifest med nordisk regnbågs-ikon
├── package.json            # NPM dependencies och scripts
├── tsconfig.json           # TypeScript configuration
├── vitest.config.js        # Test configuration
├── jsconfig.json           # JavaScript project config (legacy)
├── LICENSE                 # MIT License
├── README.md               # This file
├── assets/
│   └── icons/
│       ├── favicon.svg              # SVG-ikon med regnbågsbro
│       ├── favicon.ico              # ICO fallback
│       ├── apple-touch-icon.png     # iOS icon
│       └── favicon-data.txt         # Generation notes
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
├── data/
│   ├── links.json          # Länkdata (skapas av användaren)
│   └── examples/
│       └── example-TODO.md # Exempel på Obsidian todo-format
├── dist/                   # 📦 Kompilerad JavaScript (genereras från src/)
│   ├── main.js             # Huvudlogik + todo-hantering
│   ├── sw.js               # Service Worker (v2 cache)
│   ├── widgetLoader.js     # Widget initialization
│   ├── config/             # Konfigurationsfiler (3 filer)
│   ├── core/               # Kärnfunktionalitet (3 filer)
│   ├── integrations/       # Externa integrationer (2 filer)
│   ├── services/           # Affärslogik services (16 filer)
│   ├── utils/              # Hjälpfunktioner (5 filer)
│   └── widgets/            # UI-komponenter (14 filer)
├── docs/
│   ├── TYPESCRIPT_MIGRATION.md      # TypeScript migration guide
│   ├── PRODUCTION_READINESS.md     # Production deployment guide
│   ├── SECURITY.md                 # Security guidelines
│   ├── architecture/
│   │   ├── ARCHITECTURE.md          # Full technical architecture
│   │   └── CONFIG.md                # Konfigurationsdokumentation
│   ├── contributing/
│   │   ├── CONTRIBUTING.md          # Contributing guidelines
│   │   └── IMPLEMENTATION_SUMMARY.md # Implementation details
│   ├── features/
│   │   ├── DEADLINE_GUIDE.md        # Deadline warnings guide
│   │   ├── POMODORO_GUIDE.md        # Pomodoro timer guide
│   │   ├── QUICK_ADD_GUIDE.md       # Quick Add parser guide
│   │   ├── RECURRING_GUIDE.md       # Recurring todos guide
│   │   ├── REMINDER_GUIDE.md        # Reminders & snooze guide
│   │   └── STATS_GUIDE.md           # Statistik-dashboard guide
│   └── guides/
│       ├── DARK_THEME.md            # Tema-guide
│       ├── FAVICON_README.md        # Favicon generation guide
│       ├── GOOGLE_CALENDAR_GUIDE.md # Google Calendar integration
│       └── OBSIDIAN_SETUP.md        # Obsidian integration guide
├── src/                    # 📝 TypeScript källkod
│   ├── main.ts             # Huvudlogik + todo-hantering
│   ├── sw.ts               # Service Worker (v2 cache)
│   ├── widgetLoader.ts     # Widget initialization
│   ├── types.d.ts          # Global type definitions
│   ├── config/
│   │   ├── config.ts       # Centraliserad konfiguration
│   │   ├── types.ts        # Type definitions
│   │   └── uiConfig.ts     # UI-initialisering
│   ├── core/
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── eventBus.ts     # Pub/sub event system
│   │   └── stateManager.ts # LocalStorage state manager
│   ├── integrations/
│   │   ├── obsidianBridge.ts # Node.js bridge för Obsidian-synk
│   │   └── proxy.ts          # CORS-proxy för skolmat (Node.js)
│   ├── services/
│   │   ├── calendarSync.ts          # Bilateral sync todos ↔ calendar
│   │   ├── clockService.ts          # Tidshantering och tidszoner
│   │   ├── deadlineService.ts       # Deadline-analys och notifications
│   │   ├── googleCalendarService.ts # Google Calendar API och OAuth
│   │   ├── keyboardShortcutService.ts # Centraliserad tangentbordshantering
│   │   ├── linkService.ts           # Länkhantering
│   │   ├── menuService.ts           # API-service för skolmat
│   │   ├── obsidianTodoService.ts   # Obsidian-synkronisering
│   │   ├── performanceMonitor.ts    # Performance monitoring
│   │   ├── pomodoroService.ts       # Pomodoro timer-logik
│   │   ├── recurringService.ts      # Recurring todos service
│   │   ├── reminderService.ts       # Reminders & snooze service
│   │   ├── searchService.ts         # Multi-source söktjänst
│   │   ├── statsService.ts          # Statistik-spårning
│   │   ├── themeService.ts          # Tema-hantering (ljust/mörkt)
│   │   └── weatherService.ts        # SMHI API-service
│   ├── utils/
│   │   ├── dateHelpers.ts           # Datumfunktioner
│   │   ├── debounce.ts              # Debounce utility
│   │   ├── logger.ts                # Logging utility
│   │   ├── naturalLanguageParser.ts # Natural language parser för Quick Add
│   │   └── sanitizer.ts             # Input sanitization
│   └── widgets/
│       ├── backupWidget.ts       # Backup & export modal
│       ├── calendarWidget.ts     # Calendar-visualisering
│       ├── clockWidget.ts        # Klockkomponent
│       ├── deadlineWidget.ts     # Deadline-visualisering
│       ├── linkWidget.ts         # Snabblänkar widget
│       ├── pomodoroWidget.ts     # Pomodoro timer-widget
│       ├── quickAddWidget.ts     # Quick Add UI-komponent
│       ├── recurringWidget.ts    # Recurring todos widget
│       ├── reminderWidget.ts     # Reminders widget
│       ├── schoolMenu.ts         # Skolmatskomponent
│       ├── searchWidget.ts       # Global sök-widget
│       ├── shortcutsHelpWidget.ts # Tangentbordsgenvägar hjälp
│       ├── statsWidget.ts        # Statistik-visualisering
│       └── weatherWidget.ts      # Väderkomponent
├── scripts/
│   ├── eslint.config.js       # ESLint configuration
│   └── generate-favicons.js   # Favicon generation utility
└── tests/
    ├── setup.js
    ├── services/
    │   ├── deadlineService.test.js
    │   ├── pomodoroService.test.js
    │   ├── recurringService.test.js
    │   └── statsService.test.js
    └── utilities/
        ├── errorHandler.test.js
        ├── eventBus.test.js
        └── stateManager.test.js
```

## Komponentöversikt

### 🕒 **Klockwidget**
- **Realtidsvisning** - Uppdateras varje sekund
- **Flera tidszoner** - Stockholm, New York, Tokyo, London
- **Arbetstidsindikator** - Visar om det är arbetstid (08-17)
- **Tidsskillnader** - +/- timmar från huvudtidszon
- **Format** - 12h/24h, med/utan sekunder

### 🌤️ **Väderwidget**
- **SMHI API** - Gratis svenska väderdata
- **Aktuellt väder** - Temperatur, luftfuktighet, vind
- **Nederbördssannolikhet** - Procentuell chans för regn
- **Timprognos** - Kommande 5 timmar
- **Offline-cache** - Senaste data tillgänglig offline

### 🍽️ **Skolmatswidget**
- **Veckovy** - Hela veckans meny
- **Dagens markering** - Aktuell dag markerad i rött
- **Automatisk uppdatering** - Hämtar ny data varje dag
- **Offline-stöd** - Cachad meny när internet saknas

### 📝 **Obsidian-integration**
- **Realtidssynk** - Automatisk synkronisering med Obsidian vault
- **Prioriteter** - Stöd för high/medium/low via `[!high]`, emoji (🔥, ⚠️)
- **Datum** - Deadlines med `@YYYY-MM-DD` format
- **Kategorier** - Tags med `#tag` format
- **Sektioner** - Organisera todos under rubriker
- **Visuell distinktion** - Obsidian vs lokala todos med olika färger
- **Auto-merge** - Kombinerar Obsidian + Bifrost todos
- **Se guide**: [OBSIDIAN_SETUP.md](docs/guides/OBSIDIAN_SETUP.md)

### ⚡ **Quick Add**
- **Natural language parsing** - Skriv "Möt Anna imorgon 14:00 #arbete [!high]"
- **Smart date extraction** - Svenskstöd (idag/imorgon/fredag), absoluta datum (YYYY-MM-DD)
- **Tag extraction** - Automatisk #tag-parsing
- **Priority detection** - [!high], [!medium], [!low] eller emoji (🔥⚠️🔽)
- **Time parsing** - HH:MM, kl. 14, 2pm format
- **Live preview** - Se parsed elements medan du skriver
- **Keyboard shortcuts** - Ctrl+K för fokus, Enter för submit
- **Suggestions** - Autocomplete för datum och prioriteter
- **Se guide**: [QUICK_ADD_GUIDE.md](docs/features/QUICK_ADD_GUIDE.md)

### 📊 **Statistik Dashboard**
- **Streaks** - Spårar dagar i rad med färdiga todos 🔥
- **7-dagars graf** - Bar chart över produktivitet
- **Veckoöversikt** - Aktivitet per veckodag
- **Top tags** - Mest använda kategorier
- **Completion rate** - Procentandel färdiga todos
- **Genomsnittstid** - Hur lång tid det tar att slutföra todos
- **Real-time uppdatering** - Statistik uppdateras live
- **Se guide**: [STATS_GUIDE.md](docs/features/STATS_GUIDE.md)

### ⚠️ **Deadline Warnings**
- **Smart kategorisering** - Försenad, idag, imorgon, denna vecka
- **Desktop notifications** - Automatiska notifications för urgenta todos
- **Toast notifications** - In-app varningar med färgkodning
- **Visuell widget** - Översikt av alla deadlines att uppmärksamma
- **Daglig sammanfattning** - Rapport vid första laddning
- **Färgkodade nivåer** - Röd (försenad), Orange (idag), Blå (imorgon)
- **Automatisk monitoring** - Kontrollerar varje minut, återställs vid midnatt
- **Se guide**: [DEADLINE_GUIDE.md](docs/features/DEADLINE_GUIDE.md)

### ⏱️ **Pomodoro Timer**
- **25/5/15 min intervaller** - Work (25 min), short break (5 min), long break (15 min)
- **Cirkulär progress** - Visuell SVG-indikator med smooth animation
- **Desktop & toast notifications** - Alerts när timer är klar
- **Session tracking** - Spårar dagens Pomodoros och fokusminuter
- **Keyboard shortcuts** - Ctrl+Shift+P (start/pause), Ctrl+Shift+R (reset)
- **Ljudnotifikationer** - Subtil beep när session är klar
- **Dark theme support** - Fullt stöd för mörkt tema
- **Se guide**: [POMODORO_GUIDE.md](docs/features/POMODORO_GUIDE.md)

### 📅 **Google Calendar Integration**
- **OAuth 2.0 autentisering** - Säker inloggning med Google-konto
- **Visa dagens händelser** - Dagens calendar events i sidebar
- **Bilateral synkronisering** - Todos med datum → Calendar events automatiskt
- **Auto-sync** - Uppdateras var 5:e minut
- **Event detaljer** - Titel, tid, beskrivning, plats, länk
- **All-day & timed events** - Stöd för båda typerna
- **Calendar widget** - Visuell display med refresh-funktion
- **Se guide**: [GOOGLE_CALENDAR_GUIDE.md](docs/guides/GOOGLE_CALENDAR_GUIDE.md)

## Snabbstart

### 1. Skapa länkar (frivilligt)
Skapa `data/links.json`:
```json
[
  { "name": "GitHub", "url": "https://github.com", "category": "Utveckling" },
  { "name": "Gmail", "url": "https://gmail.com", "category": "Mejl" },
  { "name": "Reddit", "url": "https://reddit.com", "category": "Social" }
]
```

### 2. Starta proxyn för skolmat
```bash
node dist/integrations/proxy.js
```
Proxyn kör på: http://localhost:8787/api/school-menu

### 3. (Valfritt) Starta Obsidian Bridge för todo-synk
```bash
# Ändra vault-sökväg i src/integrations/obsidianBridge.ts först
# Kompilera TypeScript med 'npm run build' sedan kör:
node dist/integrations/obsidianBridge.js
```
Bridge kör på: http://localhost:8081/obsidian/todos  
Se [OBSIDIAN_SETUP.md](docs/guides/OBSIDIAN_SETUP.md) för fullständig guide

### 4. Starta statisk server
**VS Code (rekommenderat):**
- Installera Live Server-tillägget
- Högerklicka på `index.html` → "Open with Live Server"

**Alternativt:**
```bash
# Python
python -m http.server 8000

# Node.js
npx serve
# eller
npx http-server -p 8000
```

### 5. Öppna sidan
Surfa till den port din server visar (t.ex. http://localhost:5500 eller http://localhost:8000)

## Konfiguration

Anpassa inställningar i [`src/config/config.ts`](src/config/config.ts). Se [CONFIG.md](docs/architecture/CONFIG.md) för detaljer.

**Populära anpassningar:**
```js
// Ändra användarnamn
ui: { userName: 'Ditt Namn' }

// Tema-inställningar ('auto', 'light', 'dark')
ui: { theme: 'auto' } // Följer systempreferens

// Justera todo-gränser
todos: { maxItems: 10 }

// Byta sökmotor
search: { defaultEngine: 'https://google.com/search' }

// Ändra väderplats
weather: {
    location: {
        latitude: 57.7089,
        longitude: 11.9746,
        name: 'Göteborg'
    }
}

// Anpassa klocka
clock: {
    format: '12h',           // 12h eller 24h
    showSeconds: true,       // Visa sekunder
    showMultipleTimezones: false,  // Endast lokal tid
    timezones: [
        { name: 'Stockholm', timezone: 'Europe/Stockholm' },
        { name: 'New York', timezone: 'America/New_York' }
    ]
}

// Obsidian-integration
todos: {
    obsidian: {
        enabled: true,
        bridgeUrl: 'http://localhost:8081/obsidian/todos',
        updateInterval: 30 * 1000, // 30 sekunder
        showSource: true // Visa fil-källa
    }
}
```

## Tangentbordsgenvägar

| Genväg | Funktion |
|--------|----------|
| `Ctrl + F` | Öppna global sökning |
| `Ctrl + K` | Fokusera Quick Add input |
| `Ctrl + ?` (Ctrl + Shift + /) | Visa alla tangentbordsgenvägar |
| `Ctrl + Shift + B` | Öppna backup & export |
| `Ctrl + 1-9` | Öppna snabblänk 1-9 |
| `Ctrl + /` | Fokusera extern sökning (DuckDuckGo) |
| `Ctrl + Shift + D` | Toggle mörkt/ljust tema |
| `Ctrl + Shift + P` | Start/Pause Pomodoro timer |
| `Ctrl + Shift + R` | Reset Pomodoro timer |
| `Enter` | Submit Quick Add / Lägg till todo / Välj sökresultat |
| `Escape` | Clear Quick Add / Stäng sökning / Stäng modals |
| `↑` / `↓` | Navigera i sökresultat |

## Kom igång (Development)

### Installation

```bash
# Klona projektet
git clone https://github.com/yourusername/Bifrost.git
cd Bifrost

# Installera dependencies
npm install

# Kompilera TypeScript
npm run build

# För development (watch mode)
npm run dev
```

### Tillgängliga Kommandon

```bash
# TypeScript Compilation
npm run build          # Kompilera TypeScript till JavaScript (development)
npm run build:esbuild  # Alternativ build med esbuild (development)
npm run build:prod     # Production build med minifiering och optimering
npm run dev            # Watch mode - kompilera vid ändringar (TypeScript)
npm run dev:esbuild    # Watch mode med esbuild
npm run type-check     # Type-check utan att generera filer

# Build Management
npm run clean          # Ta bort dist/ och dist-prod/ mappar
npm run clean:prod     # Ta bort endast dist-prod/
npm run preview:prod   # Bygg och förhandsgranska production build

# Testing
npm test               # Kör alla tester
npm run test:ui        # Kör tester med UI
npm run test:coverage  # Kör tester med coverage-rapport

# Code Quality
npm run lint           # Kör ESLint
npm run lint:fix       # Fixa ESLint-problem automatiskt
npm run format         # Formatera kod med Prettier
npm run format:check   # Kontrollera formatering
```

## 🔷 TypeScript Development Workflow

### Projektstruktur efter Migration
```
src/        →  TypeScript källkod (.ts filer)
dist/       →  Kompilerad JavaScript (.js filer)
index.html  →  Laddar JavaScript från dist/
```

### Development Workflow

**1. Editera TypeScript-filer i `src/`**
```bash
# Starta watch mode för automatisk kompilering
npm run dev
```

**2. TypeScript kompileras automatiskt till `dist/`**
- Källkod: `src/services/themeService.ts`
- Output: `dist/services/themeService.js`
- Source maps: `dist/services/themeService.js.map`

**3. Testa i webbläsaren**
```bash
# Starta lokal server
python -m http.server 8000
# eller
npx serve .
```

**4. Type-check innan commit**
```bash
npm run type-check
```

### TypeScript-specifika Tips

**Importera moduler:**
```typescript
// ALLTID använd .js-extension i imports (även för .ts filer)
import { ThemeService } from './services/themeService.js';
import eventBus from './core/eventBus.js';
```

**Type-säkerhet:**
```typescript
// Använd interfaces för komplex data
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// Type guards för runtime-säkerhet
function isTodo(obj: any): obj is Todo {
  return obj && typeof obj.id === 'string';
}
```

**Pragmatisk any-användning:**
```typescript
// Använd 'any' när typer är för komplexa eller externa
const stats: any = performance.getEntriesByType('navigation')[0];
```

**Promise-hantering:**
```typescript
// Explicit Promise<void> för async funktioner utan return
async function loadData(): Promise<void> {
  const data = await fetch('/api/data');
  // Inget return statement
}
```

### Felsökning

**TypeScript-kompileringsfel:**
```bash
# Se alla fel
npm run build

# Type-check utan att generera filer
npm run type-check
```

**Import-fel:**
- Använd ALLTID `.js` extension, även för `.ts` filer
- Kontrollera att filen finns i `dist/` efter kompilering

**Type-fel vid körning:**
- Kolla browser console för runtime-fel
- Använd source maps för att debug TypeScript-kod direkt

### Migration Status

✅ **100% Complete** - 0 TypeScript errors  
✅ **46 kompilerade filer** i `dist/`  
✅ **Full typ-säkerhet** för alla komponenter  
✅ **Source maps** för enkel debugging  

Se [TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md) för detaljer.

## 🚀 Production Build & Deployment

### Development vs Production Builds

Bifrost erbjuder två build-lägen optimerade för olika ändamål:

| Feature | Development (`npm run build`) | Production (`npm run build:prod`) |
|---------|------------------------------|-----------------------------------|
| **Output** | `dist/` | `dist-prod/` |
| **Minifiering** | ❌ Nej (läsbar kod) | ✅ Ja (komprimerad) |
| **Source Maps** | ✅ Ja (.js.map filer) | ❌ Nej (skyddar källkod) |
| **Tree-Shaking** | Auto | ✅ Aggressiv |
| **Console.log** | Behålls | 🗑️ Tas bort |
| **Kommentarer** | Behålls | 🗑️ Tas bort |
| **Filstorlek** | ~100% | ~30-40% |
| **Användning** | Lokal utveckling | Production deployment |

### Production Build-kommando

```bash
# Bygg för production
npm run build:prod

# Output: dist-prod/ mapp med minifierade filer
```

**Vad händer:**
1. ✅ TypeScript → JavaScript kompilering
2. ✅ Minifiering (kortare variabelnamn, ingen whitespace)
3. ✅ Tree-shaking (oanvänd kod tas bort)
4. ✅ Console.log-statements tas bort
5. ✅ Kommentarer tas bort
6. ✅ Dead code elimination

**Resultat:**
```
src/main.ts (5.2 KB)
  ↓ TypeScript compilation
  ↓ Minification
  ↓ Tree-shaking
dist-prod/main.js (1.8 KB)  📉 65% mindre!
```

### Förhandsgranska Production Build

```bash
# Bygg och starta lokal server för preview
npm run preview:prod

# Öppnar http://localhost:3000 med production-filerna
```

### Deployment till Production

**Steg 1: Bygg production-filerna**
```bash
npm run build:prod
```

**Steg 2: Uppdatera index.html**

För production, uppdatera script-taggar att peka på `dist-prod/`:

```html
<!-- Development -->
<script type="module" src="dist/main.js"></script>

<!-- Production -->
<script type="module" src="dist-prod/main.js"></script>
```

**Steg 3: Deploya till server**

Ladda upp dessa filer till din webbserver:
```
index.html          (uppdaterad med dist-prod/ paths)
dist-prod/          (minifierade JavaScript-filer)
css/                (stylesheets)
assets/             (ikoner, bilder)
manifest.json       (PWA manifest)
```

### Hosting-alternativ

**GitHub Pages:**
```bash
# Skapa gh-pages branch med production build
npm run build:prod
# Kopiera dist-prod innehåll till root
# Push till gh-pages branch
```

**Netlify/Vercel:**
```bash
# Build Command: npm run build:prod
# Publish Directory: dist-prod
```

**Egen Server (Apache/Nginx):**
```bash
# Kopiera filer till server
scp -r dist-prod/* user@server:/var/www/html/bifrost/
scp index.html user@server:/var/www/html/bifrost/
scp -r css/ assets/ manifest.json user@server:/var/www/html/bifrost/
```

### Optimeringsresultat

Med `npm run build:prod` får du:

📊 **Filstorlek-reduktion:**
- JavaScript: -60% till -70% mindre
- Total bundle: ~65% mindre än development

⚡ **Performance-förbättringar:**
- Snabbare initial laddning (mindre data att ladda ner)
- Snabbare parsing (mindre kod att tolka)
- Mindre bandbreddsanvändning

🔒 **Säkerhet:**
- Ingen källkod exponerad (inga source maps)
- Inga debug-statements (console.log borttagna)
- Svårare att reverse-engineera logik

### Rensa Build-filer

```bash
# Ta bort båda dist-mappar
npm run clean

# Ta bort endast production build
npm run clean:prod
```

### CI/CD Integration

**GitHub Actions exempel:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build:prod
      - run: npm test
      
      # Deploy dist-prod/ till hosting
```

### Starta Utvecklingsserver

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Öppna sedan `http://localhost:8000` i din webbläsare.

### TypeScript Migration

Projektet har migrerats från JavaScript till TypeScript för bättre typ-säkerhet och utvecklarupplevelse. Se [TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md) för:
- Migration roadmap
- Känd a typ-fel och fixes
- Best practices
- Troubleshooting

## Service Worker & Offline-stöd

Bifrost cachar automatiskt:
- ✅ Statiska filer (HTML, CSS, JS)
- ✅ Senaste väderdata (SMHI)
- ✅ Senaste skolmatsdata
- ✅ Länkdata och konfiguration

**Offline-funktionalitet:**
- Sidan fungerar utan internet
- Todo-lista och länkar tillgängliga
- Senaste hämtade väder- och skolmatsdata visas
- Klockan fortsätter fungera lokalt

## PWA-funktioner

- 📱 Kan installeras som app på mobil/desktop
- 🔄 Offline-stöd via Service Worker
- ⚡ Snabb laddning tack vare cachning
- 🎨 Anpassad ikon och färgtema
- 🌐 Responsiv design för alla enheter

## Layout & Design

### 💻 **Desktop (1200px+)**
```
┌─────────────────────────────────┐
│           Huvudrubrik           │
├─────────────────┬───────────────┤
│    TODO-LISTA   │    KLOCKA     │
│                 ├───────────────┤
│    SÖKFÄLT      │   LÄNKAR      │
│                 ├───────────────┤
│                 │    VÄDER      │
│                 ├───────────────┤
│                 │   SKOLMAT     │
└─────────────────┴───────────────┘
```

### 📱 **Mobil (<768px)**
```
┌─────────────────┐
│   Huvudrubrik   │
├─────────────────┤
│   TODO-LISTA    │
├─────────────────┤
│    SÖKFÄLT      │
├─────────────────┤
│     KLOCKA      │
├─────────────────┤
│     LÄNKAR      │
├─────────────────┤
│     VÄDER       │
├─────────────────┤
│    SKOLMAT      │
└─────────────────┘
```

## API

### ObsidianTodoService
```javascript
const obsidianService = new ObsidianTodoService();

// Ladda todos från Obsidian
const todos = await obsidianService.loadTodos();

// Synka med lokala todos
const merged = await obsidianService.syncWithLocal();

// Lägg till lokal todo
const newTodo = obsidianService.addLocalTodo('Min nya uppgift');

// Ta bort lokal todo
obsidianService.removeLocalTodo(todoId);

// Hämta statistik
const stats = await obsidianService.getStats();
```

### Obsidian Bridge API
```bash
# Hämta todos
GET http://localhost:8081/obsidian/todos

# Statistik
GET http://localhost:8081/obsidian/stats

# Övervakade filer
GET http://localhost:8081/obsidian/files

# Hälsokontroll
GET http://localhost:8081/health
```

### ThemeService
```typescript
import themeService from './dist/services/themeService.js';

// Byta tema
themeService.setTheme('dark'); // 'light' eller 'dark'

// Toggle tema
themeService.toggleTheme();

// Läs nuvarande tema
const theme = themeService.getTheme(); // 'light' eller 'dark'

// Lyssna på temaändringar
window.addEventListener('themechange', (e: CustomEvent) => {
    console.log('Nytt tema:', e.detail.theme);
});
```

### StatsService
```typescript
import { StatsService } from './dist/services/statsService.js';
import type { Todo } from './src/types.d.ts';

const statsService = new StatsService();

// Spåra todo-händelser
statsService.trackTodoCreated(todo);
statsService.trackTodoCompleted(todo);

// Hämta statistik
const stats = statsService.getFullStats(currentTodos);
const todayStats = statsService.getTodayStats(currentTodos);
const weeklyStats = statsService.getWeeklyStats();
const topTags = statsService.getTopTags(5);
const last7Days = statsService.getLast7DaysActivity();

// Backup & restore
const backup = statsService.exportStats();
statsService.importStats(backup);
statsService.reset(); // Återställ all statistik
```

### WeatherWidget-komponent
```javascript
const weather = document.querySelector('weather-widget');

// Uppdatera väderdata
await weather.loadWeather();

// Ändra plats
weather.weatherService.setLocation(57.7089, 11.9746, 'Göteborg');
await weather.loadWeather();

// Lyssna på events
weather.addEventListener('weatherLoaded', (e) => console.log('Loaded:', e.detail));
weather.addEventListener('weatherError', (e) => console.error('Error:', e.detail));
```

### ClockWidget-komponent
```javascript
const clock = document.querySelector('clock-widget');

// Växla mellan enkelt/multipelt läge
clock.toggleMultipleTimezones();

// Lägg till ny tidszon
clock.addTimezone('America/Los_Angeles', 'Los Angeles');

// Hämta aktuell tid för specifik tidszon
const timeData = clock.clockService.getCurrentTime('Europe/London');
console.log(timeData); // { time: '14:30', date: 'måndag 13 januari 2025', ... }
```

### SchoolMenu-komponent
```javascript
const menu = document.querySelector('school-menu');

// Uppdatera menydata
await menu.loadMenu();

// Komponenten emitterar events vid laddning/fel
menu.addEventListener('menuLoaded', (e) => console.log('Loaded:', e.detail));
menu.addEventListener('menuError', (e) => console.error('Error:', e.detail));
```

### Proxy API
```bash
# Standard meny
GET /api/school-menu

# Specifik meny-ID
GET /api/school-menu?id=MENY_ID

# Datumintervall
GET /api/school-menu?startDate=2025-01-13&endDate=2025-01-17

# Hälsokontroll
GET /health
```

### SMHI Väder API
```bash
# Väderdata för specifik plats (används automatiskt av WeatherService)
GET https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.0686/lat/59.3293/data.json

# Parametrar som används:
# t = Temperatur (°C)
# r = Relativ luftfuktighet (%)
# ws = Vindhastighet (m/s)
# pmin = Nederbörd minimum (mm/h)
# pcat = Nederbördskategori (0-6)
# Wsymb2 = Vädersymbol
```

## Felsökning

**Obsidian-synk fungerar inte:**
- Kontrollera att `node dist/integrations/obsidianBridge.js` körs
- Verifiera vault-sökväg i `src/integrations/obsidianBridge.ts`
- Kolla att TODO.md finns i vault med rätt format
- Se konsolen för sync-meddelanden
- Kontrollera att port 8081 inte är blockerad

**Todos från Obsidian visas inte:**
- Kontrollera format: `- [ ] Text` (mellanslag viktigt!)
- Verifiera att bridge är igång och tillgänglig
- Kolla `todos.obsidian.enabled: true` i src/config/config.ts
- Se Network-fliken i DevTools för API-anrop

**Väder laddas inte:**
- Kontrollera internetanslutning (SMHI API kräver internet)
- Kolla nätverksflik i DevTools för CORS-fel
- Verifiera att koordinater är korrekta i src/config/config.ts

**Klockan visar fel tid:**
- Kontrollera systemtid på datorn
- Verifiera tidszonsinställningar i src/config/config.ts
- Kolla att `Intl.DateTimeFormat` stöds i webbläsaren

**Skolmat laddas inte:**
- Kontrollera att proxyn körs: `node dist/integrations/proxy.js`
- Kolla proxyn på: http://localhost:8787/api/school-menu
- Verifiera att rätt skolmeny-ID används

**Links.json hittas inte:**
- Skapa `data/links.json` enligt exemplet ovan
- Kontrollera att statisk server körs från projektets rot

**Service Worker-problem:**
- Öppna DevTools → Application → Service Workers
- Klicka "Unregister" och ladda om sidan
- Rensa cache: DevTools → Application → Storage → Clear storage

**CORS-fel:**
- Använd en lokal server (inte file://)
- Kontrollera att proxyn är igång för skolmat

**Todo-listan sparas inte:**
- Kontrollera localStorage i DevTools
- Kolla att `todos.autoSave: true` i src/config/config.ts

**Responsiv design fungerar inte:**
- Kontrollera att viewport meta-tag finns i HTML
- Testa olika skärmstorlekar i DevTools

**Favicon visas inte:**
- Hard-refresh med Ctrl+Shift+R
- Rensa browser-cache
- Kontrollera att favicon.svg finns i rot-mappen
- Kolla manifest.json för korrekta icon-paths

## Dokumentation

- **[CONFIG.md](docs/architecture/CONFIG.md)** - Fullständig konfigurationsguide
- **[OBSIDIAN_SETUP.md](docs/guides/OBSIDIAN_SETUP.md)** - Obsidian-integration setup
- **[DARK_THEME.md](docs/guides/DARK_THEME.md)** - Guide för mörkt tema och anpassning
- **[STATS_GUIDE.md](docs/features/STATS_GUIDE.md)** - Statistik dashboard och API-referens
- **[DEADLINE_GUIDE.md](docs/features/DEADLINE_GUIDE.md)** - Deadline warnings och notifications
- **[POMODORO_GUIDE.md](docs/features/POMODORO_GUIDE.md)** - Pomodoro timer och fokusläge
- **[GOOGLE_CALENDAR_GUIDE.md](docs/guides/GOOGLE_CALENDAR_GUIDE.md)** - Google Calendar integration
- **[QUICK_ADD_GUIDE.md](docs/features/QUICK_ADD_GUIDE.md)** - Natural language parser för todos
- **[FAVICON_README.md](docs/guides/FAVICON_README.md)** - Favicon-generering och anpassning
- **[example-TODO.md](data/examples/example-TODO.md)** - Exempel på Obsidian todo-format

## Utveckling

**Lägga till nya komponenter:**
1. Skapa ny TypeScript-fil i `src/`
2. Importera i `main.ts` eller lägg till widget i `widgetLoader.ts`
3. Kompilera med `npm run build`
4. Lägg till konfiguration i `src/config/config.ts`

**Skapa ny widget:**
```typescript
// 1. Skapa service (src/services/newService.ts)
export class NewService {
    private config: any;
    
    constructor() {
        // Använd config
        import('../config/config.js').then(module => {
            this.config = module.default.newFeature;
        });
    }
    
    async fetchData(): Promise<any> {
        // Service logic
        return {};
    }
}

// 2. Skapa widget (src/widgets/newWidget.ts)
import { NewService } from '../services/newService.js';

class NewWidget extends HTMLElement {
    private service: NewService;
    private shadowRoot: ShadowRoot;
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.service = new NewService();
    }
    
    connectedCallback(): void {
        this.render();
    }
    
    render(): void {
        if (!this.shadowRoot) return;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 1rem;
                }
                /* CSS */
            </style>
            <div class="new-widget">
                <!-- HTML -->
            </div>
        `;
    }
}

customElements.define('new-widget', NewWidget);

// 3. Lägg till i HTML
<new-widget></new-widget>

// 4. Kompilera och uppdatera config.ts samt sw.ts
npm run build
```

**Anpassa befintliga komponenter:**
- **Väder**: Ändra `weatherConfig.location` i `src/config/config.ts`
- **Klocka**: Modifiera `clockConfig.timezones` eller format
- **Skolmat**: Uppdatera `DEFAULT_ID` i `src/integrations/proxy.ts`
- **Layout**: Justera CSS Grid i `css/layouts/grid.css`

**Nya konfigurationsalternativ:**
1. Lägg till i `src/config/config.ts`
2. Använd i relevanta komponenter via import
3. Dokumentera i `docs/architecture/CONFIG.md`

## Teknologi

- **Vanilla JavaScript** - ES6 modules, Web Components, Shadow DOM
- **CSS Grid & Flexbox** - Responsiv layout med mobile-first approach
- **Service Worker API** - Offline-stöd och intelligent cachning
- **Web App Manifest** - PWA-funktionalitet för installation
- **localStorage** - Persisterande data för todos och preferenser
- **Fetch API** - HTTP-anrop till SMHI, Obsidian Bridge, skolmat
- **Intl API** - Internationalisering för datum, tid och tidszoner
- **Node.js** - Proxy-server för CORS och Obsidian Bridge
- **Custom Elements** - Återanvändbara webbkomponenter
- **File System Watching** - Real-time Obsidian file monitoring

## Kodstruktur & Arkitektur

### **Modulärt uppbyggd**
- Varje komponent är självständig med egen service-lager
- Konfigurationsdriven design med centraliserad config.js
- Separation of concerns: UI, logik, data

### **ES6 Modules**
- Modern import/export syntax
- Tree-shaking för optimal bundle size
- Type="module" för native browser support

### **Web Components Pattern**
- Custom elements med Shadow DOM
- Inkapsling och återanvändbarhet
- Event-driven kommunikation

### **Service Layer Pattern**
- ThemeService - Tema-hantering och systempreferenser
- StatsService - Produktivitetsspårning och statistik
- ObsidianTodoService - Obsidian-synkronisering
- WeatherService - SMHI API-integration  
- ClockService - Tidshantering
- MenuService - Skolmats-API
- DeadlineService - Deadline-monitoring och varningar
- PomodoroService - Focus timer med sessions
- RecurringService - Pattern management och automatiskt skapande av återkommande todos
- ReminderService - Schemalagda påminnelser, snooze och desktop notifications
- GoogleCalendarService - OAuth och Calendar API
- CalendarSyncService - Bilateral todo↔calendar sync
- NaturalLanguageParser - Quick Add parsing

## Exempel: Skapa todo med Quick Add

```javascript
// Tryck Ctrl+K för att fokusera Quick Add input
// Skriv naturligt:
"Möt Anna imorgon 14:00 #arbete [!high]"

// Bifrost parsar automatiskt:
{
    text: "Möt Anna",
    dueDate: "2024-12-19", // imorgon
    dueTime: "14:00",
    tags: ["arbete"],
    priority: "high",
    source: "bifrost"
}

// Todo läggs till automatiskt och:
// ✅ Synkas till Google Calendar (om datum finns)
// ✅ Läggs till i statistik (med tag)
// ✅ Visas med deadline-varning (om nära inlämning)
// ✅ Integreras med Pomodoro-timer
```

## Exempel: Skapa återkommande todo

```javascript
// Skriv i Quick Add:
"Träna varje måndag 18:00 #gym [!medium]"

// Bifrost skapar ett mönster:
{
    text: "Träna",
    type: "weekly",
    daysOfWeek: [1], // måndag
    time: "18:00",
    tags: ["gym"],
    priority: "medium",
    nextDue: "2024-12-23 18:00"
}

// Systemet:
// ✅ Skapar automatiskt ny todo varje måndag 18:00
// ✅ När du checkar av en träning → nästa måndag skapas direkt
// ✅ Spåras i statistik (#gym-kategori)
// ✅ Integreras med Calendar (återkommande event)

// Andra exempel:
"Betala hyra varje månad den 1:a #ekonomi [!high]"
"Läsa bok varannan dag 20:00 #utveckling"
"Teammöte varje fredag 09:00 #arbete"
```

## Exempel: Påminnelser & Snooze

```javascript
// Tidsbaserad påminnelse:
"Köp mjölk påminn mig om 30min #inköp"

// Bifrost skapar:
{
    text: "Köp mjölk",
    remindAt: new Date(now + 30 * 60 * 1000),
    type: "manual"
}

// Deadline-relativ påminnelse:
"Projektredovisning 2024-12-20 14:00 påminn 1h innan [!high]"

// Bifrost skapar:
{
    text: "Projektredovisning",
    dueDate: "2024-12-20",
    dueTime: "14:00",
    reminder: {
        remindAt: "2024-12-20 13:00", // 1h innan deadline
        type: "deadline-relative"
    }
}

// När påminnelse triggas:
// ✅ Desktop notification (om tillåten)
// ✅ Fallback till in-app toast
// ✅ Todo highlightas med blink-animation
// ✅ Snooze-knapp för att skjuta upp

// Snooze-funktionalitet:
// Klicka 💤-knappen → välj preset:
// • 10 minuter
// • 30 minuter  
// • 1 timme
// • 3 timmar
// • Imorgon 09:00
// • 1 dag

// Andra exempel:
"Ring tandläkaren påminn om 1h #hälsa"
"Påminn mig imorgon 09:00 #morgonrutin"
"Standup-möte varje dag 09:00 påminn 10min innan #arbete"
```
// ✅ Monitoras för deadline warnings
// ✅ Kan kopplas till Pomodoro session
```

## Dokumentation

- [TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md) - TypeScript migration guide och roadmap
- [CONFIG.md](docs/architecture/CONFIG.md) - Fullständig konfigurationsguide
- [OBSIDIAN_SETUP.md](docs/guides/OBSIDIAN_SETUP.md) - Steg-för-steg Obsidian-integration
- [DARK_THEME.md](docs/guides/DARK_THEME.md) - Guide för mörkt tema och anpassning
- [STATS_GUIDE.md](docs/features/STATS_GUIDE.md) - Statistik dashboard och API-referens
- [DEADLINE_GUIDE.md](docs/features/DEADLINE_GUIDE.md) - Deadline warnings och notifications
- [POMODORO_GUIDE.md](docs/features/POMODORO_GUIDE.md) - Pomodoro timer och fokusläge
- [GOOGLE_CALENDAR_GUIDE.md](docs/guides/GOOGLE_CALENDAR_GUIDE.md) - Google Calendar integration
- [QUICK_ADD_GUIDE.md](docs/features/QUICK_ADD_GUIDE.md) - Natural language parser för todos
- [RECURRING_GUIDE.md](docs/features/RECURRING_GUIDE.md) - Återkommande uppgifter och automatisering
- [REMINDER_GUIDE.md](docs/features/REMINDER_GUIDE.md) - Påminnelser, snooze och notifications
- [FAVICON_README.md](docs/guides/FAVICON_README.md) - Skapa och anpassa favicon
- [example-TODO.md](data/examples/example-TODO.md) - Exempel på Obsidian todo-format

## Prestandaoptimering

- **Lazy loading** - Komponenter laddas endast när de behövs
- **Cache-first** - Service Worker prioriterar cache för snabbhet
- **Minimal dependencies** - Inga externa bibliotek, bara vanilla JS
- **Komprimerade assets** - Optimerade bilder och minifierad kod
- **Responsive images** - Anpassade för olika skärmstorlekar
- **Efficient updates** - Endast nödvändiga DOM-uppdateringar

## Licens

MIT License - se [LICENSE](LICENSE) för detaljer.
