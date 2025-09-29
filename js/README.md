# Modulära Komponenter

Denna mapp innehåller de modulära JavaScript-komponenterna för Bifrost-projektet.

## Filstruktur

```
js/
├── components/
│   ├── BaseComponent.js       # Basklass för alla webbkomponenter
│   ├── SchoolMenu.js          # Skolmatsmeny-komponent
│   └── SchoolMenuService.js   # API-service för skolmatsmeny
├── utils/
│   ├── dateUtils.js          # Datumhanteringsverktyg
│   └── domUtils.js           # DOM-manipulationsverktyg
├── styles/
│   └── schoolMenu.css.js     # CSS-stilar för skolmatsmeny
├── linkHandler.js            # Länkhanterare (befintlig)
├── main.js                   # Huvudfil (befintlig)
└── proxy.js                  # Lokal proxy-server (befintlig)
```

## Komponenter

### BaseComponent
- Basklass för alla custom elements
- Hanterar state, livscykel och vanliga operationer
- Tillhandahåller hjälpmetoder för DOM och events

### SchoolMenu
- Huvudkomponent för visning av skolmatsmeny
- Utökar BaseComponent
- Hanterar rendering och användarinteraktion
- Auto-uppdatering var 15:e minut

### SchoolMenuService
- Isolerad service för API-anrop
- Caching av data (15 min)
- Validering och felhantering
- Health check-funktionalitet

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