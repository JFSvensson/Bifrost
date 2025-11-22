/**
 * Logger Utility
 *
 * Production-safe logging wrapper that respects environment and log levels.
 * Automatically silences debug logs in production and provides structured logging.
 *
 * @example
 * import { logger } from './utils/logger.js';
 *
 * logger.debug('Service initialized', { serviceName: 'reminderService' });
 * logger.info('User action', { action: 'todo-completed' });
 * logger.warn('Deprecated feature used', { feature: 'oldAPI' });
 * logger.error('Failed to save', error, { context: 'todos' });
 */

import { dev } from '../config/config.js';
import errorHandler from '../core/errorHandler.js';

/**
 * Log levels with numeric priority
 */
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4,
    SILENT: 5
};

/**
 * Check if running in production
 */
function isProduction() {
    return window.location.hostname !== 'localhost' &&
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('192.168');
}

/**
 * Get current log level from config
 */
function getCurrentLogLevel() {
    if (isProduction()) {
        return LogLevel.ERROR; // Only errors in production
    }

    const configLevel = dev?.logLevel || 'info';
    const levelMap = {
        'debug': LogLevel.DEBUG,
        'info': LogLevel.INFO,
        'warn': LogLevel.WARN,
        'error': LogLevel.ERROR,
        'critical': LogLevel.CRITICAL,
        'silent': LogLevel.SILENT
    };

    return levelMap[configLevel] || LogLevel.INFO;
}

/**
 * Format log message with context
 */
function formatMessage(level, message, context) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context && Object.keys(context).length > 0) {
        return `${prefix} ${message}`;
    }

    return `${prefix} ${message}`;
}

/**
 * Should log at this level?
 */
function shouldLog(level) {
    return level >= getCurrentLogLevel();
}

/**
 * Logger class
 */
class Logger {
    /**
     * Debug level logging (development only)
     * @param {string} message - Log message
     * @param {Object} [context] - Additional context
     */
    debug(message, context = {}) {
        if (shouldLog(LogLevel.DEBUG)) {
            console.debug(formatMessage('debug', message, context), context);
        }
    }

    /**
     * Info level logging
     * @param {string} message - Log message
     * @param {Object} [context] - Additional context
     */
    info(message, context = {}) {
        if (shouldLog(LogLevel.INFO)) {
            console.info(formatMessage('info', message, context), context);
        }
    }

    /**
     * Warning level logging
     * @param {string} message - Log message
     * @param {Object} [context] - Additional context
     */
    warn(message, context = {}) {
        if (shouldLog(LogLevel.WARN)) {
            console.warn(formatMessage('warn', message, context), context);
        }

        // Report to errorHandler
        if (errorHandler && typeof errorHandler.log === 'function') {
            errorHandler.log('WARNING', message, context);
        }
    }

    /**
     * Error level logging
     * @param {string} message - Log message
     * @param {Error} [error] - Error object
     * @param {Object} [context] - Additional context
     */
    error(message, error: any = null, context: any = {}) {
        if (shouldLog(LogLevel.ERROR)) {
            const fullContext = { ...context };
            if (error) {
                fullContext.error = error.message;
                fullContext.stack = error.stack;
            }

            console.error(formatMessage('error', message, fullContext), error || '');
        }

        // Always report errors to errorHandler
        if (errorHandler && typeof errorHandler.handle === 'function') {
            errorHandler.handle(error || new Error(message), {
                context: message,
                metadata: context,
                showToast: false // Don't show toast for logged errors
            });
        }
    }

    /**
     * Critical level logging (always logged)
     * @param {string} message - Log message
     * @param {Error} [error] - Error object
     * @param {Object} [context] - Additional context
     */
    critical(message, error: any = null, context: any = {}) {
        // Always log critical errors
        const fullContext = { ...context };
        if (error) {
            fullContext.error = error.message;
            fullContext.stack = error.stack;
        }

        console.error('🚨 CRITICAL:', formatMessage('critical', message, fullContext), error || '');

        // Report to errorHandler with toast
        if (errorHandler && typeof errorHandler.critical === 'function') {
            errorHandler.critical('CRITICAL_ERROR', message, context);
        }
    }

    /**
     * Group related logs
     * @param {string} label - Group label
     * @param {Function} callback - Function to execute in group
     */
    group(label, callback) {
        if (shouldLog(LogLevel.DEBUG)) {
            console.group(label);
            callback();
            console.groupEnd();
        } else {
            callback();
        }
    }

    /**
     * Performance measurement
     * @param {string} label - Performance label
     * @param {Function} callback - Function to measure
     * @returns {Promise<any>} Result of callback
     */
    async measure(label, callback) {
        if (shouldLog(LogLevel.DEBUG)) {
            const start = performance.now();
            const result = await callback();
            const duration = performance.now() - start;
            this.debug(`⚡ ${label}`, { duration: `${duration.toFixed(2)}ms` });
            return result;
        }
        return callback();
    }

    /**
     * Table logging for structured data
     * @param {Array|Object} data - Data to display
     */
    table(data) {
        if (shouldLog(LogLevel.DEBUG)) {
            console.table(data);
        }
    }

    /**
     * Get current environment info
     */
    getEnvironment() {
        return {
            isProduction: isProduction(),
            logLevel: getCurrentLogLevel(),
            hostname: window.location.hostname
        };
    }
}

// Export singleton instance
export const logger = new Logger();

// Export log levels for reference
export { LogLevel };
