/**
 * ReminderService
 * 
 * Hanterar schemalagda påminnelser och snooze-funktionalitet för todos.
 * 
 * Features:
 * - Schemalagda påminnelser med exakt timestamp
 * - Snooze-presets (+10min, +1h, +1day, custom)
 * - Bakgrundsövervakning med setInterval
 * - Browser notifications (med fallback till in-app toast)
 * - Integrering med deadlineService för "påminn X innan deadline"
 * - Persistens i localStorage
 * 
 * @example
 * // Skapa påminnelse
 * reminderService.createReminder({
 *   todoId: '123',
 *   text: 'Möt Anna',
 *   remindAt: new Date('2024-12-19 13:00'), // 1h innan 14:00
 *   type: 'deadline-relative'
 * });
 * 
 * // Snooze en todo
 * reminderService.snoozeTodo('123', '+10min');
 * 
 * // Lyssna på påminnelser
 * reminderService.subscribe('reminderTriggered', (reminder) => {
 *   showNotification(reminder.text);
 * });
 */

class ReminderService {
    constructor() {
        this.reminders = [];
        this.checkInterval = null;
        this.subscribers = {};
        this.notificationPermission = 'default';
        
        // Snooze presets (i millisekunder)
        this.snoozePresets = {
            '10min': 10 * 60 * 1000,
            '30min': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '3h': 3 * 60 * 60 * 1000,
            '1day': 24 * 60 * 60 * 1000,
            'tomorrow9am': null, // Special case: beräknas dynamiskt
            'nextweek': null // Special case: beräknas dynamiskt
        };
        
        this.loadReminders();
        this.checkNotificationPermission();
        this.startMonitoring();
    }
    
    /**
     * Ladda påminnelser från localStorage
     */
    loadReminders() {
        try {
            const stored = localStorage.getItem('reminders');
            if (stored) {
                this.reminders = JSON.parse(stored);
                // Konvertera string dates till Date objects
                this.reminders = this.reminders.map(r => ({
                    ...r,
                    remindAt: new Date(r.remindAt),
                    createdAt: new Date(r.createdAt),
                    snoozedAt: r.snoozedAt ? new Date(r.snoozedAt) : null
                }));
                
                // Städa gamla påminnelser (äldre än 7 dagar)
                this.cleanupOldReminders();
            }
        } catch (error) {
            console.error('Fel vid laddning av påminnelser:', error);
            this.reminders = [];
        }
    }
    
    /**
     * Spara påminnelser till localStorage
     */
    saveReminders() {
        try {
            localStorage.setItem('reminders', JSON.stringify(this.reminders));
        } catch (error) {
            console.error('Fel vid sparande av påminnelser:', error);
        }
    }
    
    /**
     * Skapa en ny påminnelse
     * 
     * @param {Object} reminderData
     * @param {string} reminderData.todoId - Todo ID
     * @param {string} reminderData.text - Påminnelsetext
     * @param {Date} reminderData.remindAt - När påminnelsen ska triggas
     * @param {string} [reminderData.type='manual'] - Typ: 'manual', 'deadline-relative', 'snoozed'
     * @param {string} [reminderData.priority='medium'] - Prioritet
     * @param {Array} [reminderData.tags=[]] - Tags från todo
     * @returns {Object} Skapad påminnelse
     */
    createReminder({todoId, text, remindAt, type = 'manual', priority = 'medium', tags = []}) {
        if (!todoId || !text || !remindAt) {
            throw new Error('todoId, text och remindAt krävs för att skapa påminnelse');
        }
        
        if (!(remindAt instanceof Date) || isNaN(remindAt)) {
            throw new Error('remindAt måste vara ett giltigt Date-objekt');
        }
        
        // Kontrollera om påminnelsen redan har passerat
        if (remindAt < new Date()) {
            console.warn('Påminnelse skapas för redan passerat datum:', remindAt);
        }
        
        const reminder = {
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            todoId,
            text,
            remindAt,
            type,
            priority,
            tags,
            createdAt: new Date(),
            snoozedAt: null,
            snoozeCount: 0,
            triggered: false
        };
        
        this.reminders.push(reminder);
        this.saveReminders();
        this.publish('reminderCreated', reminder);
        
        console.log('Påminnelse skapad:', {
            text,
            remindAt: remindAt.toLocaleString('sv-SE'),
            type
        });
        
        return reminder;
    }
    
    /**
     * Snooze en todo (skapa påminnelse baserat på preset)
     * 
     * @param {string} todoId - Todo ID
     * @param {string} preset - Snooze preset ('10min', '1h', etc.) eller custom time string
     * @param {Object} todo - Todo object med text, priority, tags
     * @returns {Object} Skapad påminnelse
     */
    snoozeTodo(todoId, preset, todo) {
        if (!todoId || !preset || !todo) {
            throw new Error('todoId, preset och todo krävs för snooze');
        }
        
        const remindAt = this.calculateSnoozeTime(preset);
        
        // Ta bort tidigare påminnelser för denna todo (undvik duplicates)
        this.reminders = this.reminders.filter(r => r.todoId !== todoId);
        
        const reminder = this.createReminder({
            todoId,
            text: todo.text,
            remindAt,
            type: 'snoozed',
            priority: todo.priority || 'medium',
            tags: todo.tags || []
        });
        
        reminder.snoozedAt = new Date();
        reminder.snoozeCount = (this.getSnoozedReminder(todoId)?.snoozeCount || 0) + 1;
        this.saveReminders();
        
        this.publish('todoSnoozed', {
            todoId,
            reminder,
            preset,
            snoozeCount: reminder.snoozeCount
        });
        
        return reminder;
    }
    
    /**
     * Beräkna snooze-tid baserat på preset
     * 
     * @param {string} preset - Snooze preset eller custom string
     * @returns {Date} Påminnelsetid
     */
    calculateSnoozeTime(preset) {
        const now = new Date();
        
        // Standard presets
        if (this.snoozePresets[preset] !== undefined && this.snoozePresets[preset] !== null) {
            return new Date(now.getTime() + this.snoozePresets[preset]);
        }
        
        // Special cases
        if (preset === 'tomorrow9am') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return tomorrow;
        }
        
        if (preset === 'nextweek') {
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(9, 0, 0, 0);
            return nextWeek;
        }
        
        // Custom preset (t.ex. "+2h", "+45min")
        const customMatch = preset.match(/^\+?(\d+)(min|h|d)$/i);
        if (customMatch) {
            const [, value, unit] = customMatch;
            const num = parseInt(value, 10);
            
            const multipliers = {
                'min': 60 * 1000,
                'h': 60 * 60 * 1000,
                'd': 24 * 60 * 60 * 1000
            };
            
            const multiplier = multipliers[unit.toLowerCase()];
            if (multiplier) {
                return new Date(now.getTime() + (num * multiplier));
            }
        }
        
        // Fallback: +1h
        console.warn('Okänd snooze preset:', preset, '- använder +1h');
        return new Date(now.getTime() + this.snoozePresets['1h']);
    }
    
    /**
     * Skapa deadline-relativ påminnelse (t.ex. "1h innan deadline")
     * 
     * @param {Object} todo - Todo med deadline
     * @param {string} offset - Tidsskillnad ('1h', '30min', '1day', etc.)
     * @returns {Object|null} Skapad påminnelse eller null om deadline saknas
     */
    createDeadlineReminder(todo, offset) {
        if (!todo.dueDate) {
            console.warn('Kan inte skapa deadline-påminnelse - todo saknar dueDate');
            return null;
        }
        
        const deadline = new Date(todo.dueDate);
        if (todo.dueTime) {
            const [hours, minutes] = todo.dueTime.split(':');
            deadline.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }
        
        // Beräkna offset i millisekunder
        const offsetMs = this.parseTimeOffset(offset);
        const remindAt = new Date(deadline.getTime() - offsetMs);
        
        // Kontrollera att påminnelsen inte redan har passerat
        if (remindAt < new Date()) {
            console.warn('Deadline-påminnelse skulle vara i det förflutna, skapar inte:', remindAt);
            return null;
        }
        
        return this.createReminder({
            todoId: todo.id,
            text: `Påminnelse: ${todo.text} (deadline om ${offset})`,
            remindAt,
            type: 'deadline-relative',
            priority: todo.priority || 'medium',
            tags: todo.tags || []
        });
    }
    
    /**
     * Parsa tidsoffset string till millisekunder
     * 
     * @param {string} offset - T.ex. '1h', '30min', '1day'
     * @returns {number} Millisekunder
     */
    parseTimeOffset(offset) {
        const match = offset.match(/^(\d+)(min|h|d|day|days)$/i);
        if (!match) {
            throw new Error(`Ogiltigt tidsformat: ${offset}`);
        }
        
        const [, value, unit] = match;
        const num = parseInt(value, 10);
        
        const multipliers = {
            'min': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'day': 24 * 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000
        };
        
        return num * multipliers[unit.toLowerCase()];
    }
    
    /**
     * Hämta aktiva påminnelser (inte triggered, framtida)
     * 
     * @returns {Array} Aktiva påminnelser sorterade efter tid
     */
    getActiveReminders() {
        const now = new Date();
        return this.reminders
            .filter(r => !r.triggered && r.remindAt > now)
            .sort((a, b) => a.remindAt - b.remindAt);
    }
    
    /**
     * Hämta påminnelser för en specifik todo
     * 
     * @param {string} todoId
     * @returns {Array} Påminnelser
     */
    getRemindersForTodo(todoId) {
        return this.reminders.filter(r => r.todoId === todoId);
    }
    
    /**
     * Hämta snoozed påminnelse för todo (om den finns)
     * 
     * @param {string} todoId
     * @returns {Object|null}
     */
    getSnoozedReminder(todoId) {
        return this.reminders.find(r => r.todoId === todoId && r.type === 'snoozed' && !r.triggered);
    }
    
    /**
     * Avbryt påminnelse
     * 
     * @param {string} reminderId
     */
    cancelReminder(reminderId) {
        const index = this.reminders.findIndex(r => r.id === reminderId);
        if (index !== -1) {
            const reminder = this.reminders[index];
            this.reminders.splice(index, 1);
            this.saveReminders();
            this.publish('reminderCancelled', reminder);
        }
    }
    
    /**
     * Avbryt alla påminnelser för en todo
     * 
     * @param {string} todoId
     */
    cancelRemindersForTodo(todoId) {
        const cancelled = this.reminders.filter(r => r.todoId === todoId);
        this.reminders = this.reminders.filter(r => r.todoId !== todoId);
        this.saveReminders();
        
        if (cancelled.length > 0) {
            this.publish('remindersForTodoCancelled', {todoId, count: cancelled.length});
        }
    }
    
    /**
     * Kontrollera och trigga påminnelser
     */
    checkReminders() {
        const now = new Date();
        const triggered = [];
        
        this.reminders.forEach(reminder => {
            if (!reminder.triggered && reminder.remindAt <= now) {
                reminder.triggered = true;
                triggered.push(reminder);
                
                // Skicka notification
                this.triggerReminder(reminder);
            }
        });
        
        if (triggered.length > 0) {
            this.saveReminders();
            this.publish('remindersChecked', {
                count: triggered.length,
                reminders: triggered
            });
        }
    }
    
    /**
     * Trigga en påminnelse (visa notification)
     * 
     * @param {Object} reminder
     */
    async triggerReminder(reminder) {
        console.log('Triggar påminnelse:', reminder);
        
        // Försök med browser notification först
        if (this.notificationPermission === 'granted') {
            try {
                const notification = new Notification('Bifrost Påminnelse', {
                    body: reminder.text,
                    icon: '/favicon-32x32.png',
                    tag: reminder.id,
                    requireInteraction: true, // Stannar kvar tills användaren interagerar
                    data: {
                        todoId: reminder.todoId,
                        reminderId: reminder.id
                    }
                });
                
                // Klick på notification → öppna todo
                notification.onclick = () => {
                    window.focus();
                    this.publish('reminderClicked', reminder);
                    notification.close();
                };
            } catch (error) {
                console.error('Kunde inte visa browser notification:', error);
                // Fallback till in-app toast
                this.publish('reminderTriggered', reminder);
            }
        } else {
            // Fallback till in-app toast
            this.publish('reminderTriggered', reminder);
        }
        
        // Statistik
        this.publish('reminderTriggered', reminder);
    }
    
    /**
     * Städa gamla påminnelser (äldre än 7 dagar och triggered)
     */
    cleanupOldReminders() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const before = this.reminders.length;
        this.reminders = this.reminders.filter(r => {
            if (r.triggered && r.remindAt < sevenDaysAgo) {
                return false;
            }
            return true;
        });
        
        const removed = before - this.reminders.length;
        if (removed > 0) {
            this.saveReminders();
            console.log(`Städade ${removed} gamla påminnelser`);
        }
    }
    
    /**
     * Kontrollera notification permission
     */
    async checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser stödjer inte notifications');
            this.notificationPermission = 'denied';
            return 'denied';
        }
        
        this.notificationPermission = Notification.permission;
        return this.notificationPermission;
    }
    
    /**
     * Begär notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser stödjer inte notifications');
            return 'denied';
        }
        
        if (Notification.permission === 'granted') {
            this.notificationPermission = 'granted';
            return 'granted';
        }
        
        if (Notification.permission === 'denied') {
            this.notificationPermission = 'denied';
            return 'denied';
        }
        
        // Begär permission
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            this.publish('notificationPermissionChanged', permission);
            return permission;
        } catch (error) {
            console.error('Fel vid begäran av notification permission:', error);
            this.notificationPermission = 'denied';
            return 'denied';
        }
    }
    
    /**
     * Starta bakgrundsövervakning
     * 
     * @param {number} [interval=30000] - Intervall i millisekunder (default: 30s)
     */
    startMonitoring(interval = 30000) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Initial check
        this.checkReminders();
        
        // Kör check med intervall
        this.checkInterval = setInterval(() => {
            this.checkReminders();
            this.cleanupOldReminders();
        }, interval);
        
        console.log(`ReminderService monitoring startad (intervall: ${interval}ms)`);
    }
    
    /**
     * Stoppa bakgrundsövervakning
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('ReminderService monitoring stoppad');
        }
    }
    
    /**
     * Hämta statistik
     * 
     * @returns {Object}
     */
    getStats() {
        const now = new Date();
        const active = this.reminders.filter(r => !r.triggered && r.remindAt > now);
        const snoozed = active.filter(r => r.type === 'snoozed');
        const upcoming = active.filter(r => {
            const hoursUntil = (r.remindAt - now) / (1000 * 60 * 60);
            return hoursUntil <= 24;
        });
        
        return {
            total: this.reminders.length,
            active: active.length,
            snoozed: snoozed.length,
            upcoming24h: upcoming.length,
            triggered: this.reminders.filter(r => r.triggered).length,
            byType: {
                manual: this.reminders.filter(r => r.type === 'manual').length,
                snoozed: this.reminders.filter(r => r.type === 'snoozed').length,
                deadlineRelative: this.reminders.filter(r => r.type === 'deadline-relative').length
            }
        };
    }
    
    /**
     * Subscribe till events
     * 
     * @param {string} event
     * @param {Function} callback
     */
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
    }
    
    /**
     * Publicera event
     * 
     * @param {string} event
     * @param {*} data
     */
    publish(event, data) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Fel i subscriber för ${event}:`, error);
                }
            });
        }
    }
}

// Singleton export
const reminderService = new ReminderService();
export default reminderService;
