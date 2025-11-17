# 📅 Google Calendar Integration Guide

## Översikt

Bifrost har nu full integration med Google Calendar! Synka todos med datum till din kalender, visa dagens händelser, och håll alla dina aktiviteter synkroniserade på ett ställe.

## ✨ Funktioner

### 📖 **Visa Kalenderhändelser**
- Dagens händelser i sidebar
- Kommande events (7 dagar)
- All-day events och timed events
- Event beskrivningar och platser
- Direktlänkar till Google Calendar

### 🔄 **Bilateral Synkronisering**
- **Bifrost → Calendar**: Todos med datum blir automatiskt calendar events
- **Calendar → Bifrost**: Se calendar events i Bifrost (future)
- **Auto-sync**: Uppdateras var 5:e minut
- **Real-time**: Omedelbar synk vid changes

### 🔔 **Notifications**
- Desktop notifications för kommande events
- Integration med deadline warnings
- Reminder 1 timme innan event

### 🎨 **Visuell Integration**
- Calendar widget i sidebar
- Color-coded events
- Dark theme support
- Responsive design

## 🚀 Setup

### Steg 1: Google Cloud Project

Följ detaljerad guide för att skapa Google Cloud Project:
- Se huvudguiden i README
- Aktivera Google Calendar API
- Skapa OAuth 2.0 credentials

### Steg 2: Konfigurera Credentials

1. **Skapa `google-credentials.json`** i Bifrost root:

```json
{
  "client_id": "123456789-abc123xyz789.apps.googleusercontent.com",
  "api_key": "AIza..."
}
```

2. **Lägg till i `.gitignore`:**

```
google-credentials.json
.env
```

⚠️ **VIKTIGT**: Committa ALDRIG credentials till git!

### Steg 3: Authorized Redirect URIs

I Google Cloud Console, lägg till:
- `http://localhost`
- `http://127.0.0.1`
- Din produktions-URL (om applicable)

### Steg 4: Sign In

1. Öppna Bifrost
2. Hitta Calendar widget i sidebar
3. Klicka **"Sign in with Google"**
4. Godkänn permissions
5. ✅ Connected!

## 📋 Användning

### Visa Dagens Kalenderhändelser

Calendar widget visar automatiskt dagens events:

```
📅 Today's Events (3)

🔄 [refresh] Sign Out

● Connected to Google Calendar

09:00 - 10:00
Team Standup
📍 Office 

14:00 - 15:30
Client Meeting
Important quarterly review

All day
Deadline: Project Delivery
```

### Synka Todo till Calendar

**Automatisk synk:**
Todos med `dueDate` synkas automatiskt var 5:e minut:

```javascript
const todo = {
    text: "Finish report",
    dueDate: "2025-11-15",
    priority: "high",
    source: "bifrost"
};
// → Skapas automatiskt i Google Calendar
```

**Manuell synk:**
```javascript
import { calendarSyncService } from './js/calendarSync.js';

// Synka specifik todo
await calendarSyncService.syncTodoToCalendar(todo);

// Manuell full sync
await calendarSyncService.performSync();
```

### Skapa Todo från Calendar Event

(Future feature - planerad funktionalitet)

```javascript
// Listen for new calendar events
window.addEventListener('newCalendarEvents', (event) => {
    const events = event.detail.events;
    // Skapa todos från events
});
```

### Refresh Events

Klicka 🔄 refresh-knappen för att uppdatera events omedelbart.

### Sign Out

Klicka "Sign Out" för att logga ut från Google Calendar.

## 🔧 API

### GoogleCalendarService

```javascript
import { googleCalendarService } from './js/googleCalendarService.js';

// ===== AUTHENTICATION =====

// Initialize service
await googleCalendarService.initialize();

// Sign in
await googleCalendarService.signIn();

// Sign out
googleCalendarService.signOut();

// Check authentication status
const isAuth = googleCalendarService.isAuthenticated();

// ===== EVENTS =====

// Get today's events
const todayEvents = await googleCalendarService.getTodaysEvents();

// Get upcoming events (next 7 days)
const upcoming = await googleCalendarService.getUpcomingEvents(7);

// Get events in date range
const start = new Date('2025-11-10');
const end = new Date('2025-11-17');
const events = await googleCalendarService.getEvents(start, end, 50);

// ===== CREATE EVENTS =====

// Create event
const event = {
    summary: 'Team Meeting',
    description: 'Weekly sync',
    start: {
        dateTime: '2025-11-10T14:00:00+01:00',
        timeZone: 'Europe/Stockholm'
    },
    end: {
        dateTime: '2025-11-10T15:00:00+01:00',
        timeZone: 'Europe/Stockholm'
    },
    reminders: {
        useDefault: false,
        overrides: [
            { method: 'popup', minutes: 30 }
        ]
    }
};

const createdEvent = await googleCalendarService.createEvent(event);

// Create all-day event
const allDayEvent = {
    summary: 'Project Deadline',
    start: { date: '2025-11-15' },
    end: { date: '2025-11-15' }
};

await googleCalendarService.createEvent(allDayEvent);

// Create event from todo
const calendarEvent = await googleCalendarService.createEventFromTodo(todo);

// ===== UPDATE & DELETE =====

// Update event
await googleCalendarService.updateEvent(eventId, {
    summary: 'Updated Title',
    description: 'New description'
});

// Delete event
await googleCalendarService.deleteEvent(eventId);

// ===== FORMAT =====

// Format event for display
const formatted = googleCalendarService.formatEvent(event);
console.log(formatted);
// {
//   id: 'abc123',
//   title: 'Team Meeting',
//   description: 'Weekly sync',
//   start: Date,
//   end: Date,
//   allDay: false,
//   location: 'Office',
//   link: 'https://...',
//   raw: {...}
// }

// ===== SUBSCRIPTIONS =====

// Subscribe to auth changes
const unsubscribe = googleCalendarService.subscribe((data) => {
    if (data.authenticated) {
        console.log('Signed in!');
    } else {
        console.log('Signed out!');
    }
});

// Unsubscribe
unsubscribe();
```

### CalendarSyncService

```javascript
import { calendarSyncService } from './js/calendarSync.js';

// ===== ENABLE/DISABLE SYNC =====

// Enable automatic sync
calendarSyncService.enableSync(() => getTodos());

// Disable sync
calendarSyncService.disableSync();

// ===== MANUAL SYNC =====

// Perform full sync
await calendarSyncService.performSync();

// Sync specific todo
await calendarSyncService.syncTodoToCalendar(todo);

// Remove sync for todo
await calendarSyncService.unsyncTodo(todoId);

// ===== STATUS =====

// Check if todo is synced
const isSynced = calendarSyncService.isSynced(todoId);

// Get calendar event ID for todo
const eventId = calendarSyncService.getEventId(todoId);

// Get sync status
const status = calendarSyncService.getSyncStatus();
console.log(status);
// {
//   enabled: true,
//   lastSync: Date,
//   syncedCount: 5,
//   authenticated: true
// }

// ===== EVENTS =====

// Listen for sync completion
window.addEventListener('calendarSynced', (event) => {
    console.log('Synced at:', event.detail.timestamp);
});

// Listen for todo synced to calendar
window.addEventListener('todoSyncedToCalendar', (event) => {
    const { todo, event: calendarEvent } = event.detail;
    console.log(`Todo "${todo.text}" synced to calendar`);
});

// Listen for new calendar events
window.addEventListener('newCalendarEvents', (event) => {
    const events = event.detail.events;
    console.log(`${events.length} new calendar events`);
});
```

## 🎯 Integration med Bifrost

### Med Todo-systemet

Todos med `dueDate` synkas automatiskt:

```javascript
// Add todo med datum
const todo = {
    text: "Submit report",
    dueDate: "2025-11-15",
    priority: "high",
    tags: ["work", "important"]
};

// → Skapas automatiskt i Google Calendar
// → Visas i deadline warnings
// → Tracked i stats
```

### Med Deadline Warnings

Calendar events integreras med deadline system:

```javascript
// Deadline warnings inkluderar calendar events
deadlineService.analyzeAllTodos(todos);
// → Inkluderar synkade calendar events
```

### Med Statistics

Calendar sync stats trackas:

```javascript
statsService.trackCalendarSync({
    todosSynced: 5,
    eventsCreated: 3,
    timestamp: new Date()
});
```

## ⚙️ Konfiguration

### Sync Frequency

Ändra hur ofta synk körs:

```javascript
// I calendarSync.js
this.syncFrequency = 10 * 60 * 1000; // 10 minuter
```

### Event Reminders

Anpassa reminders för skapade events:

```javascript
// I googleCalendarService.js, createEventFromTodo()
reminders: {
    useDefault: false,
    overrides: [
        { method: 'popup', minutes: 60 },  // 1 hour before
        { method: 'email', minutes: 1440 }  // 1 day before
    ]
}
```

### Time Zone

Sätt din tidszon:

```javascript
const event = {
    start: {
        dateTime: '2025-11-10T14:00:00',
        timeZone: 'Europe/Stockholm'  // Din tidszon
    }
};
```

## 🎨 Styling

### Calendar Widget

Widgeten har inbyggd styling med Shadow DOM:

```css
/* I calendarWidget.js */
.event-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-left: 4px solid #4285f4;
    border-radius: 8px;
    padding: 1rem;
}

.event-card.all-day {
    border-left-color: #34a853; /* Grön för all-day events */
}
```

### Dark Theme

Fullständigt dark theme-stöd:

```css
:host(.dark-theme) .calendar-container {
    background: #2d3748;
}

:host(.dark-theme) .event-card {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
}
```

## 🔒 Säkerhet & Privacy

### OAuth 2.0

- Säker autentisering via Google
- Endast läs/skriv till DIN kalender
- Ingen access till andra Google-tjänster

### Token Storage

- Access tokens lagras i localStorage
- Automatisk expiry efter 1 timme
- Re-authentication vid behov

### Permissions

Bifrost ber om dessa permissions:
- `calendar.readonly` - Läsa calendar events
- `calendar.events` - Skapa/uppdatera/ta bort events

### Data Privacy

- All sync är lokal (Bifrost ↔ Google)
- Ingen data skickas till tredje part
- Du kontrollerar all data

## 📊 Sync Logic

### Todo → Calendar

**När synkas en todo?**
1. Todo har `dueDate`
2. Todo är inte completed
3. Todo är från Bifrost (inte Obsidian)

**Vad händer?**
1. All-day event skapas på `dueDate`
2. Event title = todo text
3. Event description inkluderar priority
4. Tags sparas i extended properties
5. Mapping sparas (todo ID → event ID)

**Updates:**
- Om todo text ändras → event title uppdateras
- Om dueDate ändras → event flyttas
- Om todo completed → event tas bort

### Calendar → Todo (Future)

Planerad funktionalitet:
- Calendar events → nya todos
- Bilateral sync
- Conflict resolution

## 🆘 Troubleshooting

### "Failed to load credentials"

**Problem:** `google-credentials.json` saknas eller ogiltig

**Lösning:**
1. Kontrollera att filen finns i root
2. Verifiera JSON-format
3. Kolla client_id och api_key

### "Not authenticated"

**Problem:** OAuth token expired eller revoked

**Lösning:**
1. Sign out
2. Sign in igen
3. Godkänn permissions på nytt

### "Access blocked: Bifrost has not completed verification"

**Problem:** OAuth consent screen i test mode

**Lösning:**
1. Klicka "Advanced"
2. Klicka "Go to Bifrost (unsafe)"
3. Detta är säkert - det är din egen app!

### Events visas inte

**Problem:** Events kanske inte är i rätt tidsintervall

**Lösning:**
1. Klicka refresh 🔄
2. Kontrollera att events är idag
3. Kolla browser console för errors

### Todos synkas inte

**Problem:** Sync kanske inte är enabled

**Lösning:**
```javascript
// Check sync status
console.log(calendarSyncService.getSyncStatus());

// Enable sync manually
calendarSyncService.enableSync(() => todos);

// Perform manual sync
await calendarSyncService.performSync();
```

### "Redirect URI mismatch"

**Problem:** Callback URL matchar inte Google Cloud config

**Lösning:**
1. Gå till Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Lägg till exakt URL (inklusive port)

## 🔮 Future Features

Planerade förbättringar:

- 📅 **Calendar View** - Månadsvy med alla events
- 🔄 **Bilateral Sync** - Calendar events → Bifrost todos automatiskt
- 🎨 **Custom Event Colors** - Färgkodning per kategori
- ⏰ **Custom Reminders** - Anpassningsbara notifications
- 📊 **Calendar Analytics** - Stats över calendar usage
- 🗓️ **Multiple Calendars** - Stöd för flera kalendrar
- 👥 **Shared Events** - Hantering av delade events
- 🔗 **Deep Linking** - Öppna events direkt i Google Calendar
- 📱 **Mobile Optimization** - Förbättrad mobile experience
- 🌐 **Timezone Support** - Bättre hantering av tidszoner

## 💡 Tips & Best Practices

### Organisera med Tags

Använd tags för att organisera synkade events:

```javascript
const todo = {
    text: "Team meeting",
    dueDate: "2025-11-15",
    tags: ["work", "meetings", "weekly"]
};
// → Tags sparas i calendar event
```

### Priority Mapping

- `high` priority → Röd färg i calendar (future)
- `medium` priority → Orange färg
- `low` priority → Standard färg

### Kombinera med Deadlines

Deadline warnings arbetar tillsammans med calendar sync:

```javascript
// Urgent deadlines + calendar events
const urgentItems = [
    ...deadlineService.getUrgentTodos(todos),
    ...todaysCalendarEvents
];
```

### Batch Operations

För många todos, använd batch sync:

```javascript
// Disable auto-sync under bulk operations
calendarSyncService.disableSync();

// Add many todos
todos.forEach(t => addTodo(t));

// Manual sync once
await calendarSyncService.performSync();

// Re-enable auto-sync
calendarSyncService.enableSync(() => todos);
```

## 📚 Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Explorer](https://developers.google.com/calendar/api/v3/reference)

## Support

Frågor eller problem? Öppna en issue på GitHub! 🚀
