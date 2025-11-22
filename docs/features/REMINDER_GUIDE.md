# 🔔 Påminnelser & Snooze Guide

En komplett guide till Bifrosts påminnelse-system - schemalagda påminnelser, snooze-funktionalitet och notifikationer.

## 📋 Innehållsförteckning

- [Snabbstart](#snabbstart)
- [Påminnelsetyper](#påminnelsetyper)
- [Snooze-funktioner](#snooze-funktioner)
- [Notifikationer](#notifikationer)
- [Widget-funktioner](#widget-funktioner)
- [Natural Language Parsing](#natural-language-parsing)
- [Avancerad användning](#avancerad-användning)
- [Integration](#integration)
- [Use Cases](#use-cases)
- [Felsökning](#felsökning)
- [API-referens](#api-referens)
- [Datalagring](#datalagring)
- [Tips & Best Practices](#tips--best-practices)

---

## Snabbstart

### Skapa påminnelse via Quick Add

Skriv naturligt i Quick Add-fältet (Ctrl+K):

```
Köp mjölk påminn mig om 30min #inköp
```

System parsar automatiskt:
- **Text**: "Köp mjölk"
- **Påminnelse**: Om 30 minuter från nu
- **Tag**: #inköp

### Snooze en todo

Klicka på 💤-knappen på en todo → välj snooze-tid från dropdown.

### Visa aktiva påminnelser

Påminnelse-widgeten visar:
- **Aktiva påminnelser** med countdown
- **Kommande 24h** - antal påminnelser
- **Snoozade** - antal snoozade todos

---

## Påminnelsetyper

### 1. Tidsbaserade påminnelser

Påminn X tid från nu:

**Quick Add exempel:**
```
Ring tandläkaren påminn mig om 1h
Hämta paket påminn om 30min
Kolla mail påminn om 3h
```

**Stödda tidsenheter:**
- `min` / `minuter` - Minuter
- `h` / `tim` / `timmar` - Timmar
- `d` / `dag` / `dagar` - Dagar

**Resultat:**
- Påminnelse skapas X tid från nu
- Browser notification vid triggering (om tillåtet)
- Fallback till in-app toast om notifications blockerade

### 2. Deadline-relativa påminnelser

Påminn X före deadline:

**Quick Add exempel:**
```
Möt Anna imorgon 14:00 påminn 1h innan #arbete
Projektredovisning 2024-12-20 14:00 påminn 1 dag innan [!high]
```

**Funktion:**
- Beräknar deadline från `dueDate` + `dueTime`
- Skapar påminnelse X tid **innan** deadline
- Kräver att todon har `dueDate` satt

**Fördelar:**
- Alltid rätt tid före deadline
- Följer med om deadline ändras (manual update krävs)
- Perfekt för deadlines

### 3. Specifik tid påminnelser

Påminn vid exakt tidpunkt:

**Quick Add exempel:**
```
Påminn mig imorgon 09:00 #morgonrutin
Påminn idag 15:30 #tandläkare
```

**Funktion:**
- `imorgon` / `tomorrow` → nästa dag
- `idag` / `today` → samma dag
- Tid anges med `HH:MM` format

---

## Snooze-funktioner

### Snooze-presets

Klicka på 💤-knappen på en todo → dropdown med:

| Preset | Tid |
|--------|-----|
| **10 minuter** | +10 minuter från nu |
| **30 minuter** | +30 minuter från nu |
| **1 timme** | +1 timme från nu |
| **3 timmar** | +3 timmar från nu |
| **Imorgon 09:00** | Nästa dag kl 09:00 |
| **1 dag** | +24 timmar från nu |

### Hur snooze fungerar

1. **Välj snooze** på en todo
2. **Tidigare påminnelser raderas** (undvik duplicates)
3. **Ny påminnelse skapas** med vald tid
4. **Snoozed-indikator** (💤) visas på todon
5. **Snooze-räknare** ökar (visas i widget)

### Snooze via Natural Language

Du kan också snooze direkt via Quick Add:

```
snooze +10min  # Snooze aktuell todo 10 min
snooza 30min   # Svensk variant
```

⚠️ **Obs:** Detta kräver att du refererar till en befintlig todo (implementera todo-selection om önskat).

---

## Notifikationer

### Browser Notifications

Bifrost använder **Web Notifications API** för desktop-notiser.

**Aktivera notifications:**

1. Klicka **"Aktivera"** i påminnelse-widget bannern
2. Webbläsaren frågar om permission
3. Välj **"Tillåt"**

**När notifications triggas:**
- Desktop notification visas med todo-text
- Klicka på notification → fokusera Bifrost
- Notification stannar kvar tills du interagerar

### Fallback till Toast

Om notifications blockerade/nekade:
- In-app toast-meddelande visas istället
- Todo highlightas med gul blink-animation
- Lika funktionellt men kräver att fliken är öppen

### Permission-hantering

**Tre states:**
1. **default** - Ej frågat än → visar "Aktivera"-knapp
2. **granted** - Tillåten → desktop notifications fungerar
3. **denied** - Blockerad → visar varning med instruktioner

**Ändra permission:**
- Chrome: `chrome://settings/content/notifications`
- Firefox: Inställningar → Integritet → Behörigheter → Meddelanden
- Safari: Safari → Inställningar → Webbplatser → Meddelanden

---

## Widget-funktioner

### Påminnelse-widget

Visar alla aktiva påminnelser med:

#### Statistik-rad

```
Aktiva: 3    Snoozade: 1    Kommande 24h: 2
```

- **Aktiva** - Totalt antal ej-triggade påminnelser
- **Snoozade** - Antal påminnelser från snooze
- **Kommande 24h** - Påminnelser inom 24 timmar

#### Påminnelse-kort

Varje påminnelse visar:

**Header:**
- **Text** - Todo-text
- **Typ-badge** - "Manuell" / "Snoozad" / "Deadline"

**Meta:**
- **Countdown** ⏰ - "2h 15min" / "Imorgon 09:00"
- **Exakt tid** 📅 - "Idag 14:30" / "Dec 20 09:00"
- **Snooze-räknare** 💤 - "Snoozad 2x" (om snoozed)

**Färgkodning:**
- **Röd countdown** (⚡) - Mindre än 10 minuter kvar
- **Orange countdown** - Mindre än 1 timme kvar
- **Lila bakgrund** - Snoozade påminnelser
- **Röd bakgrund** - Urgenta påminnelser

**Actions:**
- **Avbryt** - Radera påminnelse

### Live Countdown

Widget uppdaterar countdowns varje minut:
- "2h 15min" → "2h 14min"
- Ändrar färg när urgent (< 1h)
- Blinkar när väldigt urgent (< 10 min)

---

## Natural Language Parsing

### Påminnelse-patterns

ReminderService känner igen följande patterns:

#### "påminn (mig) om X"

Svenska/Engelska:
```
påminn mig om 30min
påminn om 1h
remind me in 2h
remind in 45min
```

**Regex:** `/\b(?:påminn|remind)(?:\s+mig)?\s+(?:om|in)\s+(\d+)\s*(min|h|tim|dag|day)/i`

#### "påminn X innan"

Före deadline:
```
påminn 1h innan
påminn mig 30min innan
remind 1 day before
remind 2h before
```

**Regex:** `/\b(?:påminn|remind)(?:\s+mig)?\s+(\d+)\s*(min|h|tim|dag|day)\s+(?:innan|före|before)/i`

#### "påminn mig (dag) (tid)"

Exakt tidpunkt:
```
påminn mig imorgon 09:00
påminn idag 15:30
remind me tomorrow 14:00
remind today 10:00
```

**Regex:** `/\b(?:påminn|remind)(?:\s+mig)?\s+(?:imorgon|tomorrow|idag|today)\s+(?:kl\.?\s*)?(\d{1,2}):?(\d{2})?/i`

#### "snooze +X"

Snooze-kommando:
```
snooze +10min
snooze 30min
snooza +1h
```

**Regex:** `/\b(snooze|snooza)\s*\+?(\d+)\s*(min|h|tim|hour)/i`

### Parser-resultat

Parsed reminder-objekt innehåller:

```javascript
{
    type: 'in-time' | 'before-deadline' | 'at-time' | 'snooze',
    offset: '1h' | '30min' | '2d',  // För in-time/before-deadline
    offsetDisplay: '1h innan',        // Human-readable
    when: 'today' | 'tomorrow',      // För at-time
    time: '09:00',                   // För at-time
    preset: '+30min',                // För snooze
    matched: 'påminn mig om 1h'      // Matchad text (raderas från input)
}
```

---

## Avancerad användning

### Programmatisk API

Skapa påminnelser via JavaScript:

```typescript
import reminderService from './dist/services/reminderService.js';

// Skapa tidbaserad påminnelse
const reminder = reminderService.createReminder({
    todoId: 'todo-123',
    text: 'Köp mjölk',
    remindAt: new Date(Date.now() + 30 * 60 * 1000), // +30 min
    type: 'manual',
    priority: 'medium',
    tags: ['inköp']
});

// Skapa deadline-relativ påminnelse
const todo = {
    id: 'todo-456',
    text: 'Projektredovisning',
    dueDate: '2024-12-20',
    dueTime: '14:00',
    priority: 'high'
};

reminderService.createDeadlineReminder(todo, '1h');

// Snooze en todo
reminderService.snoozeTodo('todo-123', '1h', todo);

// Avbryt påminnelse
reminderService.cancelReminder('reminder-id');

// Hämta aktiva påminnelser
const active = reminderService.getActiveReminders();
console.log('Aktiva påminnelser:', active);
```

### Event-subscription

Lyssna på reminder-events:

```javascript
// Påminnelse triggad
reminderService.subscribe('reminderTriggered', (reminder) => {
    console.log('🔔 Påminnelse:', reminder.text);
    // Visa custom notification
});

// Todo snoozad
reminderService.subscribe('todoSnoozed', ({ todoId, reminder, preset }) => {
    console.log(`💤 Todo ${todoId} snoozad till ${reminder.remindAt}`);
});

// Påminnelse skapad
reminderService.subscribe('reminderCreated', (reminder) => {
    console.log('✓ Påminnelse skapad:', reminder);
});

// Påminnelse avbruten
reminderService.subscribe('reminderCancelled', (reminder) => {
    console.log('❌ Påminnelse avbruten:', reminder);
});

// Notification permission ändrad
reminderService.subscribe('notificationPermissionChanged', (permission) => {
    console.log('Notification permission:', permission);
});
```

### Custom snooze-presets

Lägg till egna snooze-tider:

```javascript
// I reminderService.js
this.snoozePresets = {
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '45min': 45 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    'lunch': null  // Special case
};

// Hantera special case i calculateSnoozeTime
if (preset === 'lunch') {
    const lunch = new Date();
    lunch.setHours(12, 0, 0, 0);
    if (lunch < new Date()) {
        lunch.setDate(lunch.getDate() + 1); // Nästa dag om lunch passerat
    }
    return lunch;
}
```

---

## Integration

### Med Stats-systemet

Påminnelser räknas i statistik:

```javascript
statsService.trackReminderTriggered(reminder);
statsService.getRemindersThisWeek();
statsService.getMostSnoozedTodos();
```

### Med Deadline-systemet

Deadline-relativa påminnelser:

```javascript
// DeadlineService kan skapa påminnelser automatiskt
deadlineService.on('deadlineSoon', (todo) => {
    if (todo.autoRemind) {
        reminderService.createDeadlineReminder(todo, '1h');
    }
});
```

### Med Calendar-systemet

Synka påminnelser till Google Calendar:

```javascript
// Calendar events får notifications från Calendar + Bifrost reminders
calendarSyncService.on('eventCreated', (event) => {
    if (event.reminders?.useDefault) {
        // Lägg till Bifrost-påminnelse parallellt
        reminderService.createReminder({
            todoId: event.bifrostTodoId,
            text: event.summary,
            remindAt: new Date(event.start.dateTime - 60 * 60 * 1000),
            type: 'deadline-relative'
        });
    }
});
```

### Med Pomodoro-timer

Påminn efter Pomodoro-session:

```javascript
pomodoroService.on('sessionComplete', () => {
    reminderService.createReminder({
        todoId: 'break-reminder',
        text: 'Dags för nästa Pomodoro!',
        remindAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min break
        type: 'manual',
        priority: 'low'
    });
});
```

---

## Use Cases

### 1. Morgonrutin

Schemalägg dagens uppgifter:

```
Påminn mig imorgon 07:00 #morgon
Träna påminn imorgon 07:30 #gym
Frukost påminn imorgon 08:00 #mat
```

### 2. Arbetsdag

Möten och deadlines:

```
Standup-möte varje dag 09:00 påminn 10min innan #arbete
Lunchmöte imorgon 12:00 påminn 30min innan #möten
Projektredovisning 2024-12-20 14:00 påminn 1 dag innan [!high]
```

### 3. Inköp & ärenden

Påminn när du ska handla:

```
Köp mjölk påminn om 2h #inköp
Hämta paket påminn imorgon 10:00 #ärenden
Apoteket stänger 18:00 påminn 1h innan #ärenden
```

### 4. Medicinering

Dagliga mediciner:

```
Ta medicin varje dag 08:00 påminn 08:00 #hälsa [!high]
Ta medicin varje dag 20:00 påminn 20:00 #hälsa [!high]
```

### 5. Fokusarbete

Undvik distraktion med snooze:

```
Telefon ringer → Snooze +30min
Email kom in → Snooze +1h (efter focus-session)
```

### 6. Återkommande uppgifter + påminnelser

Kombinera recurring + reminders:

```
Betala hyra varje månad den 1:a påminn 1 dag innan #ekonomi [!high]
Veckomöte varje måndag 10:00 påminn 30min innan #arbete
Backup varje vecka påminn om 1h #tech
```

---

## Felsökning

### Notifications visas inte

**Problem:** Desktop notifications triggat ej.

**Lösningar:**

1. **Kontrollera permission:**
   ```javascript
   console.log('Notification permission:', Notification.permission);
   ```
   - Om `denied` → Ändra i webbläsarinställningar
   - Om `default` → Klicka "Aktivera" i widget

2. **Kontrollera browser support:**
   ```javascript
   if (!('Notification' in window)) {
       console.error('Browser stödjer inte notifications');
   }
   ```

3. **Kontrollera OS-inställningar:**
   - **Windows:** Inställningar → System → Notifications → Chrome
   - **macOS:** Systeminställningar → Notiser → Chrome
   - **Linux:** Varierar per distro

4. **Fallback till toast:**
   - Bifrost visar in-app toast automatiskt om notifications blockerade

### Påminnelse triggas inte

**Problem:** Påminnelse skapades men inget hände vid triggering.

**Lösningar:**

1. **Kontrollera monitoring:**
   ```javascript
   console.log('Monitoring active:', reminderService.checkInterval !== null);
   ```
   - Ska vara `true`
   - Startas automatiskt i konstruktor

2. **Kontrollera påminnelse-tid:**
   ```javascript
   const reminders = reminderService.getActiveReminders();
   console.log('Aktiva påminnelser:', reminders);
   ```
   - Är `remindAt` i framtiden?
   - Är `triggered` = `false`?

3. **Manuell check:**
   ```javascript
   reminderService.checkReminders();
   ```

4. **Check intervall för långt:**
   - Standard: 30 sekunder
   - Öka frekvens om nödvändigt:
     ```javascript
     reminderService.startMonitoring(10000); // 10s intervall
     ```

### Snooze fungerar inte

**Problem:** Snooze-knapp reagerar inte.

**Lösningar:**

1. **Kontrollera todo source:**
   - Snooze endast för `source === 'bifrost'`
   - Obsidian todos kan ej snoozas

2. **Kontrollera completed status:**
   - Kan ej snooze avklarade todos
   - Endast `completed === false`

3. **JavaScript-fel:**
   - Öppna DevTools → Console
   - Sök efter fel-meddelanden

### Gamla påminnelser stannar kvar

**Problem:** Gamla påminnelser raderas inte.

**Lösningar:**

1. **Automatisk cleanup:**
   - Körs var 30:e sekund i `checkReminders()`
   - Raderar triggered påminnelser äldre än 7 dagar

2. **Manuell cleanup:**
   ```javascript
   reminderService.cleanupOldReminders();
   ```

3. **Radera alla:**
   ```javascript
   localStorage.removeItem('reminders');
   location.reload();
   ```

### Duplicerade påminnelser

**Problem:** Flera påminnelser för samma todo.

**Lösningar:**

1. **Snooze tar bort tidigare:**
   - `snoozeTodo()` raderar tidigare påminnelser för samma todo
   - Kontrollera att rätt todoId används

2. **Manuell radering:**
   ```javascript
   reminderService.cancelRemindersForTodo(todoId);
   ```

---

## API-referens

### ReminderService

#### `createReminder(reminderData)`

Skapa en påminnelse.

**Parameters:**
```javascript
{
    todoId: string,        // Required
    text: string,          // Required
    remindAt: Date,        // Required
    type: 'manual' | 'deadline-relative' | 'snoozed',
    priority: 'low' | 'medium' | 'high',
    tags: string[]
}
```

**Returns:** `Object` - Skapad påminnelse

**Example:**
```javascript
const reminder = reminderService.createReminder({
    todoId: 'todo-123',
    text: 'Köp mjölk',
    remindAt: new Date(Date.now() + 30 * 60 * 1000),
    type: 'manual',
    priority: 'medium',
    tags: ['inköp']
});
```

#### `snoozeTodo(todoId, preset, todo)`

Snooze en todo.

**Parameters:**
- `todoId` (string): Todo ID
- `preset` (string): Snooze preset ('10min', '1h', 'tomorrow9am', etc.)
- `todo` (Object): Todo-objekt med text, priority, tags

**Returns:** `Object` - Skapad påminnelse

**Example:**
```javascript
reminderService.snoozeTodo('todo-123', '30min', {
    text: 'Köp mjölk',
    priority: 'medium',
    tags: ['inköp']
});
```

#### `createDeadlineReminder(todo, offset)`

Skapa deadline-relativ påminnelse.

**Parameters:**
- `todo` (Object): Todo med `dueDate` (och optional `dueTime`)
- `offset` (string): Tid innan deadline ('1h', '30min', '1day')

**Returns:** `Object|null` - Påminnelse eller null om ingen deadline

**Example:**
```javascript
const todo = {
    id: 'todo-456',
    text: 'Projektredovisning',
    dueDate: '2024-12-20',
    dueTime: '14:00'
};
reminderService.createDeadlineReminder(todo, '1h');
```

#### `getActiveReminders()`

Hämta aktiva påminnelser.

**Returns:** `Array` - Aktiva påminnelser sorterade efter tid

**Example:**
```javascript
const active = reminderService.getActiveReminders();
console.log(`${active.length} aktiva påminnelser`);
```

#### `cancelReminder(reminderId)`

Avbryt en påminnelse.

**Parameters:**
- `reminderId` (string): Påminnelse ID

**Example:**
```javascript
reminderService.cancelReminder('reminder-abc123');
```

#### `cancelRemindersForTodo(todoId)`

Avbryt alla påminnelser för en todo.

**Parameters:**
- `todoId` (string): Todo ID

**Example:**
```javascript
reminderService.cancelRemindersForTodo('todo-123');
```

#### `requestNotificationPermission()`

Begär notification permission från användaren.

**Returns:** `Promise<string>` - 'granted', 'denied', eller 'default'

**Example:**
```javascript
const permission = await reminderService.requestNotificationPermission();
if (permission === 'granted') {
    console.log('Notifications aktiverade!');
}
```

#### `getStats()`

Hämta statistik om påminnelser.

**Returns:** `Object`

```javascript
{
    total: number,
    active: number,
    snoozed: number,
    upcoming24h: number,
    triggered: number,
    byType: {
        manual: number,
        snoozed: number,
        deadlineRelative: number
    }
}
```

**Example:**
```javascript
const stats = reminderService.getStats();
console.log(`${stats.active} aktiva, ${stats.snoozed} snoozade`);
```

---

## Datalagring

### localStorage structure

Påminnelser lagras i `localStorage` med nyckeln `'reminders'`:

```javascript
{
    "reminders": [
        {
            "id": "reminder_1702567890123_abc123",
            "todoId": "todo-456",
            "text": "Köp mjölk",
            "remindAt": "2024-12-20T14:00:00.000Z",
            "type": "manual",
            "priority": "medium",
            "tags": ["inköp"],
            "createdAt": "2024-12-19T12:30:00.000Z",
            "snoozedAt": null,
            "snoozeCount": 0,
            "triggered": false
        }
    ]
}
```

### Export påminnelser

```javascript
// Export till JSON
const reminders = localStorage.getItem('reminders');
const blob = new Blob([reminders], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'bifrost-reminders-backup.json';
a.click();
```

### Import påminnelser

```javascript
// Import från JSON
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'application/json';
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        localStorage.setItem('reminders', event.target.result);
        location.reload();
    };
    reader.readAsText(file);
};
fileInput.click();
```

---

## Tips & Best Practices

### 1. Använd snooze istället för att ignorera

När en påminnelse triggas och du inte kan hantera den direkt:
→ **Snooze +30min** istället för att dismissa

**Fördelar:**
- Glöm inte uppgiften
- Flexibilitet
- Statistik spårar snooze-frekvens

### 2. Kombinera deadlines med påminnelser

Alla deadlines bör ha påminnelse **1h innan**:

```
Projektredovisning 2024-12-20 14:00 påminn 1h innan [!high]
```

**Fördelar:**
- Mindre stress
- Hinner förbereda sig
- Backup om kalendersync misslyckas

### 3. Morgonrutin med påminnelser

Skapa en serie påminnelser för morgon:

```
Vakna påminn imorgon 07:00 #morgon
Träna påminn imorgon 07:30 #gym
Frukost påminn imorgon 08:00 #mat
Pendla påminn imorgon 08:45 #resa
```

**Resultat:**
- Strukturerad morgon
- Alla påminnelser redo kvällen innan
- Widget visar hela morgon-schemat

### 4. Använd rätt snooze-tid

**För korta uppgifter (5-10 min):**
→ Snooze **10-30 min**

**För längre uppgifter (30+ min):**
→ Snooze **1-3h** eller **imorgon 09:00**

**För ärenden med öppettider:**
→ Snooze **1h innan stängning**

### 5. Batch-snooze vid fokusarbete

När du jobbar fokuserat:
- Snooze alla inkommande påminnelser **+1h**
- Efter focus-session → hantera alla på en gång
- Kombinera med Pomodoro-timer

### 6. Notification permissions

**Aktivera alltid notifications:**
- Desktop notifications fungerar även när fliken i bakgrunden
- Viktigare påminnelser (high priority) får mer uppmärksamhet
- Kombinera med system-ljud för extra tydlighet

### 7. Återkommande + påminnelse

För viktiga återkommande uppgifter:

```
Betala hyra varje månad den 1:a påminn 1 dag innan #ekonomi [!high]
```

**Resultat:**
- Recurring pattern skapar todo varje månad
- Påminnelse 1 dag innan automatiskt
- Dubbel säkerhet mot att glömma

### 8. Cleanup regelbundet

Kontrollera widget varje vecka:
- Avbryt irrelevanta påminnelser
- Städa gamla snoozade todos
- Automatisk cleanup raderar gamla (7+ dagar)

### 9. Integrera med Calendar

Använd Bifrost + Google Calendar tillsammans:
- **Calendar** - Möten och events
- **Bifrost reminders** - Personliga påminnelser
- Bästa av två världar

### 10. Experiment med monitoring-intervall

För kritiska påminnelser (sekund-precision):

```javascript
reminderService.stopMonitoring();
reminderService.startMonitoring(5000); // 5s intervall
```

**Trade-off:**
- ✅ Mer exakta triggeringar
- ❌ Högre CPU-användning

---

## Sammanfattning

Bifrost Reminders ger dig:

✅ **3 påminnelsetyper** - Tidsbaserad, deadline-relativ, exakt tid  
✅ **Snooze-presets** - 6 färdiga snooze-tider  
✅ **Natural language** - "påminn mig om 1h"  
✅ **Desktop notifications** - Med fallback till toast  
✅ **Live countdown** - Widget uppdaterar varje minut  
✅ **Integration** - Stats, Deadlines, Calendar, Pomodoro  
✅ **Edge cases** - Cleanup, permissions, tab closed  
✅ **Dark theme** - Fullt stöd  

**Börja använda:**
1. Aktivera notifications i widget
2. Skapa första påminnelse via Quick Add
3. Testa snooze på en todo
4. Utforska deadline-relativa påminnelser

Lycka till! 🔔✨
