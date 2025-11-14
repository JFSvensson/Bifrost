import { clock as clockConfig } from './config.js';

/**
 * Clock service for time and timezone management
 */
export class ClockService {
    /**
     * Create clock service
     */
    constructor() {
        this.timezones = clockConfig.timezones;
        this.format = clockConfig.format;
        this.updateInterval = clockConfig.updateInterval;
        this.showSeconds = clockConfig.showSeconds;
    }

    /**
     * Get current time for timezone
     * @param {string} [timezone='Europe/Stockholm'] - IANA timezone identifier
     * @returns {Object} Time information
     * @property {string} time - Formatted time
     * @property {string} date - Formatted date
     * @property {string} timezone - Timezone identifier
     * @property {number} timestamp - Unix timestamp
     */
    getCurrentTime(timezone = 'Europe/Stockholm') {
        const now = new Date();

        return {
            time: this.formatTime(now, timezone),
            date: this.formatDate(now, timezone),
            timezone: timezone,
            timestamp: now.getTime()
        };
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
        const options = {
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
     */
    getTimeDifference(fromTimezone, toTimezone) {
        const now = new Date();
        const fromTime = new Date(now.toLocaleString('en-US', { timeZone: fromTimezone }));
        const toTime = new Date(now.toLocaleString('en-US', { timeZone: toTimezone }));
        return Math.round((toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60));
    }
}