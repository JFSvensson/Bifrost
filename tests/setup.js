/**
 * Test setup file for Vitest
 * Sets up global mocks and utilities for testing
 */

// Mock localStorage for tests
globalThis.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = String(value);
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    }
};

// Mock window.matchMedia for theme testing
globalThis.matchMedia = globalThis.matchMedia || function (query) {
    return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
    };
};

// Mock PromiseRejectionEvent for error handler tests
globalThis.PromiseRejectionEvent = class PromiseRejectionEvent {
    constructor(type, options) {
        this.type = type;
        this.promise = options.promise;
        this.reason = options.reason;
    }
};

// Clear localStorage before each test
// eslint-disable-next-line no-undef
beforeEach(() => {
    localStorage.clear();

    // Enable test mode for stateManager to disable debouncing in tests
    // This is handled by the stateManager import check
    if (globalThis.__VITEST__) {
        globalThis.__TEST_MODE__ = true;
    }
});
