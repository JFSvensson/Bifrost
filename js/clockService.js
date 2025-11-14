import { clock as clockConfig } from './config.js';

/**
 * Clock service for time and timezone management
 */
export class ClockService {
    constructor() {
        this.timezones = clockConfig.timezones;
        this.format = clockConfig.format;
        this.updateInterval = clockConfig.updateInterval;
        this.showSeconds = clockConfig.showSeconds;
    }

    getCurrentTime(timezone = 'Europe/Stockholm') {
        const now = new Date();

        return {
            time: this.formatTime(now, timezone),
            date: this.formatDate(now, timezone),
            timezone: timezone,
            timestamp: now.getTime()
        };
    }

    getAllTimezones() {
        return this.timezones.map(tz => ({
            ...tz,
            ...this.getCurrentTime(tz.timezone)
        }));
    }

    formatTime(date, timezone) {
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

    formatDate(date, timezone) {
        return date.toLocaleDateString('sv-SE', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getTimezoneName(timezone) {
        const tz = this.timezones.find(t => t.timezone === timezone);
        return tz ? tz.name : timezone;
    }

    isWorkingHours(timezone = 'Europe/Stockholm') {
        const now = new Date();
        const hour = parseInt(this.formatTime(now, timezone).split(':')[0]);
        return hour >= 8 && hour < 17;
    }

    getTimeDifference(fromTimezone, toTimezone) {
        const now = new Date();
        const fromTime = new Date(now.toLocaleString('en-US', { timeZone: fromTimezone }));
        const toTime = new Date(now.toLocaleString('en-US', { timeZone: toTimezone }));
        return Math.round((toTime - fromTime) / (1000 * 60 * 60));
    }
}