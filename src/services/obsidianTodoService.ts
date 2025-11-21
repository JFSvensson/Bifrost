import { todos as todoConfig } from '../config/config.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Service for syncing todos with Obsidian via bridge
 */
export class ObsidianTodoService {
    /**
     * Create Obsidian todo service
     */
    constructor() {
        this.bridgeUrl = todoConfig.obsidian.bridgeUrl;
        this.updateInterval = todoConfig.obsidian.updateInterval;
        this.showSource = todoConfig.obsidian.showSource;
        this.priorityColors = todoConfig.obsidian.priorityColors;
        this.timeout = 5000;
        this.lastSync = null;
    }

    /**
     * Load todos from Obsidian bridge
     * @returns {Promise<Array<Object>>} Processed todos from Obsidian
     * @throws {Error} If fetch fails or times out
     */
    async loadTodos() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                const response = await fetch(this.bridgeUrl, {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.lastSync = new Date();

                logger.info(`Synced ${data.count} todos from Obsidian`);
                return this.processObsidianTodos(data.todos);

            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const err = new Error('Obsidian bridge timeout - kontrollera att bridge körs');
                errorHandler.handle(err, {
                    code: ErrorCode.API_ERROR,
                    context: 'Obsidian bridge connection'
                });
                throw err;
            }

            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Syncing with Obsidian'
            });
            throw new Error(`Kunde inte synka med Obsidian: ${error.message}`);
        }
    }

    /**
     * Process raw Obsidian todos into app format
     * @param {Array<Object>} obsidianTodos - Raw todos from Obsidian
     * @returns {Array<Object>} Processed todos
     * @private
     */
    processObsidianTodos(obsidianTodos) {
        return obsidianTodos.map(todo => ({
            text: this.formatTodoText(todo),
            completed: todo.completed,
            completedAt: todo.completedAt ? new Date(todo.completedAt) : null,
            source: 'obsidian',
            originalSource: todo.source,
            priority: todo.priority,
            tags: todo.tags || [],
            section: todo.section,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            lineNumber: todo.lineNumber,
            id: this.generateTodoId(todo)
        }));
    }

    /**
     * Format todo text with optional metadata
     * @param {Object} todo - Todo to format
     * @returns {string} Formatted text
     * @private
     */
    formatTodoText(todo) {
        let text = todo.text;

        // Ta bort prioritets-markeringar från text
        text = text.replace(/\[!(high|medium|low)\]/gi, '').trim();

        // Ta bort datum-markeringar om de ska visas separat
        text = text.replace(/@\d{4}-\d{2}-\d{2}/g, '').trim();

        // Lägg till källfil om inställt
        if (this.showSource && todo.source) {
            const fileName = todo.source.replace('.md', '');
            text += ` 📄${fileName}`;
        }

        // Lägg till sektion om den finns
        if (todo.section && todo.section !== 'TODO' && todo.section !== 'Tasks') {
            text += ` 📂${todo.section}`;
        }

        return text;
    }

    /**
     * Generate unique ID for Obsidian todo
     * @param {Object} todo - Todo object
     * @returns {string} Unique ID
     * @private
     */
    generateTodoId(todo) {
        // Skapa unikt ID baserat på fil + rad
        return `obsidian-${todo.source}-${todo.lineNumber}`;
    }

    /**
     * Sync Obsidian todos with local todos
     * @returns {Promise<Array<Object>>} Merged and sorted todos
     */
    async syncWithLocal() {
        try {
            const obsidianTodos = await this.loadTodos();
            const localTodos = this.getLocalTodos();

            // Merge: Obsidian todos + lokala Bifrost todos
            const merged = [
                ...obsidianTodos,
                ...localTodos.filter(todo => todo.source !== 'obsidian')
            ];

            // Sortera efter prioritet
            return this.sortTodos(merged);

        } catch (error) {
            errorHandler.warning(
                'OBSIDIAN_SYNC_FAILED',
                'Obsidian sync failed, using local todos only',
                { error: error.message }
            );
            return this.getLocalTodos();
        }
    }

    /**
     * Sort todos by completion status, priority, source, and text
     * @param {Array<Object>} todos - Todos to sort
     * @returns {Array<Object>} Sorted todos
     */
    sortTodos(todos) {
        const priorityOrder = { high: 4, medium: 3, normal: 2, low: 1 };

        return todos.sort((a, b) => {
            // Ofärdiga todos först
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Först efter prioritet
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;

            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Hög prioritet först
            }

            // Sedan efter källa (Obsidian först)
            if (a.source !== b.source) {
                if (a.source === 'obsidian') {return -1;}
                if (b.source === 'obsidian') {return 1;}
            }

            // Slutligen alfabetiskt
            return a.text.localeCompare(b.text);
        });
    }

    /**
     * Get local Bifrost todos from storage
     * @returns {Array<Object>} Local todos
     */
    getLocalTodos() {
        try {
            const todos = stateManager.get('todos') || [];
            return todos.map(todo => ({
                ...todo,
                source: todo.source || 'bifrost',
                priority: todo.priority || 'normal'
            }));
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Loading local todos'
            });
            return [];
        }
    }

    /**
     * Add a new local todo
     * @param {string} text - Todo text
     * @returns {Object} Created todo
     */
    addLocalTodo(text) {
        const todos = this.getLocalTodos();
        const newTodo = {
            text: text,
            completed: false,
            source: 'bifrost',
            priority: 'normal',
            id: Date.now().toString(),
            createdAt: new Date()
        };

        todos.push(newTodo);
        stateManager.set('todos', todos);

        return newTodo;
    }

    /**
     * Remove a local todo
     * @param {string} todoId - Todo ID to remove
     * @returns {Array<Object>} Remaining todos
     */
    removeLocalTodo(todoId) {
        const todos = this.getLocalTodos();
        const filtered = todos.filter(todo => todo.id !== todoId);
        stateManager.set('todos', filtered);

        return filtered;
    }

    /**
     * Get Obsidian statistics
     * @returns {Promise<Object|null>} Stats or null
     */
    async getStats() {
        try {
            const response = await fetch(this.bridgeUrl.replace('/todos', '/stats'));
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            errorHandler.warning(
                'OBSIDIAN_STATS_FAILED',
                'Could not load Obsidian stats',
                { error: error.message }
            );
        }
        return null;
    }

    /**
     * Get color for priority level
     * @param {string} priority - Priority level
     * @returns {string} Color code
     */
    getPriorityColor(priority) {
        return this.priorityColors[priority] || this.priorityColors.normal;
    }

    /**
     * Check if Obsidian bridge is online
     * @returns {boolean} True if recently synced
     */
    isOnline() {
        return this.lastSync && (Date.now() - this.lastSync.getTime()) < this.updateInterval * 2;
    }
}