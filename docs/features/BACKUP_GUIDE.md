# Backup & Export Guide

En omfattande guide för Bifrosts backup- och exportfunktionalitet med JSON-export/import och säker datahantering.

## Översikt

BackupWidget tillhandahåller:
- **JSON-export** av all applikationsdata
- **Import** för återställning av data
- **Tidsstämplade filer** för versionshantering
- **Statistik** över exporterad data
- **Säkerhetsbekräftelse** vid import
- **Footer-knapp** för snabb åtkomst

---

## Snabbstart

### Exportera data

```
Tryck Ctrl+Shift+B (eller klicka 💾 Backup i footer)
    ↓
Modal öppnas med statistik
    ↓
Klicka 📥 Exportera Data
    ↓
bifrost-backup-YYYY-MM-DDTHH-MM-SS.json laddas ner
```

### Importera data

```
Tryck Ctrl+Shift+B
    ↓
Klicka 📤 Importera Data
    ↓
Välj .json-fil
    ↓
Bekräfta varning (ersätter befintlig data)
    ↓
Sidan laddas om automatiskt
```

---

## Funktioner

### 1. Export

Exporterar all applikationsdata till JSON-fil:

**Inkluderat:**
- Todos (aktiva och färdiga)
- Snabblänkar
- Återkommande uppgifter
- Deadlines
- Påminnelser
- Pomodoro-inställningar
- Temaval (dark/light)
- Widget-inställningar
- Alla localStorage-nycklar

**Filformat:**
```json
{
    "todos": [...],
    "links": [...],
    "recurring": [...],
    "deadlines": [...],
    "reminders": [...],
    "settings": {...},
    "theme": "dark",
    "exportDate": "2025-11-20T15:30:00.000Z",
    "version": "1.0.0"
}
```

**Filnamn:**
```
bifrost-backup-2025-11-20T15-30-00.json
```

### 2. Import

Importerar data från JSON-fil:

**Steg:**
1. Välj .json-fil från dator
2. Filens innehåll läses och valideras
3. Bekräfta varning (nuvarande data ersätts)
4. Data importeras till localStorage via StateManager
5. Sidan laddas om för att applicera ändringar

**Säkerhet:**
- ⚠️ Varningsmeddelande visas innan import
- ✅ JSON-validering före import
- ✅ Automatisk reload för att undvika inkonsistent state

### 3. Statistik

Visar översikt före export:

```
Data att exportera:
  • 42 items i databasen
  • Total storlek: 15.3 KB
```

**Beräkning:**
- Antal items = summa av alla localStorage-nycklar
- Storlek = Blob.size i bytes, formaterat till KB/MB

---

## Användning

### Tangentbordsgenvägar

| Genväg | Funktion |
|--------|----------|
| `Ctrl + Shift + B` | Öppna backup modal |
| `Escape` | Stäng modal |

### UI-kontroller

**Footer-knapp:**
```html
<footer class="footer">
    <button id="backup-btn" class="backup-btn">
        💾 Backup
    </button>
</footer>
```

**Modal:**
```
┌─────────────────────────────────────┐
│  Backup & Export           [✕]      │
├─────────────────────────────────────┤
│  Data att exportera:                │
│    • 42 items i databasen           │
│    • Total storlek: 15.3 KB         │
│                                      │
│  [📥 Exportera Data]                │
│  [📤 Importera Data]                │
│                                      │
│  ⚠️ OBS: Import ersätter befintlig  │
│  data. Exportera innan import för   │
│  säkerhetskopia.                    │
└─────────────────────────────────────┘
```

---

## API

### BackupWidget

```javascript
const backupWidget = document.querySelector('backup-widget');

// Öppna modal
backupWidget.open();

// Stäng modal
backupWidget.close();

// Toggle
backupWidget.toggle();

// Exportera programmatiskt
backupWidget.exportData();

// Importera från File-objekt
const file = event.target.files[0];
backupWidget.importData(file);
```

### StateManager (används av BackupWidget)

```javascript
import { stateManager } from './core/stateManager.js';

// Exportera all data
const data = stateManager.exportAll();
// { todos: [...], links: [...], ... }

// Importera data
stateManager.importAll({
    todos: [...],
    links: [...]
});
```

---

## EventBus Integration

BackupWidget emitterar events:

```javascript
import eventBus from './core/eventBus.js';

// Export success
eventBus.on('backup:exported', ({ itemCount, size }) => {
    console.log(`Exported ${itemCount} items (${size} bytes)`);
});

// Export error
eventBus.on('backup:export-failed', ({ error }) => {
    console.error('Export failed:', error);
});

// Import success
eventBus.on('backup:imported', ({ itemCount }) => {
    console.log(`Imported ${itemCount} items`);
});

// Import error
eventBus.on('backup:import-failed', ({ error }) => {
    console.error('Import failed:', error);
});
```

---

## Filformat

### Grundläggande struktur

```json
{
    "version": "1.0.0",
    "exportDate": "2025-11-20T15:30:00.000Z",
    "todos": [],
    "links": [],
    "recurring": [],
    "deadlines": [],
    "reminders": [],
    "settings": {},
    "theme": "dark"
}
```

### Exempel med data

```json
{
    "version": "1.0.0",
    "exportDate": "2025-11-20T15:30:00.000Z",
    "todos": [
        {
            "id": "todo-123",
            "text": "Köp mjölk",
            "completed": false,
            "createdAt": "2025-11-19T10:00:00.000Z"
        }
    ],
    "links": [
        {
            "id": "link-1",
            "title": "GitHub",
            "url": "https://github.com",
            "order": 1
        }
    ],
    "settings": {
        "pomodoroWorkDuration": 25,
        "pomodoroBreakDuration": 5,
        "notificationsEnabled": true
    },
    "theme": "dark"
}
```

---

## Användningsfall

### 1. Regelbunden backup

```javascript
// Automatisk backup varje vecka
setInterval(() => {
    const backupWidget = document.querySelector('backup-widget');
    backupWidget.exportData();
}, 7 * 24 * 60 * 60 * 1000); // 7 dagar
```

### 2. Flytta data mellan datorer

**Dator A:**
1. Tryck `Ctrl+Shift+B`
2. Klicka `📥 Exportera Data`
3. Spara `bifrost-backup-2025-11-20T15-30-00.json`

**Dator B:**
1. Öppna Bifrost
2. Tryck `Ctrl+Shift+B`
3. Klicka `📤 Importera Data`
4. Välj fil från Dator A
5. Bekräfta import

### 3. Återställning efter dataförlust

```javascript
// Om localStorage töms av misstag
const backupWidget = document.querySelector('backup-widget');
backupWidget.open();
// Importera senaste backup-fil
```

### 4. Versionshantering

Spara backup före stora ändringar:

```
bifrost-backup-2025-11-20T10-00-00.json  (före ändring)
bifrost-backup-2025-11-20T15-30-00.json  (efter ändring)
```

---

## Säkerhet

### Varningar

⚠️ **Import ersätter ALL befintlig data**
- Exportera alltid innan import
- Spara backup-filer på säker plats
- Verifiera filinnehåll före import

### Validering

BackupWidget validerar:
- ✅ Fil är JSON-format
- ✅ JSON kan parsas utan fel
- ✅ Användarbekräftelse före import

**Ingen validering av:**
- ❌ Dataintegritet (korrupta todos, etc.)
- ❌ Versionskompabilitet
- ❌ Schema-validering

**Rekommendation:** Implementera ytterligare validering i StateManager om kritisk data.

---

## Storleksoptimering

### Nuvarande storlek

Typisk Bifrost-backup:
- **10-50 KB** - Liten dataset (< 100 todos)
- **50-200 KB** - Mellan dataset (100-500 todos)
- **200 KB-1 MB** - Stor dataset (> 500 todos)

### Minska filstorlek

```javascript
// 1. Ta bort färdiga todos före export
const activeTodos = todos.filter(t => !t.completed);

// 2. Komprimera med gzip (kräver backend)
// Inte implementerat än

// 3. Rensa gammal data
const recent = deadlines.filter(d => 
    new Date(d.dueDate) > Date.now() - 30 * 24 * 60 * 60 * 1000
);
```

---

## Felsökning

**Export laddar inte ner:**
- Kontrollera att StateManager.exportAll() returnerar data
- Verifiera att Blob skapas korrekt
- Kolla att `<a download>` fungerar i webbläsaren

**Import fungerar inte:**
- Kontrollera att filen är valid JSON
- Verifiera att StateManager.importAll() körs
- Kolla konsolen för fel vid JSON.parse()

**Data försvinner efter import:**
- Kontrollera att window.location.reload() körs efter import
- Verifiera att importerad data sparades i localStorage

**Modal öppnas inte:**
- Kontrollera att `backup-widget` är registrerad i HTML
- Verifiera att Ctrl+Shift+B är registrerad i KeyboardShortcutService
- Kolla att footer-knapp har event listener

**Statistik visar fel värden:**
- Kontrollera att updateStats() anropas vid modal-öppning
- Verifiera att Blob.size returnerar bytes
- Kolla att formatBytes() formaterar korrekt

---

## Best Practices

### 1. Regelbunden backup

```javascript
// Påminn användaren att exportera varje månad
setInterval(() => {
    const lastBackup = localStorage.getItem('lastBackupDate');
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || new Date(lastBackup) < oneMonthAgo) {
        alert('Dags att exportera en backup!');
    }
}, 24 * 60 * 60 * 1000); // Kolla varje dag
```

### 2. Namngivning

Använd tidsstämplade filnamn:
```
✅ bifrost-backup-2025-11-20T15-30-00.json
❌ backup.json (överskrivs varje gång)
```

### 3. Förvaring

Spara backup på flera platser:
- 💾 Lokal disk
- ☁️ Cloud storage (Google Drive, Dropbox)
- 📧 Email till dig själv

### 4. Validering före import

```javascript
// Validera filstorlek
const file = event.target.files[0];
if (file.size > 10 * 1024 * 1024) { // 10 MB
    alert('Fil för stor!');
    return;
}

// Validera filnamn
if (!file.name.endsWith('.json')) {
    alert('Endast JSON-filer!');
    return;
}
```

---

## Framtida Förbättringar

### Planerade features

**Automatisk backup:**
```javascript
// Auto-export varje vecka
settings.autoBackup = {
    enabled: true,
    frequency: 'weekly',
    destination: 'localStorage'
};
```

**Cloud sync:**
```javascript
// Synka till Google Drive / Dropbox
backupWidget.syncToCloud('google-drive');
```

**Versionshistorik:**
```javascript
// Spara flera versioner i localStorage
backups = [
    { date: '2025-11-20T15:30:00Z', data: {...} },
    { date: '2025-11-19T10:00:00Z', data: {...} }
];
```

**Selektiv export:**
```javascript
// Exportera endast specifika data
backupWidget.exportData({
    include: ['todos', 'deadlines'],
    exclude: ['links', 'settings']
});
```

**Kryptering:**
```javascript
// Kryptera backup med lösenord
backupWidget.exportData({
    encrypt: true,
    password: 'mitt-lösenord'
});
```

---

## Integration med andra widgets

### StateManager

BackupWidget använder StateManager för all data:

```javascript
// Export
const data = stateManager.exportAll();
const json = JSON.stringify(data, null, 2);
const blob = new Blob([json], { type: 'application/json' });

// Import
const text = await file.text();
const data = JSON.parse(text);
stateManager.importAll(data);
```

### EventBus

Widgets kan lyssna på backup-events:

```javascript
// Todo-widget uppdaterar UI efter import
eventBus.on('backup:imported', () => {
    todoWidget.refresh();
});

// Stats-widget loggar export
eventBus.on('backup:exported', ({ itemCount, size }) => {
    statsService.log('backup-exported', { itemCount, size });
});
```

---

## Exempel

### Programmatisk export

```javascript
// Exportera vid specifik trigger
document.getElementById('export-btn').addEventListener('click', () => {
    const backupWidget = document.querySelector('backup-widget');
    backupWidget.exportData();
});
```

### Validera import-fil

```javascript
// Validera innan import
async function validateBackupFile(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Kontrollera version
        if (!data.version || data.version !== '1.0.0') {
            throw new Error('Invalid version');
        }
        
        // Kontrollera required fields
        const required = ['todos', 'links', 'exportDate'];
        for (const field of required) {
            if (!(field in data)) {
                throw new Error(`Missing field: ${field}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Validation failed:', error);
        return false;
    }
}
```

### Batch export

```javascript
// Exportera flera projekt
const projects = ['project-a', 'project-b'];
for (const project of projects) {
    stateManager.setContext(project);
    backupWidget.exportData();
}
```

---

## Se även

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - StateManager API
- [KEYBOARD_SHORTCUTS_GUIDE.md](KEYBOARD_SHORTCUTS_GUIDE.md) - Ctrl+Shift+B
- [CONTRIBUTING.md](../contributing/CONTRIBUTING.md) - Development guide

---

**Version:** 1.0  
**Senast uppdaterad:** 2025-11-20
