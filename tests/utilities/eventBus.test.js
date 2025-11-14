/**
 * Tests for eventBus.js
 * Tests pub/sub, wildcards, event replay, priority handling, and unsubscribe functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import eventBus from '../../js/eventBus.js';

describe('EventBus', () => {
    beforeEach(() => {
    // Clear all listeners and history before each test
        eventBus.listeners = {};
        eventBus.onceListeners = {};
        eventBus.eventHistory = [];
        eventBus.debugMode = false;
    });

    describe('on() - Subscribe to events', () => {
        it('should subscribe to events', () => {
            const callback = vi.fn();
            eventBus.on('todo:created', callback);

            eventBus.emit('todo:created', { id: '123', text: 'Test' });

            expect(callback).toHaveBeenCalledWith(
                { id: '123', text: 'Test' },
                'todo:created'
            );
        });

        it('should return unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = eventBus.on('todo:created', callback);

            expect(typeof unsubscribe).toBe('function');

            unsubscribe();
            eventBus.emit('todo:created', { id: '123' });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should support multiple subscribers', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            eventBus.on('todo:created', callback1);
            eventBus.on('todo:created', callback2);

            eventBus.emit('todo:created', { id: '123' });

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        it('should throw error for invalid callback', () => {
            expect(() => {
                eventBus.on('todo:created', 'not a function');
            }).toThrow('Callback must be a function');
        });

        it('should throw error for invalid event name', () => {
            const callback = vi.fn();

            expect(() => {
                eventBus.on('invalid-event', callback);
            }).toThrow('Invalid event name');
        });

        it('should warn for unknown namespaces', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn();

            eventBus.on('unknown:action', callback);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Unknown namespace')
            );

            warnSpy.mockRestore();
        });
    });

    describe('once() - Subscribe once', () => {
        it('should only trigger callback once', () => {
            const callback = vi.fn();
            eventBus.once('todo:created', callback);

            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:created', { id: '2' });
            eventBus.emit('todo:created', { id: '3' });

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ id: '1' }, 'todo:created');
        });

        it('should allow unsubscribe before trigger', () => {
            const callback = vi.fn();
            const unsubscribe = eventBus.once('todo:created', callback);

            unsubscribe();
            eventBus.emit('todo:created', { id: '1' });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('off() - Unsubscribe', () => {
        it('should unsubscribe by callback reference', () => {
            const callback = vi.fn();
            eventBus.on('todo:created', callback);

            eventBus.off('todo:created', callback);
            eventBus.emit('todo:created', { id: '123' });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should only remove specific callback', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            eventBus.on('todo:created', callback1);
            eventBus.on('todo:created', callback2);

            eventBus.off('todo:created', callback1);
            eventBus.emit('todo:created', { id: '123' });

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });

    describe('offAll() - Remove all listeners', () => {
        it('should remove all listeners for event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            eventBus.on('todo:created', callback1);
            eventBus.on('todo:created', callback2);

            eventBus.offAll('todo:created');
            eventBus.emit('todo:created', { id: '123' });

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });
    });

    describe('emit() - Publish events', () => {
        it('should emit events with data', () => {
            const callback = vi.fn();
            eventBus.on('todo:updated', callback);

            const data = { id: '123', text: 'Updated', completed: true };
            eventBus.emit('todo:updated', data);

            expect(callback).toHaveBeenCalledWith(data, 'todo:updated');
        });

        it('should emit events without data', () => {
            const callback = vi.fn();
            eventBus.on('app:ready', callback);

            eventBus.emit('app:ready');

            expect(callback).toHaveBeenCalledWith(undefined, 'app:ready');
        });

        it('should add events to history', () => {
            eventBus.emit('todo:created', { id: '123' });

            expect(eventBus.eventHistory).toHaveLength(1);
            expect(eventBus.eventHistory[0].eventName).toBe('todo:created');
            expect(eventBus.eventHistory[0].data).toEqual({ id: '123' });
            expect(eventBus.eventHistory[0].timestamp).toBeTypeOf('number');
        });

        it('should handle callback errors gracefully', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Callback error');
            });
            const goodCallback = vi.fn();

            eventBus.on('todo:created', errorCallback);
            eventBus.on('todo:created', goodCallback);

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            eventBus.emit('todo:created', { id: '123' });

            expect(errorCallback).toHaveBeenCalled();
            expect(goodCallback).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
        });
    });

    describe('emitAsync() - Async emit', () => {
        it('should emit events asynchronously', async () => {
            const callback = vi.fn();
            eventBus.on('todo:created', callback);

            eventBus.emitAsync('todo:created', { id: '123' });

            // Should not be called immediately
            expect(callback).not.toHaveBeenCalled();

            // Wait for next tick
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(callback).toHaveBeenCalledWith({ id: '123' }, 'todo:created');
        });
    });

    describe('Priority handling', () => {
        it('should execute high priority callbacks first', () => {
            const callOrder = [];

            eventBus.on('todo:created', () => callOrder.push('low'), { priority: 0 });
            eventBus.on('todo:created', () => callOrder.push('high'), { priority: 10 });
            eventBus.on('todo:created', () => callOrder.push('medium'), { priority: 5 });

            eventBus.emit('todo:created', {});

            expect(callOrder).toEqual(['high', 'medium', 'low']);
        });
    });

    describe('Wildcard subscriptions', () => {
        it('should support wildcard subscriptions', () => {
            const callback = vi.fn();
            eventBus.on('todo:*', callback);

            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:updated', { id: '2' });
            eventBus.emit('todo:deleted', { id: '3' });

            expect(callback).toHaveBeenCalledTimes(3);
        });

        it('should not trigger wildcard for other namespaces', () => {
            const callback = vi.fn();
            eventBus.on('todo:*', callback);

            eventBus.emit('reminder:triggered', {});

            expect(callback).not.toHaveBeenCalled();
        });

        it('should trigger both specific and wildcard listeners', () => {
            const specificCallback = vi.fn();
            const wildcardCallback = vi.fn();

            eventBus.on('todo:created', specificCallback);
            eventBus.on('todo:*', wildcardCallback);

            eventBus.emit('todo:created', { id: '123' });

            expect(specificCallback).toHaveBeenCalled();
            expect(wildcardCallback).toHaveBeenCalled();
        });
    });

    describe('Event history', () => {
        it('should maintain event history', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:updated', { id: '2' });
            eventBus.emit('todo:deleted', { id: '3' });

            expect(eventBus.eventHistory).toHaveLength(3);
        });

        it('should limit history size', () => {
            const originalMax = eventBus.maxHistorySize;
            eventBus.maxHistorySize = 5;

            for (let i = 0; i < 10; i++) {
                eventBus.emit('todo:created', { id: i });
            }

            expect(eventBus.eventHistory.length).toBeLessThanOrEqual(5);

            // Should keep latest events
            expect(eventBus.eventHistory[eventBus.eventHistory.length - 1].data.id).toBe(9);

            eventBus.maxHistorySize = originalMax;
        });

        it('should provide getHistory() method', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('reminder:triggered', { id: '2' });

            const history = eventBus.getHistory();
            expect(history).toHaveLength(2);
        });

        it('should filter history by event name', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:updated', { id: '2' });
            eventBus.emit('reminder:triggered', { id: '3' });

            const filtered = eventBus.getHistory({ eventName: 'todo:*' });
            expect(filtered).toHaveLength(2);
        });

        it('should filter history by timestamp', () => {
            const now = Date.now();

            eventBus.emit('todo:created', { id: '1' });

            const filtered = eventBus.getHistory({ since: now });
            expect(filtered.length).toBeGreaterThan(0);
        });

        it('should limit history results', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:created', { id: '2' });
            eventBus.emit('todo:created', { id: '3' });

            const limited = eventBus.getHistory({ limit: 2 });
            expect(limited).toHaveLength(2);
            expect(limited[limited.length - 1].data.id).toBe('3');
        });
    });

    describe('replay() - Event replay', () => {
        it('should replay all events', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:updated', { id: '2' });

            const callback = vi.fn();
            eventBus.replay(callback);

            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should replay events matching pattern', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('reminder:triggered', { id: '2' });
            eventBus.emit('todo:updated', { id: '3' });

            const callback = vi.fn();
            eventBus.replay(callback, 'todo:*');

            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should pass data, eventName, and timestamp to callback', () => {
            eventBus.emit('todo:created', { id: '123' });

            const callback = vi.fn();
            eventBus.replay(callback);

            expect(callback).toHaveBeenCalledWith(
                { id: '123' },
                'todo:created',
                expect.any(Number)
            );
        });

        it('should handle callback errors gracefully', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:created', { id: '2' });

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const callback = vi.fn((data) => {
                if (data.id === '1') {throw new Error('Test error');}
            });

            eventBus.replay(callback);

            // Should not stop replay on error
            expect(callback).toHaveBeenCalledTimes(2);
            expect(errorSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
        });

        it('should throw if callback is not a function', () => {
            expect(() => {
                eventBus.replay('not a function');
            }).toThrow('callback function');
        });
    });

    describe('registerNamespace()', () => {
        it('should register new namespaces', () => {
            eventBus.registerNamespace('custom');

            expect(eventBus.registeredNamespaces.has('custom')).toBe(true);
        });

        it('should not warn for registered namespaces', () => {
            eventBus.registerNamespace('custom');

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn();

            eventBus.on('custom:action', callback);

            expect(warnSpy).not.toHaveBeenCalled();

            warnSpy.mockRestore();
        });
    });

    describe('Debug mode', () => {
        it('should log events in debug mode', () => {
            eventBus.debugMode = true;
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const callback = vi.fn();
            eventBus.on('todo:created', callback);
            eventBus.emit('todo:created', { id: '123' });

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining('Subscribed')
            );
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining('Emitted'),
                expect.anything()
            );

            logSpy.mockRestore();
            eventBus.debugMode = false;
        });
    });

    describe('clearHistory()', () => {
        it('should clear event history', () => {
            eventBus.emit('todo:created', { id: '1' });
            eventBus.emit('todo:updated', { id: '2' });

            expect(eventBus.eventHistory.length).toBeGreaterThan(0);

            eventBus.clearHistory();

            expect(eventBus.eventHistory).toHaveLength(0);
        });
    });

    describe('getListenerCount()', () => {
        it('should return listener count for event', () => {
            eventBus.on('todo:created', vi.fn());
            eventBus.on('todo:created', vi.fn());
            eventBus.once('todo:created', vi.fn());

            const count = eventBus.getListenerCount('todo:created');
            expect(count).toBe(3);
        });

        it('should return 0 for events with no listeners', () => {
            const count = eventBus.getListenerCount('nonexistent:event');
            expect(count).toBe(0);
        });
    });
});
