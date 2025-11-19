/**
 * Performance Monitoring Service
 * Tracks and reports application performance metrics
 */

/* global performance, PerformanceObserver */

class PerformanceMonitor {
    constructor() {
        /** @type {boolean} Debug mode - show detailed metrics */
        this.debugMode = false;

        /** @type {Map<string, number[]>} Metric history */
        this.metrics = new Map();

        /** @type {number} Max history entries per metric */
        this.maxHistorySize = 50;

        this._init();
    }

    /**
     * Initialize performance monitoring
     * @private
     */
    _init() {
        // Enable debug mode in development
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true')) {
            this.debugMode = true;
        }

        // Monitor page load performance
        if (window.performance && performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => this._reportPageLoad(), 0);
            });
        }

        // Monitor long tasks (if supported)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Long task threshold
                            this.recordMetric('long-task', entry.duration);
                            if (this.debugMode) {
                                console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
                            }
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // longtask not supported in all browsers
            }
        }
    }

    /**
     * Start timing an operation
     * @param {string} label - Operation label
     * @returns {void}
     */
    start(label) {
        performance.mark(`${label}-start`);
    }

    /**
     * End timing an operation and record metric
     * @param {string} label - Operation label
     * @returns {number} Duration in milliseconds
     */
    end(label) {
        const endMark = `${label}-end`;
        const startMark = `${label}-start`;
        
        performance.mark(endMark);
        
        try {
            performance.measure(label, startMark, endMark);
            const measure = performance.getEntriesByName(label).pop();
            
            if (measure) {
                this.recordMetric(label, measure.duration);
                
                if (this.debugMode) {
                    console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
                }
                
                return measure.duration;
            }
        } catch (e) {
            console.error(`Performance measure error for ${label}:`, e);
        }
        
        return 0;
    }

    /**
     * Record a metric value
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @returns {void}
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const values = this.metrics.get(name);
        values.push(value);
        
        // Keep history size limited
        if (values.length > this.maxHistorySize) {
            values.shift();
        }
    }

    /**
     * Get metric statistics
     * @param {string} name - Metric name
     * @returns {Object|null} Statistics (avg, min, max, count)
     */
    getMetricStats(name) {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) {
            return null;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        
        return {
            avg: sum / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted[Math.floor(sorted.length / 2)],
            count: values.length,
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    /**
     * Get all metrics
     * @returns {Object} All metrics with statistics
     */
    getAllMetrics() {
        const result = {};
        
        for (const [name, values] of this.metrics.entries()) {
            result[name] = this.getMetricStats(name);
        }
        
        return result;
    }

    /**
     * Report page load performance
     * @private
     * @returns {void}
     */
    _reportPageLoad() {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        const metrics = {
            'dns-lookup': timing.domainLookupEnd - timing.domainLookupStart,
            'tcp-connect': timing.connectEnd - timing.connectStart,
            'request-time': timing.responseStart - timing.requestStart,
            'response-time': timing.responseEnd - timing.responseStart,
            'dom-processing': timing.domComplete - timing.domLoading,
            'dom-interactive': timing.domInteractive - timing.navigationStart,
            'dom-complete': timing.domComplete - timing.navigationStart,
            'page-load': timing.loadEventEnd - timing.navigationStart
        };

        // Record page load metrics
        for (const [name, value] of Object.entries(metrics)) {
            if (value > 0) {
                this.recordMetric(name, value);
            }
        }

        if (this.debugMode) {
            console.group('📊 Page Load Performance');
            console.log(`DNS Lookup: ${metrics['dns-lookup']}ms`);
            console.log(`TCP Connect: ${metrics['tcp-connect']}ms`);
            console.log(`Request Time: ${metrics['request-time']}ms`);
            console.log(`Response Time: ${metrics['response-time']}ms`);
            console.log(`DOM Processing: ${metrics['dom-processing']}ms`);
            console.log(`DOM Interactive: ${metrics['dom-interactive']}ms`);
            console.log(`DOM Complete: ${metrics['dom-complete']}ms`);
            console.log(`Total Load: ${metrics['page-load']}ms`);
            console.groupEnd();
        }

        // Check for First Contentful Paint
        const navEntry = /** @type {PerformanceNavigationTiming} */ (navigation);
        if (navEntry && navEntry.loadEventEnd) {
            this.recordMetric('fcp', navEntry.loadEventEnd);
        }
    }

    /**
     * Generate performance report
     * @returns {string} Formatted performance report
     */
    generateReport() {
        const allMetrics = this.getAllMetrics();
        let report = '=== Performance Report ===\n\n';

        for (const [name, stats] of Object.entries(allMetrics)) {
            if (stats) {
                report += `${name}:\n`;
                report += `  Average: ${stats.avg.toFixed(2)}ms\n`;
                report += `  Min: ${stats.min.toFixed(2)}ms\n`;
                report += `  Max: ${stats.max.toFixed(2)}ms\n`;
                report += `  Median: ${stats.median.toFixed(2)}ms\n`;
                report += `  P95: ${stats.p95.toFixed(2)}ms\n`;
                report += `  Count: ${stats.count}\n\n`;
            }
        }

        return report;
    }

    /**
     * Clear all metrics
     * @returns {void}
     */
    clear() {
        this.metrics.clear();
        performance.clearMarks();
        performance.clearMeasures();
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Enable debug mode
     * @returns {void}
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`Performance debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    // @ts-ignore - Add to window for debugging
    window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;
