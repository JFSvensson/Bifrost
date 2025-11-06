# 📊 Statistics Dashboard Guide

## Översikt

Bifrost har nu ett komplett statistik-dashboard som spårar din produktivitet och ger insikter om dina todo-vanor.

## Funktioner

### 🔥 **Streak Tracking**
- **Aktuell streak**: Antal dagar i rad du har slutfört minst en todo
- **Längsta streak**: Din personliga rekord-streak
- Visualiseras med eldikon 🔥
- Återställs automatiskt om du missar en dag

### ✅ **Dagens Statistik**
- Antal todos färdiga idag
- Antal nya todos skapade idag
- Kvarvarande aktiva todos
- Uppdateras live när du lägger till eller markerar todos

### 📈 **7-Dagars Aktivitetsgraf**
- Bar chart som visar färdiga todos senaste 7 dagarna
- Hover för att se exakt antal
- Hjälper dig identifiera dina mest produktiva dagar
- Automatisk skalning baserat på max-värde

### 🏷️ **Top Tags**
- Visar dina 5 mest använda tags
- Antal todos per tag
- Completion rate per tag
- Färgkodade badges

### 📅 **Veckoöversikt**
- Grid med alla veckodagar
- Antal färdiga todos per dag
- Progress bar visar completion rate
- Återställs varje måndag (kan customizas)

### 📊 **Completion Rate**
- Procentandel av skapade todos som är färdiga
- Total översikt över din produktivitet
- Räknas som: (Färdiga / Skapade) × 100

### ⏱️ **Genomsnittlig Completion Time**
- Mäter hur lång tid det tar i genomsnitt att slutföra en todo
- Räknas från `createdAt` till `completedAt`
- Visas i timmar
- Uppdateras automatiskt med löpande medelvärde

### ✨ **Totala Antal**
- Totalt skapade todos all-time
- Totalt färdiga todos all-time
- Aktiva todos just nu
- Färdiga todos just nu

## Spårad Data

### Per Todo
```javascript
{
    text: "Min todo",
    completed: false,
    completedAt: null,
    createdAt: new Date(),
    source: "bifrost", // eller "obsidian"
    priority: "high",  // high, medium, low, normal
    tags: ["arbete", "viktigt"],
    id: "unique-id"
}
```

### Statistik-struktur
```javascript
{
    totalCompleted: 42,
    totalCreated: 50,
    currentStreak: 5,
    longestStreak: 12,
    lastCompletionDate: "2025-11-06",
    lastActivityDate: "2025-11-06",
    averageCompletionTime: 3.5, // timmar
    
    tagStats: {
        "arbete": { count: 15, completed: 12 },
        "privat": { count: 10, completed: 8 }
    },
    
    priorityStats: {
        high: { created: 10, completed: 9 },
        medium: { created: 20, completed: 15 },
        low: { created: 5, completed: 3 },
        normal: { created: 15, completed: 15 }
    },
    
    sourceStats: {
        bifrost: { created: 30, completed: 25 },
        obsidian: { created: 20, completed: 17 }
    },
    
    weeklyStats: {
        "Måndag": { created: 5, completed: 4 },
        "Tisdag": { created: 3, completed: 3 },
        // ... resten av veckan
    }
}
```

## API

### StatsService

```javascript
import { StatsService } from './js/statsService.js';

const statsService = new StatsService();

// Spåra skapad todo
statsService.trackTodoCreated(todo);

// Spåra färdig todo
statsService.trackTodoCompleted(todo);

// Hämta fullständig statistik
const stats = statsService.getFullStats(currentTodos);

// Hämta endast dagens statistik
const today = statsService.getTodayStats(currentTodos);

// Hämta veckostatistik
const weekly = statsService.getWeeklyStats();

// Hämta top tags
const topTags = statsService.getTopTags(5); // Top 5

// Hämta senaste 7 dagarna
const last7Days = statsService.getLast7DaysActivity();

// Exportera statistik (för backup)
const exported = statsService.exportStats();

// Importera statistik
statsService.importStats(exported);

// Återställ all statistik
statsService.reset();

// Återställ veckostatistik
statsService.resetWeeklyStats();
```

### StatsWidget

```javascript
// Widgeten lyssnar automatiskt på 'todosUpdated' events
// och uppdaterar sig själv

// Manuell uppdatering
const widget = document.querySelector('stats-widget');
widget.updateStats();
```

## Data Storage

Statistik sparas i localStorage under två nycklar:

1. **`bifrost-stats`** - Huvudstatistik
2. **`bifrost-stats-history`** - Historisk data för grafer (senaste 30 dagarna)

### Backup & Export

```javascript
// Exportera till JSON
const stats = statsService.exportStats();
console.log(JSON.stringify(stats, null, 2));

// Spara till fil
const blob = new Blob([JSON.stringify(stats)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'bifrost-stats-backup.json';
a.click();

// Importera från JSON
const imported = JSON.parse(jsonString);
statsService.importStats(imported);
```

## Visualisering

### Bar Chart (7-dagars aktivitet)
- Responsiv höjd baserat på max-värde
- Hover effects
- Value labels på bars
- Datumformat: "fre 6 nov"

### Progress Bars (veckoöversikt)
- Grön fill för completion rate
- Animerad width transition
- Visar completed/created ratio

### Stat Cards
- Grid layout, responsiv
- Ikoner för varje metrik
- Hover lift effect
- Olika färger för olika metriker

### Tag Badges
- Rounded pills
- Färgkodade (Obsidian purple)
- Count badge
- Flexbox wrap layout

## Responsive Design

### Desktop (>768px)
- 4-kolumns grid för stat cards
- Full-width bar chart
- 7-kolumns grid för veckoöversikt

### Tablet (768px - 1024px)
- 2-kolumns grid för stat cards
- Smaller chart height
- Maintains full functionality

### Mobile (<768px)
- 2-kolumns grid för stat cards
- Compressed bar chart (120px height)
- Stacked weekly grid

## Dark Theme Support

Alla komponenter har full dark theme styling:
- Mörk bakgrund för cards (#2d2d44)
- Ljusblå accenter (#64b5f6)
- Kontrastrika färger
- Smooth transitions mellan teman

## Events

### todosUpdated
Dispatches när todos ändras:
```javascript
window.addEventListener('todosUpdated', (e) => {
    const todos = e.detail.todos;
    // Stats widget uppdateras automatiskt
});
```

Dispatch från main.js:
```javascript
function dispatchTodosUpdated() {
    window.dispatchEvent(new CustomEvent('todosUpdated', {
        detail: { todos: currentTodos }
    }));
}
```

## Achievements & Milestones

Framtida förbättringar kan inkludera:
- 🏆 Badges för milestones (100 todos, 30-dagars streak)
- 📈 Jämförelser med föregående vecka/månad
- 🎯 Mål-setting (slutför X todos denna vecka)
- 📊 Mer avancerade grafer (trender, prognoser)
- 🔔 Notifikationer för nya achievements

## Troubleshooting

**Problem: Statistik uppdateras inte**
- Lösning: Kolla att `dispatchTodosUpdated()` anropas efter todo-ändringar
- Verifiera att `statsService.trackTodoCreated/Completed()` körs

**Problem: Streak är fel**
- Lösning: Kontrollera systemdatum
- Streaks bygger på `lastCompletionDate` i Date.toDateString() format

**Problem: Graf visar ingen data**
- Lösning: Slutför minst en todo för att få data
- Historik byggs upp över tid (max 30 dagar)

**Problem: Tags visas inte**
- Lösning: Todos måste ha `tags` array property
- Obsidian todos får tags från #hashtags i texten

**Problem: Completion time är 0**
- Lösning: Todos måste ha både `createdAt` och `completedAt`
- Gamla todos utan timestamps påverkar inte genomsnittet

## Performance

- Alla beräkningar görs i minnesoptimerade Set/Map där möjligt
- localStorage uppdateras endast vid faktiska ändringar
- Historik begränsad till 30 dagar för att undvika bloat
- Shadow DOM för isolerad rendering

## Privacy

- All data lagras lokalt i localStorage
- Ingen data skickas till externa servrar
- Kan raderas när som helst via `statsService.reset()`
- Export/import för att flytta mellan enheter

## Tips för Bästa Användning

1. **Konsistens**: Markera todos som klara dagligen för bra streaks
2. **Tags**: Använd tags konsekvent för bättre insights
3. **Priorities**: Sätt priorities för att se completion rate per priority
4. **Backup**: Exportera statistik regelbundet
5. **Tidszoner**: Tänk på att streak bygger på lokal tid

## Future Roadmap

🔮 **Planerade funktioner:**
- Export till CSV/PDF
- Månadsrapporter
- Jämförelse med föregående period
- Custom date ranges för grafer
- Heatmap för aktivitet
- Produktivitets-score
- AI-baserade insights

Har du fler idéer? Öppna en issue på GitHub! 🚀
