/**
 * Lazy loading system for widgets
 * Widgets are loaded dynamically when they become visible in the viewport
 * This improves initial page load performance
 */

/* global performance, IntersectionObserver */

const loadedWidgets = new Set();
const widgetLoaders = new Map([
    ['stats-widget', () => import('./widgets/statsWidget.js')],
    ['deadline-widget', () => import('./widgets/deadlineWidget.js')],
    ['recurring-widget', () => import('./widgets/recurringWidget.js')],
    ['reminder-widget', () => import('./widgets/reminderWidget.js')],
    ['pomodoro-widget', () => import('./widgets/pomodoroWidget.js')],
    ['calendar-widget', () => import('./widgets/calendarWidget.js')]
]);

/**
 * Load a widget dynamically
 * @param {string} widgetName - Name of the widget element (e.g., 'stats-widget')
 * @returns {Promise<void>}
 */
async function loadWidget(widgetName) {
    if (loadedWidgets.has(widgetName)) {
        return; // Already loaded
    }

    const loader = widgetLoaders.get(widgetName);
    if (!loader) {
        console.warn(`No loader found for widget: ${widgetName}`);
        return;
    }

    try {
        performance.mark(`widget-load-start-${widgetName}`);
        await loader();
        loadedWidgets.add(widgetName);
        performance.mark(`widget-load-end-${widgetName}`);
        performance.measure(
            `widget-load-${widgetName}`,
            `widget-load-start-${widgetName}`,
            `widget-load-end-${widgetName}`
        );
        console.log(`✅ Loaded widget: ${widgetName}`);
    } catch (error) {
        console.error(`Failed to load widget ${widgetName}:`, error);
    }
}

/**
 * Setup Intersection Observer for lazy loading widgets
 * Widgets load when they are about to enter the viewport
 */
function setupLazyLoading() {
    const options = {
        root: null, // viewport
        rootMargin: '100px', // Load 100px before widget enters viewport
        threshold: 0.01 // Trigger when 1% visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const widgetName = entry.target.tagName.toLowerCase();
                loadWidget(widgetName);
                observer.unobserve(entry.target); // Stop observing after load
            }
        });
    }, options);

    // Observe all lazy-loadable widgets
    widgetLoaders.forEach((_, widgetName) => {
        const elements = document.querySelectorAll(widgetName);
        elements.forEach(el => {
            el.classList.add('widget-loading');
            observer.observe(el);
        });
    });
}

/**
 * Preload critical widgets immediately (for above-the-fold content)
 * @param {string[]} widgetNames - Array of widget names to preload
 * @returns {Promise<void>}
 */
export async function preloadWidgets(widgetNames) {
    const promises = widgetNames.map(name => loadWidget(name));
    await Promise.all(promises);
}

/**
 * Initialize lazy loading system
 * Call this when DOM is ready
 */
export function initWidgetLoader() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLazyLoading);
    } else {
        setupLazyLoading();
    }
}

/**
 * Get performance metrics for loaded widgets
 * @returns {Array<{name: string, duration: number}>}
 */
export function getWidgetLoadMetrics() {
    const metrics = [];
    loadedWidgets.forEach(widgetName => {
        const measures = performance.getEntriesByName(`widget-load-${widgetName}`);
        if (measures.length > 0) {
            metrics.push({
                name: widgetName,
                duration: measures[0].duration
            });
        }
    });
    return metrics;
}

// Auto-initialize
initWidgetLoader();
