# Recurring Todos - Återkommande Uppgifter

Bifrost's Recurring Todos feature allows you to automate repetitive tasks. Set up a pattern once, and Bifrost will automatically create new todo instances based on your schedule.

## 🚀 Quick Start

### Create with Quick Add

The fastest way to create a recurring todo is using natural language in Quick Add:

```
Träna varje måndag #hälsa
→ Creates: Weekly recurring pattern for Mondays

Backup varje söndag 20:00
→ Creates: Weekly recurring pattern for Sundays at 8 PM

Betala hyra varje månad den 1:a
→ Creates: Monthly recurring pattern on the 1st

Städa varannan vecka
→ Creates: Bi-weekly recurring pattern
```

### Create with Widget

1. Open the **🔄 Återkommande** widget in the main content area
2. Click **➕ Ny återkommande uppgift**
3. Fill in the form:
   - **Uppgift**: Task description
   - **Typ**: Daily, Weekly, or Monthly
   - **Frekvens**: Every N days/weeks/months
   - **Veckodagar**: (Weekly only) Select specific days
   - **Dag i månaden**: (Monthly only) Day number (1-31)
   - **Tid**: Optional time (HH:MM)
   - **Prioritet**: Normal, High, Medium, or Low
   - **Taggar**: Comma-separated tags
4. Click **Spara**

## 📅 Pattern Types

### Daily Patterns

**Every day:**
```
varje dag
every day
dagligen
```

**Every N days:**
```
var 2:e dag     → Every 2 days
var 3:e dag     → Every 3 days
every 5 days    → Every 5 days
```

**Examples:**
- "Ta vitaminer varje dag"
- "Gå ut med hunden var 2:e dag"
- "Kontrollera mejl every day"

### Weekly Patterns

**Every week:**
```
varje vecka
every week
veckovis
```

**Every N weeks:**
```
varannan vecka  → Every 2 weeks
var 3:e vecka   → Every 3 weeks
every 4 weeks   → Every 4 weeks
```

**Specific weekday:**
```
varje måndag
varje tisdag
every friday
varje lördag
```

**Multiple weekdays (in widget):**
- Select multiple days in the weekday picker
- Example: Monday, Wednesday, Friday

**Examples:**
- "Team meeting varje måndag 09:00 #arbete"
- "Träna varje måndag och onsdag"
- "Städa varannan vecka #hem"
- "Veckomöte every friday 14:00"

### Monthly Patterns

**Every month:**
```
varje månad
every month
månadsvis
```

**Every N months:**
```
var 2:e månad   → Every 2 months (bi-monthly)
var 3:e månad   → Every 3 months (quarterly)
every 6 months  → Every 6 months (semi-annually)
```

**Specific day of month:**
```
varje månad den 1:a    → 1st of every month
varje månad den 15:e   → 15th of every month
every month the 28th   → 28th of every month
```

**Examples:**
- "Betala hyra varje månad den 1:a #ekonomi"
- "Servera bilen var 6:e månad"
- "Budget review every month the 1st #work [!high]"
- "Backup server var 3:e månad"

## ⚙️ Pattern Configuration

### Frequency

Control how often the pattern repeats:

| Type | Frequency | Result |
|------|-----------|--------|
| Daily | 1 | Every day |
| Daily | 2 | Every 2 days |
| Daily | 7 | Every 7 days (weekly) |
| Weekly | 1 | Every week |
| Weekly | 2 | Every 2 weeks (bi-weekly) |
| Weekly | 4 | Every 4 weeks (monthly-ish) |
| Monthly | 1 | Every month |
| Monthly | 3 | Every 3 months (quarterly) |
| Monthly | 12 | Every 12 months (yearly) |

### Time

Add optional time to schedule when todos are created:

```
Träna varje måndag 07:00
Team standup every day 09:30
Backup varje söndag 20:00
```

- Time format: HH:MM (24-hour)
- If no time specified, defaults to 00:00 (midnight)
- Todos are created at the specified time

### Priority

Set priority for all instances:

```
Deadline report every friday [!high]
Clean desk weekly [!low]
Monthly review varje månad [!medium]
```

- **High**: Urgent, important tasks
- **Medium**: Moderately important
- **Low**: Nice to have, low urgency
- **Normal**: Default priority

### Tags

Organize recurring todos with tags:

```
Träna varje måndag #hälsa #gym
Code review every day #utveckling #team
Betala räkningar varje månad #ekonomi
```

- Tags are inherited by all created instances
- Use for filtering and statistics
- Comma-separated in widget form

## 🔄 How It Works

### Automatic Creation

1. **Pattern Created**: You create a recurring pattern
2. **Next Due Calculated**: System calculates when next instance should be created
3. **Monitoring**: System checks every hour for due patterns
4. **Auto-Create**: When due time arrives, a new todo is automatically created
5. **Next Occurrence**: Pattern is updated with next due date

### On Completion

When you complete a todo from a recurring pattern:

1. **Mark Complete**: Check off the todo as normal
2. **Detect Pattern**: System detects this todo is recurring
3. **Create Next**: Next instance is automatically created
4. **Update Pattern**: Pattern's "next due" is recalculated

This ensures there's always one pending instance of recurring tasks.

### Example Flow

```
1. Create pattern: "Träna varje måndag 07:00"
   → Pattern created with next due: Monday, Nov 13, 2025 07:00

2. Monday arrives:
   → Todo "Träna" is auto-created at 07:00
   → Pattern updated: next due = Monday, Nov 20, 2025 07:00

3. You complete "Träna":
   → Todo marked complete
   → Next instance "Träna" created immediately
   → Pattern updated: next due = Monday, Nov 27, 2025 07:00

4. Cycle continues every Monday
```

## 📊 Widget Features

### Statistics

View recurring patterns overview:

- **Aktiva**: Number of active patterns
- **Pausade**: Number of paused patterns
- **Kommande**: Patterns due in next 7 days
- **Totalt skapade**: Total todos created from all patterns

### Pattern List

Each pattern card shows:

- **Text**: Task description
- **Status Badge**: Active or Paused
- **Type Badge**: Daily, Weekly, or Monthly
- **Description**: Human-readable pattern (e.g., "Varje måndag kl. 07:00")
- **Next Due**: When next instance will be created
- **Last Created**: When last instance was created
- **Completion Count**: Total instances created

### Actions

For each pattern:

- **⏸️ Pausa**: Temporarily disable pattern (no new todos created)
- **▶️ Återuppta**: Resume paused pattern
- **✏️ Redigera**: Edit pattern settings
- **🗑️ Ta bort**: Delete pattern permanently

### Manual Check

Click **🔄 Kontrollera nu** to force immediate check for due patterns. Useful for:
- Testing new patterns
- Creating missed instances
- Manual synchronization

## 🎨 Visual Indicators

### Recurring Icon

Todos created from recurring patterns show a 🔄 icon:

```
✓ [ ] Träna #hälsa  📝  🔄
```

- **🔄**: Recurring todo indicator
- **Animated**: Subtle rotation animation
- **Hover**: "Återkommande uppgift" tooltip

### Pattern Status

In the widget:

- **Green badge**: Active pattern
- **Gray badge**: Paused pattern
- **Blue badge**: Daily pattern
- **Purple badge**: Weekly pattern
- **Orange badge**: Monthly pattern

## 🔧 Advanced Usage

### Custom Patterns in Code

For advanced users, create custom patterns programmatically:

```javascript
import { recurringService } from './js/recurringService.js';

// Create custom pattern
const pattern = recurringService.createPattern({
    text: 'Custom task',
    type: 'weekly',
    frequency: 2,
    daysOfWeek: [1, 3, 5],  // Mon, Wed, Fri
    time: '14:00',
    priority: 'high',
    tags: ['custom', 'advanced']
});

console.log('Pattern created:', pattern.id);
```

### Programmatic Control

```javascript
// Pause pattern
recurringService.pausePattern(patternId);

// Resume pattern
recurringService.resumePattern(patternId);

// Update pattern
recurringService.updatePattern(patternId, {
    frequency: 3,
    time: '15:00'
});

// Delete pattern
recurringService.deletePattern(patternId);

// Get all active patterns
const active = recurringService.getActivePatterns();

// Get upcoming (next 7 days)
const upcoming = recurringService.getUpcomingRecurring(7);

// Check now
const created = recurringService.checkDuePatterns();
console.log(`Created ${created.length} todos`);
```

### Subscribe to Events

```javascript
recurringService.subscribe((event, data) => {
    switch (event) {
        case 'patternCreated':
            console.log('New pattern:', data);
            break;
        case 'todoCreated':
            console.log('Todo created:', data.todo);
            break;
        case 'nextInstanceCreated':
            console.log('Next instance:', data.nextTodo);
            break;
    }
});
```

## 📱 Integration

### Statistics Tracking

Recurring todos integrate with Statistics Dashboard:

- Counted in daily completion stats
- Tags from patterns tracked in "Top Tags"
- Contribute to streaks when completed
- Completion times analyzed

### Deadline Warnings

If recurring todos have dates:

- Monitored for deadline warnings
- Color-coded by urgency
- Desktop notifications for overdue
- Daily summary includes recurring tasks

### Google Calendar Sync

Recurring todos with dates sync to calendar:

- Each instance syncs as separate event
- Calendar event includes recurring indicator
- Completing todo marks calendar event done
- Next instance creates new calendar event

### Pomodoro Timer

Use recurring todos with Pomodoro:

- Focus on recurring tasks
- Track time per pattern type
- Statistics show most time-consuming patterns

## 🎯 Use Cases

### Daily Habits

```
Ta vitaminer varje dag 08:00 #hälsa
Meditation every day 07:00 #mindfulness
Planera dagen varje dag 09:00 #produktivitet
Journal entry every day 21:00 #reflection
```

### Work Routines

```
Team standup varje måndag 09:00 #arbete
Code review every day #utveckling
Weekly report varje fredag 16:00 #rapportering
Sprint planning varannan måndag #agile
```

### Household Chores

```
Städa lägenheten varje söndag #hem
Tvätt varannan onsdag #hushåll
Ta ut soporna every friday #hem
Vattna växter var 3:e dag #trädgård
```

### Financial Tasks

```
Betala hyra varje månad den 1:a #ekonomi [!high]
Budget review every month the 1st #finans
Spara pengar varje månad den 15:e #sparande
Check accounts every week #ekonomi
```

### Health & Fitness

```
Träna varje måndag och onsdag 18:00 #gym
Löpning every tuesday and thursday #spring
Yoga varje söndag 10:00 #hälsa
Läkarmöte var 6:e månad #hälsa [!high]
```

### Maintenance

```
Backup server varje söndag 20:00 #it
Update software every month the 1st #underhåll
Oil change var 6:e månad #bil
HVAC filter var 3:e månad #hem
```

## 🐛 Troubleshooting

### Pattern not creating todos

**Check:**
1. Pattern is **Active** (not Paused)
2. "Next Due" date is in the past
3. Click **🔄 Kontrollera nu** to force check
4. Check browser console for errors

**Solutions:**
- Resume paused patterns
- Edit pattern to fix incorrect next due date
- Refresh page to restart monitoring

### Duplicate todos created

**Cause:** Multiple browser tabs or manual creation while auto-creation runs

**Solutions:**
- Use only one browser tab
- Don't manually check too frequently
- Delete duplicate todos manually

### Next due date wrong

**Cause:** Pattern frequency or weekday settings incorrect

**Solutions:**
- Edit pattern in widget
- Fix frequency (1, 2, 3, etc.)
- For weekly: check correct weekdays are selected
- For monthly: verify day of month (1-31)

### Time not working

**Check:**
1. Time format is HH:MM (24-hour)
2. Pattern has time field filled
3. Monitoring runs every hour (not every minute)

**Solutions:**
- Use 24-hour format (14:00, not 2 PM)
- Be patient - todos created within 1 hour of due time
- For immediate creation, click **Kontrollera nu**

### Pattern description shows "Okänt mönster"

**Cause:** Invalid pattern type

**Solutions:**
- Delete and recreate pattern
- Use widget instead of manual code
- Check pattern type is 'daily', 'weekly', or 'monthly'

### Recurring icon not showing

**Check:**
1. Todo has `isRecurring: true` or `recurringPatternId` set
2. CSS loaded correctly
3. Browser cache cleared

**Solutions:**
- Refresh page
- Hard refresh (Ctrl+Shift+R)
- Check developer console for CSS errors

## 📖 API Reference

### RecurringService

#### `createPattern(pattern)`

Create new recurring pattern.

**Parameters:**
```javascript
{
    text: string,              // Task description
    type: 'daily'|'weekly'|'monthly',
    frequency: number,         // Every N periods
    daysOfWeek: number[],      // For weekly: [0-6] (Sun=0)
    dayOfMonth: number,        // For monthly: 1-31
    time: string,              // HH:MM or null
    tags: string[],            // Array of tags
    priority: string,          // 'high'|'medium'|'low'|'normal'
    source: string             // 'bifrost'|'obsidian'
}
```

**Returns:** Pattern object with `id`

#### `updatePattern(patternId, updates)`

Update existing pattern.

**Parameters:**
- `patternId` (string): Pattern ID
- `updates` (object): Fields to update

**Returns:** Updated pattern or null

#### `deletePattern(patternId)`

Delete pattern permanently.

**Returns:** `true` if deleted, `false` if not found

#### `pausePattern(patternId)`

Pause pattern (stop creating todos).

**Returns:** Updated pattern or null

#### `resumePattern(patternId)`

Resume paused pattern.

**Returns:** Updated pattern or null

#### `getActivePatterns()`

Get all active patterns.

**Returns:** Array of active patterns

#### `getAllPatterns()`

Get all patterns (active + paused).

**Returns:** Array of all patterns

#### `getUpcomingRecurring(days = 7)`

Get patterns due in next N days.

**Returns:** Array of upcoming patterns, sorted by due date

#### `checkDuePatterns()`

Manually check for due patterns and create todos.

**Returns:** Array of created todos

#### `onTodoCompleted(todo)`

Handle todo completion. If recurring, creates next instance.

**Returns:** Next todo instance or null

#### `getPatternDescription(pattern)`

Get human-readable pattern description.

**Returns:** String like "Varje måndag kl. 07:00"

#### `getStats()`

Get recurring patterns statistics.

**Returns:**
```javascript
{
    total: number,            // Total patterns
    active: number,           // Active patterns
    paused: number,           // Paused patterns
    daily: number,            // Daily patterns
    weekly: number,           // Weekly patterns
    monthly: number,          // Monthly patterns
    totalCompletions: number, // Total todos created
    upcoming: number          // Due in next 7 days
}
```

#### `subscribe(callback)`

Subscribe to recurring service events.

**Parameters:**
- `callback(event, data)`: Event handler function

**Events:**
- `patternCreated`: New pattern created
- `patternUpdated`: Pattern updated
- `patternDeleted`: Pattern deleted
- `todoCreated`: Todo created from pattern
- `nextInstanceCreated`: Next instance auto-created on completion
- `duePatterns`: Multiple patterns due, todos created

**Returns:** Unsubscribe function

### Natural Language Parser

#### Recurring Patterns Parsed

The parser recognizes these Swedish and English patterns:

**Daily:**
- `varje dag`, `every day`, `dagligen`
- `var N:e dag`, `every N days`

**Weekly:**
- `varje vecka`, `every week`, `veckovis`
- `varannan vecka`, `every 2 weeks`
- `varje måndag/tisdag/...`, `every monday/tuesday/...`

**Monthly:**
- `varje månad`, `every month`, `månadsvis`
- `var N:e månad`, `every N months`
- `varje månad den N:e`, `every month the Nth`

**Examples:**
```javascript
import { naturalLanguageParser } from './js/naturalLanguageParser.js';

const result = naturalLanguageParser.parse('Träna varje måndag 18:00 #gym');
// result.recurring = {
//     type: 'weekly',
//     frequency: 1,
//     daysOfWeek: [1],
//     matched: 'varje måndag'
// }
```

## 🔐 Data Storage

Recurring patterns are stored in `localStorage`:

```javascript
// Key: 'recurringPatterns'
// Value: JSON array of pattern objects

[
    {
        "id": "1699123456789",
        "text": "Träna",
        "type": "weekly",
        "frequency": 1,
        "daysOfWeek": [1, 3],
        "time": "18:00",
        "tags": ["hälsa", "gym"],
        "priority": "normal",
        "active": true,
        "createdAt": "2025-11-11T10:00:00.000Z",
        "lastCreated": "2025-11-13T18:00:00.000Z",
        "nextDue": "2025-11-15T18:00:00.000Z",
        "completionCount": 5
    }
]
```

**Export/Backup:**
```javascript
// Get all patterns
const patterns = JSON.stringify(recurringService.getAllPatterns(), null, 2);

// Save to file
const blob = new Blob([patterns], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download...
```

**Import/Restore:**
```javascript
// Load patterns from file
const patterns = JSON.parse(fileContent);

// Clear existing
recurringService.clearAll();

// Import each
patterns.forEach(p => recurringService.createPattern(p));
```

## 💡 Tips & Best Practices

### Start Simple

Begin with a few high-value recurring tasks:
1. Daily morning routine
2. Weekly team meeting
3. Monthly bill payments

Don't over-commit initially - add more as you get comfortable.

### Use Meaningful Names

Clear, action-oriented task names:
```
✓ "Träna" → Clear and simple
✓ "Team standup" → Specific
✗ "Stuff" → Too vague
✗ "Do the thing" → Unclear
```

### Tag Consistently

Use consistent tags for better organization:
```
✓ #arbete, #gym, #ekonomi
✗ #work, #jobb, #arbete (mixed)
```

### Set Realistic Frequency

Don't create too frequent patterns you can't maintain:
```
✓ Träna 3 gånger/vecka
✗ Träna varje dag (if unrealistic)
```

### Use Time Wisely

Set times for important patterns:
```
✓ Team standup varje dag 09:00
✓ Betala hyra varje månad den 1:a 08:00
✗ Generic tasks without time (less urgent)
```

### Pause, Don't Delete

Going on vacation? Pause patterns instead of deleting:
- Easy to resume later
- Preserves completion history
- No need to recreate

### Review Regularly

Monthly review of patterns:
- Remove unused patterns
- Adjust frequencies if needed
- Check completion counts
- Optimize times

### Combine with Other Features

- **Deadlines**: For time-sensitive recurring tasks
- **Pomodoro**: Focus on recurring work tasks
- **Calendar**: Sync recurring todos to Google Calendar
- **Stats**: Track completion rates and streaks

---

**Recurring Todos** transforms repetitive task management in Bifrost. Set it once, and let automation handle the rest! 🔄✨
