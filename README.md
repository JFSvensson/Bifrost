# Bifrost Starting Page

En modern startsida med att‑göra‑lista, sök, länkar samt veckans skolmat. Byggd med modulär JavaScript, Service Worker för offline-stöd och PWA-funktionalitet.

## Funktioner

✅ **Todo-lista** - Persisterande i localStorage med tangentbordsgenvägar  
✅ **Snabbsök** - DuckDuckGo med Ctrl+/ för fokus  
✅ **Snabblänkar** - Från JSON-fil med Ctrl+1-9 genvägar  
✅ **Skolmat** - Veckans meny med dagens dag markerad  
✅ **Service Worker** - Offline-stöd och cachning  
✅ **PWA** - Kan installeras som app  
✅ **Responsiv design** - Fungerar på mobil och desktop  
✅ **Konfigurationsystem** - Centraliserade inställningar  

## Arkitektur

```
Bifrost/
├── index.html              # Huvudsida
├── manifest.json           # PWA-manifest
├── css/styles.css          # Responsiva stilar
├── js/
│   ├── main.js            # Huvudlogik + Service Worker
│   ├── config.js          # Centraliserad konfiguration
│   ├── uiConfig.js        # UI-initialisering
│   ├── linkHandler.js     # Länkhantering
│   ├── schoolMenu.js      # Skolmatskomponent
│   ├── menuService.js     # API-service för skolmat
│   ├── dateHelpers.js     # Datumfunktioner
│   ├── sw.js             # Service Worker
│   └── proxy.js          # CORS-proxy för skolmat
└── data/
    └── links.json        # Länkdata (skapas av användaren)
```

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

### 3. Starta statisk server
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

### 4. Öppna sidan
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
- ✅ Senaste skolmatsdata
- ✅ Länkdata

**Offline-funktionalitet:**
- Sidan fungerar utan internet
- Todo-lista och länkar tillgängliga
- Senaste hämtade skolmat visas

## PWA-funktioner

- 📱 Kan installeras som app på mobil/desktop
- 🔄 Offline-stöd via Service Worker
- ⚡ Snabb laddning tack vare cachning
- 🎨 Anpassad ikon och färgtema

## API

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

## Felsökning

**Skolmat laddas inte:**
- Kontrollera att proxyn körs: `node js/proxy.js`
- Kolla proxyn på: http://localhost:8787/api/school-menu

**Links.json hittas inte:**
- Skapa `data/links.json` enligt exemplet ovan
- Kontrollera att statisk server körs från projektets rot

**Service Worker-problem:**
- Öppna DevTools → Application → Service Workers
- Klicka "Unregister" och ladda om sidan

**CORS-fel:**
- Använd en lokal server (inte file://)
- Kontrollera att proxyn är igång

**Todo-listan sparas inte:**
- Kontrollera localStorage i DevTools
- Kolla att `todos.autoSave: true` i config.js

## Utveckling

**Lägga till nya komponenter:**
1. Skapa ny ES6-modul i `js/`
2. Importera i `main.js` eller `index.html`
3. Uppdatera Service Worker's `STATIC_ASSETS`

**Ändra skolmats-API:**
1. Uppdatera `DEFAULT_ID` i `proxy.js`
2. Eventuellt anpassa parsing i `transformToSimpleModel()`

**Nya konfigurationsalternativ:**
1. Lägg till i `config.js`
2. Använd i relevanta komponenter
3. Dokumentera i `CONFIG.md`

## Teknologi

- **Vanilla JavaScript** - ES6 modules, Web Components
- **CSS Grid & Flexbox** - Responsiv layout
- **Service Worker API** - Offline-stöd och cachning
- **Web App Manifest** - PWA-funktionalitet
- **localStorage** - Persisterande data
- **Fetch API** - HTTP-anrop
- **Node.js** - Proxy-server

## Licens

MIT License - se [LICENSE](LICENSE) för detaljer.

---

**Bifrost** - En bro till webben 🌉
