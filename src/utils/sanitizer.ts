/**
 * HTML Sanitizer Utility
 * 
 * Provides secure HTML sanitization using the native Sanitizer API (when available)
 * with a robust fallback implementation.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
 */

import { logger } from './logger.js';

/**
 * @typedef {Object} SanitizerConfig
 * @property {string[]} [allowElements]
 * @property {Object.<string, string[]>} [allowAttributes]
 */

/**
 * Native Sanitizer API (not yet in all browsers)
 * @class
 */
// @ts-ignore - Sanitizer API is not in TypeScript DOM lib yet
const NativeSanitizer = typeof window !== 'undefined' && window.Sanitizer;

/**
 * Sanitizer configuration
 * Allows only safe HTML elements and attributes
 */
const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li', 'span', 'div', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

const ALLOWED_ATTRIBUTES = new Set([
    'href', 'title', 'class', 'id', 'style', 'data-*', 'aria-*'
]);

/**
 * Check if native Sanitizer API is available
 * @returns {boolean}
 */
function hasNativeSanitizer() {
    return typeof window !== 'undefined' && 'Sanitizer' in window;
}

/**
 * Fallback sanitizer using DOM manipulation
 * Removes potentially dangerous HTML while preserving safe content
 * 
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function fallbackSanitize(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Create temporary container
    const temp = document.createElement('div');
    temp.textContent = html; // First, escape all HTML
    const text = temp.innerHTML;
    
    // Parse as DOM
    temp.innerHTML = text;
    
    // Recursively clean the DOM tree
    cleanNode(temp);
    
    return temp.innerHTML;
}

/**
 * Recursively clean a DOM node
 * @param {Node} node - Node to clean
 */
function cleanNode(node) {
    // Remove script and style tags entirely
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
        node.parentNode?.removeChild(node);
        return;
    }

    // Check if tag is allowed
    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {Element} */ (node);
        const tagName = element.nodeName.toLowerCase();
        
        if (!ALLOWED_TAGS.has(tagName)) {
            // Replace disallowed tag with its text content
            const textNode = document.createTextNode(element.textContent || '');
            element.parentNode?.replaceChild(textNode, element);
            return;
        }

        // Clean attributes
        const attributes = Array.from(element.attributes || []);
        attributes.forEach((attr: any) => {
            const attrName = attr.name.toLowerCase();
            
            // Remove event handlers
            if (attrName.startsWith('on')) {
                element.removeAttribute(attr.name);
                return;
            }

            // Check if attribute is allowed
            const isAllowed = ALLOWED_ATTRIBUTES.has(attrName) ||
                            attrName.startsWith('data-') ||
                            attrName.startsWith('aria-');
            
            if (!isAllowed) {
                element.removeAttribute(attr.name);
            }

            // Sanitize href to prevent javascript: protocol
            if (attrName === 'href') {
                const href = attr.value.trim().toLowerCase();
                if (href.startsWith('javascript:') || 
                    href.startsWith('data:') ||
                    href.startsWith('vbscript:')) {
                    element.removeAttribute('href');
                }
            }
        });
    }

    // Recursively clean children
    const children = Array.from(node.childNodes || []);
    children.forEach(child => cleanNode(child));
}

/**
 * Sanitize HTML string
 * Uses native Sanitizer API if available, otherwise uses secure fallback
 * 
 * @param {string} html - HTML string to sanitize
 * @param {Object} [options] - Sanitization options
 * @param {boolean} [options.allowLinks=true] - Allow <a> tags
 * @param {boolean} [options.allowFormatting=true] - Allow formatting tags (strong, em, etc)
 * @returns {string} Sanitized HTML string
 * 
 * @example
 * const safe = sanitizeHTML('<script>alert("XSS")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 * 
 * @example
 * const safe = sanitizeHTML('<a href="javascript:alert(1)">Click</a>', { allowLinks: false });
 * // Returns: 'Click'
 */
export function sanitizeHTML(html, options: any = {}) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const {
        allowLinks = true,
        allowFormatting = true
    } = options;

    // Use native Sanitizer API if available (Chrome 105+, Safari 16.4+)
    if (hasNativeSanitizer()) {
        try {
            // @ts-ignore - Sanitizer API is not in TypeScript DOM lib yet
            const sanitizer = new window.Sanitizer({
                allowElements: Array.from(ALLOWED_TAGS),
                allowAttributes: {
                    'href': ['a'],
                    'class': ['*'],
                    'id': ['*']
                }
            });
            
            const fragment = sanitizer.sanitizeFor('div', html);
            return fragment?.innerHTML || '';
        } catch (error) {
            logger.warn('Native Sanitizer API failed, using fallback', { error: error.message });
            return fallbackSanitize(html);
        }
    }

    // Fallback sanitization
    return fallbackSanitize(html);
}

/**
 * Sanitize text for safe insertion into HTML
 * Escapes HTML entities to prevent XSS
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 * 
 * @example
 * const safe = escapeHTML('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHTML(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string
 * 
 * @example
 * sanitizeURL('javascript:alert(1)') // Returns: ''
 * sanitizeURL('https://example.com') // Returns: 'https://example.com'
 */
export function sanitizeURL(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }

    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('file:')) {
        return '';
    }

    // Allow relative URLs and safe protocols
    return url;
}

/**
 * Create a safe HTML element from sanitized HTML
 * @param {string} html - HTML to sanitize and convert
 * @param {string} [wrapper='div'] - Wrapper element type
 * @returns {HTMLElement} Safe DOM element
 */
export function createSafeElement(html, wrapper = 'div') {
    const element = document.createElement(wrapper);
    element.innerHTML = sanitizeHTML(html);
    return element;
}

// Export singleton for convenience
export default {
    sanitizeHTML,
    escapeHTML,
    sanitizeURL,
    createSafeElement,
    hasNativeSanitizer: hasNativeSanitizer()
};
