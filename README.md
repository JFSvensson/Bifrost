# Bifrost Starting Page

En enkel startsida med att‑göra‑lista, sök, länkar samt veckans skolmat.

- HTML: [index.html](index.html)
- CSS: [css/styles.css](css/styles.css)
- JS: [js/main.js](js/main.js), [js/linkHandler.js](js/linkHandler.js), [js/schoolMenu.js](js/schoolMenu.js), [js/proxy.js](js/proxy.js)

## Funktioner

- ToDo-lista
- Sök (DuckDuckGo)
- Länkar (från `data/links.json`)
- Skolmat/veckomeny via Matilda Platform, renderad av webbkomponenten [`SchoolMenu`](js/schoolMenu.js)

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

- Länkar: [`js/linkHandler.js`](js/linkHandler.js) hämtar `./data/links.json` och bygger listan i elementet med id `links`.
- Skolmat: [`SchoolMenu`](js/schoolMenu.js) hämtar JSON från proxyn på `http://localhost:8787/api/school-menu` och renderar veckans dagar och rätter.
- Proxy: [`js/proxy.js`](js/proxy.js) hämtar Matilda-sidan, plockar ut `__NEXT_DATA__` och transformerar till ett enkelt JSON-format:  
  `{ startDate, endDate, days: [{ dayName, meals: [{ name }] }] }`

## Konfiguration

- Byta meny (skola/enhet): 
  - Ändra `DEFAULT_ID` i [`js/proxy.js`](js/proxy.js), eller
  - Anropa proxyn med queryparametrar:  
    `http://localhost:8787/api/school-menu?id=<MENY_ID>`
- Begränsa datumintervall (om stöds av källan):  
  `http://localhost:8787/api/school-menu?id=<MENY_ID>&startDate=2025-09-08&endDate=2025-09-12`
- Byta port:
  - Ändra `PORT` i [`js/proxy.js`](js/proxy.js) och uppdatera URL:en i [`js/schoolMenu.js`](js/schoolMenu.js).

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
