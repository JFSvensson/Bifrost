# ⏱️ Pomodoro Timer Guide

## Översikt

Bifrost har nu en inbyggd Pomodoro Timer för att hjälpa dig hålla fokus och arbeta effektivt. Tekniken bygger på 25-minuters fokuserade arbetssessioner följda av korta pauser, perfekt för att maximera produktivitet och minska mental utmattning.

## Vad är Pomodoro-tekniken?

Pomodoro-tekniken, utvecklad av Francesco Cirillo på 1980-talet, är en tidshanteringsmetod som delar upp arbete i intervaller:

- **25 minuter fokuserat arbete** (en "Pomodoro")
- **5 minuters paus** efter varje session
- **15 minuters lång paus** efter 4 sessioner

## Funktioner

### ⏱️ **Timer**

**Work Mode (25 min):**
- Fokuserad arbetstid
- Cirkulär progress indikator (lila)
- Timer räknar ner från 25:00
- Desktop & toast notifications när klar

**Short Break (5 min):**
- Kort paus mellan sessioner
- Progress indikator (grön)
- Timer räknar ner från 05:00
- Auto-aktiveras efter work session

**Long Break (15 min):**
- Längre paus efter 4 sessioner
- Progress indikator (grön)
- Timer räknar ner från 15:00
- Återställer session-räknare

### 🎛️ **Kontroller**

**Start/Pause:**
- Toggle mellan start och paus
- Bevarar tid vid paus
- Fortsätter från samma tid vid resume
- Keyboard: `Ctrl+Shift+P`

**Reset:**
- Återställer current timer till start
- Behåller current mode (work/break)
- Pausar automatiskt
- Keyboard: `Ctrl+Shift+R`

**Skip:**
- Hoppa till nästa mode
- Kompletterar current session (om work mode)
- Pausar automatiskt
- Användbart för att justera schema

### 🔔 **Notifications**

**Desktop Notifications:**
```
🎉 Pomodoro Complete!
Great work! Time for a 5 minute break.
```

- Visas när timer når 00:00
- Kräver notification permission
- Klickbar för att fokusera Bifrost
- Olika meddelanden för work/break

**Toast Notifications (In-App):**
- Lila gradient för completed work sessions
- Grön gradient för completed breaks
- Slide-in animation från höger
- Auto-stängs efter 5 sekunder
- Manuell stängning med ✕-knapp

**Sound Alert:**
- Subtil beep-ljud när timer är klar
- Använder Web Audio API
- 800 Hz sinuston, 0.5s duration
- Kan stängas av i browser

### 📊 **Session Tracking**

**Cycle Progress:**
```
2/4  ← Sessions i current cycle
```

- Visar progress mot long break
- Återställs efter 4 sessioner
- Updates i real-time

**Dagens Statistik:**
```
Today:    5    ← Totalt antal sessions idag
Minutes:  125  ← Totalt fokusminuter (5×25)
Streak:   3    ← Streak i current cycle
```

- Resettas vid midnatt
- Sparas i localStorage
- Integration med Stats Dashboard

### 🎨 **Visuell Feedback**

**Cirkulär Progress:**
- Smooth animation varje sekund
- Lila för work mode
- Grön för break modes
- 200×200px SVG circle
- Strokewidth: 10px

**Mode Indicator:**
```
25:00          ← Tid kvar
Focus Time     ← Current mode
```

**Color Coding:**
- **Work**: Lila gradient (#667eea → #764ba2)
- **Break**: Grön gradient (#48bb78 → #38a169)
- **Buttons**: Matchande gradients

## Användning

### Starta en Pomodoro-session

1. **Klicka "▶️ Start"** eller tryck `Ctrl+Shift+P`
2. **Arbeta fokuserat** i 25 minuter
3. **Ta en paus** när timern är klar (notification visas)
4. **Upprepa** för nästa session

### Best Practices

**🎯 Förberedelse:**
- Bestäm vad du ska göra innan du startar
- Stäng av notifikationer och distraktioner
- Ha vatten och snacks nära

**💪 Under sessionen:**
- Fokusera endast på en uppgift
- Ingen multitasking
- Om något kommer upp: skriv ner och hantera efter

**🧘 Under pausen:**
- Sträck på dig och rör dig
- Titta bort från skärmen
- Undvik mentalt krävande aktiviteter
- Återhämta dig ordentligt

**📈 Långsiktig användning:**
- Tracka hur många Pomodoros olika uppgifter tar
- Justera arbetssätt baserat på dina resultat
- Använd Statistics Dashboard för insikter

### Vanliga Arbetsflöden

**Standard Pomodoro:**
```
1. Work (25 min)     ▶️ Start
2. Short Break (5)   ⏸️ Auto-pause
3. Work (25 min)     ▶️ Start igen
4. Short Break (5)
5. Work (25 min)
6. Short Break (5)
7. Work (25 min)
8. Long Break (15)   🎉 Cycle complete!
```

**Anpassad Session:**
```
1. Work (25 min)     ▶️ Start
2. Behöver mer tid?  🔄 Reset & fortsätt
3. Nödsituation?     ⏭️ Skip till paus
4. Ta paus          ▶️ Start break
```

## Keyboard Shortcuts

| Genväg | Funktion |
|--------|----------|
| `Ctrl + Shift + P` | Start/Pause timer |
| `Ctrl + Shift + R` | Reset current timer |

Tips: Lägg till shortcuts i muscle memory för snabb kontroll!

## API

### PomodoroService

```javascript
import { pomodoroService } from './js/pomodoroService.js';

// ===== TIMER CONTROLS =====

// Start timer
pomodoroService.start();

// Pause timer
pomodoroService.pause();

// Toggle start/pause
pomodoroService.toggle();

// Reset current timer
pomodoroService.reset();

// Skip to next mode
pomodoroService.skip();

// ===== GET STATE =====

// Get full state object
const state = pomodoroService.getState();
console.log(state);
// {
//   mode: 'work',
//   timeLeft: 1500,
//   isRunning: false,
//   sessionsCompleted: 2,
//   totalSessionsToday: 5,
//   startTime: 1699450234567
// }

// Get formatted time (MM:SS)
const time = pomodoroService.getFormattedTime();
console.log(time); // "25:00"

// Get progress percentage
const progress = pomodoroService.getProgress();
console.log(progress); // 35.5

// Get mode display name
const mode = pomodoroService.getModeName();
console.log(mode); // "Focus Time"

// ===== STATISTICS =====

// Get today's statistics
const stats = pomodoroService.getTodayStats();
console.log(stats);
// {
//   sessionsCompleted: 3,
//   totalSessions: 5,
//   focusMinutes: 125,
//   streakSessions: 3
// }

// ===== CUSTOMIZATION =====

// Set custom durations (in minutes)
pomodoroService.setDurations(25, 5, 15); // work, short, long

// Custom work duration only
pomodoroService.setDurations(30); // 30 min work, keeps default breaks

// ===== SUBSCRIPTIONS =====

// Subscribe to timer updates (called every second)
const unsubscribe = pomodoroService.subscribe((state) => {
    console.log('Timer update:', state);
    // Update your UI
});

// Unsubscribe when done
unsubscribe();

// ===== EVENTS =====

// Listen for completed work sessions
window.addEventListener('pomodoroCompleted', (event) => {
    console.log('Pomodoro completed!', event.detail);
    // { sessionsCompleted: 3, totalToday: 5 }
});
```

### PomodoroWidget

```javascript
// Widget updates automatically, no manual control needed

// Get widget element
const widget = document.querySelector('pomodoro-widget');

// Widget listens to pomodoroService automatically
// Updates display every second when timer is running
```

## Integrationer

### Med Statistics Dashboard

Pomodoro sessions spåras automatiskt i statistik:

```javascript
// Event dispatched when work session completes
window.addEventListener('pomodoroCompleted', (event) => {
    // StatsService kan lyssna här
    const { sessionsCompleted, totalToday } = event.detail;
    
    // Uppdatera custom stats
    statsService.recordPomodoroSession();
});
```

### Med Todo-listan

Kombinera Pomodoro med todos för bättre fokus:

```javascript
// Future: Link todo to Pomodoro
todo.pomodoroEstimate = 3; // 3 sessions estimated
todo.pomodoroActual = 2;   // 2 sessions actual

// Track per todo
statsService.recordTodoWithPomodoro(todoId, sessions);
```

### Med Notifications API

```javascript
// Check notification support
if ('Notification' in window) {
    console.log('Notifications supported');
    
    // Request permission
    await Notification.requestPermission();
    
    // Check permission
    console.log(Notification.permission);
    // "granted", "denied", "default"
}
```

## Anpassningar

### Ändra Durationer

**I kod:**
```javascript
// Custom durations (minutes)
pomodoroService.setDurations(
    30,  // Work
    10,  // Short break
    20   // Long break
);
```

**Populära varianter:**
- **Kort Pomodoro**: 15/3/10 (bra för börjare)
- **Standard**: 25/5/15 (klassisk)
- **Lång Pomodoro**: 50/10/30 (deep work)
- **Ultra Focus**: 90/15/45 (Ultradian rhythm)

### Stäng av Ljud

```javascript
// I pomodoroService.js, kommentera ut:
// this.playSound();
```

### Auto-Start Nästa Session

```javascript
// I pomodoroService.js, completeSession():
// Avkommentera denna rad:
this.start();
```

### Custom Styling

**Widget colors:**
```css
/* I pomodoroWidget.js shadow DOM styles */
.progress-bar.work {
    stroke: #ff6b6b; /* Röd istället */
}

.control-btn {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
```

**Toast styling:**
```css
/* I styles.css */
.pomodoro-toast-work {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
```

## Styling

### Widget Styles

```css
/* Circular progress */
.circular-progress {
    width: 200px;
    height: 200px;
}

.progress-bar {
    stroke-width: 10;
    stroke-linecap: round;
}

/* Time display */
.time-text {
    font-size: 2.5rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

/* Buttons */
.control-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
}

.control-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

### Dark Theme Support

Widgeten har fullständigt dark theme-stöd:

```css
:host(.dark-theme) .pomodoro-container {
    background: #2d3748;
}

:host(.dark-theme) .time-text {
    color: #e2e8f0;
}

:host(.dark-theme) .progress-bg {
    stroke: #4a5568;
}
```

## Responsive Design

### Desktop (> 768px)
- Full-size widget (200px circle)
- 3 knappar i rad
- Large time display

### Mobile (< 768px)
- Smaller circle (180px)
- Buttons wrap på flera rader
- Kompakt layout
- Touch-friendly buttons

## Browser Compatibility

✅ **Timer Functionality:**
- All modern browsers
- IE11+ (med polyfills)

✅ **Desktop Notifications:**
- Chrome 22+
- Firefox 22+
- Safari 6+
- Edge 14+

✅ **Web Audio (sound):**
- Chrome 10+
- Firefox 25+
- Safari 6+
- Edge 12+

✅ **SVG Animations:**
- All modern browsers
- IE9+ (basic support)

## Performance

- **Minimal CPU**: Timer uppdateras varje sekund (setInterval)
- **Low memory**: State sparas endast i localStorage
- **Efficient rendering**: Shadow DOM för isolerad rendering
- **No network**: Fungerar helt offline

## Privacy

- **Lokalt först**: All data lagras lokalt i browser
- **Ingen tracking**: Inga analytics för timer
- **User control**: Data kan rensas när som helst
- **No cookies**: Använder endast localStorage

## Troubleshooting

**Problem: Notifications visas inte**
- Lösning: Kolla browser permission (ska vara "granted")
- Kontrollera OS notification settings
- Testa med `await Notification.requestPermission()`

**Problem: Ljud spelas inte**
- Lösning: Vissa browsers kräver user interaction först
- Chrome kan blockera autoplay audio
- Testa manuellt: `pomodoroService.playSound()`

**Problem: Timer slutar räkna**
- Lösning: Browser tab kan vara suspended
- Vissa browsers throttlar inactive tabs
- Håll tab aktiv eller använd extension

**Problem: Sessions räknas inte**
- Lösning: Kontrollera localStorage inte är full
- Verifiera datum är korrekt
- Manuell reset: `pomodoroService.saveState()`

**Problem: Widget renderas inte**
- Lösning: Kontrollera custom element registration
- Kolla browser console för errors
- Verifiera module imports

## Tips & Tricks

### Maximera Produktivitet

1. **Planera dagen** - Estimera antal Pomodoros per uppgift
2. **En uppgift i taget** - Ingen multitasking under session
3. **Respektera timern** - Sluta när den ringer, även om du är "i flow"
4. **Ta ordentliga pauser** - Rör dig, sträck, titta bort från skärmen
5. **Track resultaten** - Använd Statistics Dashboard för insikter

### Kombinera med Andra Tekniker

**Med GTD (Getting Things Done):**
- Planera Pomodoros för varje todo
- En Pomodoro = ett chunk av arbete

**Med Deep Work:**
- 2× Pomodoro i rad = 50 min deep work
- Perfekt för komplexa uppgifter

**Med Timeboxing:**
- Allokera specifikt antal Pomodoros per projekt
- Håll budget med session counter

### Anpassa Till Din Rytm

**För morgonpigg:**
- Svåraste uppgifter under första 2 Pomodoros
- Rutinarbete på eftermiddagen

**För nattuggle:**
- Warm-up tasks först
- Peak productivity på kvällen

**För varierande energi:**
- Tracka när du är mest produktiv
- Schemalägg viktigt arbete då

## Future Enhancements

🔮 **Planerade funktioner:**
- ⏰ Anpassningsbara durationer i UI
- 📊 Detaljerade analytics per uppgift
- 🔗 Integration med todo-lista (estimate Pomodoros per todo)
- 🎨 Custom themes och färger
- 🔊 Val av notification sounds
- 📅 Pomodoro-schemaläggning
- 📈 Produktivitetsrapporter
- 🏆 Achievements och badges
- 🌐 Cross-device sync
- 📱 PWA notifications

## Vetenskaplig Bakgrund

### Varför 25 minuter?

- **Optimal fokustid** - Balans mellan koncentration och mental utmattning
- **Ultradian rhythm** - Kroppen arbetar i ~90-120 min cykler
- **Överkomligt commitment** - Lättare att starta "bara 25 min"
- **Tvingar prioritering** - Vad kan göras på 25 min?

### Fördelar med Pomodoro

📚 **Forskning visar:**
- Ökad produktivitet (25-40% improvement)
- Minskad stress och prokrastinering
- Bättre time awareness
- Förbättrad fokusförmåga över tid
- Mindre mental utmattning

💪 **Praktiska fördelar:**
- Mäter tid i konkreta enheter
- Skapar känsla av framgång efter varje session
- Regelbundna pauser förhindrar burnout
- Lätt att estimera hur lång tid saker tar
- Bygger self-discipline

## Support

Frågor eller problem? Öppna en issue på GitHub! 🚀

## Resources

- [Pomodoro Technique Official](https://francescocirillo.com/pages/pomodoro-technique)
- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Research on Pomodoro](https://www.researchgate.net/publication/318467620_The_Pomodoro_Technique_An_Effective_Time_Management_Tool)
