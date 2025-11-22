/**
 * Simple date helper functions
 */

export function isToday(dayName, dayIndex, menuData) {
    // Try date-based matching first
    if (menuData?.startDate) {
        const todayIndex = getTodayIndex(menuData.startDate, menuData.days.length);
        if (todayIndex !== -1) {
            return todayIndex === dayIndex;
        }
    }

    // Fallback to name matching
    const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
    return dayName?.toLowerCase() === today.toLowerCase();
}

export function getTodayIndex(startDate, weekLength) {
    if (!startDate) {return -1;}

    const start = normalizeDate(startDate);
    const today = normalizeDate(new Date());
    const daysDiff = Math.floor((today.getTime() - start.getTime()) / 86400000);

    return daysDiff >= 0 && daysDiff < weekLength ? daysDiff : -1;
}

function normalizeDate(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}