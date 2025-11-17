/**
 * Tests for stateManager.js
 * Tests get/set operations, schema validation, migrations, TTL functionality, and localStorage integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import stateManager from '../../js/core/stateManager.js';

describe('StateManager', () => {
    beforeEach(() => {
    // Clear localStorage and reset state
        localStorage.clear();
        stateManager.schemas = {};
        stateManager.versions = {};
        stateManager.subscribers = {};
    });

    describe('get() and set() - Basic operations', () => {
        it('should save and retrieve data', () => {
            stateManager.set('testKey', { value: 'test' });
            const result = stateManager.get('testKey');

            expect(result).toEqual({ value: 'test' });
        });

        it('should return default value when key not found', () => {
            const result = stateManager.get('nonexistent', 'default');

            expect(result).toBe('default');
        });

        it('should handle primitive values', () => {
            stateManager.set('string', 'hello');
            stateManager.set('number', 42);
            stateManager.set('boolean', true);

            expect(stateManager.get('string')).toBe('hello');
            expect(stateManager.get('number')).toBe(42);
            expect(stateManager.get('boolean')).toBe(true);
        });

        it('should handle arrays', () => {
            const arr = [1, 2, 3, { nested: 'value' }];
            stateManager.set('array', arr);

            expect(stateManager.get('array')).toEqual(arr);
        });

        it('should handle complex objects', () => {
            const obj = {
                id: '123',
                nested: {
                    deep: {
                        value: 'test'
                    }
                },
                array: [1, 2, 3]
            };

            stateManager.set('complex', obj);
            expect(stateManager.get('complex')).toEqual(obj);
        });

        it('should return false when set fails', () => {
            // Mock localStorage to throw error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            const result = stateManager.set('test', 'value');
            expect(result).toBe(false);

            localStorage.setItem = originalSetItem;
        });
    });

    describe('remove()', () => {
        it('should remove data from storage', () => {
            stateManager.set('testKey', 'value');
            expect(stateManager.has('testKey')).toBe(true);

            stateManager.remove('testKey');
            expect(stateManager.has('testKey')).toBe(false);
        });

        it('should notify subscribers on remove', () => {
            const callback = vi.fn();
            stateManager.subscribe('testKey', callback);

            stateManager.set('testKey', 'value');
            stateManager.remove('testKey');

            expect(callback).toHaveBeenCalledWith(null, 'testKey');
        });
    });

    describe('has()', () => {
        it('should check if key exists', () => {
            expect(stateManager.has('testKey')).toBe(false);

            stateManager.set('testKey', 'value');
            expect(stateManager.has('testKey')).toBe(true);
        });
    });

    describe('clear()', () => {
        it('should clear all storage', () => {
            stateManager.set('key1', 'value1');
            stateManager.set('key2', 'value2');

            stateManager.clear();

            expect(stateManager.has('key1')).toBe(false);
            expect(stateManager.has('key2')).toBe(false);
        });

        it('should keep schemas by default', () => {
            stateManager.registerSchema('test', {
                version: 1,
                validate: (data) => true
            });

            stateManager.clear();

            expect(stateManager.schemas.test).toBeDefined();
        });

        it('should clear schemas when keepSchemas is false', () => {
            stateManager.registerSchema('test', {
                version: 1
            });

            stateManager.clear({ keepSchemas: false });

            expect(stateManager.schemas.test).toBeUndefined();
        });
    });

    describe('Schema validation', () => {
        it('should register schemas', () => {
            stateManager.registerSchema('todos', {
                version: 1,
                validate: (data) => Array.isArray(data),
                default: []
            });

            expect(stateManager.schemas.todos).toBeDefined();
            expect(stateManager.versions.todos).toBe(1);
        });

        it('should validate data against schema', () => {
            stateManager.registerSchema('todos', {
                version: 1,
                validate: (data) => Array.isArray(data)
            });

            const result = stateManager.set('todos', [1, 2, 3]);
            expect(result).toBe(true);
        });

        it('should fail validation for invalid data', () => {
            stateManager.registerSchema('todos', {
                version: 1,
                validate: (data) => Array.isArray(data)
            });

            const result = stateManager.set('todos', 'not an array');
            expect(result).toBe(false);
        });

        it('should use schema default values', () => {
            stateManager.registerSchema('todos', {
                version: 1,
                default: []
            });

            const result = stateManager.get('todos');
            expect(result).toEqual([]);
        });

        it('should throw error if schema version missing', () => {
            expect(() => {
                stateManager.registerSchema('test', {});
            }).toThrow('Schema version required');
        });

        it('should allow skipping validation', () => {
            stateManager.registerSchema('todos', {
                version: 1,
                validate: (data) => Array.isArray(data)
            });

            // Should succeed even though validation would fail
            const result = stateManager.set('todos', 'not array', { validate: false });
            expect(result).toBe(true);
        });
    });

    describe('Schema migrations', () => {
        it('should migrate data between versions', () => {
            // Register v1 schema and save data
            stateManager.registerSchema('settings', {
                version: 1,
                validate: (data) => true
            });

            stateManager.set('settings', { oldFormat: true });

            // Register v2 schema with migration
            stateManager.registerSchema('settings', {
                version: 2,
                validate: (data) => true,
                migrate: (oldData, oldVersion) => {
                    if (oldVersion === 1) {
                        return { newFormat: oldData.oldFormat, migrated: true };
                    }
                    return oldData;
                }
            });

            const result = stateManager.get('settings');
            expect(result.migrated).toBe(true);
            expect(result.newFormat).toBe(true);
        });

        it('should not migrate if versions match', () => {
            const migrateFn = vi.fn((data) => data);

            stateManager.registerSchema('test', {
                version: 1,
                migrate: migrateFn
            });

            stateManager.set('test', { value: 'original' });

            // Re-register with same version
            stateManager.registerSchema('test', {
                version: 1,
                migrate: migrateFn
            });

            // Migration should not have been called
            expect(migrateFn).not.toHaveBeenCalled();
        });
    });

    describe('TTL (Time To Live)', () => {
        it('should set TTL for cache data', () => {
            const ttl = 1000; // 1 second
            stateManager.set('cache', 'value', { ttl });

            const result = stateManager.get('cache');
            expect(result).toBe('value');
        });

        it('should expire data after TTL', async () => {
            const ttl = 50; // 50ms
            stateManager.set('cache', 'value', { ttl });

            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 100));

            const result = stateManager.get('cache', 'expired');
            expect(result).toBe('expired');
        });

        it('should not expire data before TTL', async () => {
            const ttl = 1000; // 1 second
            stateManager.set('cache', 'value', { ttl });

            // Wait shorter than TTL
            await new Promise(resolve => setTimeout(resolve, 100));

            const result = stateManager.get('cache');
            expect(result).toBe('value');
        });
    });

    describe('subscribe() - Change notifications', () => {
        it('should notify subscribers on change', () => {
            const callback = vi.fn();
            stateManager.subscribe('testKey', callback);

            stateManager.set('testKey', 'value');

            expect(callback).toHaveBeenCalledWith('value', 'testKey');
        });

        it('should support multiple subscribers', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            stateManager.subscribe('testKey', callback1);
            stateManager.subscribe('testKey', callback2);

            stateManager.set('testKey', 'value');

            expect(callback1).toHaveBeenCalledWith('value', 'testKey');
            expect(callback2).toHaveBeenCalledWith('value', 'testKey');
        });

        it('should return unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = stateManager.subscribe('testKey', callback);

            unsubscribe();
            stateManager.set('testKey', 'value');

            expect(callback).not.toHaveBeenCalled();
        });

        it('should not notify when notify option is false', () => {
            const callback = vi.fn();
            stateManager.subscribe('testKey', callback);

            stateManager.set('testKey', 'value', { notify: false });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle subscriber errors gracefully', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Subscriber error');
            });
            const goodCallback = vi.fn();

            stateManager.subscribe('testKey', errorCallback);
            stateManager.subscribe('testKey', goodCallback);

            stateManager.set('testKey', 'value');

            // Both should have been called
            expect(errorCallback).toHaveBeenCalled();
            expect(goodCallback).toHaveBeenCalled();
        });
    });

    describe('Backup and restore', () => {
        it('should create backups', () => {
            stateManager.set('key1', 'value1');
            stateManager.set('key2', 'value2');

            const result = stateManager._createBackup();
            expect(result).toBe(true);

            // Check backup exists
            const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('backup_'));
            expect(backupKeys.length).toBeGreaterThan(0);
        });

        it('should restore from backup', () => {
            stateManager.set('key1', 'original');
            stateManager._createBackup();

            // Change data
            stateManager.set('key1', 'modified');
            expect(stateManager.get('key1')).toBe('modified');

            // Restore
            const result = stateManager.restoreFromBackup();
            expect(result).toBe(true);
            expect(stateManager.get('key1')).toBe('original');
        });

        it('should restore from specific backup', () => {
            stateManager.set('key1', 'value1');
            stateManager._createBackup();
            const firstBackup = Object.keys(localStorage).find(k => k.startsWith('backup_'));

            stateManager.set('key1', 'value2');
            stateManager._createBackup();

            stateManager.set('key1', 'value3');

            // Restore first backup
            stateManager.restoreFromBackup(firstBackup);
            expect(stateManager.get('key1')).toBe('value1');
        });

        it('should fail restore when no backups exist', () => {
            const result = stateManager.restoreFromBackup();
            expect(result).toBe(false);
        });
    });

    describe('Storage quota handling', () => {
        it('should handle quota exceeded errors', () => {
            // Mock localStorage to throw QuotaExceededError
            const originalSetItem = localStorage.setItem;
            let callCount = 0;

            localStorage.setItem = vi.fn(() => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
            });

            const result = stateManager.set('test', 'large data');

            // Should have tried twice (original + retry)
            expect(localStorage.setItem).toHaveBeenCalled();

            localStorage.setItem = originalSetItem;
        });
    });

    describe('Storage quota monitoring', () => {
        it('should check storage quota on init', () => {
            // Just verify the method exists and doesn't throw
            expect(() => {
                stateManager._checkStorageQuota();
            }).not.toThrow();
        });
    });

    describe('Data cleanup', () => {
        it('should cleanup old backups', () => {
            // Create old backup
            const oldBackupKey = `backup_${Date.now() - (8 * 24 * 60 * 60 * 1000)}`; // 8 days old
            localStorage.setItem(oldBackupKey, JSON.stringify({}));

            stateManager._cleanupOldBackups();

            expect(localStorage.getItem(oldBackupKey)).toBeNull();
        });

        it('should keep recent backups', () => {
            const recentBackupKey = `backup_${Date.now()}`;
            localStorage.setItem(recentBackupKey, JSON.stringify({}));

            stateManager._cleanupOldBackups();

            expect(localStorage.getItem(recentBackupKey)).not.toBeNull();
        });

        it('should cleanup expired TTL data', () => {
            // Manually create expired data
            const expiredData = {
                _data: 'value',
                _ttl: Date.now() - 1000 // Expired 1 second ago
            };
            localStorage.setItem('expired', JSON.stringify(expiredData));

            stateManager._cleanupOldData();

            expect(localStorage.getItem('expired')).toBeNull();
        });
    });

    describe('Integration with localStorage', () => {
        it('should use actual localStorage', () => {
            stateManager.set('test', 'value');

            const raw = localStorage.getItem('test');
            expect(raw).toBeTruthy();

            const parsed = JSON.parse(raw);
            expect(parsed._data).toBe('value');
            expect(parsed._version).toBeDefined();
            expect(parsed._updated).toBeDefined();
        });

        it('should handle corrupted localStorage data', () => {
            // Write invalid JSON
            localStorage.setItem('corrupted', 'invalid json {{{');

            const result = stateManager.get('corrupted', 'default');
            expect(result).toBe('default');
        });

        it('should preserve metadata in storage', () => {
            stateManager.registerSchema('test', { version: 2 });
            stateManager.set('test', 'value');

            const raw = JSON.parse(localStorage.getItem('test'));
            expect(raw._version).toBe(2);
            expect(raw._updated).toBeTypeOf('number');
        });
    });

    describe('getStorageSize()', () => {
        it('should calculate storage size', () => {
            stateManager.set('key1', 'a'.repeat(1000));
            stateManager.set('key2', 'b'.repeat(1000));

            const size = stateManager.getStorageSize();
            expect(size).toBeGreaterThan(0);
        });
    });

    describe('exportState() and importState()', () => {
        it('should export all state', () => {
            stateManager.set('key1', 'value1');
            stateManager.set('key2', { nested: 'value2' });

            const exported = stateManager.exportState();

            expect(exported.key1).toBeDefined();
            expect(exported.key2).toBeDefined();
        });

        it('should import state', () => {
            const state = {
                key1: 'value1',
                key2: 'value2'
            };

            stateManager.importState(state);

            expect(stateManager.get('key1')).toBe('value1');
            expect(stateManager.get('key2')).toBe('value2');
        });
    });
});
