# 🌓 Dark Theme Guide

## Översikt

Bifrost har nu fullt stöd för både ljust och mörkt tema med smooth transitions och automatisk system-preferens detection.

## Funktioner

✨ **Auto-detection**
- Följer automatiskt ditt operativsystems tema
- Byter automatiskt när systemtemat ändras
- Ingen manuell konfiguration krävs

🎨 **Manuell kontroll**
- Toggle-knapp i övre högra hörnet
- Klicka på 🌙/☀️ för att byta tema
- Ditt val sparas i localStorage

⌨️ **Keyboard Shortcut**
- `Ctrl+Shift+D` (Windows/Linux)
- `Cmd+Shift+D` (Mac)
- Snabb växling utan att använda musen

🎭 **Smooth Animations**
- Mjuka övergångar mellan teman
- Roterande animation på toggle-knappen
- Ingen blinkning eller "flash"

## Användning

### Byta tema manuellt

1. **Med musen:**
   - Klicka på knappen i övre högra hörnet
   - 🌙 = byt till mörkt tema
   - ☀️ = byt till ljust tema

2. **Med tangentbordet:**
   - Tryck `Ctrl+Shift+D` (eller `Cmd+Shift+D` på Mac)

### Automatiskt tema

Om du aldrig har bytt tema manuellt kommer Bifrost automatiskt att:
- Använda ljust tema om ditt system är ljust
- Använda mörkt tema om ditt system är mörkt
- Följa ditt systems temaändringar i realtid

När du väl har bytt manuellt, kommer ditt val att sparas och systempreferensen ignoreras.

## Dark Theme Design

### Färgpalett

**Ljust tema:**
- Bakgrund: Gradient från #f5f7fa till #c3cfe2
- Cards: Vit (#ffffff)
- Text: Mörkgrå (#333)
- Accenter: Blå (#3498db)

**Mörkt tema:**
- Bakgrund: Gradient från #0f0c29 via #302b63 till #24243e
- Cards: Mörkblå (#1e1e2e)
- Text: Ljusgrå (#e0e0e0)
- Accenter: Ljusblå (#64b5f6)

### Komponenter i Dark Mode

**Todos:**
- Bifrost todos: Blå border (#64b5f6)
- Obsidian todos: Lila border (#9575cd)
- High priority: Röd (#ef5350)
- Medium priority: Orange (#ffa726)
- Completed: Nedtonad opacity + genomstruken

**Knappar:**
- Primary: Ljusblå (#64b5f6) med mörk text
- Search: Röd (#ef5350) med vit text
- Hover: Ljusare nyanser

**Links:**
- Grön accent-färg (#66bb6a)
- Hover: Grön bakgrund med mörk text

## Teknisk Implementation

### ThemeService

```typescript
// Auto-initieras vid sidladdning
import themeService from './dist/services/themeService.js';

// Byta tema programmatiskt
themeService.setTheme('dark'); // eller 'light'

// Toggle tema
themeService.toggleTheme();

// Läs nuvarande tema
const currentTheme = themeService.getTheme();

// Lyssna på temaändringar
window.addEventListener('themechange', (e: CustomEvent) => {
    console.log('New theme:', e.detail.theme);
});
```

### CSS Classes

```css
/* Ljust tema (default) */
body.light-theme { }

/* Mörkt tema */
body.dark-theme { }

/* Tema-specifika styles */
.dark-theme .card { }
.dark-theme .todo-list li { }
```

### localStorage

Temapreferensen sparas i:
```javascript
localStorage.getItem('bifrost-theme'); // 'light' eller 'dark'
```

Ta bort för att återgå till auto-mode:
```javascript
localStorage.removeItem('bifrost-theme');
```

## Browser Support

✅ **Moderna browsers:**
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+

✅ **Features:**
- `prefers-color-scheme` media query
- CSS custom properties
- localStorage
- CSS transitions

## Accessibility

♿ **WCAG Compliance:**
- ARIA-label på toggle-knapp
- Keyboard navigation support
- Tillräcklig kontrast i båda teman
- Respekterar system-preferenser

## Tips & Tricks

💡 **För utvecklare:**
```javascript
// Tvinga ett tema (för testing)
document.body.classList.add('dark-theme');

// Disable animations (för screenshots)
document.body.style.transition = 'none';
```

💡 **För användare:**
- Mörkt tema sparar batteri på OLED-skärmar
- Mörkt tema är bättre på kvällen för ögonen
- Ljust tema är lättare att läsa i dagsljus

## Future Enhancements

🔮 **Möjliga förbättringar:**
- Custom färgteman (högkontrast, sepia, etc.)
- Scheduled theme switching (auto dark efter kl 20:00)
- Per-widget tema-inställningar
- Tema-export/import
- Gradient editor för bakgrund

## Troubleshooting

**Problem: Temat återgår till ljust varje gång jag laddar om**
- Lösning: Kontrollera att localStorage inte blockeras av din browser

**Problem: Toggle-knappen syns inte**
- Lösning: Kontrollera att `themeService.js` laddas korrekt
- Kolla console för fel

**Problem: Smooth transitions fungerar inte**
- Lösning: Kontrollera att `ui.animations` är `true` i config.js

**Problem: Fel färger i dark mode**
- Lösning: Hard refresh med Ctrl+Shift+R för att rensa CSS-cache

## Support

Har du problem eller förslag? Öppna en issue på GitHub! 🚀
