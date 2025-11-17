# Obsidian Integration Setup Guide

## 🚀 Snabbstart

### 1. Konfigurera Obsidian Bridge

1. **Ändra vault-sökväg** i `js/integrations/obsidianBridge.js`:
   ```js
   const config = {
       vaultPath: 'C:/Users/DittNamn/Documents/ObsidianVault', // ← Din vault
       todoFiles: ['TODO.md', 'Tasks.md'], 
       port: 8081
   };
   ```

2. **Skapa TODO.md** i din Obsidian vault:
   - Kopiera `example-TODO.md` till din vault
   - Döp om den till `TODO.md`

### 2. Starta tjänsterna

```bash
# Terminal 1: Starta Obsidian Bridge
node js/integrations/obsidianBridge.js

# Terminal 2: Starta school proxy (om du vill ha skolmat)
node js/integrations/proxy.js

# Terminal 3: Starta webserver (Live Server i VS Code eller)
npx serve
```

### 3. Verifiera att det fungerar

1. **Öppna Bifrost** i webbläsaren
2. **Kolla konsolen** för sync-meddelanden
3. **Testa redigera** TODO.md i Obsidian
4. **Se ändringar** uppdateras automatiskt i Bifrost

## 📝 Todo-format som stöds

### Grundläggande
```markdown
- [ ] Vanlig todo
- [x] Klar todo
```

### Med prioritet
```markdown
- [ ] Hög prioritet [!high] 🔥
- [ ] Medium prioritet [!medium] ⚠️
- [ ] Låg prioritet [!low]
```

### Med datum
```markdown
- [ ] Deadline imorgon @2025-01-15
- [ ] Möte nästa vecka @2025-01-20
```

### Med kategorier
```markdown
- [ ] Utvecklingsuppgift #development
- [ ] Dokumentation #docs #writing
- [ ] Buggfix #bug #urgent
```

### Med sektioner
```markdown
## Arbete
- [ ] Jobbrelaterad uppgift

## Privat  
- [ ] Personlig uppgift
```

## ⚙️ Anpassning

### Lägg till fler filer
```js
todoFiles: ['TODO.md', 'Work.md', 'Projects.md']
```

### Ändra port
```js
port: 8082  // Om 8081 är upptagen
```

### Uppdatera Bifrost config
```js
// js/config.js
obsidian: {
    bridgeUrl: 'http://localhost:8082/obsidian/todos' // Matcha porten
}
```

## 🔧 Felsökning

### "Obsidian bridge timeout"
- Kontrollera att `node js/integrations/obsidianBridge.js` körs
- Verifiera att porten (8081) inte är blockerad

### "Vault hittades inte"
- Dubbelkolla sökvägen i `js/integrations/obsidianBridge.js`
- Använd absolut sökväg med forward slashes

### Todos visas inte
- Kontrollera att TODO.md finns i vault
- Kolla format: `- [ ] Text` (mellanslag viktigt!)
- Se konsolen för parse-fel

### Ändringar syns inte
- Spara filen i Obsidian (Ctrl+S)
- Vänta upp till 30 sekunder för auto-sync
- Ladda om Bifrost-sidan

## 🎯 Tips & Tricks

### Dataview Plugin Integration
```markdown
# Auto-genererad todo-lista

```dataview
TASK
WHERE !completed AND contains(file.name, "Project")
SORT priority DESC
```

### Quick Add Plugin
Skapa snabba todos med Obsidian Quick Add plugin som sparar till TODO.md

### Daily Notes Integration
```markdown
## [[2025-01-13]] Dagens todos
- [ ] Synka med Bifrost @2025-01-13 [!high]
```

### Mobile Obsidian
Obsidian mobile app synkroniserar också med bridge - ändra todos på telefonen!

## 🔄 Dataflöde

```
1. Redigera TODO.md i Obsidian
2. Bridge upptäcker filändring (1s intervall)
3. Bridge parsar markdown → JSON
4. Bifrost hämtar via HTTP (30s intervall)  
5. Todos visas med prioritet/källa
```

## 🎨 Visuell guide

- **📝** = Från Obsidian
- **🏠** = Lokala Bifrost todos
- **🔥** = Hög prioritet  
- **⚠️** = Medium prioritet
- **📅** = Har deadline
- **#tag** = Kategoriserad

Kör `node obsidianBridge.js` och börja synka! 🚀