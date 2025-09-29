# Bifrost Starting Page

En enkel startsida med att‑göra‑lista, sök, länkar samt veckans skolmat.

- HTML: [ind- CORS-fel eller "Unexpected content-type":
  - Använd proxyns URL i [`SchoolMenuService`](js/components/SchoolMenuService.js) och säkerställ att proxyn kör..html](index.html)
- CSS: [css/styles.css](css/styles.css)
- JS: Modulär struktur i [`js/`](js/) mappen (se [js/README.md](js/README.md))
- Proxy: [js/proxy.js](js/proxy.js)

## Funktioner

- ToDo-lista
- Sök (DuckDuckGo)
- Länkar (från `data/links.json`)
- Skolmat/veckomeny via Matilda Platform, renderad av modulära webbkomponenter

## Arkitektur

Projektet använder en modulär JavaScript-arkitektur:

```
js/
├── components/          # Webbkomponenter
│   ├── BaseComponent.js      # Basklass för komponenter
│   ├── SchoolMenu.js         # Skolmatsmeny-komponent  
│   └── SchoolMenuService.js  # API-service
├── utils/              # Hjälpfunktioner
│   ├── dateUtils.js         # Datumhantering
│   └── domUtils.js          # DOM-manipulation
├── styles/             # CSS-in-JS stilar
│   └── schoolMenu.css.js    # Komponentstilar
├── linkHandler.js      # Länkhanterare
├── main.js            # Huvudfil
└── proxy.js           # CORS-proxy server
```

Se [js/README.md](js/README.md) för detaljerad dokumentation.

## Snabbstart

1) Skapa länkar (frivilligt men rekommenderas)
- Skapa filen `data/links.json` (mappen är ignorerad i `.gitignore`).
```json
[
  { "name": "Name of link", "url": "https://www.example.com" },
  { "name": "Name of link 2", "url": "https://www.example.com" }
]
```

2) Starta proxyn för skolmaten
- Krav: Node.js 18+
```bash
node js/proxy.js
```
- Proxyn kör på: http://localhost:8787/api/school-menu

3) Starta en lokal statisk server (välj ett sätt)
- VS Code Live Server: högerklicka [index.html](index.html) → “Open with Live Server”
- Python:
```bash
python -m http.server 8000
```
- Node (npx):
```bash
npx serve
# eller
npx http-server -p 8000
```

4) Öppna sidan
- Surfa till den port din statiska server visar (t.ex. http://localhost:8000).
- Se till att proxyn (steg 2) fortfarande kör.

## Hur det funkar

- **Länkar**: [`js/linkHandler.js`](js/linkHandler.js) hämtar `./data/links.json` och bygger listan i elementet med id `links`.
- **Skolmat**: Modulär [`SchoolMenu`](js/components/SchoolMenu.js) komponent hämtar JSON från proxyn och renderar veckans dagar med dagens dag markerad i rött.
- **Proxy**: [`js/proxy.js`](js/proxy.js) hämtar Matilda-sidan, plockar ut `__NEXT_DATA__` och transformerar till enkelt JSON-format.
- **Service**: [`SchoolMenuService`](js/components/SchoolMenuService.js) hanterar API-anrop, caching och validering.
- **Utils**: Hjälpfunktioner för datum ([`dateUtils.js`](js/utils/dateUtils.js)) och DOM ([`domUtils.js`](js/utils/domUtils.js)).

## API

Komponenten erbjuder ett publikt API:

```javascript
const menu = document.querySelector('school-menu');

// Uppdatera menydata
await menu.refresh();

// Hämta aktuell menydata  
const data = menu.getMenuData();

// Kontrollera service-hälsa
const isHealthy = await menu.getHealthStatus();

// Lyssna på events
menu.addEventListener('menuLoaded', (e) => console.log(e.detail));
menu.addEventListener('menuError', (e) => console.error(e.detail));
```

## Konfiguration

- Byta meny (skola/enhet): 
  - Ändra `DEFAULT_ID` i [`js/proxy.js`](js/proxy.js), eller
  - Anropa proxyn med queryparametrar:  
    `http://localhost:8787/api/school-menu?id=<MENY_ID>`
- Begränsa datumintervall (om stöds av källan):  
  `http://localhost:8787/api/school-menu?id=<MENY_ID>&startDate=2025-09-08&endDate=2025-09-12`
- Byta port:
  - Ändra `PORT` i [`js/proxy.js`](js/proxy.js) och uppdatera URL:en i [`SchoolMenuService`](js/components/SchoolMenuService.js).

## Felsökning

- CORS-fel eller “Unexpected content-type”:
  - Använd proxyns URL i [`SchoolMenu`](js/schoolMenu.js) och säkerställ att proxyn kör.
- “JSON.parse …” vid proxy-körning:
  - Källsidan kan ha ändrat struktur. Proxyn parser `__NEXT_DATA__`; uppdatera parsern i [`js/proxy.js`](js/proxy.js) vid behov.
- Port redan upptagen:
  - Ändra `PORT` i [`js/proxy.js`](js/proxy.js).
- `links.json` laddas inte:
  - Kontrollera att din statiska server körs från repo‑roten och att filen finns under `data/links.json`.

## Licens

Bifrost är licensierat under MIT. Se [LICENSE](LICENSE).
