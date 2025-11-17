# 🔔 Deadline Warnings Guide

## Översikt

Bifrost har nu ett smart deadline warning-system som hjälper dig hålla koll på kommande och försenade todos. Systemet använder visuella varningar, färgkodning och notifications för att säkerställa att du aldrig missar en deadline.

## Funktioner

### ⚠️ **Automatisk Kategorisering**

Todos med deadlines kategoriseras automatiskt baserat på hur nära deadline är:

**🚨 Försenad** (Röd)
- Deadline har passerat
- Högsta prioritet
- Visas överst i listan

**⚡ Idag** (Orange)
- Deadline är idag
- Hög prioritet
- Desktop notification vid första laddning

**📅 Imorgon** (Blå)
- Deadline är imorgon
- Medel prioritet
- Inkluderad i daglig sammanfattning

**📆 Denna vecka** (Ljusblå)
- Deadline inom 7 dagar
- Låg prioritet
- Visas i översikt

**📌 Kommande** (Grå)
- Deadline > 7 dagar framåt
- Ingen varning
- Normal visning

### 🔔 **Notifications**

**Desktop Notifications:**
```
🚨 Försenad
Du har en försenad uppgift: "Fixa buggen"
```

- Visas automatiskt för urgenta todos (försenad, idag, imorgon)
- Kräver notification permission
- Visas endast en gång per dag per todo
- Klicka för att fokusera Bifrost

**Toast Notifications (In-App):**
```
⚠️ Daglig Sammanfattning
🚨 2 försenade todos
⚡ 1 deadline idag
📅 3 deadline imorgon
```

- Visas vid första laddning
- Kan stängas manuellt
- Auto-stängs efter 8 sekunder
- Sticky för försenade todos

### 📊 **Deadline Widget**

Visar översikt över alla urgenta deadlines:

```
⚠️ Deadlines att uppmärksamma    [2 urgenta]

🚨 Försenade (1)
┌──────────────────────────────┐
│ 🚨  Fixa buggen              │
│     🔥 Hög  📝 Obsidian      │
└──────────────────────────────┘

⚡ Idag (1)
┌──────────────────────────────┐
│ ⚡  Lämna rapport            │
│     ⚠️ Medel  #arbete        │
└──────────────────────────────┘

Statistik:
2 Försenade  |  3 Denna vecka  |  8 Totalt
```

**Features:**
- Grupperad visning per kategori
- Visar priority och tags
- Färgkodade cards
- Klickbara (future: direkt navigation)
- Real-time uppdatering

### 🎨 **Visuella Varningar**

**I Todo-listan:**
- Försenad: Röd border, röd bakgrund
- Idag: Orange border, orange bakgrund
- Imorgon: Blå border, blå bakgrund
- Blinkar för extra uppmärksamhet (optional)

**Deadline Badges:**
```
🚨 Försenad (6 nov)
⚡ Idag
📅 Imorgon
📆 fre 8 nov
```

### 📈 **Statistik Integration**

Deadline stats visas i statistik-widgeten:
- Antal försenade todos
- Deadline completion rate
- Trend över tid
- Mest missade deadlines

## Användning

### Sätta Deadline på Todo

**I Bifrost:**
För närvarande stöds endast deadlines från Obsidian.

**I Obsidian:**
```markdown
- [ ] Min uppgift @2025-11-10
- [ ] Viktig deadline @2025-11-06 [!high]
- [ ] Köpa mjölk imorgon @2025-11-07 #shopping
```

Format: `@YYYY-MM-DD`

### Aktivera Desktop Notifications

1. **Vid första laddning** får du en permission-prompt
2. Klicka "Tillåt" för att aktivera
3. Notifications visas automatiskt för urgenta todos

**Manuell aktivering:**
```javascript
// I browser console
await Notification.requestPermission();
```

### Anpassa Varningar

**I `deadlineService.js`:**
```javascript
// Ändra varningsnivåer
warningLevels: {
    overdue: {
        color: '#e74c3c',
        icon: '🚨',
        label: 'Försenad',
        priority: 4
    }
    // ... customize
}

// Ändra check-intervall (default: 60 sekunder)
deadlineService.startMonitoring(() => currentTodos, 30000);
```

## API

### DeadlineService

```javascript
import { DeadlineService } from './js/deadlineService.js';

const deadlineService = new DeadlineService();

// Analysera en todo
const analysis = deadlineService.analyzeTodo(todo);
console.log(analysis);
// {
//   level: 'overdue',
//   daysUntil: -2,
//   color: '#e74c3c',
//   icon: '🚨',
//   label: 'Försenad',
//   priority: 4
// }

// Analysera alla todos
const warnings = deadlineService.analyzeAllTodos(todos);
console.log(warnings);
// {
//   overdue: [...],
//   today: [...],
//   tomorrow: [...],
//   thisWeek: [...],
//   future: [...]
// }

// Hämta endast urgenta
const urgent = deadlineService.getUrgentTodos(todos);

// Visa notifications
await deadlineService.showNotifications(todos);

// Visa toast
deadlineService.showToast('Deadline idag!', 'today', 5000);

// Visa daglig sammanfattning
deadlineService.showDailySummary(todos);

// Starta monitoring
deadlineService.startMonitoring(() => getCurrentTodos(), 60000);

// Stoppa monitoring
deadlineService.stopMonitoring();

// Formatera deadline
const formatted = deadlineService.formatDeadline('2025-11-06');
// "⚡ Idag"

// Hämta CSS-klass
const cssClass = deadlineService.getDeadlineClass(todo);
// "deadline-overdue"

// Sortera todos efter deadline
const sorted = deadlineService.sortByDeadline(todos);

// Hämta statistik
const stats = deadlineService.getDeadlineStats(todos);
// {
//   overdue: 2,
//   today: 1,
//   tomorrow: 3,
//   thisWeek: 5,
//   total: 15,
//   urgent: 6
// }

// Återställ notification-historik
deadlineService.resetNotificationHistory();
```

### DeadlineWidget

```javascript
// Widgeten uppdateras automatiskt via 'todosUpdated' events
const widget = document.querySelector('deadline-widget');

// Manuell uppdatering
widget.updateWarnings();
```

## Integrationer

### Med Obsidian

Deadlines synkas automatiskt från Obsidian:

```markdown
## Denna vecka
- [ ] Möte med teamet @2025-11-08 [!high] #arbete
- [ ] Läkarbesök @2025-11-07 #privat

## Projekt
- [ ] Färdigställ rapport @2025-11-06 [!high] #deadline
```

### Med Statistik

Deadline stats spåras automatiskt:
- Completion rate för todos med deadline
- Genomsnittlig tid till deadline
- Hur ofta deadlines missas

### Med Notifications API

Desktop notifications använder browser's Notification API:
```javascript
// Check support
if ('Notification' in window) {
    console.log('Notifications supported');
}

// Check permission
console.log(Notification.permission);
// "granted", "denied", eller "default"
```

## Styling

### Toast Notifications

```css
.deadline-toast {
    /* Position */
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    
    /* Styling */
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem 1.5rem;
    
    /* Animation */
    animation: slideInRight 0.3s ease;
}

/* Levels */
.deadline-toast-overdue { /* Röd */ }
.deadline-toast-today { /* Orange */ }
.deadline-toast-tomorrow { /* Blå */ }
```

### Warning Items

```css
.warning-item.overdue {
    background: linear-gradient(90deg, #fff5f5 0%, #fee2e2 100%);
    border-left: 4px solid #e74c3c;
}

.warning-item.today {
    background: linear-gradient(90deg, #fffbf0 0%, #fef3c7 100%);
    border-left: 4px solid #f39c12;
}
```

## Responsive Design

### Desktop
- Toast i nedre högra hörnet
- Full-width deadline cards
- Alla varningsnivåer visas

### Mobile
- Toast täcker hela bredden
- Kompakta cards
- Priority på urgenta först

## Dark Theme

Fullständigt stöd för dark theme:
- Mörka toast backgrounds
- Kontrastrika färger
- Läsbara warnings
- Smooth transitions

## Browser Compatibility

✅ **Desktop Notifications:**
- Chrome/Edge 22+
- Firefox 22+
- Safari 6+
- Opera 25+

✅ **Toast Notifications:**
- All modern browsers
- Fallback för äldre browsers

## Performance

- **Minimal overhead**: Kontroller körs max varje minut
- **Smart caching**: Notifications visas bara en gång per dag
- **Efficient rendering**: Shadow DOM för isolerad rendering
- **Memory efficient**: Begränsad historik (dagens notifications)

## Privacy

- **Lokalt först**: All data lagras lokalt
- **Ingen tracking**: Inga analytics för notifications
- **User control**: Notifications kan stängas av när som helst

## Troubleshooting

**Problem: Notifications visas inte**
- Lösning: Kontrollera browser permission
- Kolla att notifications är aktiverade i OS-inställningar
- Verifiera att `Notification.permission === 'granted'`

**Problem: Toast visas inte**
- Lösning: Kontrollera CSS är laddad
- Kolla browser console för fel
- Verifiera z-index (ska vara 10000)

**Problem: Fel varningsnivå**
- Lösning: Kontrollera datum-format i todo
- Deadline måste vara `@YYYY-MM-DD`
- Systemdatum måste vara korrekt

**Problem: Duplicerade notifications**
- Lösning: Notification-historik kan behöva återställas
- Kör `deadlineService.resetNotificationHistory()`

**Problem: Ingen daglig sammanfattning**
- Lösning: Kontrollera att todos har `dueDate` property
- Verifiera att `showDailySummary()` körs vid laddning

## Future Enhancements

🔮 **Planerade funktioner:**
- ⏰ Custom notification times (8:00, 12:00, 17:00)
- 🔁 Recurring deadline reminders
- 📧 Email notifications för viktiga deadlines
- 🎯 Snooze functionality
- 📱 Mobile push notifications
- 🔊 Sound alerts (optional)
- 🎨 Custom warning themes
- 📊 Deadline analytics dashboard
- ⏱️ Time-based countdowns
- 🗓️ Calendar integration

## Tips & Best Practices

1. **Sätt realistiska deadlines** - Ge dig själv marginal
2. **Använd priorities** - Kombinera med `[!high]` för extra varning
3. **Check-in dagligen** - Se dagliga sammanfattningen
4. **Aktivera notifications** - Missa inga urgenta deadlines
5. **Review veckovis** - Kolla "denna vecka"-översikten
6. **Obsidian integration** - Centralisera deadline-hantering
7. **Snooze mental load** - Låt systemet hålla koll åt dig

## Support

Frågor eller problem? Öppna en issue på GitHub! 🚀
