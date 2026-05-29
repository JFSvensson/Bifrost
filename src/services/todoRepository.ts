import stateManager from '../core/stateManager.js';
import { dev, todos as todoConfig } from '../config/config.js';
import { logger } from '../utils/logger.js';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    source?: string;
    priority?: string;
    [key: string]: unknown;
}

interface TodoWriteOptions {
    persist?: boolean;
}

class TodoRepository {
    private readonly storageKey: string;
    private todos: TodoItem[];

    constructor() {
        this.storageKey = todoConfig.storageKey;
        this.todos = [];
    }

    async load(): Promise<TodoItem[]> {
        const stateTodos = this.readViaStateManager();
        const legacyTodos = this.readViaLegacyLocalStorage();

        if (dev.debug && stateTodos.length !== legacyTodos.length) {
            logger.warn('TodoRepository dual-read mismatch', {
                stateCount: stateTodos.length,
                legacyCount: legacyTodos.length
            });
        }

        const preferred = stateTodos.length > 0 ? stateTodos : legacyTodos;
        this.todos = preferred.map((todo) => this.normalizeTodo(todo));

        return this.getAll();
    }

    getAll(): TodoItem[] {
        return [...this.todos];
    }

    findById(todoId: string): TodoItem | undefined {
        return this.todos.find((todo) => todo.id === todoId);
    }

    size(): number {
        return this.todos.length;
    }

    replaceAll(todos: TodoItem[], options: TodoWriteOptions = {}): TodoItem[] {
        this.todos = todos.map((todo) => this.normalizeTodo(todo));
        if (options.persist !== false) {
            this.persistBifrostTodos();
        }
        return this.getAll();
    }

    append(todo: TodoItem, options: TodoWriteOptions = {}): TodoItem[] {
        this.todos.push(this.normalizeTodo(todo));
        if (options.persist !== false) {
            this.persistBifrostTodos();
        }
        return this.getAll();
    }

    appendMany(todos: TodoItem[], options: TodoWriteOptions = {}): TodoItem[] {
        todos.forEach((todo) => {
            this.todos.push(this.normalizeTodo(todo));
        });
        if (options.persist !== false) {
            this.persistBifrostTodos();
        }
        return this.getAll();
    }

    update(todoId: string, updater: (todo: TodoItem) => TodoItem, options: TodoWriteOptions = {}): TodoItem[] {
        this.todos = this.todos.map((todo) => {
            if (todo.id !== todoId) {
                return todo;
            }

            return this.normalizeTodo(updater(todo));
        });

        if (options.persist !== false) {
            this.persistBifrostTodos();
        }

        return this.getAll();
    }

    remove(todoId: string, options: TodoWriteOptions = {}): TodoItem[] {
        this.todos = this.todos.filter((todo) => todo.id !== todoId);
        if (options.persist !== false) {
            this.persistBifrostTodos();
        }
        return this.getAll();
    }

    persistBifrostTodos(): void {
        const bifrostTodos = this.todos.filter((todo) => (todo.source || 'bifrost') === 'bifrost');
        stateManager.set(this.storageKey, bifrostTodos, { immediate: true });
    }

    private normalizeTodo(todo: Partial<TodoItem>): TodoItem {
        return {
            ...todo,
            id: String(todo.id || Date.now().toString()),
            text: String(todo.text || ''),
            completed: Boolean(todo.completed),
            source: String(todo.source || 'bifrost'),
            priority: String(todo.priority || 'normal')
        };
    }

    private readViaStateManager(): TodoItem[] {
        const stored = stateManager.get(this.storageKey, []);
        if (!Array.isArray(stored)) {
            return [];
        }

        return stored.map((todo) => this.normalizeTodo(todo));
    }

    private readViaLegacyLocalStorage(): TodoItem[] {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
                return parsed.map((todo) => this.normalizeTodo(todo));
            }

            if (parsed && Array.isArray(parsed._data)) {
                return parsed._data.map((todo: Partial<TodoItem>) => this.normalizeTodo(todo));
            }
        } catch (error) {
            logger.warn('TodoRepository legacy localStorage read failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }

        return [];
    }
}

export const todoRepository = new TodoRepository();