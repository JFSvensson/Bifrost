/**
 * Search Service
 * Multi-source search with fuzzy matching and real-time indexing
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';

export class SearchService {
    indices: Map<string, any>;
    sources: Map<string, any>;
    lastIndexUpdate: Date | null;

    constructor() {
        this.indices = new Map();
        this.sources = new Map();
        this.lastIndexUpdate = null;

        this._init();
    }

    /**
     * Initialize service
     * @private
     */
    _init() {
        // Register search sources
        this._registerSources();

        // Build initial index
        this.rebuildIndex();

        // Listen for data changes to update index
        this._setupEventListeners();

        console.log('✅ Search Service initialized');
    }

    /**
     * Register search sources
     * @private
     */
    _registerSources() {
        // Todos from Obsidian
        this.registerSource({
            id: 'todos',
            name: 'Tasks',
            icon: '✓',
            fetch: () => {
                const todos = stateManager.get('bifrost-todos', []);
                return todos.map(todo => ({
                    id: todo.id,
                    title: todo.text,
                    content: todo.text,
                    type: 'todo',
                    completed: todo.completed,
                    priority: todo.priority,
                    tags: todo.tags || [],
                    dueDate: todo.dueDate,
                    metadata: { ...todo }
                }));
            }
        });

        // Links
        this.registerSource({
            id: 'links',
            name: 'Links',
            icon: '🔗',
            fetch: () => {
                const links = stateManager.get('bifrost-links', []);
                return links.map(link => ({
                    id: link.url,
                    title: link.name,
                    content: `${link.name} ${link.url}`,
                    type: 'link',
                    url: link.url,
                    metadata: { ...link }
                }));
            }
        });

        // Recurring tasks
        this.registerSource({
            id: 'recurring',
            name: 'Recurring Tasks',
            icon: '🔄',
            fetch: () => {
                const recurring = stateManager.get('recurringTasks', []);
                return recurring.map(task => ({
                    id: task.id,
                    title: task.text,
                    content: task.text,
                    type: 'recurring',
                    schedule: task.schedule,
                    metadata: { ...task }
                }));
            }
        });

        // Deadlines
        this.registerSource({
            id: 'deadlines',
            name: 'Deadlines',
            icon: '⏰',
            fetch: () => {
                const deadlines = stateManager.get('deadlines', []);
                return deadlines.map(deadline => ({
                    id: deadline.id,
                    title: deadline.text,
                    content: deadline.text,
                    type: 'deadline',
                    dueDate: deadline.dueDate,
                    metadata: { ...deadline }
                }));
            }
        });

        // Reminders
        this.registerSource({
            id: 'reminders',
            name: 'Reminders',
            icon: '🔔',
            fetch: () => {
                const reminders = stateManager.get('reminders', []);
                return reminders.filter(r => !r.triggered).map(reminder => ({
                    id: reminder.id,
                    title: reminder.text,
                    content: reminder.text,
                    type: 'reminder',
                    remindAt: reminder.remindAt,
                    metadata: { ...reminder }
                }));
            }
        });
    }

    /**
     * Setup event listeners for real-time index updates
     * @private
     */
    _setupEventListeners() {
        // Todo events
        eventBus.on('todo:created', () => this.updateIndex('todos'));
        eventBus.on('todo:updated', () => this.updateIndex('todos'));
        eventBus.on('todo:deleted', () => this.updateIndex('todos'));
        eventBus.on('todo:completed', () => this.updateIndex('todos'));

        // Link events
        eventBus.on('links:added', () => this.updateIndex('links'));
        eventBus.on('links:updated', () => this.updateIndex('links'));
        eventBus.on('links:removed', () => this.updateIndex('links'));

        // Recurring task events
        eventBus.on('recurring:created', () => this.updateIndex('recurring'));
        eventBus.on('recurring:updated', () => this.updateIndex('recurring'));
        eventBus.on('recurring:deleted', () => this.updateIndex('recurring'));

        // Deadline events
        eventBus.on('deadline:created', () => this.updateIndex('deadlines'));
        eventBus.on('deadline:updated', () => this.updateIndex('deadlines'));
        eventBus.on('deadline:deleted', () => this.updateIndex('deadlines'));

        // Reminder events
        eventBus.on('reminder:created', () => this.updateIndex('reminders'));
        eventBus.on('reminder:cancelled', () => this.updateIndex('reminders'));
    }

    /**
     * Register a search source
     * @param {Object} source
     * @param {string} source.id - Unique source identifier
     * @param {string} source.name - Display name
     * @param {string} source.icon - Icon emoji
     * @param {Function} source.fetch - Function that returns searchable items
     */
    registerSource(source) {
        errorHandler.validateRequired(source, ['id', 'name', 'fetch'], {
            context: 'SearchService.registerSource'
        } as any);

        this.sources.set(source.id, source);
        console.log(`✅ Registered search source: ${source.name}`);
    }

    /**
     * Rebuild entire search index
     */
    rebuildIndex() {
        this.indices.clear();

        for (const [sourceId, source] of this.sources) {
            try {
                const items = source.fetch();
                this.indices.set(sourceId, items);
            } catch (error) {
                errorHandler.handle(error, {
                    code: ErrorCode.UNKNOWN_ERROR,
                    context: `Building index for ${source.name}`,
                    showToast: false
                });
            }
        }

        this.lastIndexUpdate = new Date();
        eventBus.emit('search:indexUpdated', { timestamp: this.lastIndexUpdate });

        console.log(`✅ Search index rebuilt (${this._getTotalItems()} items)`);
    }

    /**
     * Update index for specific source
     * @param {string} sourceId - Source to update
     */
    updateIndex(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {return;}

        try {
            const items = source.fetch();
            this.indices.set(sourceId, items);
            this.lastIndexUpdate = new Date();

            eventBus.emit('search:indexUpdated', {
                source: sourceId,
                timestamp: this.lastIndexUpdate
            });
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.UNKNOWN_ERROR,
                context: `Updating index for ${source.name}`,
                showToast: false
            });
        }
    }

    /**
     * Search across all sources
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {Array<string>} [options.sources] - Limit to specific sources
     * @param {number} [options.limit=50] - Maximum results
     * @param {boolean} [options.fuzzy=true] - Enable fuzzy matching
     * @param {number} [options.threshold=0.4] - Fuzzy match threshold (0-1, lower is stricter)
     * @returns {Array} Search results
     */
    search(query, options: any = {}) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const {
            sources = Array.from(this.sources.keys()),
            limit = 50,
            fuzzy = true,
            threshold = 0.4
        } = options;

        const normalizedQuery = query.toLowerCase().trim();
        const results = [];

        // Search in specified sources
        for (const sourceId of sources) {
            const items = this.indices.get(sourceId) || [];
            const source = this.sources.get(sourceId);

            for (const item of items) {
                const score = this._calculateScore(item, normalizedQuery, fuzzy, threshold);

                if (score > 0) {
                    results.push({
                        ...item,
                        source: source.name,
                        sourceId,
                        sourceIcon: source.icon,
                        score,
                        highlights: this._getHighlights(item, normalizedQuery)
                    });
                }
            }
        }

        // Sort by score (descending) and limit results
        results.sort((a, b) => b.score - a.score);

        const limitedResults = results.slice(0, limit);

        eventBus.emit('search:performed', {
            query,
            resultCount: limitedResults.length,
            totalMatches: results.length
        });

        return limitedResults;
    }

    /**
     * Calculate match score for an item
     * @private
     * @param {Object} item
     * @param {string} query
     * @param {boolean} fuzzy
     * @param {number} threshold
     * @returns {number} Score (0 = no match, higher = better match)
     */
    _calculateScore(item, query, fuzzy, threshold) {
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        const tags = (item.tags || []).map(t => t.toLowerCase());

        // Exact match in title - highest score
        if (title === query) {return 1000;}

        // Starts with query in title
        if (title.startsWith(query)) {return 900;}

        // Contains query in title
        if (title.includes(query)) {return 800;}

        // Exact match in tags
        for (const tag of tags) {
            if (tag === query) {return 700;}
            if (tag.includes(query)) {return 600;}
        }

        // Contains query in content
        if (content.includes(query)) {return 500;}

        // Fuzzy matching
        if (fuzzy) {
            const titleScore = this._fuzzyMatch(title, query);
            const contentScore = this._fuzzyMatch(content, query);
            const maxScore = Math.max(titleScore, contentScore);

            if (maxScore >= threshold) {
                return maxScore * 400; // Scale to 0-400 range
            }
        }

        return 0;
    }

    /**
     * Fuzzy match implementation (simple Levenshtein-based)
     * @private
     * @param {string} text
     * @param {string} query
     * @returns {number} Score between 0-1
     */
    _fuzzyMatch(text, query) {
        if (!text || !query) {return 0;}

        // Simple substring match score
        let _score = 0;
        let queryIndex = 0;

        for (let i = 0; i < text.length && queryIndex < query.length; i++) {
            if (text[i] === query[queryIndex]) {
                _score++;
                queryIndex++;
            }
        }

        // Return ratio of matched characters
        return queryIndex / query.length;
    }

    /**
     * Get highlighted text portions
     * @private
     * @param {Object} item
     * @param {string} query
     * @returns {Array} Highlight positions
     */
    _getHighlights(item, query) {
        const highlights = [];
        const title = (item.title || '').toLowerCase();

        let index = title.indexOf(query);
        while (index !== -1) {
            highlights.push({
                start: index,
                end: index + query.length,
                text: item.title.substring(index, index + query.length)
            });
            index = title.indexOf(query, index + 1);
        }

        return highlights;
    }

    /**
     * Get total number of indexed items
     * @private
     * @returns {number}
     */
    _getTotalItems() {
        let total = 0;
        for (const items of this.indices.values()) {
            total += items.length;
        }
        return total;
    }

    /**
     * Get statistics about indexed content
     * @returns {Object}
     */
    getStats() {
        const stats = {
            totalItems: this._getTotalItems(),
            lastUpdate: this.lastIndexUpdate,
            sources: {}
        };

        for (const [sourceId, items] of this.indices) {
            const source = this.sources.get(sourceId);
            stats.sources[sourceId] = {
                name: source.name,
                count: items.length
            };
        }

        return stats;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.indices.clear();
        this.sources.clear();
        console.log('✅ Search Service destroyed');
    }
}

// Export singleton instance
export const searchService = new SearchService();
