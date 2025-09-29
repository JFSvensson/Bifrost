/**
 * DOM utility functions
 */
class DomUtils {
    /**
     * Safely escape HTML content
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    static escapeHtml(str) {
        if (typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Create element with attributes and content
     * @param {string} tagName - Element tag name
     * @param {Object} attributes - Element attributes
     * @param {string|Node|Array} content - Element content
     * @returns {Element} Created element
     */
    static createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                element.setAttribute(key, value);
            }
        });
        
        // Set content
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    /**
     * Create template from string with safe interpolation
     * @param {string} template - Template string
     * @param {Object} data - Data for interpolation
     * @returns {string} Interpolated template
     */
    static template(template, data = {}) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = data[key];
            return value !== undefined ? this.escapeHtml(String(value)) : match;
        });
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if element is visible in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Visibility threshold (0-1)
     * @returns {boolean} True if element is visible
     */
    static isElementVisible(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const verticalVisible = rect.bottom >= threshold * viewHeight && 
                               rect.top <= viewHeight * (1 - threshold);
        const horizontalVisible = rect.right >= threshold * viewWidth && 
                                  rect.left <= viewWidth * (1 - threshold);
        
        return verticalVisible && horizontalVisible;
    }

    /**
     * Animate element with CSS transitions
     * @param {Element} element - Element to animate
     * @param {Object} styles - CSS styles to animate to
     * @param {number} duration - Animation duration in milliseconds
     * @returns {Promise} Promise that resolves when animation completes
     */
    static animate(element, styles, duration = 300) {
        return new Promise(resolve => {
            const originalTransition = element.style.transition;
            
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            Object.assign(element.style, styles);
            
            setTimeout(() => {
                element.style.transition = originalTransition;
                resolve();
            }, duration);
        });
    }
}

export { DomUtils };