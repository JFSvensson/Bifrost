/**
 * Base class for custom web components with common functionality
 */
class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = {};
        this.isConnected = false;
    }

    connectedCallback() {
        this.isConnected = true;
        this.onConnected();
    }

    disconnectedCallback() {
        this.isConnected = false;
        this.onDisconnected();
    }

    /**
     * Override in subclasses
     */
    onConnected() {
        // To be implemented by subclasses
    }

    /**
     * Override in subclasses
     */
    onDisconnected() {
        // To be implemented by subclasses
    }

    /**
     * Update component state and trigger re-render
     * @param {Object} newState - Partial state to merge
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        if (this.isConnected) {
            this.render();
        }
    }

    /**
     * Get current state
     * @returns {Object} Current component state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Render the component - to be implemented by subclasses
     */
    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Create and inject styles into shadow DOM
     * @param {string} css - CSS string
     */
    injectStyles(css) {
        const existingStyle = this.shadowRoot.querySelector('style');
        if (existingStyle) {
            existingStyle.textContent = css;
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            this.shadowRoot.prepend(style);
        }
    }

    /**
     * Safe query selector within shadow DOM
     * @param {string} selector - CSS selector
     * @returns {Element|null} Found element or null
     */
    $(selector) {
        return this.shadowRoot.querySelector(selector);
    }

    /**
     * Safe query selector all within shadow DOM
     * @param {string} selector - CSS selector
     * @returns {NodeList} Found elements
     */
    $$(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }

    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail data
     * @param {Object} options - Event options
     */
    emit(eventName, detail = null, options = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true,
            ...options
        });
        this.dispatchEvent(event);
    }

    /**
     * Add event listener with automatic cleanup
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    on(event, handler, options = {}) {
        this.addEventListener(event, handler, options);
        
        // Store for cleanup
        if (!this._eventListeners) {
            this._eventListeners = [];
        }
        this._eventListeners.push({ event, handler, options });
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        if (this._eventListeners) {
            this._eventListeners.forEach(({ event, handler, options }) => {
                this.removeEventListener(event, handler, options);
            });
            this._eventListeners = [];
        }
    }
}

export { BaseComponent };