/**
 * Debounce utility for performance optimization
 * Delays function execution until after a specified wait period
 * Useful for reducing frequency of expensive operations like localStorage writes
 */

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} [options.leading] - Execute on leading edge
 * @param {boolean} [options.trailing] - Execute on trailing edge (default: true)
 * @param {number} [options.maxWait] - Maximum time to wait before forcing execution
 * @returns {Function} Debounced function with cancel() and flush() methods
 */
export function debounce(func, wait = 0, options = {}) {
    const {
        leading = false,
        trailing = true,
        maxWait
    } = options;

    let timeoutId = null;
    let lastCallTime = 0;
    let lastInvokeTime = 0;
    let lastArgs = null;
    let lastThis = null;
    let result;

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = null;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === 0 ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
        );
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        timeoutId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxWait !== undefined
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timeoutId = null;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = null;
        return result;
    }

    function cancel() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeoutId = null;
    }

    function flush() {
        return timeoutId === null ? result : trailingEdge(Date.now());
    }

    function pending() {
        return timeoutId !== null;
    }

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeoutId === null) {
                return leadingEdge(lastCallTime);
            }
            if (maxWait !== undefined) {
                timeoutId = setTimeout(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timeoutId === null) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
}

/**
 * Creates a throttled version of a function
 * Executes at most once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, wait = 0) {
    return debounce(func, wait, {
        leading: true,
        trailing: true,
        maxWait: wait
    });
}

/**
 * Batches multiple function calls into a single execution
 * Useful for batching DOM updates or API calls
 * @param {Function} func - Function to batch
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Batched function
 */
export function batch(func, wait = 0) {
    const pending = [];
    let timeoutId = null;

    function executeBatch() {
        const items = pending.splice(0);
        if (items.length > 0) {
            func(items);
        }
        timeoutId = null;
    }

    return function (...args) {
        pending.push(args);
        if (timeoutId === null) {
            timeoutId = setTimeout(executeBatch, wait);
        }
    };
}
