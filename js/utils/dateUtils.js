/**
 * Date utility functions for menu components
 */
class DateUtils {
    /**
     * Normalize date to local midnight
     * @param {Date|string} date - Date to normalize
     * @returns {Date} Normalized date
     */
    static normalizeToLocalDate(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    /**
     * Calculate difference in days between two dates
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Difference in days
     */
    static getDaysDifference(date1, date2) {
        const msPerDay = 86400000; // 24 * 60 * 60 * 1000
        return Math.floor((date1 - date2) / msPerDay);
    }

    /**
     * Get today's name in Swedish
     * @returns {string} Today's day name in Swedish
     */
    static getTodayName() {
        return new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
    }

    /**
     * Check if a day name matches today
     * @param {string} dayName - Day name to check
     * @returns {boolean} True if day name matches today
     */
    static isTodayByName(dayName) {
        if (!dayName) return false;
        const todayName = this.getTodayName();
        return dayName.toLowerCase() === todayName.toLowerCase();
    }

    /**
     * Find today's index in a week starting from a specific date
     * @param {string|Date} startDate - Week start date
     * @param {number} weekLength - Number of days in the week data
     * @returns {number} Today's index or -1 if not found
     */
    static getTodayIndex(startDate, weekLength = 7) {
        if (!startDate) return -1;
        
        const start = this.normalizeToLocalDate(startDate);
        const today = this.normalizeToLocalDate(new Date());
        const daysDiff = this.getDaysDifference(today, start);
        
        return daysDiff >= 0 && daysDiff < weekLength ? daysDiff : -1;
    }

    /**
     * Format a date range for display
     * @param {string|Date} startDate - Start date
     * @param {string|Date} endDate - End date
     * @returns {string} Formatted date range
     */
    static formatDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const formatOptions = { 
            day: 'numeric', 
            month: 'short',
            locale: 'sv-SE'
        };
        
        const startFormatted = start.toLocaleDateString('sv-SE', formatOptions);
        const endFormatted = end.toLocaleDateString('sv-SE', formatOptions);
        
        return `${startFormatted} - ${endFormatted}`;
    }

    /**
     * Check if a date is today
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if date is today
     */
    static isToday(date) {
        const target = this.normalizeToLocalDate(date);
        const today = this.normalizeToLocalDate(new Date());
        return target.getTime() === today.getTime();
    }

    /**
     * Get week number for a given date
     * @param {Date} date - Date to get week number for
     * @returns {number} Week number
     */
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

export { DateUtils };