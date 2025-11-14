import { todos as todoConfig } from './config.js';

/**
 * Service for syncing todos with Obsidian via bridge
 */
export class ObsidianTodoService {
    constructor() {
        this.bridgeUrl = todoConfig.obsidian.bridgeUrl;
        this.updateInterval = todoConfig.obsidian.updateInterval;
        this.showSource = todoConfig.obsidian.showSource;
        this.priorityColors = todoConfig.obsidian.priorityColors;
        this.timeout = 5000;
        this.lastSync = null;
    }

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

                console.log(`📥 Synced ${data.count} todos from Obsidian`);
                return this.processObsidianTodos(data.todos);

            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Obsidian bridge timeout - kontrollera att bridge körs');
            }

            console.error('Obsidian sync failed:', error);
            throw new Error(`Kunde inte synka med Obsidian: ${error.message}`);
        }
    }

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

    generateTodoId(todo) {
        // Skapa unikt ID baserat på fil + rad
        return `obsidian-${todo.source}-${todo.lineNumber}`;
    }

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
            console.warn('Obsidian sync failed, using local todos only:', error.message);
            return this.getLocalTodos();
        }
    }

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

    getLocalTodos() {
        const saved = localStorage.getItem(todoConfig.storageKey);
        const todos = saved ? JSON.parse(saved) : [];

        return todos.map(todo => ({
            ...todo,
            source: todo.source || 'bifrost',
            priority: todo.priority || 'normal'
        }));
    }

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
        localStorage.setItem(todoConfig.storageKey, JSON.stringify(todos));

        return newTodo;
    }

    removeLocalTodo(todoId) {
        const todos = this.getLocalTodos();
        const filtered = todos.filter(todo => todo.id !== todoId);
        localStorage.setItem(todoConfig.storageKey, JSON.stringify(filtered));

        return filtered;
    }

    async getStats() {
        try {
            const response = await fetch(this.bridgeUrl.replace('/todos', '/stats'));
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not load Obsidian stats:', error);
        }
        return null;
    }

    getPriorityColor(priority) {
        return this.priorityColors[priority] || this.priorityColors.normal;
    }

    isOnline() {
        return this.lastSync && (Date.now() - this.lastSync.getTime()) < this.updateInterval * 2;
    }
}