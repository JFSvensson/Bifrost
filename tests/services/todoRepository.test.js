import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('todoRepository', () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
    });

    it('loads legacy todo array from localStorage via repository', async () => {
        const { todos } = await import('../../src/config/config.ts');

        localStorage.setItem(todos.storageKey, JSON.stringify([
            {
                id: '1',
                text: 'Legacy todo',
                completed: false,
                source: 'bifrost'
            }
        ]));

        const { todoRepository } = await import('../../src/services/todoRepository.ts');

        await todoRepository.load();
        const all = todoRepository.getAll();

        expect(all).toHaveLength(1);
        expect(all[0].text).toBe('Legacy todo');
        expect(all[0].source).toBe('bifrost');
    });

    it('persists only bifrost todos when replacing mixed list', async () => {
        const { todos } = await import('../../src/config/config.ts');
        const { todoRepository } = await import('../../src/services/todoRepository.ts');

        todoRepository.replaceAll([
            {
                id: 'b-1',
                text: 'Local todo',
                completed: false,
                source: 'bifrost'
            },
            {
                id: 'o-1',
                text: 'Obsidian todo',
                completed: false,
                source: 'obsidian'
            }
        ]);

        const raw = localStorage.getItem(todos.storageKey);
        expect(raw).toBeTruthy();

        const parsed = JSON.parse(raw);
        const persisted = Array.isArray(parsed) ? parsed : parsed._data;

        expect(persisted).toHaveLength(1);
        expect(persisted[0].source).toBe('bifrost');
        expect(persisted[0].id).toBe('b-1');
    });

    it('supports append, update and remove without direct global state mutation', async () => {
        const { todoRepository } = await import('../../src/services/todoRepository.ts');

        todoRepository.replaceAll([]);
        todoRepository.append({
            id: '1',
            text: 'Todo',
            completed: false,
            source: 'bifrost'
        });

        todoRepository.update('1', (todo) => ({
            ...todo,
            completed: true
        }));

        expect(todoRepository.findById('1')?.completed).toBe(true);

        todoRepository.remove('1');
        expect(todoRepository.size()).toBe(0);
    });
});