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
 * - Persistens via StateManager
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
 * eventBus.on('reminder:triggered', (reminder) => {
 *   showNotification(reminder.text);
 * });
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

class ReminderService {
    /**
     * Initialiserar ReminderService
     * Laddar sparade påminnelser, kontrollerar notifikationsbehörighet och startar övervakning
     */
    constructor() {
        this.reminders = [];
        this.checkInterval = null;
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

        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Register StateManager schema
        stateManager.registerSchema('reminders', {
            version: 1,
            validate: (data) => Array.isArray(data),
            migrate: (oldData) => oldData,
            default: []
        });

        // Register EventBus namespace
        eventBus.register('reminder');

        this.loadReminders();
        this.checkNotificationPermission();
        this.startMonitoring();
    }

    /**
     * Laddar påminnelser från StateManager och konverterar till rätt format
     * Kör även cleanup av gamla påminnelser
     * @returns {void}
     */
    loadReminders() {
        try {
            const stored = stateManager.get('reminders');
            if (stored && stored.length > 0) {
                // Konvertera string dates till Date objects
                this.reminders = stored.map(r => ({
                    ...r,
                    remindAt: new Date(r.remindAt),
                    createdAt: new Date(r.createdAt),
                    snoozedAt: r.snoozedAt ? new Date(r.snoozedAt) : null
                }));

                // Städa gamla påminnelser (äldre än 7 dagar)
                this.cleanupOldReminders();
            } else {
                this.reminders = [];
            }
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading reminders'
            });
            this.reminders = [];
        }
    }

    /**
     * Sparar alla påminnelser till StateManager
     * @returns {void}
     */
    saveReminders() {
        try {
            stateManager.set('reminders', this.reminders);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving reminders'
            });
        }
    }

    /**
     * Skapar en ny påminnelse för en todo
     *
     * @param {Object} reminderData - Påminnelsedata
     * @param {string} reminderData.todoId - ID för associerad todo
     * @param {string} reminderData.text - Text för påminnelsen
     * @param {Date} reminderData.remindAt - Datum/tid när påminnelsen ska triggas
     * @param {string} [reminderData.type='manual'] - Typ av påminnelse: 'manual', 'deadline-relative', 'snoozed'
     * @param {string} [reminderData.priority='medium'] - Prioritet: 'low', 'medium', 'high'
     * @param {Array<string>} [reminderData.tags=[]] - Taggar från associerad todo
     * @returns {Object} Den skapade påminnelsen
     */
    createReminder({ todoId, text, remindAt, type = 'manual', priority = 'medium', tags = [] }) {
        // Validate required fields
        errorHandler.validateRequired({ todoId, text, remindAt }, ['todoId', 'text', 'remindAt'], 'ReminderService.createReminder');

        if (!(remindAt instanceof Date) || isNaN(remindAt.getTime())) {
            const error = new Error('remindAt måste vara ett giltigt Date-objekt');
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: 'Creating reminder'
            });
            throw error;
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
        eventBus.emit('reminder:created', reminder);

        console.log('Påminnelse skapad:', {
            text,
            remindAt: remindAt.toLocaleString('sv-SE'),
            type
        });

        return reminder;
    }

    /**
     * Snooze:ar en todo genom att skapa påminnelse baserat på preset
     * Tar bort tidigare påminnelser för samma todo för att undvika duplicates
     *
     * @param {string} todoId - ID för todo att snooze:a
     * @param {string} preset - Snooze preset ('10min', '1h', '1day', etc.) eller custom ('+2h')
     * @param {Object} todo - Todo-objekt
     * @param {string} todo.text - Todo text
     * @param {string} [todo.priority] - Prioritet
     * @param {Array<string>} [todo.tags] - Taggar
     * @returns {Object} Skapad påminnelse med snooze-metadata
     */
    snoozeTodo(todoId, preset, todo) {
        // Validate required fields
        errorHandler.validateRequired({ todoId, preset, todo }, ['todoId', 'preset', 'todo'], 'ReminderService.snoozeTodo');

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

        eventBus.emit('reminder:todoSnoozed', {
            todoId,
            reminder,
            preset,
            snoozeCount: reminder.snoozeCount
        });

        return reminder;
    }

    /**
     * Beräknar framtida snooze-tid baserat på preset eller custom string
     * Stödjer: '10min', '30min', '1h', '3h', '1day', 'tomorrow9am', 'nextweek'
     * Samt custom format: '+2h', '+45min', '+3d'
     *
     * @param {string} preset - Snooze preset eller custom time string (t.ex. '+2h')
     * @returns {Date} Beräknad påminnelsetid
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
     * Skapar en deadline-relativ påminnelse (t.ex. "påminn 1h innan deadline")
     * Kräver att todo har dueDate, kan ha dueTime för exakt tid
     *
     * @param {Object} todo - Todo-objekt med deadline
     * @param {string} todo.id - Todo ID
     * @param {string} todo.text - Todo text
     * @param {string} todo.dueDate - Deadline datum (YYYY-MM-DD)
     * @param {string} [todo.dueTime] - Deadline tid (HH:MM)
     * @param {string} [todo.priority] - Prioritet
     * @param {Array<string>} [todo.tags] - Taggar
     * @param {string} offset - Tidsskillnad från deadline ('1h', '30min', '1day', etc.)
     * @returns {Object|null} Skapad påminnelse eller null om deadline saknas eller redan passerat
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
     * Konverterar tidsoffset-sträng till millisekunder
     * Stödjer format: Xmin, Xh, Xd/Xday/Xdays
     *
     * @param {string} offset - Tidsoffset (t.ex. '1h', '30min', '1day')
     * @returns {number} Antal millisekunder
     * @throws {Error} Om formatet är ogiltigt
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
     * Hämtar alla aktiva påminnelser (inte triggered, framtida)
     * Returnerar sorterade efter tid, närmast först
     *
     * @returns {Array<Object>} Aktiva påminnelser sorterade efter remindAt
     */
    getActiveReminders() {
        const now = new Date();
        return this.reminders
            .filter(r => !r.triggered && r.remindAt > now)
            .sort((a, b) => a.remindAt - b.remindAt);
    }

    /**
     * Hämtar alla påminnelser associerade med en specifik todo
     *
     * @param {string} todoId - ID för todo
     * @returns {Array<Object>} Lista med påminnelser för denna todo
     */
    getRemindersForTodo(todoId) {
        return this.reminders.filter(r => r.todoId === todoId);
    }

    /**
     * Hämtar aktiv snoozed påminnelse för en todo (om den finns)
     * Returnerar endast otriggade snooze-påminnelser
     *
     * @param {string} todoId - ID för todo
     * @returns {Object|null} Snoozed påminnelse eller null om ingen finns
     */
    getSnoozedReminder(todoId) {
        return this.reminders.find(r => r.todoId === todoId && r.type === 'snoozed' && !r.triggered);
    }

    /**
     * Avbryter en specifik påminnelse och publicerar event
     *
     * @param {string} reminderId - ID för påminnelsen att avbryta
     * @returns {void}
     */
    cancelReminder(reminderId) {
        const index = this.reminders.findIndex(r => r.id === reminderId);
        if (index !== -1) {
            const reminder = this.reminders[index];
            this.reminders.splice(index, 1);
            this.saveReminders();
            eventBus.emit('reminder:cancelled', reminder);
        }
    }

    /**
     * Avbryter alla påminnelser associerade med en todo
     * Publicerar event om minst en påminnelse avbryts
     *
     * @param {string} todoId - ID för todo vars påminnelser ska avbrytas
     * @returns {void}
     */
    cancelRemindersForTodo(todoId) {
        const cancelled = this.reminders.filter(r => r.todoId === todoId);
        this.reminders = this.reminders.filter(r => r.todoId !== todoId);
        this.saveReminders();

        if (cancelled.length > 0) {
            eventBus.emit('reminder:todoCancelled', { todoId, count: cancelled.length });
        }
    }

    /**
     * Kontrollerar alla påminnelser och triggar de som har passerat sin tid
     * Körs automatiskt av monitoring interval
     *
     * @returns {void}
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
            eventBus.emit('reminder:checked', {
                count: triggered.length,
                reminders: triggered
            });
        }
    }

    /**
     * Triggar en påminnelse och visar browser notification (eller fallback)
     * Försöker först med Notification API, faller tillbaka till in-app toast
     *
     * @param {Object} reminder - Påminnelse att trigga
     * @param {string} reminder.id - Reminder ID
     * @param {string} reminder.text - Påminnelsetext
     * @param {string} reminder.todoId - Associerad todo ID
     * @returns {Promise<void>}
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
                    eventBus.emit('reminder:clicked', reminder);
                    notification.close();
                };
            } catch (error) {
                errorHandler.handle(error, {
                    code: ErrorCode.UNKNOWN_ERROR,
                    context: 'Showing browser notification',
                    showToast: false
                });
                // Fallback till in-app toast
                eventBus.emit('reminder:triggered', reminder);
            }
        } else {
            // Fallback till in-app toast
            eventBus.emit('reminder:triggered', reminder);
        }

        // Statistik
        eventBus.emit('reminder:triggered', reminder);
    }

    /**
     * Städar bort gamla påminnelser (äldre än 7 dagar och triggered)
     * Sparar automatiskt efter cleanup
     *
     * @returns {void}
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
     * Kontrollerar nuvarande notification permission status
     *
     * @returns {Promise<string>} Permission status: 'granted', 'denied', eller 'default'
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
     * Begär notification permission från användaren
     * Publicerar event vid ändring av permission
     *
     * @returns {Promise<string>} Permission status: 'granted' eller 'denied'
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
            eventBus.emit('reminder:permissionChanged', permission);
            return permission;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: 'Requesting notification permission',
                showToast: false
            });
            this.notificationPermission = 'denied';
            return 'denied';
        }
    }

    /**
     * Startar bakgrundsövervakning av påminnelser
     * Kör checkReminders() och cleanupOldReminders() på intervall
     *
     * @param {number} [interval=30000] - Intervall i millisekunder (default: 30s)
     * @returns {void}
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
     * Stoppar bakgrundsövervakning av påminnelser
     * Rensar interval timer
     *
     * @returns {void}
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('ReminderService monitoring stoppad');
        }
    }

    /**
     * Hämtar statistik om påminnelser
     *
     * @returns {Object} Statistik-objekt med följande properties:
     * @property {number} total - Totalt antal påminnelser
     * @property {number} active - Antal aktiva påminnelser
     * @property {number} snoozed - Antal snoozade påminnelser
     * @property {number} upcoming24h - Antal påminnelser inom 24h
     * @property {number} triggered - Antal triggade påminnelser
     * @property {Object} byType - Påminnelser per typ
     */
    getStats() {
        const now = new Date();
        const active = this.reminders.filter(r => !r.triggered && r.remindAt > now);
        const snoozed = active.filter(r => r.type === 'snoozed');
        const upcoming = active.filter(r => {
            const hoursUntil = (r.remindAt.getTime() - now.getTime()) / (1000 * 60 * 60);
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

}

/**
 * Events emitted by ReminderService:
 * - reminder:created - När en påminnelse skapas
 * - reminder:todoSnoozed - När en todo snooze:as
 * - reminder:triggered - När en påminnelse triggas
 * - reminder:clicked - När användaren klickar på en notification
 * - reminder:cancelled - När en påminnelse avbryts
 * - reminder:todoCancelled - När alla påminnelser för en todo avbryts
 * - reminder:checked - När påminnelser har kontrollerats
 * - reminder:permissionChanged - När notification permission ändras
 */

// Singleton export
const reminderService = new ReminderService();
export default reminderService;
