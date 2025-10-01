# Bifrost Konfiguration

## Hur du anpassar Bifrost

Redigera [`js/config.js`](js/config.js) för att ändra inställningar.

## Populära anpassningar

### Ändra användarnamn
```js
ui: {
    userName: 'Ditt Namn Här'
}
```

### Lägg till fler tangentbordsgenvägar
```js
shortcuts: {
    enabled: true,
    linkShortcuts: true,    // Ctrl+1-9 för länkar
    todoShortcuts: true,    // Enter för att lägga till todo
    searchShortcuts: true   // Ctrl+/ för att fokusera sök
}
```

### Anpassa sökmotorer
```js
search: {
    defaultEngine: 'https://google.com/search',
    engines: {
        'duckduckgo': 'https://duckduckgo.com/?q=',
        'google': 'https://google.com/search?q=',
        'bing': 'https://bing.com/search?q=',
        'startpage': 'https://startpage.com/search?q='
    }
}
```

### Justera skolmatsinställningar
```js
schoolMenu: {
    apiUrl: 'http://localhost:8787/api/school-menu',
    updateInterval: 30 * 60 * 1000, // 30 minuter istället för 15
    timeout: 10000 // 10 sekunder istället för 8
}
```

### Begränsa antal todos
```js
todos: {
    maxItems: 10, // Max 10 todos istället för 20
    placeholder: 'Vad ska du göra idag?'
}
```

### Aktivera mörkt tema
```js
ui: {
    theme: 'dark', // 'light' eller 'dark'
    compactMode: true // Mindre spacing
}
```

### Debug-läge
```js
dev: {
    debug: true,
    logLevel: 'debug',
    mockData: true // Använd mock-data istället för riktiga API-anrop
}
```

## Återställa till standard

Ta bort dina ändringar i `config.js` och ladda om sidan för att få tillbaka standardinställningarna.