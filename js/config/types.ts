/**
 * @fileoverview Type definitions for Bifrost application
 * This file provides JSDoc type definitions for type-safety and editor IntelliSense
 * without requiring TypeScript compilation.
 */

/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier for the todo
 * @property {string} text - The todo text content
 * @property {boolean} done - Whether the todo is completed
 * @property {number} created - Unix timestamp when created
 * @property {number} [completed] - Unix timestamp when completed
 * @property {string} [deadline] - Deadline date in YYYY-MM-DD format
 * @property {string} [deadlineTime] - Deadline time in HH:MM format
 * @property {string} [category] - Category or tag for the todo
 * @property {string} [source] - Source of the todo (obsidian, manual, etc.)
 * @property {string} [obsidianFile] - Path to Obsidian file if synced
 * @property {boolean} [snoozed] - Whether the todo is snoozed
 * @property {number} [snoozedUntil] - Unix timestamp when snooze ends
 * @property {string} [recurringId] - ID of the recurring pattern if applicable
 * @property {number} [priority] - Priority level (1-5, higher is more important)
 */

/**
 * @typedef {Object} Reminder
 * @property {string} id - Unique identifier for the reminder
 * @property {string} todoId - Associated todo ID
 * @property {string} type - Reminder type: 'time-based', 'deadline-relative', 'specific-time'
 * @property {number} triggerTime - Unix timestamp when reminder should trigger
 * @property {string} [message] - Custom reminder message
 * @property {boolean} triggered - Whether the reminder has been triggered
 * @property {number} created - Unix timestamp when reminder was created
 * @property {Object} [metadata] - Additional type-specific data
 * @property {number} [metadata.minutesBefore] - Minutes before deadline (for deadline-relative)
 * @property {string} [metadata.originalTime] - Original time string (for specific-time)
 */

/**
 * @typedef {Object} RecurringPattern
 * @property {string} id - Unique identifier for the pattern
 * @property {string} templateText - Template text for new todos
 * @property {'daily'|'weekly'|'monthly'} frequency - How often to recur
 * @property {number} [dayOfWeek] - Day of week (0-6) for weekly patterns
 * @property {number} [dayOfMonth] - Day of month (1-31) for monthly patterns
 * @property {string} [time] - Time in HH:MM format
 * @property {string} [category] - Category for generated todos
 * @property {boolean} enabled - Whether the pattern is active
 * @property {number} created - Unix timestamp when pattern was created
 * @property {number} [lastGenerated] - Unix timestamp of last todo generation
 * @property {string} [deadline] - Relative deadline (e.g., 'same-day', '+1d', '+1w')
 */

/**
 * @typedef {Object} ServiceConfig
 * @property {string} name - Service name
 * @property {string} storageKey - localStorage key for persistence
 * @property {boolean} [autoLoad] - Whether to auto-load on initialization
 * @property {number} [saveDebounce] - Debounce time in ms for save operations
 */

/**
 * @typedef {Object} WidgetConfig
 * @property {string} name - Widget name
 * @property {string} selector - CSS selector for the widget element
 * @property {boolean} [lazyLoad] - Whether to lazy load the widget
 * @property {Object} [dependencies] - Required services or other dependencies
 */

/**
 * @typedef {Object} ServiceEventData
 * @property {string} type - Event type
 * @property {*} [data] - Event payload data
 * @property {number} timestamp - Unix timestamp when event occurred
 */

/**
 * @callback ServiceEventCallback
 * @param {ServiceEventData} event - The event data
 * @returns {void}
 */

/**
 * @typedef {Object} NotificationPermission
 * @property {'granted'|'denied'|'default'} status - Current permission status
 * @property {boolean} supported - Whether notifications are supported
 */

/**
 * @typedef {Object} StatsData
 * @property {number} totalCompleted - Total completed todos
 * @property {number} completedToday - Todos completed today
 * @property {number} completedThisWeek - Todos completed this week
 * @property {number} completedThisMonth - Todos completed this month
 * @property {number} currentStreak - Current daily completion streak
 * @property {number} longestStreak - Longest daily completion streak
 * @property {Object.<string, number>} completionsByDate - Map of date to completion count
 * @property {Object.<string, number>} completionsByCategory - Map of category to completion count
 */

/**
 * @typedef {Object} PomodoroSession
 * @property {string} id - Unique session identifier
 * @property {string} [todoId] - Associated todo ID
 * @property {number} startTime - Unix timestamp when session started
 * @property {number} [endTime] - Unix timestamp when session ended
 * @property {number} duration - Duration in minutes (typically 25)
 * @property {'work'|'break'|'long-break'} type - Session type
 * @property {boolean} completed - Whether the session was completed
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} id - Event ID
 * @property {string} summary - Event title
 * @property {string} [description] - Event description
 * @property {string} start - Start date/time ISO string
 * @property {string} end - End date/time ISO string
 * @property {string} [location] - Event location
 * @property {boolean} allDay - Whether this is an all-day event
 */

/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Temperature in Celsius
 * @property {string} description - Weather description
 * @property {string} icon - Weather icon code
 * @property {number} humidity - Humidity percentage
 * @property {number} windSpeed - Wind speed in m/s
 * @property {string} location - Location name
 * @property {number} timestamp - Unix timestamp of weather data
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} name - Menu item name
 * @property {string} [description] - Menu item description
 * @property {string} category - Menu category
 * @property {string} date - Menu date in YYYY-MM-DD format
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {'light'|'dark'|'auto'} mode - Theme mode
 * @property {boolean} respectSystemPreference - Whether to follow system theme
 */

/**
 * @typedef {Object} ParseResult
 * @property {string} text - Cleaned todo text
 * @property {string} [deadline] - Parsed deadline date
 * @property {string} [time] - Parsed time
 * @property {Object} [recurring] - Parsed recurring pattern
 * @property {Object} [reminder] - Parsed reminder data
 * @property {string} [category] - Parsed category
 */

/**
 * @typedef {Object} ErrorInfo
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [context] - Additional context
 * @property {Error} [originalError] - Original error object
 * @property {number} timestamp - Unix timestamp when error occurred
 */

export {};
