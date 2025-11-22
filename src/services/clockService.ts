import { clock as clockConfig } from '../config/config.js';
import eventBus from '../core/eventBus.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

/**
 * Clock service for time and timezone management
 *
 * Provides time formatting, timezone conversion, and working hours detection.
 *
 * @example
 * const clockService = new ClockService();
 * const time = clockService.getCurrentTime('Europe/Stockholm');
 * console.log(time.time); // "14:30"
 */
export class ClockService {
    timezones: any[];
    format: string;
    updateInterval: number;
    showSeconds: boolean;
    updateIntervalId: number | null;

    /**
     * Create clock service
     */
    constructor() {
        this.timezones = clockConfig.timezones;
        this.format = clockConfig.format;
        this.updateInterval = clockConfig.updateInterval;
        this.showSeconds = clockConfig.showSeconds;

        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Emit initial time
        this._emitTimeUpdate();

        // Set up periodic updates if needed
        if (this.updateInterval > 0) {
            this.startUpdates();
        }
    }

    /**
     * Start periodic time updates
     */
    startUpdates() {
        if (this.updateIntervalId) {
            return; // Already running
        }

        this.updateIntervalId = setInterval(() => {
            this._emitTimeUpdate();
        }, this.updateInterval) as unknown as number;
    }

    /**
     * Stop periodic time updates
     */
    stopUpdates() {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
    }

    /**
     * Emit time update event
     * @private
     */
    _emitTimeUpdate() {
        try {
            const allTimezones = this.getAllTimezones();
            eventBus.emit('clock:update', allTimezones);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: 'Updating clock',
                showToast: false
            });
        }
    }

    /**
     * Get current time for timezone
     * @param {string} [timezone='Europe/Stockholm'] - IANA timezone identifier
     * @returns {Object} Time information
     * @property {string} time - Formatted time
     * @property {string} date - Formatted date
     * @property {string} timezone - Timezone identifier
     * @property {number} timestamp - Unix timestamp
     * @throws {Error} If timezone is invalid
     */
    getCurrentTime(timezone = 'Europe/Stockholm') {
        try {
            const now = new Date();

            return {
                time: this.formatTime(now, timezone),
                date: this.formatDate(now, timezone),
                timezone: timezone,
                timestamp: now.getTime()
            };
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: `Getting time for timezone: ${timezone}`
            });
            throw error;
        }
    }

    /**
     * Get current time for all configured timezones
     * @returns {Array<Object>} Array of timezone data
     */
    getAllTimezones() {
        return this.timezones.map(tz => ({
            ...tz,
            ...this.getCurrentTime(tz.timezone)
        }));
    }

    /**
     * Format time for timezone
     * @param {Date} date - Date to format
     * @param {string} timezone - IANA timezone identifier
     * @returns {string} Formatted time string
     */
    formatTime(date, timezone) {
        /** @type {Intl.DateTimeFormatOptions} */
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: this.format === '12h'
        };

        if (this.showSeconds) {
            options.second = '2-digit';
        }

        return date.toLocaleTimeString('sv-SE', options);
    }

    /**
     * Format date for timezone
     * @param {Date} date - Date to format
     * @param {string} timezone - IANA timezone identifier
     * @returns {string} Formatted date string
     */
    formatDate(date, timezone) {
        return date.toLocaleDateString('sv-SE', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get display name for timezone
     * @param {string} timezone - IANA timezone identifier
     * @returns {string} Human-readable timezone name
     */
    getTimezoneName(timezone) {
        const tz = this.timezones.find(t => t.timezone === timezone);
        return tz ? tz.name : timezone;
    }

    /**
     * Check if current time is within working hours (8-17)
     * @param {string} [timezone='Europe/Stockholm'] - IANA timezone identifier
     * @returns {boolean} True if within working hours
     */
    isWorkingHours(timezone = 'Europe/Stockholm') {
        const now = new Date();
        const hour = parseInt(this.formatTime(now, timezone).split(':')[0]);
        return hour >= 8 && hour < 17;
    }

    /**
     * Get time difference between two timezones in hours
     * @param {string} fromTimezone - Source timezone
     * @param {string} toTimezone - Target timezone
     * @returns {number} Hour difference
     * @throws {Error} If timezone is invalid
     */
    getTimeDifference(fromTimezone, toTimezone) {
        try {
            const now = new Date();
            const fromTime = new Date(now.toLocaleString('en-US', { timeZone: fromTimezone }));
            const toTime = new Date(now.toLocaleString('en-US', { timeZone: toTimezone }));
            return Math.round((toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60));
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                context: `Calculating time difference: ${fromTimezone} -> ${toTimezone}`
            });
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopUpdates();
    }
}

/**
 * Events emitted by ClockService:
 * - clock:update - Emitted periodically with all timezone data
 */