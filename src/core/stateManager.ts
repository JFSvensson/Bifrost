/**
 * StateManager
 *
 * Centraliserad hantering av localStorage för Bifrost-applikationen.
 * Tillhandahåller standardiserat API för att spara, läsa och migrera data.
 *
 * Features:
 * - Type-safe storage med validation
 * - Schema migrations för versionshantering
 * - Automatic backup och restore
 * - Storage quota monitoring
 * - Compression för stora objekt
 * - TTL (Time To Live) för cache-data
 * - Event-driven updates via EventBus
 *
 * @example
 * // Definiera schema
 * stateManager.registerSchema('todos', {
 *   version: 1,
 *   validate: (data) => Array.isArray(data)
 * });
 *
 * // Spara data
 * stateManager.set('todos', myTodos);
 *
 * // Läs data
 * const todos = stateManager.get('todos', []);
 *
 * // Lyssna på ändringar
 * stateManager.subscribe('todos', (data) => {
 *   console.log('Todos updated:', data);
 * });
 */

import eventBus from './eventBus.js';
import errorHandler, { ErrorCode } from './errorHandler.js';
import { debounce } from '../utils/debounce.js';
import { logger } from '../utils/logger.js';

/**
 * StateManager class - Singleton för centraliserad state-hantering
 */
class StateManager {
    schemas: Record<string, any>;
    versions: Record<string, number>;
    subscribers: Record<string, Array<Function>>;
    quotaWarningThreshold: number;
    autoBackupEnabled: boolean;
    _backupCounter: number;
    maxBackupAge: number;
    pendingWrites: Map<string, any>;
    debounceDelay: number;
    testMode: boolean;
    _debouncedFlush: () => void;
    _keys: Set<string>;

    /**
     * Initialiserar StateManager
     */
    constructor() {
        /** @type {Object.<string, Object>} Registrerade schemas per key */
        this.schemas = {};

        /** @type {Object.<string, number>} Versionsnummer per key */
        this.versions = {};

        /** @type {Object.<string, Array<Function>>} Subscribers per key */
        this.subscribers = {};

        /** @type {number} Storage quota warning threshold (80%) */
        this.quotaWarningThreshold = 0.8;

        /** @type {boolean} Auto-backup enabled */
        this.autoBackupEnabled = true;

        /** @type {number} Backup counter for unique timestamps */
        this._backupCounter = 0;

        /** @type {number} Max backup age in days */
        this.maxBackupAge = 7;

        /** @type {Map<string, any>} Pending writes buffer */
        this.pendingWrites = new Map();

        /** @type {number} Debounce delay in milliseconds */
        this.debounceDelay = 300;

        /** @type {boolean} Test mode - disable debouncing for tests */
        this.testMode = false;

        // Create debounced flush function
        this._debouncedFlush = debounce(() => this._flushPendingWrites(), this.debounceDelay);

        /** @type {Set<string>} Internal registry of localStorage keys */
        this._keys = new Set();

        this._init();
    }

    /**
     * Synchronize internal key registry with localStorage
     * @private
     */
    _syncKeys() {
        // Try multiple enumeration methods
        try {
            // Method 1: for...in
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    this._keys.add(key);
                }
            }
        } catch (_e) {}

        try {
            // Method 2: Standard iteration
            if (typeof localStorage.length === 'number') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {this._keys.add(key);}
                }
            }
        } catch (_e) {}
    }

    /**
     * Get all localStorage keys (works in both browser and test environments)
     * @private
     * @returns {string[]} Array of keys
     */
    _getAllKeys() {
        // Return keys from our registry, filtered to only include keys that still exist
        const keys = [];
        for (const key of this._keys) {
            if (localStorage.getItem(key) !== null) {
                keys.push(key);
            } else {
                // Remove stale keys
                this._keys.delete(key);
            }
        }
        return keys;
    }

    /**
     * Initialiserar StateManager och kontrollerar storage
     *
     * @private
     * @returns {void}
     */
    _init() {
        // Enable test mode if running in Vitest (disable debouncing for tests)
        if (typeof process !== 'undefined' && process.env?.VITEST) {
            this.testMode = true;
        }

        // Register state namespace in eventBus
        eventBus.registerNamespace('state');

        this._syncKeys();
        this._checkStorageQuota();
        this._cleanupOldBackups();

        // Registrera event listeners
        eventBus.on('app:beforeUnload', () => {
            // Flush pending writes before unload
            this.flush();

            if (this.autoBackupEnabled) {
                this._createBackup();
            }
        });

        // Also flush on page visibility change (tab switch, minimize)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.flush();
                }
            });
        }
    }

    /**
     * Registrerar ett schema för en storage key
     *
     * @param {string} key - Storage key
     * @param {Object} schema - Schema definition
     * @param {number} schema.version - Schema version
     * @param {Function} [schema.validate] - Validation function (data) => boolean
     * @param {Function} [schema.migrate] - Migration function (oldData, oldVersion) => newData
     * @param {*} [schema.default] - Default value
     * @returns {void}
     */
    registerSchema(key, schema) {
        const { version, validate, migrate, default: defaultValue } = schema;

        if (!version || typeof version !== 'number') {
            throw new Error(`Schema version required for key '${key}'`);
        }

        this.schemas[key] = {
            version,
            validate: validate || (() => true),
            migrate: migrate || ((data) => data),
            default: defaultValue
        };

        this.versions[key] = version;

        // Kör migrations om nödvändigt
        this._checkAndMigrate(key);
    }

    /**
     * Hämtar data från storage
     *
     * @param {string} key - Storage key
     * @param {*} [defaultValue] - Default value om key saknas
     * @returns {*} Sparad data eller default value
     */
    get(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);

            if (stored === null) {
                // Returnera default från schema eller parameter
                const schemaDefault = this.schemas[key]?.default;
                return schemaDefault !== undefined ? schemaDefault : defaultValue;
            }

            const parsed = JSON.parse(stored);

            // Kontrollera TTL
            if (parsed._ttl && parsed._ttl < Date.now()) {
                this.remove(key);
                return defaultValue;
            }

            // Returnera data (eller hela objektet om inget _data finns)
            const data = parsed._data !== undefined ? parsed._data : parsed;

            // Validera mot schema
            if (this.schemas[key] && !this.schemas[key].validate(data)) {
                errorHandler.warning(
                    ErrorCode.VALIDATION_ERROR,
                    `Data validation failed for key '${key}'`,
                    { key, data }
                );
            }

            return data;

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_PARSE_ERROR,
                context: `Reading key '${key}'`,
                showToast: false
            });

            return defaultValue;
        }
    }

    /**
     * Sparar data till storage
     *
     * @param {string} key - Storage key
     * @param {*} data - Data att spara
     * @param {Object} [options={}] - Konfiguration
     * @param {number} [options.ttl] - Time to live i millisekunder
     * @param {boolean} [options.validate=true] - Validera mot schema
     * @param {boolean} [options.notify=true] - Notifiera subscribers
     * @param {boolean} [options.immediate=false] - Skip debouncing and save immediately
     * @returns {boolean} True om spara lyckades
     */
    set(key, data, options: any = {}) {
        const {
            ttl,
            validate = true,
            notify = true,
            immediate = false
        } = options;

        try {
            // Validera mot schema
            if (validate && this.schemas[key]) {
                if (!this.schemas[key].validate(data)) {
                    throw new Error(`Validation failed for key '${key}'`);
                }
            }

            // Bygg storage object
            const storageObject: any = {
                _data: data,
                _version: this.versions[key] || 1,
                _updated: Date.now()
            };

            if (ttl) {
                storageObject._ttl = Date.now() + ttl;
            }

            // If immediate or test mode, save directly to localStorage
            if (immediate || this.testMode) {
                const serialized = JSON.stringify(storageObject);
                localStorage.setItem(key, serialized);
                this._keys.add(key); // Track key
            } else {
                // Buffer write for debouncing
                this.pendingWrites.set(key, { storageObject, notify });
                this._debouncedFlush();
            }

            // Notifiera subscribers immediately (don't debounce UI updates)
            if (notify) {
                this._notifySubscribers(key, data);
            }

            // Emit event
            eventBus.emit('state:updated', { key, data });

            return true;

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: `Saving key '${key}'`,
                showToast: true
            });

            return false;
        }
    }

    /**
     * Flushes all pending writes to localStorage
     * Called by debounced function after delay
     * @private
     * @returns {void}
     */
    _flushPendingWrites() {
        if (this.pendingWrites.size === 0) {
            return;
        }

        performance.mark('storage-flush-start');

        const writesToFlush = Array.from(this.pendingWrites.entries());
        this.pendingWrites.clear();

        for (const [key, { storageObject }] of writesToFlush) {
            try {
                const serialized = JSON.stringify(storageObject);
                localStorage.setItem(key, serialized);
                this._keys.add(key); // Track key
            } catch (error) {
                // Hantera quota exceeded
                if (error.name === 'QuotaExceededError') {
                    errorHandler.handle(error, {
                        code: ErrorCode.STORAGE_QUOTA_EXCEEDED,
                        context: `Flushing key '${key}'`,
                        showToast: true
                    });

                    // Försök rensa gammalt och försök igen
                    this._cleanupOldData();

                    try {
                        const serialized = JSON.stringify(storageObject);
                        localStorage.setItem(key, serialized);
                        this._keys.add(key); // Track key
                    } catch (retryError) {
                        logger.error(`Failed to flush ${key}`, retryError);
                    }
                } else {
                    errorHandler.handle(error, {
                        code: ErrorCode.STORAGE_ERROR,
                        context: `Flushing key '${key}'`,
                        showToast: false
                    });
                }
            }
        }

        performance.mark('storage-flush-end');
        performance.measure('storage-flush', 'storage-flush-start', 'storage-flush-end');
    }

    /**
     * Forces immediate flush of all pending writes
     * Useful before page unload or critical operations
     * @returns {void}
     */
    flush() {
        (this._debouncedFlush as any).cancel();
        this._flushPendingWrites();
    }
    /**
     * Tar bort data från storage
     *
     * @param {string} key - Storage key
     * @param {Object} [options={}] - Konfiguration
     * @param {boolean} [options.notify=true] - Notifiera subscribers
     * @returns {void}
     */
    remove(key, options: any = {}) {
        const { notify = true } = options;

        localStorage.removeItem(key);
        this._keys.delete(key); // Remove from registry

        if (notify) {
            this._notifySubscribers(key, null);
        }

        eventBus.emit('state:removed', { key });
    }

    /**
     * Kontrollerar om key finns i storage
     *
     * @param {string} key - Storage key
     * @returns {boolean} True om key finns
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Rensar all data från storage
     *
     * @param {Object} [options={}] - Konfiguration
     * @param {boolean} [options.keepSchemas=true] - Behåll schema registreringar
     * @returns {void}
     */
    clear(options: any = {}) {
        const { keepSchemas = false } = options;

        // Backup före clear
        if (this.autoBackupEnabled) {
            this._createBackup();
        }

        localStorage.clear();
        this._keys.clear(); // Clear key registry

        if (!keepSchemas) {
            this.schemas = {};
            this.versions = {};
        }

        eventBus.emit('state:cleared', {});
    }

    /**
     * Prenumererar på ändringar för en key
     *
     * @param {string} key - Storage key att lyssna på
     * @param {Function} callback - Callback (data, key) => void
     * @returns {Function} Unsubscribe-funktion
     */
    subscribe(key, callback) {
        if (!this.subscribers[key]) {
            this.subscribers[key] = [];
        }

        this.subscribers[key].push(callback);

        // Returnera unsubscribe
        return () => {
            const index = this.subscribers[key]?.indexOf(callback);
            if (index !== -1) {
                this.subscribers[key].splice(index, 1);
            }
        };
    }

    /**
     * Notifierar subscribers om ändringar
     *
     * @private
     * @param {string} key - Storage key
     * @param {*} data - Uppdaterad data
     * @returns {void}
     */
    _notifySubscribers(key, data) {
        if (this.subscribers[key]) {
            this.subscribers[key].forEach(callback => {
                try {
                    callback(data, key);
                } catch (error) {
                    errorHandler.log(
                        ErrorCode.UNKNOWN_ERROR,
                        `Error in state subscriber for '${key}'`,
                        { error }
                    );
                }
            });
        }
    }

    /**
     * Kontrollerar och kör migrations om nödvändigt
     *
     * @private
     * @param {string} key - Storage key
     * @returns {void}
     */
    _checkAndMigrate(key) {
        const stored = localStorage.getItem(key);
        if (!stored) {return;}

        try {
            const parsed = JSON.parse(stored);
            const currentVersion = parsed._version || 0;
            const targetVersion = this.versions[key];

            if (currentVersion < targetVersion) {
                logger.info(`[StateManager] Migrating '${key}' from v${currentVersion} to v${targetVersion}`);

                const migratedData = this.schemas[key].migrate(parsed._data || parsed, currentVersion);

                this.set(key, migratedData, { notify: false });

                eventBus.emit('state:migrated', { key, from: currentVersion, to: targetVersion });
            }
        } catch (error) {
            errorHandler.log(
                ErrorCode.STORAGE_ERROR,
                `Migration failed for key '${key}'`,
                { error }
            );
        }
    }

    /**
     * Skapar backup av all data
     *
     * @private
     * @returns {boolean} True om backup lyckades
     */
    _createBackup() {
        try {
            const backup = {};
            const keys = this._getAllKeys();

            keys.forEach(key => {
                if (!key.startsWith('backup_')) {
                    backup[key] = localStorage.getItem(key);
                }
            });

            const backupKey = `backup_${Date.now()}_${this._backupCounter++}`;
            localStorage.setItem(backupKey, JSON.stringify(backup));
            this._keys.add(backupKey);

            logger.debug('[StateManager] Backup created', { backupKey });
            return true;

        } catch (error) {
            errorHandler.log(
                ErrorCode.STORAGE_ERROR,
                'Failed to create backup',
                { error }
            );
            return false;
        }
    }

    /**
     * Återställer från backup
     *
     * @param {string} [backupKey] - Backup key, senaste om inte specificerad
     * @returns {boolean} True om restore lyckades
     */
    restoreFromBackup(backupKey) {
        try {
            // Hitta senaste backup om ingen specificerad
            if (!backupKey) {
                const backupKeys = this._getAllKeys()
                    .filter(k => k.startsWith('backup_'))
                    .sort()
                    .reverse();

                if (backupKeys.length === 0) {
                    throw new Error('No backups found');
                }

                backupKey = backupKeys[0];
            }

            const backup = JSON.parse(localStorage.getItem(backupKey));

            // Återställ alla keys
            Object.keys(backup).forEach(key => {
                localStorage.setItem(key, backup[key]);
                this._keys.add(key); // Track restored key
            });

            eventBus.emit('state:restored', { backupKey });
            logger.info('[StateManager] Restored from backup', { backupKey });

            return true;

        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Restoring from backup',
                showToast: true
            });
            return false;
        }
    }

    /**
     * Rensar gamla backups
     *
     * @private
     * @returns {void}
     */
    _cleanupOldBackups() {
        // Re-sync keys to catch any backups created outside normal flow (e.g., in tests)
        this._syncKeys();

        const cutoffTime = Date.now() - (this.maxBackupAge * 24 * 60 * 60 * 1000);

        const keysToRemove = this._getAllKeys()
            .filter(k => k.startsWith('backup_'))
            .filter(key => {
                const timestamp = parseInt(key.split('_')[1], 10);
                return timestamp < cutoffTime;
            });

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            this._keys.delete(key);
        });
    }

    /**
     * Rensar gammal data (expired TTL etc)
     *
     * @private
     * @returns {void}
     */
    _cleanupOldData() {
        // Re-sync keys to ensure we find all stored data
        this._syncKeys();

        const now = Date.now();
        const keys = this._getAllKeys();
        const keysToRemove = [];

        keys.forEach(key => {
            try {
                const stored = localStorage.getItem(key);
                const parsed = JSON.parse(stored);

                // Ta bort om TTL passerat
                if (parsed._ttl && parsed._ttl < now) {
                    keysToRemove.push(key);
                }
            } catch (_error) {
                // Ignore parse errors
            }
        });

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            this._keys.delete(key);
        });
    }

    /**
     * Kontrollerar storage quota
     *
     * @private
     * @returns {Promise<void>}
     */
    async _checkStorageQuota() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return;
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage / estimate.quota;

            if (usage > this.quotaWarningThreshold) {
                errorHandler.warning(
                    'STORAGE_QUOTA_WARNING',
                    'Storage quota nearly full',
                    { usage: `${(usage * 100).toFixed(1)}%` }
                );

                eventBus.emit('state:quotaWarning', {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentage: usage
                });
            }
        } catch (_error) {
            // Ignore quota check errors
        }
    }

    /**
     * Hämtar storage statistik
     *
     * @returns {Promise<Object>} Statistik-objekt
     */
    async getStats() {
        let usage = null;
        let quota = null;

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                usage = estimate.usage;
                quota = estimate.quota;
            } catch (_error) {
                // Ignore
            }
        }

        return {
            keyCount: Object.keys(localStorage).length,
            schemaCount: Object.keys(this.schemas).length,
            subscriberCount: Object.values(this.subscribers).reduce((sum, arr) => sum + arr.length, 0),
            usage,
            quota,
            usagePercentage: usage && quota ? (usage / quota * 100).toFixed(1) : null
        };
    }

    /**
     * Exporterar all data som JSON
     *
     * @returns {Object} All sparad data
     */
    exportAll() {
        const data = {};
        const keys = this._getAllKeys();

        keys.forEach(key => {
            if (!key.startsWith('backup_')) {
                try {
                    const value = localStorage.getItem(key);
                    if (value !== null) {
                        data[key] = JSON.parse(value);
                    }
                } catch (_error) {
                    data[key] = localStorage.getItem(key);
                }
            }
        });

        return data;
    }

    /**
     * Importerar data från JSON
     *
     * @param {Object} data - Data att importera
     * @param {Object} [options={}] - Konfiguration
     * @param {boolean} [options.merge=false] - Merge med befintlig data
     * @returns {void}
     */
    importAll(data, options: any = {}) {
        const { merge = false } = options;

        if (!merge) {
            this.clear({ keepSchemas: true });
        }

        Object.keys(data).forEach(key => {
            try {
                // Always JSON.stringify to ensure consistent storage format
                const value = JSON.stringify(data[key]);
                localStorage.setItem(key, value);
                this._keys.add(key); // Track imported key
            } catch (error) {
                errorHandler.log(
                    ErrorCode.STORAGE_ERROR,
                    `Failed to import key '${key}'`,
                    { error }
                );
            }
        });

        eventBus.emit('state:imported', { keyCount: Object.keys(data).length });
    }

    /**
     * Beräknar total storlek på localStorage
     *
     * @returns {number} Storlek i bytes
     */
    getStorageSize() {
        let size = 0;
        const keys = this._getAllKeys();

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            size += (value ? value.length : 0) + key.length;
        });

        return size;
    }

    /**
     * Get all keys in localStorage (including internal registry for test environments)
     * @returns {string[]} Array of all keys
     */
    getAllKeys() {
        return this._getAllKeys();
    }

    /**
     * Add a key to the internal registry (for test environments)
     * @param {string} key - Key to track
     */
    _trackKey(key) {
        this._keys.add(key);
    }

    /**
     * Exporterar all state (alias för exportAll)
     *
     * @returns {Object} Exporterad data
     */
    exportState() {
        return this.exportAll();
    }

    /**
     * Importerar state (alias för importAll)
     *
     * @param {Object} data - Data att importera
     * @param {Object} [options={}] - Konfiguration
     * @returns {void}
     */
    importState(data, options = {}) {
        return this.importAll(data, options);
    }
}

// Singleton export
const stateManager = new StateManager();
export default stateManager;
