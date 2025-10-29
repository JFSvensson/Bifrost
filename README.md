# Bifrost Starting Page

En modern startsida med att‑göra‑lista, sök, länkar, väder, klocka samt veckans skolmat. Byggd med modulär JavaScript, Service Worker för offline-stöd och PWA-funktionalitet.

## Funktioner

✅ **Todo-lista** - Persisterande i localStorage med tangentbordsgenvägar  
✅ **Obsidian-synk** - Automatisk synkronisering med Obsidian.md vault  
✅ **Snabbsök** - DuckDuckGo med Ctrl+/ för fokus  
✅ **Snabblänkar** - Från JSON-fil med Ctrl+1-9 genvägar  
✅ **Väderprognos** - SMHI-data med temperatur och nederbördssannolikhet  
✅ **Klockwidget** - Aktuell tid och flera tidszoner med arbetstidsindikator  
✅ **Skolmat** - Veckans meny med dagens dag markerad  
✅ **Service Worker** - Offline-stöd och cachning  
✅ **PWA** - Kan installeras som app  
✅ **Responsiv design** - Fungerar på mobil och desktop  
✅ **Konfigurationsystem** - Centraliserade inställningar  
✅ **Favicon** - Nordisk regnbågsbro-tema (Bifrost mythology)  

## Arkitektur

```
Bifrost/
├── index.html              # Huvudsida med grid-layout
├── manifest.json           # PWA-manifest med nordisk regnbågs-ikon
├── favicon.svg             # SVG-ikon med regnbågsbro
├── obsidianBridge.js       # Node.js bridge för Obsidian-synk
├── example-TODO.md         # Exempel på Obsidian todo-format
├── OBSIDIAN_SETUP.md       # Guide för Obsidian-integration
├── FAVICON_README.md       # Guide för favicon-generering
├── CONFIG.md               # Konfigurationsdokumentation
├── css/styles.css          # Responsiva stilar med CSS Grid
├── js/
│   ├── main.js            # Huvudlogik + todo-hantering
│   ├── config.js          # Centraliserad konfiguration
│   ├── uiConfig.js        # UI-initialisering
│   ├── linkHandler.js     # Länkhantering
│   ├── schoolMenu.js      # Skolmatskomponent
│   ├── menuService.js     # API-service för skolmat
│   ├── dateHelpers.js     # Datumfunktioner
│   ├── weatherWidget.js   # Väderkomponent
│   ├── weatherService.js  # SMHI API-service
│   ├── clockWidget.js     # Klockkomponent
│   ├── clockService.js    # Tidshantering och tidszoner
│   ├── obsidianTodoService.js  # Obsidian-synkronisering
│   ├── sw.js             # Service Worker
│   └── proxy.js          # CORS-proxy för skolmat
└── data/
    └── links.json        # Länkdata (skapas av användaren)
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
- **Se guide**: [OBSIDIAN_SETUP.md](OBSIDIAN_SETUP.md)

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
node js/proxy.js
```
Proxyn kör på: http://localhost:8787/api/school-menu

### 3. (Valfritt) Starta Obsidian Bridge för todo-synk
```bash
# Ändra vault-sökväg i obsidianBridge.js först
node obsidianBridge.js
```
Bridge kör på: http://localhost:8081/obsidian/todos  
Se [OBSIDIAN_SETUP.md](OBSIDIAN_SETUP.md) för fullständig guide

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

Anpassa inställningar i [`js/config.js`](js/config.js). Se [CONFIG.md](CONFIG.md) för detaljer.

**Populära anpassningar:**
```js
// Ändra användarnamn
ui: { userName: 'Ditt Namn' }

// Aktivera mörkt tema
ui: { theme: 'dark' }

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
| `Ctrl + 1-9` | Öppna snabblänk 1-9 |
| `Ctrl + /` | Fokusera sökfältet |
| `Enter` | Lägg till todo (i todo-input) |

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
- Kontrollera att `node obsidianBridge.js` körs
- Verifiera vault-sökväg i `obsidianBridge.js`
- Kolla att TODO.md finns i vault med rätt format
- Se konsolen för sync-meddelanden
- Kontrollera att port 8081 inte är blockerad

**Todos från Obsidian visas inte:**
- Kontrollera format: `- [ ] Text` (mellanslag viktigt!)
- Verifiera att bridge är igång och tillgänglig
- Kolla `todos.obsidian.enabled: true` i config.js
- Se Network-fliken i DevTools för API-anrop

**Väder laddas inte:**
- Kontrollera internetanslutning (SMHI API kräver internet)
- Kolla nätverksflik i DevTools för CORS-fel
- Verifiera att koordinater är korrekta i config.js

**Klockan visar fel tid:**
- Kontrollera systemtid på datorn
- Verifiera tidszonsinställningar i config.js
- Kolla att `Intl.DateTimeFormat` stöds i webbläsaren

**Skolmat laddas inte:**
- Kontrollera att proxyn körs: `node js/proxy.js`
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
- Kolla att `todos.autoSave: true` i config.js

**Responsiv design fungerar inte:**
- Kontrollera att viewport meta-tag finns i HTML
- Testa olika skärmstorlekar i DevTools

**Favicon visas inte:**
- Hard-refresh med Ctrl+Shift+R
- Rensa browser-cache
- Kontrollera att favicon.svg finns i rot-mappen
- Kolla manifest.json för korrekta icon-paths

## Dokumentation

- **[CONFIG.md](CONFIG.md)** - Fullständig konfigurationsguide
- **[OBSIDIAN_SETUP.md](OBSIDIAN_SETUP.md)** - Obsidian-integration setup
- **[FAVICON_README.md](FAVICON_README.md)** - Favicon-generering och anpassning
- **[example-TODO.md](example-TODO.md)** - Exempel på Obsidian todo-format

## Utveckling

**Lägga till nya komponenter:**
1. Skapa ny ES6-modul i `js/`
2. Importera i `main.js` eller `index.html`
3. Uppdatera Service Worker's `STATIC_ASSETS`
4. Lägg till konfiguration i `config.js`

**Skapa ny widget:**
```javascript
// 1. Skapa service (js/newService.js)
export class NewService {
    constructor() {
        // Använd config
    }
}

// 2. Skapa widget (js/newWidget.js)
import { NewService } from './newService.js';
import { newConfig } from './config.js';

class NewWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.service = new NewService();
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>/* CSS */</style>
            <div>/* HTML */</div>
        `;
    }
}

customElements.define('new-widget', NewWidget);

// 3. Lägg till i HTML
<new-widget></new-widget>

// 4. Uppdatera config.js och sw.js
```

**Anpassa befintliga komponenter:**
- **Väder**: Ändra `weatherConfig.location` eller lägg till nya parametrar
- **Klocka**: Modifiera `clockConfig.timezones` eller format
- **Skolmat**: Uppdatera `DEFAULT_ID` i `proxy.js`
- **Layout**: Justera CSS Grid i `styles.css`

**Nya konfigurationsalternativ:**
1. Lägg till i `config.js`
2. Använd i relevanta komponenter via import
3. Dokumentera i `CONFIG.md`

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
- ObsidianTodoService - Obsidian-synkronisering
- WeatherService - SMHI API-integration  
- ClockService - Tidshantering
- MenuService - Skolmats-API

## Prestandaoptimering

- **Lazy loading** - Komponenter laddas endast när de behövs
- **Cache-first** - Service Worker prioriterar cache för snabbhet
- **Minimal dependencies** - Inga externa bibliotek, bara vanilla JS
- **Komprimerade assets** - Optimerade bilder och minifierad kod
- **Responsive images** - Anpassade för olika skärmstorlekar
- **Efficient updates** - Endast nödvändiga DOM-uppdateringar

## Licens

MIT License - se [LICENSE](LICENSE) för detaljer.
