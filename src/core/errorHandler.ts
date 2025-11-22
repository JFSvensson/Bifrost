/**
 * ErrorHandler
 *
 * Centraliserad felhantering för Bifrost-applikationen.
 * Hanterar loggning, användarnotifikationer och felrapportering.
 *
 * Features:
 * - Standardiserade feltyper med error codes
 * - Toast-notifikationer för användaren
 * - Console-loggning med context
 * - Error tracking och statistik
 * - Configurable log levels
 *
 * @example
 * // Hantera ett fel
 * errorHandler.handle(error, {
 *   code: 'STORAGE_ERROR',
 *   context: 'Sparar todos',
 *   showToast: true
 * });
 *
 * // Logga ett fel utan toast
 * errorHandler.log('API_ERROR', 'Kunde inte hämta väder', { service: 'weather' });
 *
 * // Rapportera kritiskt fel
 * errorHandler.critical('SERVICE_INIT_FAILED', 'ReminderService kunde inte startas');
 */

/**
 * Error severity levels
 * @enum {string}
 */
export const ErrorLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * Standard error codes för Bifrost
 * @enum {string}
 */
export const ErrorCode = {
    // Storage errors
    STORAGE_ERROR: 'STORAGE_ERROR',
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    STORAGE_PARSE_ERROR: 'STORAGE_PARSE_ERROR',

    // Service errors
    SERVICE_INIT_FAILED: 'SERVICE_INIT_FAILED',
    SERVICE_NOT_READY: 'SERVICE_NOT_READY',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

    // API errors
    API_ERROR: 'API_ERROR',
    API_TIMEOUT: 'API_TIMEOUT',
    API_UNAUTHORIZED: 'API_UNAUTHORIZED',
    API_NOT_FOUND: 'API_NOT_FOUND',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED: 'MISSING_REQUIRED',

    // Notification errors
    NOTIFICATION_PERMISSION_DENIED: 'NOTIFICATION_PERMISSION_DENIED',
    NOTIFICATION_NOT_SUPPORTED: 'NOTIFICATION_NOT_SUPPORTED',

    // Obsidian integration
    OBSIDIAN_BRIDGE_ERROR: 'OBSIDIAN_BRIDGE_ERROR',
    OBSIDIAN_FILE_NOT_FOUND: 'OBSIDIAN_FILE_NOT_FOUND',

    // Generic
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
};

/**
 * ErrorHandler class - Singleton för centraliserad felhantering
 */
class ErrorHandler {
    errorHistory: any[];
    maxHistorySize: number;
    logLevel: string;
    errorCounts: Record<string, number>;
    toastFunction: ((_message: string, _type: string) => void) | null;

    /**
     * Initialiserar ErrorHandler
     */
    constructor() {
        /** @type {Array<Object>} Historik av loggade fel */
        this.errorHistory = [];

        /** @type {number} Max antal fel att spara i historik */
        this.maxHistorySize = 100;

        /** @type {string} Nuvarande log level */
        this.logLevel = ErrorLevel.WARNING;

        /** @type {Object.<string, number>} Statistik per felkod */
        this.errorCounts = {};

        /** @type {Function|null} Toast-funktion för att visa meddelanden */
        this.toastFunction = null;

        // Fånga uncaught errors
        this.setupGlobalErrorHandlers();
    }

    /**
     * Sätter upp globala error handlers
     * @private
     * @returns {void}
     */
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handle(event.error, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: 'Uncaught error',
                level: ErrorLevel.ERROR,
                showToast: false // Undvik spam
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handle(event.reason, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: 'Unhandled promise rejection',
                level: ErrorLevel.ERROR,
                showToast: false
            });
        });
    }

    /**
     * Huvudmetod för att hantera fel
     *
     * @param {Error|string} error - Fel-objekt eller felmeddelande
     * @param {Object} [options={}] - Konfiguration
     * @param {string} [options.code=ErrorCode.UNKNOWN_ERROR] - Felkod
     * @param {string} [options.context] - Context där felet uppstod
     * @param {string} [options.level=ErrorLevel.ERROR] - Severity level
     * @param {boolean} [options.showToast=true] - Visa toast-notifikation
     * @param {Object} [options.metadata] - Extra metadata
     * @returns {Object} ErrorInfo-objekt
     */
    handle(error, options: any = {}) {
        const {
            code = ErrorCode.UNKNOWN_ERROR,
            context = '',
            level = ErrorLevel.ERROR,
            showToast = true,
            metadata = {}
        } = options;

        // Skapa errorInfo-objekt
        const errorInfo = {
            code,
            message: error instanceof Error ? error.message : String(error),
            context,
            level,
            timestamp: Date.now(),
            stack: error instanceof Error ? error.stack || null : null,
            metadata
        };

        // Logga till console
        this._logToConsole(errorInfo);

        // Lägg till i historik
        this._addToHistory(errorInfo);

        // Uppdatera statistik
        this._updateStats(code);

        // Visa toast om specificerat
        if (showToast) {
            this._showToast(errorInfo);
        }

        return errorInfo;
    }

    /**
     * Loggar ett fel utan att kasta exception
     *
     * @param {string} code - Felkod
     * @param {string} message - Felmeddelande
     * @param {Object} [metadata={}] - Extra metadata
     * @returns {void}
     */
    log(code, message, metadata = {}) {
        this.handle(new Error(message), {
            code,
            level: ErrorLevel.WARNING,
            showToast: false,
            metadata
        });
    }

    /**
     * Loggar en info-meddelande
     *
     * @param {string} message - Meddelande
     * @param {Object} [metadata={}] - Extra metadata
     * @returns {void}
     */
    info(message, metadata = {}) {
        const errorInfo = {
            code: 'INFO',
            message,
            context: '',
            level: ErrorLevel.INFO,
            timestamp: Date.now(),
            metadata
        };

        this._logToConsole(errorInfo);
    }

    /**
     * Loggar en warning
     *
     * @param {string} code - Warning code
     * @param {string} message - Warning meddelande
     * @param {Object} [metadata={}] - Extra metadata
     * @returns {void}
     */
    warning(code, message, metadata = {}) {
        this.handle(new Error(message), {
            code,
            level: ErrorLevel.WARNING,
            showToast: false,
            metadata
        });
    }

    /**
     * Rapporterar ett kritiskt fel
     *
     * @param {string} code - Felkod
     * @param {string} message - Felmeddelande
     * @param {Object} [metadata={}] - Extra metadata
     * @returns {void}
     */
    critical(code, message, metadata = {}) {
        this.handle(new Error(message), {
            code,
            level: ErrorLevel.CRITICAL,
            showToast: true,
            metadata
        });
    }

    /**
     * Validerar att required fields finns
     *
     * @param {Object} data - Data att validera
     * @param {Array<string>} requiredFields - Required field names
     * @param {string} [context='Validation'] - Context
     * @throws {Error} Om required fields saknas
     * @returns {void}
     */
    validateRequired(data, requiredFields, context = 'Validation') {
        const missing = requiredFields.filter(field => !data[field]);

        if (missing.length > 0) {
            const error = new Error(`Missing required fields: ${missing.join(', ')}`);
            this.handle(error, {
                code: ErrorCode.MISSING_REQUIRED,
                context,
                showToast: true,
                metadata: { missing, data }
            });
            throw error;
        }
    }

    /**
     * Loggar till console baserat på level
     *
     * @private
     * @param {Object} errorInfo - ErrorInfo-objekt
     * @returns {void}
     */
    _logToConsole(errorInfo) {
        const { level, code, message, context, metadata, stack } = errorInfo;

        const logMessage = [
            `[${level.toUpperCase()}]`,
            code && `[${code}]`,
            context && `(${context})`,
            message
        ].filter(Boolean).join(' ');

        switch (level) {
            case ErrorLevel.DEBUG:
                console.debug(logMessage, metadata);
                break;
            case ErrorLevel.INFO:
                console.info(logMessage, metadata);
                break;
            case ErrorLevel.WARNING:
                console.warn(logMessage, metadata);
                break;
            case ErrorLevel.ERROR:
                console.error(logMessage, metadata);
                if (stack) {console.error('Stack:', stack);}
                break;
            case ErrorLevel.CRITICAL:
                console.error('🚨 CRITICAL:', logMessage, metadata);
                if (stack) {console.error('Stack:', stack);}
                break;
        }
    }

    /**
     * Lägger till fel i historik
     *
     * @private
     * @param {Object} errorInfo - ErrorInfo-objekt
     * @returns {void}
     */
    _addToHistory(errorInfo) {
        this.errorHistory.push(errorInfo);

        // Begränsa historikstorlek
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
    }

    /**
     * Uppdaterar statistik för felkoder
     *
     * @private
     * @param {string} code - Felkod
     * @returns {void}
     */
    _updateStats(code) {
        this.errorCounts[code] = (this.errorCounts[code] || 0) + 1;
    }

    /**
     * Visar toast-notifikation till användaren
     *
     * @private
     * @param {Object} errorInfo - ErrorInfo-objekt
     * @returns {void}
     */
    _showToast(errorInfo) {
        if (!this.toastFunction) {
            // Fallback: använd alert för kritiska fel
            if (errorInfo.level === ErrorLevel.CRITICAL) {
                alert(`Fel: ${errorInfo.message}`);
            }
            return;
        }

        // Anpassa meddelande för användaren (user-friendly)
        const userMessage = this._getUserFriendlyMessage(errorInfo);

        this.toastFunction(userMessage, {
            type: errorInfo.level === ErrorLevel.CRITICAL ? 'error' : 'warning',
            duration: errorInfo.level === ErrorLevel.CRITICAL ? 10000 : 5000
        } as any);
    }

    /**
     * Konverterar tekniskt felmeddelande till användarvänligt
     *
     * @private
     * @param {Object} errorInfo - ErrorInfo-objekt
     * @returns {string} Användarvänligt meddelande
     */
    _getUserFriendlyMessage(errorInfo) {
        const { code, message: _message, context } = errorInfo;

        // Mapping av felkoder till användarvänliga meddelanden
        const friendlyMessages = {
            [ErrorCode.STORAGE_ERROR]: 'Kunde inte spara data',
            [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Lagringsutrymmme fullt',
            [ErrorCode.API_ERROR]: 'Nätverksfel - försök igen',
            [ErrorCode.API_TIMEOUT]: 'Servern svarar inte - försök igen',
            [ErrorCode.VALIDATION_ERROR]: 'Ogiltig inmatning',
            [ErrorCode.NOTIFICATION_PERMISSION_DENIED]: 'Notifikationer är blockerade',
            [ErrorCode.OBSIDIAN_BRIDGE_ERROR]: 'Kunde inte ansluta till Obsidian'
        };

        const baseMessage = friendlyMessages[code] || 'Ett fel uppstod';
        return context ? `${baseMessage} (${context})` : baseMessage;
    }

    /**
     * Registrerar toast-funktion för notifikationer
     *
     * @param {Function} toastFn - Toast-funktion (message, options) => void
     * @returns {void}
     */
    registerToastFunction(toastFn) {
        this.toastFunction = toastFn;
    }

    /**
     * Hämtar error-historik
     *
     * @param {Object} [filters={}] - Filtreringsalternativ
     * @param {string} [filters.level] - Filtrera på level
     * @param {string} [filters.code] - Filtrera på kod
     * @param {number} [filters.since] - Timestamp att filtrera från
     * @returns {Array<Object>} Filtrerad errorhistorik
     */
    getHistory(filters: any = {}) {
        let filtered = [...this.errorHistory];

        if (filters.level) {
            filtered = filtered.filter(e => e.level === filters.level);
        }

        if (filters.code) {
            filtered = filtered.filter(e => e.code === filters.code);
        }

        if (filters.since) {
            filtered = filtered.filter(e => e.timestamp >= filters.since);
        }

        return filtered;
    }

    /**
     * Hämtar statistik över fel
     *
     * @returns {Object.<string, number>} Error counts per code
     */
    getStats() {
        return { ...this.errorCounts };
    }

    /**
     * Rensar error-historik
     *
     * @returns {void}
     */
    clearHistory() {
        this.errorHistory = [];
    }

    /**
     * Rensar statistik
     *
     * @returns {void}
     */
    clearStats() {
        this.errorCounts = {};
    }

    /**
     * Sätter log level
     *
     * @param {string} level - ErrorLevel
     * @returns {void}
     */
    setLogLevel(level) {
        if (Object.values(ErrorLevel).includes(level)) {
            this.logLevel = level;
        } else {
            console.warn('Invalid log level:', level);
        }
    }

    /**
     * Sätter toast-funktionen för att visa meddelanden
     *
     * @param {Function} toastFn - Funktion som tar emot errorInfo-objekt
     * @returns {void}
     */
    setToastFunction(toastFn) {
        if (typeof toastFn === 'function') {
            this.toastFunction = toastFn;
        }
    }

    /**
     * Ger recovery suggestions baserat på felkod
     *
     * @param {string} code - Felkod
     * @returns {string} Recovery suggestion
     */
    getRecoverySuggestion(code) {
        const suggestions = {
            [ErrorCode.STORAGE_ERROR]: 'Try clearing browser data or use a different browser.',
            [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage is full. Clear old data to free up space.',
            [ErrorCode.API_ERROR]: 'Check your network connection and try again.',
            [ErrorCode.API_TIMEOUT]: 'Request timed out. Please retry the operation.',
            [ErrorCode.API_UNAUTHORIZED]: 'Authorization failed. Please sign in again.',
            [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
            [ErrorCode.SERVICE_INIT_FAILED]: 'Service failed to initialize. Reload the page.',
            [ErrorCode.NETWORK_ERROR]: 'Check your internet connection and try again.'
        };

        return suggestions[code] || 'An error occurred. Please try again or contact support.';
    }
}

// Singleton export
const errorHandler = new ErrorHandler();
export default errorHandler;
