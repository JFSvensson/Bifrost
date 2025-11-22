/**
 * Global type declarations for Bifrost application
 */

// ============================================================================
// Window Interface Extensions
// ============================================================================

interface Window {
    addTodo: () => void;
    toggleTodo: (_id: string) => void;
    removeTodo: (_id: string) => void;
}

// ============================================================================
// Configuration Types
// ============================================================================

interface Config {
    version: string;
    app: {
        name: string;
        description: string;
    };
    dev: {
        enableDebugLogging: boolean;
        logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    };
    obsidian: {
        vaultPath: string;
        todoFile: string;
        enabled: boolean;
        syncInterval: number;
        autoSync: boolean;
    };
    weather: {
        updateInterval: number;
        lat: number;
        lon: number;
    };
    calendar: {
        syncInterval: number;
        maxEvents: number;
        clientId: string;
        apiKey: string;
        scopes: string[];
        discoveryDocs: string[];
    };
}

// ============================================================================
// Todo Types
// ============================================================================

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    recurring?: RecurringConfig;
    reminder?: ReminderConfig;
    source?: 'local' | 'obsidian' | 'calendar';
    metadata?: Record<string, unknown>;
}

interface RecurringConfig {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: string;
    count?: number;
}

interface ReminderConfig {
    enabled: boolean;
    time: string;
    beforeMinutes?: number;
    repeat?: boolean;
}

// ============================================================================
// Event Bus Types
// ============================================================================

interface TodosUpdatedEvent extends CustomEvent {
    detail: {
        todos: Todo[];
        source?: string;
    };
}

interface StateChangedEvent extends CustomEvent {
    detail: {
        key: string;
        value: unknown;
        oldValue: unknown;
    };
}

// ============================================================================
// Service Types
// ============================================================================

interface WeatherData {
    location: {
        name: string;
        lat: number;
        lon: number;
    };
    current: {
        time: string;
        temperature: number;
        weatherSymbol: number;
        precipitationCategory: number;
        windSpeed: number;
        windDirection: number;
        humidity: number;
        pressure: number;
    };
    hourly: Array<{
        time: string;
        temperature: number;
        weatherSymbol: number;
        precipitationCategory: number;
        windSpeed: number;
    }>;
}

interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    colorId?: string;
}

interface SearchResult {
    id: string;
    text: string;
    title?: string;
    source: 'todo' | 'calendar' | 'link';
    sourceIcon?: string;
    score: number;
    highlights?: Array<{start: number; end: number}>;
    metadata?: Record<string, unknown>;
}

interface SearchOptions {
    sources?: Array<'todo' | 'calendar' | 'link'>;
    limit?: number;
    includeCompleted?: boolean;
}

interface StatsData {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
    todayCompleted: number;
    weekCompleted: number;
    monthCompleted: number;
    averagePerDay: number;
    currentStreak: number;
    longestStreak: number;
    topTags: Array<{tag: string; count: number}>;
    activityByDay: Array<{day: string; completed: number; created: number}>;
    weeklyStats: {
        thisWeek: {completed: number; created: number};
        lastWeek: {completed: number; created: number};
        change: number;
    };
}

// ============================================================================
// Keyboard Shortcut Types
// ============================================================================

interface KeyboardShortcut {
    keys: string | string[];
    description: string;
    action: (_event: KeyboardEvent) => void;
    category?: string;
    condition?: () => boolean;
    preventDefault?: boolean;
}

// ============================================================================
// Logger Types
// ============================================================================

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

interface LogContext {
    [key: string]: unknown;
}

// ============================================================================
// Utility Types
// ============================================================================

interface DebouncedFunction<T extends (..._args: unknown[]) => unknown> {
    (..._args: Parameters<T>): void;
    cancel: () => void;
}

// ============================================================================
// Widget Base Types
// ============================================================================

interface WidgetConfig {
    name: string;
    selector: string;
    enabled: boolean;
}

// ============================================================================
// Natural Language Parser Types
// ============================================================================

interface ParsedTodo {
    text: string;
    tags: string[];
    priority?: 'low' | 'medium' | 'high';
    deadline?: string;
    recurring?: RecurringConfig;
    reminder?: ReminderConfig;
}

// ============================================================================
// Performance Monitor Types
// ============================================================================

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Backup Types
// ============================================================================

interface BackupData {
    version: string;
    timestamp: number;
    todos: Todo[];
    settings: Record<string, unknown>;
}

// ============================================================================
// Menu Service Types
// ============================================================================

interface MenuData {
    week: number;
    year: number;
    days: Array<{
        date: string;
        meals: string[];
    }>;
}
