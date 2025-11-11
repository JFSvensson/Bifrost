# Quick Add - Natural Language Todo Creation

Quick Add allows you to create todos faster using natural language. Just type what you need to do, and Bifrost will automatically extract dates, times, tags, and priorities.

## 🚀 Quick Start

### Basic Usage

Press **Ctrl+K** anywhere to focus the Quick Add input, or click directly in the input field at the top of the page.

Type your todo naturally:
```
Köp mjölk imorgon #shopping
```

Press **Enter** to add the todo. Bifrost will automatically:
- Extract the text: "Köp mjölk"
- Set due date: Tomorrow's date
- Add tag: #shopping

### Examples

```
Möt Anna imorgon 14:00 #arbete [!high]
→ Text: "Möt Anna"
→ Date: Tomorrow
→ Time: 14:00
→ Tag: #arbete
→ Priority: High

Lämna in rapport fredag 🔥
→ Text: "Lämna in rapport"
→ Date: Next Friday
→ Priority: High (🔥 emoji = high priority)

Städa lägenheten om 3 dagar #hem [!low]
→ Text: "Städa lägenheten"
→ Date: 3 days from now
→ Tag: #hem
→ Priority: Low

Team meeting 2024-12-25 10:00 #work ⚠️
→ Text: "Team meeting"
→ Date: 2024-12-25
→ Time: 10:00
→ Tag: #work
→ Priority: Medium (⚠️ emoji = medium priority)
```

## 📅 Date Formats

### Relative Dates (Swedish)
- `idag` / `today` → Today's date
- `imorgon` / `imorn` / `tomorrow` → Tomorrow's date
- `igår` / `yesterday` → Yesterday's date

### Weekdays
- `måndag` / `monday` / `mån` → Next Monday
- `tisdag` / `tuesday` / `tis` → Next Tuesday
- `onsdag` / `wednesday` / `ons` → Next Wednesday
- `torsdag` / `thursday` / `tors` / `tor` → Next Thursday
- `fredag` / `friday` / `fre` → Next Friday
- `lördag` / `saturday` / `lör` → Next Saturday
- `söndag` / `sunday` / `sön` → Next Sunday

**Note:** Weekdays always refer to the next occurrence. If today is Tuesday and you type "måndag", it will be next Monday (6 days from now).

### Relative Periods
- `nästa vecka` / `next week` → 7 days from now
- `nästa månad` / `next month` → Same day next month
- `om X dagar` → X days from now (e.g., "om 5 dagar")
- `om X veckor` → X weeks from now (e.g., "om 2 veckor")

### Absolute Dates
- `YYYY-MM-DD` → ISO format (e.g., "2024-12-25")
- `DD/MM` or `DD/MM/YYYY` → Slash format (e.g., "25/12" or "25/12/2024")
- `DD.MM` or `DD.MM.YYYY` → Dot format (e.g., "25.12" or "25.12.2024")

## ⏰ Time Formats

- `HH:MM` → 24-hour format (e.g., "14:30")
- `kl. HH` or `kl HH` → Hour only (e.g., "kl. 14" → "14:00")
- `HH am/pm` → 12-hour format (e.g., "2 pm" → "14:00")

**Note:** Times must be combined with dates. Time without a date will be ignored.

## 🏷️ Tags

Add tags with the `#` symbol:
```
Köp present #shopping #jul
```

Multiple tags are supported. Tags can contain letters, numbers, and underscores:
```
#work_project #2024 #important
```

## 🔥 Priority Levels

### Text Format
- `[!high]` → High priority (red)
- `[!medium]` → Medium priority (orange)
- `[!low]` → Low priority (yellow)

### Emoji Format
- 🔥 or ‼️ → High priority
- ⚠️ → Medium priority
- 🔽 → Low priority

Mix and match:
```
Deadline report [!high] #work
Fix bug 🔥 #development
Clean desk [!low] #home
```

## ⌨️ Keyboard Shortcuts

- **Ctrl+K** - Focus Quick Add input (works anywhere on page)
- **Enter** - Submit todo
- **Escape** - Clear input and close suggestions

## 🎨 Live Preview

As you type, Quick Add shows a live preview of parsed elements:

```
Möt Anna imorgon 14:00 #arbete [!high]

Preview badges:
📅 Imorgon    ⏰ 14:00    #arbete    🔥 high    "Möt Anna"
```

Preview badge colors:
- **Blue** 📅 - Date
- **Purple** ⏰ - Time
- **Purple** # - Tags
- **Red** 🔥 - High priority
- **Orange** ⚠️ - Medium priority
- **Green** 🔽 - Low priority
- **Gray** " " - Cleaned text

## 🔄 Integration

Quick Add integrates seamlessly with all Bifrost features:

### Statistics Tracking
- Todos created via Quick Add are tracked in statistics
- Tags are counted for "Top Tags" section
- Completion times contribute to streaks

### Deadline Warnings
- Todos with due dates trigger deadline monitoring
- Urgency levels are calculated automatically
- Desktop notifications for approaching deadlines

### Pomodoro Timer
- Focus on todos created via Quick Add
- Session tracking tied to todo completion

### Google Calendar Sync
- Todos with dates automatically sync to Google Calendar
- Bilateral sync keeps everything in sync
- Auto-sync every 5 minutes

## 🌙 Dark Theme Support

Quick Add fully supports dark theme:
- Input fields adapt to theme colors
- Preview badges have dark mode variants
- Smooth transitions when switching themes

## 📱 Mobile Support

Quick Add is fully responsive:
- Full-width input on mobile
- Touch-friendly buttons
- Optimized preview layout

## ⚠️ Edge Cases

### Ambiguous Dates
If a date cannot be parsed, it defaults to `null` (no due date):
```
Köp något nästa
→ "nästa" alone is ambiguous
→ No due date set
```

### Multiple Dates
If multiple dates are found, only the first is used:
```
Möt Anna idag eller imorgon
→ Date: Today (first match)
→ Text: "Möt Anna eller imorgon"
```

### Invalid Dates
Invalid date formats are ignored:
```
Deadline 2024-13-45
→ Invalid month/day
→ No due date set
```

### Time Without Date
Times require a date context:
```
Meeting 14:00
→ Time ignored (no date)
→ Text: "Meeting 14:00"
```

To fix, add a date:
```
Meeting idag 14:00
→ Date: Today
→ Time: 14:00
→ Text: "Meeting"
```

## 🛠️ API Reference

### NaturalLanguageParser

#### `parse(input: string)`
Parses natural language input into structured todo data.

**Parameters:**
- `input` (string) - The natural language text to parse

**Returns:** Object with structure:
```javascript
{
    text: string,           // Cleaned todo text
    dueDate: string | null, // ISO date (YYYY-MM-DD) or null
    dueTime: string | null, // Time (HH:MM) or null
    tags: string[],         // Array of tag strings
    priority: string,       // 'high' | 'medium' | 'low' | 'normal'
    source: string,         // 'bifrost' | 'obsidian'
    rawInput: string        // Original input
}
```

**Example:**
```javascript
import { naturalLanguageParser } from './js/naturalLanguageParser.js';

const result = naturalLanguageParser.parse('Möt Anna imorgon 14:00 #arbete [!high]');
console.log(result);
// {
//     text: 'Möt Anna',
//     dueDate: '2024-12-19',
//     dueTime: '14:00',
//     tags: ['arbete'],
//     priority: 'high',
//     source: 'bifrost',
//     rawInput: 'Möt Anna imorgon 14:00 #arbete [!high]'
// }
```

#### `getSuggestions(input: string)`
Get autocomplete suggestions for partial input.

**Parameters:**
- `input` (string) - Partial input text

**Returns:** Array of suggestion objects:
```javascript
[
    { type: 'date', text: 'idag', value: 'today' },
    { type: 'priority', text: '[!high]', value: 'high' }
]
```

#### `validate(parsed: object)`
Validate parsed result for errors.

**Parameters:**
- `parsed` (object) - Result from `parse()`

**Returns:** Validation object:
```javascript
{
    valid: boolean,
    errors: string[]
}
```

### Quick Add Widget Events

#### `todoAdded`
Dispatched when user submits a todo via Quick Add.

**Event Detail:** Parsed todo object (same structure as `parse()` returns)

**Example:**
```javascript
const widget = document.querySelector('quick-add-widget');
widget.addEventListener('todoAdded', (e) => {
    console.log('New todo:', e.detail);
    // e.detail contains parsed todo data
});
```

### Widget Methods

#### `focus()`
Programmatically focus the Quick Add input.

```javascript
const widget = document.querySelector('quick-add-widget');
widget.focus();
```

#### `setValue(value: string)`
Set input value and trigger parsing.

```javascript
const widget = document.querySelector('quick-add-widget');
widget.setValue('Möt Anna imorgon 14:00');
```

## 🎯 Best Practices

### Use Natural Language
Write todos as you would say them:
```
✓ Ringa mamma imorgon
✗ mamma imorgon ringa (awkward word order)
```

### Be Specific with Dates
Absolute dates are clearer for distant deadlines:
```
✓ Semesterplanering 2025-06-01
✗ Semesterplanering (no date)
```

### Tag Consistently
Use the same tags across todos for better statistics:
```
✓ #arbete (consistent)
✗ #work, #jobb, #arbete (mixed languages/terms)
```

### Use Priority Wisely
Not everything needs high priority:
```
✓ 2-3 high priority tasks per day
✗ 10+ high priority tasks (defeats the purpose)
```

### Combine Features
Leverage all parsing features together:
```
Team meeting fredag 10:00 #arbete [!high] 🔥
→ Complete todo with date, time, tag, and priority
```

## 🔍 Troubleshooting

### "Todo not parsing dates"
- Check spelling of date keywords (Swedish/English)
- Try absolute date format (YYYY-MM-DD)
- Ensure date is in supported format

### "Tags not showing"
- Tags must start with `#`
- No spaces in tags (use underscore: `#work_meeting`)
- Tags only support letters, numbers, underscores

### "Priority not detected"
- Use exact format: `[!high]`, `[!medium]`, `[!low]`
- Or use emoji: 🔥, ⚠️, 🔽
- Priority markers are case-insensitive

### "Ctrl+K not working"
- Check if another extension is using this shortcut
- Try clicking directly in input field
- Refresh page if widget didn't load

## 📝 Tips & Tricks

### Quick Todo Entry
For rapid entry, use short keywords:
```
Buy milk tmrw #shop
Meeting Mon 2pm #work 🔥
Call mom fri #personal
```

### Batch Entry
Add multiple todos quickly with Ctrl+K → type → Enter → repeat:
```
1. Ctrl+K → "Gym idag" → Enter
2. Ctrl+K → "Study imorgon" → Enter
3. Ctrl+K → "Project fredag [!high]" → Enter
```

### Template Todos
Save common patterns and reuse:
```
Weekly review fredag 15:00 #planning [!medium]
Team standup måndag 09:00 #work
Backup files söndag #maintenance
```

## 🆚 Quick Add vs Regular Input

### Use Quick Add When:
- Adding todos with dates, times, or priorities
- Using tags extensively
- Need keyboard-only workflow (Ctrl+K)
- Want live preview of parsed elements

### Use Regular Input When:
- Simple text-only todos
- No special metadata needed
- Prefer mouse-driven workflow

Both methods work seamlessly together and share the same todo list!

## 🚦 Status Indicators

### Input Validation
- **Green border** - Valid todo, ready to submit
- **Red border** - Validation error (e.g., empty text)
- **Blue glow** - Input focused

### Button States
- **Blue button** - Ready to add
- **Green "✓ Tillagd!"** - Success feedback (1 second)
- **Grayed out** - Disabled (invalid input)

## 🔗 Related Features

- [Dark Theme](./DARK_THEME.md) - Theme support in Quick Add
- [Statistics](./STATS_GUIDE.md) - Tag tracking from Quick Add
- [Deadlines](./DEADLINE_GUIDE.md) - Date integration
- [Google Calendar](./GOOGLE_CALENDAR_GUIDE.md) - Calendar sync
- [Pomodoro](./POMODORO_GUIDE.md) - Focus on Quick Add todos

---

**Quick Add** brings natural language processing to Bifrost, making todo creation 3-5× faster. Just type naturally and let Bifrost handle the rest! 🚀
