import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

/**
 * Service for managing quick links
 * Loads links from data/links.json and provides API for link operations
 */
class LinkService {
    constructor() {
        this.links = [];
        this.storageKey = 'links';
        this._init();
    }

    /**
     * Initialize the service
     * @private
     */
    _init() {
        this.load();
        this._setupEventListeners();
    }

    /**
     * Load links from cache or fetch from file
     */
    async load() {
        try {
            // Try to load from cache first
            const cached = stateManager.get(this.storageKey, null);
            if (cached && Array.isArray(cached) && cached.length > 0) {
                this.links = cached;
                eventBus.emit('links:loaded', this.links);
                return;
            }

            // Fetch from file if no cache
            await this.fetchLinks();
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading links',
                showToast: false
            });
        }
    }

    /**
     * Fetch links from data/links.json
     */
    async fetchLinks() {
        try {
            const response = await fetch('./data/links.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.links = await response.json();

            // Validate links
            if (!Array.isArray(this.links)) {
                throw new Error('Invalid links data format');
            }

            // Cache the links
            this.save();

            eventBus.emit('links:loaded', this.links);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Fetching links from file',
                showToast: true
            });
        }
    }

    /**
     * Save links to cache
     */
    save() {
        try {
            stateManager.set(this.storageKey, this.links);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Saving links',
                showToast: false
            });
        }
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        eventBus.on('app:ready', () => {
            // Reload links when app is ready
            this.load();
        });
    }

    /**
     * Get all links
     * @returns {Array<Object>} Array of link objects
     */
    getLinks() {
        return this.links;
    }

    /**
     * Add a new link
     * @param {Object} linkData - Link data
     * @param {string} linkData.name - Link name
     * @param {string} linkData.url - Link URL
     * @returns {Object} Created link
     */
    addLink(linkData) {
        errorHandler.validateRequired(linkData, ['name', 'url'], 'LinkService.addLink');

        const link = {
            name: linkData.name,
            url: linkData.url
        };

        this.links.push(link);
        this.save();

        eventBus.emit('links:added', link);

        return link;
    }

    /**
     * Remove a link by index
     * @param {number} index - Index of link to remove
     */
    removeLink(index) {
        if (index < 0 || index >= this.links.length) {
            errorHandler.warning(
                ErrorCode.VALIDATION_ERROR,
                'Invalid link index',
                { index }
            );
            return;
        }

        const removed = this.links.splice(index, 1)[0];
        this.save();

        eventBus.emit('links:removed', removed);
    }

    /**
     * Update a link by index
     * @param {number} index - Index of link to update
     * @param {Object} linkData - New link data
     * @param {string} [linkData.name] - Link name
     * @param {string} [linkData.url] - Link URL
     */
    updateLink(index, linkData) {
        if (index < 0 || index >= this.links.length) {
            errorHandler.warning(
                ErrorCode.VALIDATION_ERROR,
                'Invalid link index',
                { index }
            );
            return;
        }

        this.links[index] = {
            ...this.links[index],
            ...linkData
        };

        this.save();

        eventBus.emit('links:updated', this.links[index]);
    }
}

// Singleton export
const linkService = new LinkService();
export default linkService;
