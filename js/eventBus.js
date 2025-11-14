/**
 * EventBus
 *
 * Centraliserad event-hantering för Bifrost-applikationen.
 * Implementerar pub/sub-pattern för lös koppling mellan services och widgets.
 *
 * Features:
 * - Type-safe event handling med event namespaces
 * - Wildcard subscriptions (*-events)
 * - Once-subscriptions för engångslyssnare
 * - Event history och replay
 * - Automatic cleanup och unsubscribe
 * - Debug mode med console logging
 *
 * @example
 * // Prenumerera på event
 * const unsubscribe = eventBus.on('todo:created', (data) => {
 *   console.log('New todo:', data);
 * });
 *
 * // Publicera event
 * eventBus.emit('todo:created', { id: '123', text: 'New todo' });
 *
 * // Lyssna en gång
 * eventBus.once('app:ready', () => {
 *   console.log('App is ready!');
 * });
 *
 * // Avregistrera
 * unsubscribe();
 */

/**
 * EventBus class - Singleton för centraliserad event-hantering
 */
class EventBus {
    /**
     * Initialiserar EventBus
     */
    constructor() {
        /** @type {Object.<string, Array<{fn: Function, priority: number, id: string}>>} Event listeners per event namn */
        this.listeners = {};

        /** @type {Object.<string, Array<{fn: Function, priority: number, id: string}>>} Once-listeners som körs en gång */
        this.onceListeners = {};

        /** @type {Array<Object>} Event history för replay och debugging */
        this.eventHistory = [];

        /** @type {number} Max antal events i historik */
        this.maxHistorySize = 100;

        /** @type {boolean} Debug mode - loggar alla events */
        this.debugMode = false;

        /** @type {Set<string>} Event namespaces för validering */
        this.registeredNamespaces = new Set([
            'todo',
            'reminder',
            'recurring',
            'pomodoro',
            'stats',
            'theme',
            'weather',
            'calendar',
            'obsidian',
            'app',
            'ui',
            'menu'
        ]);
    }

    /**
     * Prenumerera på ett event
     *
     * @param {string} eventName - Event namn (t.ex. 'todo:created', 'reminder:triggered')
     * @param {Function} callback - Callback-funktion som tar emot event data
     * @param {Object} [options={}] - Konfiguration
     * @param {boolean} [options.once=false] - Kör endast en gång
     * @param {number} [options.priority=0] - Högre prioritet körs först
     * @returns {Function} Unsubscribe-funktion
     */
    on(eventName, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this._validateEventName(eventName);

        const { once = false, priority = 0 } = options;

        // Wrappa callback med metadata
        const wrappedCallback = {
            fn: callback,
            priority,
            id: this._generateId()
        };

        if (once) {
            // Once-listener
            if (!this.onceListeners[eventName]) {
                this.onceListeners[eventName] = [];
            }
            this.onceListeners[eventName].push(wrappedCallback);
        } else {
            // Vanlig listener
            if (!this.listeners[eventName]) {
                this.listeners[eventName] = [];
            }
            this.listeners[eventName].push(wrappedCallback);

            // Sortera efter prioritet (högre först)
            this.listeners[eventName].sort((a, b) => b.priority - a.priority);
        }

        if (this.debugMode) {
            console.log(`[EventBus] Subscribed to '${eventName}'`);
        }

        // Returnera unsubscribe-funktion
        return () => this.off(eventName, wrappedCallback.id);
    }

    /**
     * Prenumerera på event som endast körs en gång
     *
     * @param {string} eventName - Event namn
     * @param {Function} callback - Callback-funktion
     * @returns {Function} Unsubscribe-funktion
     */
    once(eventName, callback) {
        return this.on(eventName, callback, { once: true });
    }

    /**
     * Avregistrera en listener
     *
     * @param {string} eventName - Event namn
     * @param {string|Function} callbackOrId - Callback-funktion eller wrapper ID
     * @returns {void}
     */
    off(eventName, callbackOrId) {
        const removeFromList = (list) => {
            if (!list[eventName]) {return;}

            const index = list[eventName].findIndex(wrapper =>
                wrapper.id === callbackOrId || wrapper.fn === callbackOrId
            );

            if (index !== -1) {
                list[eventName].splice(index, 1);
                if (this.debugMode) {
                    console.log(`[EventBus] Unsubscribed from '${eventName}'`);
                }
            }
        };

        removeFromList(this.listeners);
        removeFromList(this.onceListeners);
    }

    /**
     * Avregistrera alla listeners för ett event
     *
     * @param {string} eventName - Event namn
     * @returns {void}
     */
    offAll(eventName) {
        delete this.listeners[eventName];
        delete this.onceListeners[eventName];

        if (this.debugMode) {
            console.log(`[EventBus] Removed all listeners for '${eventName}'`);
        }
    }

    /**
     * Publicera ett event
     *
     * @param {string} eventName - Event namn
     * @param {*} [data] - Event data
     * @param {Object} [options={}] - Konfiguration
     * @param {boolean} [options.async=false] - Kör callbacks asynkront
     * @returns {void}
     */
    emit(eventName, data, options = {}) {
        this._validateEventName(eventName);

        const { async = false } = options;

        // Spara i historik
        this._addToHistory(eventName, data);

        if (this.debugMode) {
            console.log(`[EventBus] Emitted '${eventName}'`, data);
        }

        // Samla alla listeners (vanliga + once)
        const regularListeners = this.listeners[eventName] || [];
        const onceListeners = this.onceListeners[eventName] || [];

        // Wildcard listeners (lyssnar på alla events i namespace)
        const namespace = eventName.split(':')[0];
        const wildcardListeners = this.listeners[`${namespace}:*`] || [];

        const allListeners = [
            ...regularListeners,
            ...onceListeners,
            ...wildcardListeners
        ];

        // Rensa once-listeners
        if (onceListeners.length > 0) {
            delete this.onceListeners[eventName];
        }

        // Kör callbacks
        if (async) {
            // Asynkrona callbacks
            setTimeout(() => {
                this._executeCallbacks(allListeners, eventName, data);
            }, 0);
        } else {
            // Synkrona callbacks
            this._executeCallbacks(allListeners, eventName, data);
        }
    }

    /**
     * Publicera event asynkront (non-blocking)
     *
     * @param {string} eventName - Event namn
     * @param {*} [data] - Event data
     * @returns {void}
     */
    emitAsync(eventName, data) {
        this.emit(eventName, data, { async: true });
    }

    /**
     * Kör callbacks för ett event
     *
     * @private
     * @param {Array<Object>} listeners - Lista med listener-wrappers
     * @param {string} eventName - Event namn
     * @param {*} data - Event data
     * @returns {void}
     */
    _executeCallbacks(listeners, eventName, data) {
        listeners.forEach(wrapper => {
            try {
                wrapper.fn(data, eventName);
            } catch (error) {
                console.error(`[EventBus] Error in listener for '${eventName}':`, error);
            }
        });
    }

    /**
     * Validerar event namn (måste ha namespace:action format)
     *
     * @private
     * @param {string} eventName - Event namn att validera
     * @throws {Error} Om namnet är ogiltigt
     * @returns {void}
     */
    _validateEventName(eventName) {
        if (typeof eventName !== 'string' || !eventName.includes(':')) {
            throw new Error(`Invalid event name: '${eventName}'. Must be in format 'namespace:action'`);
        }

        const [namespace] = eventName.split(':');

        if (!this.registeredNamespaces.has(namespace) && namespace !== '*') {
            console.warn(`[EventBus] Unknown namespace '${namespace}'. Consider registering it.`);
        }
    }

    /**
     * Genererar unikt ID för listener
     *
     * @private
     * @returns {string} Unikt ID
     */
    _generateId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Lägger till event i historik
     *
     * @private
     * @param {string} eventName - Event namn
     * @param {*} data - Event data
     * @returns {void}
     */
    _addToHistory(eventName, data) {
        this.eventHistory.push({
            eventName,
            data,
            timestamp: Date.now()
        });

        // Begränsa historikstorlek
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * Replay events från historik
     * Användbart för att synka widgets som laddas sent
     *
     * @param {Function} callback - Callback som tar emot varje event
     * @param {string} [eventPattern='*'] - Event pattern att replaya (t.ex. 'todo:*')
     * @returns {void}
     */
    replay(callback, eventPattern = '*') {
        if (typeof callback !== 'function') {
            throw new Error('First parameter must be a callback function');
        }

        const regex = this._createPatternRegex(eventPattern);

        this.eventHistory
            .filter(event => regex.test(event.eventName))
            .forEach(event => {
                try {
                    callback(event.data, event.eventName, event.timestamp);
                } catch (error) {
                    console.error('[EventBus] Error in replay callback:', error);
                }
            });
    }

    /**
     * Skapar regex från event pattern
     *
     * @private
     * @param {string} pattern - Event pattern (t.ex. 'todo:*', '*', 'todo:created')
     * @returns {RegExp} Regex för matching
     */
    _createPatternRegex(pattern) {
        if (pattern === '*') {
            return /.*/;
        }

        // Konvertera wildcard till regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/:/g, '\\:');

        return new RegExp(`^${regexPattern}$`);
    }

    /**
     * Hämtar event historik
     *
     * @param {Object} [filters={}] - Filtreringsalternativ
     * @param {string} [filters.eventName] - Filtrera på event namn (stödjer wildcard)
     * @param {number} [filters.since] - Timestamp att filtrera från
     * @param {number} [filters.limit] - Max antal events att returnera
     * @returns {Array<Object>} Filtrerad eventhistorik
     */
    getHistory(filters = {}) {
        let filtered = [...this.eventHistory];

        if (filters.eventName) {
            const regex = this._createPatternRegex(filters.eventName);
            filtered = filtered.filter(e => regex.test(e.eventName));
        }

        if (filters.since) {
            filtered = filtered.filter(e => e.timestamp >= filters.since);
        }

        if (filters.limit) {
            filtered = filtered.slice(-filters.limit);
        }

        return filtered;
    }

    /**
     * Registrerar ett nytt namespace
     *
     * @param {string} namespace - Namespace att registrera
     * @returns {void}
     */
    registerNamespace(namespace) {
        this.registeredNamespaces.add(namespace);

        if (this.debugMode) {
            console.log(`[EventBus] Registered namespace '${namespace}'`);
        }
    }

    /**
     * Hämtar alla aktiva listeners
     *
     * @returns {Object.<string, number>} Antal listeners per event
     */
    getListenerCount() {
        const counts = Object.create(null);

        Object.keys(this.listeners).forEach(eventName => {
            counts[eventName] = this.listeners[eventName].length;
        });

        Object.keys(this.onceListeners).forEach(eventName => {
            counts[eventName] = (counts[eventName] || 0) + this.onceListeners[eventName].length;
        });

        return counts;
    }

    /**
     * Rensar alla listeners och historik
     * Används främst för testing
     *
     * @returns {void}
     */
    clear() {
        this.listeners = {};
        this.onceListeners = {};
        this.eventHistory = [];

        if (this.debugMode) {
            console.log('[EventBus] Cleared all listeners and history');
        }
    }

    /**
     * Aktiverar/avaktiverar debug mode
     *
     * @param {boolean} enabled - Om debug mode ska vara på
     * @returns {void}
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Hämtar statistik över event-systemet
     *
     * @returns {Object} Statistik-objekt
     */
    getStats() {
        return {
            totalEvents: this.eventHistory.length,
            listenerCount: this.getListenerCount(),
            namespaces: Array.from(this.registeredNamespaces),
            recentEvents: this.eventHistory.slice(-10)
        };
    }
}

// Singleton export
const eventBus = new EventBus();
export default eventBus;
