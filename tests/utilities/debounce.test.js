/**
 * Tests for debounce.js
 * Tests debounce, throttle, and batch utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { debounce, throttle, batch } from '../../js/utils/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce()', () => {
    it('should delay function execution', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should only execute once for multiple calls within wait period', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass latest arguments to function', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('third');
    });

    it('should preserve this context', () => {
      const obj = {
        value: 42,
        method: vi.fn(function() {
          return this.value;
        })
      };

      obj.debouncedMethod = debounce(obj.method, 100);
      obj.debouncedMethod();

      vi.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalled();
    });

    it('should reset timer on subsequent calls', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      vi.advanceTimersByTime(50);

      debounced(); // Resets timer
      vi.advanceTimersByTime(50); // Only 50ms passed since last call

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50); // Total 100ms from last call

      expect(func).toHaveBeenCalledTimes(1);
    });

    describe('leading edge', () => {
      it('should execute immediately when leading is true', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100, { leading: true });

        debounced();

        expect(func).toHaveBeenCalledTimes(1);
      });

      it('should not execute again on trailing edge with leading only', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100, { leading: true, trailing: false });

        debounced();
        expect(func).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(1);
      });

      it('should execute on both edges when both enabled', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100, { leading: true, trailing: true });

        debounced();
        expect(func).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(2);
      });
    });

    describe('maxWait option', () => {
      it('should force execution after maxWait time', () => {
        const func = vi.fn();
        const debounced = debounce(func, 50, { maxWait: 150 });

        debounced();
        vi.advanceTimersByTime(40);
        debounced();
        vi.advanceTimersByTime(40);
        debounced();
        vi.advanceTimersByTime(40);
        debounced();
        vi.advanceTimersByTime(40); // Total: 160ms

        expect(func).toHaveBeenCalled();
      });

      it('should respect maxWait even with continuous calls', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100, { maxWait: 200 });

        // Call every 50ms
        for (let i = 0; i < 5; i++) {
          debounced();
          vi.advanceTimersByTime(50);
        }

        expect(func).toHaveBeenCalled();
      });
    });

    describe('cancel()', () => {
      it('should cancel pending execution', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced();
        debounced.cancel();

        vi.advanceTimersByTime(100);

        expect(func).not.toHaveBeenCalled();
      });

      it('should allow new calls after cancel', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced();
        debounced.cancel();
        debounced();

        vi.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(1);
      });

      it('should do nothing when no pending execution', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        expect(() => debounced.cancel()).not.toThrow();
      });
    });

    describe('flush()', () => {
      it('should immediately execute pending function', () => {
        const func = vi.fn(() => 'result');
        const debounced = debounce(func, 100);

        debounced();
        const result = debounced.flush();

        expect(func).toHaveBeenCalledTimes(1);
        expect(result).toBe('result');
      });

      it('should return undefined when no pending execution', () => {
        const func = vi.fn(() => 'result');
        const debounced = debounce(func, 100);

        const result = debounced.flush();

        expect(result).toBeUndefined();
        expect(func).not.toHaveBeenCalled();
      });

      it('should prevent scheduled execution after flush', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced();
        debounced.flush();

        vi.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(1);
      });
    });

    describe('pending()', () => {
      it('should return true when execution is pending', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced();

        expect(debounced.pending()).toBe(true);
      });

      it('should return false when no execution is pending', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        expect(debounced.pending()).toBe(false);
      });

      it('should return false after execution', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced();
        vi.advanceTimersByTime(100);

        expect(debounced.pending()).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle wait time of 0', () => {
        const func = vi.fn();
        const debounced = debounce(func, 0);

        debounced();
        vi.advanceTimersByTime(0);

        expect(func).toHaveBeenCalledTimes(1);
      });

      it('should handle multiple argument types', () => {
        const func = vi.fn();
        const debounced = debounce(func, 100);

        debounced('string', 123, { key: 'value' }, [1, 2, 3]);
        vi.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledWith('string', 123, { key: 'value' }, [1, 2, 3]);
      });

      it('should handle functions that throw errors', () => {
        const func = vi.fn(() => {
          throw new Error('Test error');
        });
        const debounced = debounce(func, 100);

        debounced();

        expect(() => {
          vi.advanceTimersByTime(100);
        }).toThrow('Test error');
      });
    });
  });

  describe('throttle()', () => {
    it('should execute immediately on first call', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      throttled();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should limit execution to once per period', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      throttled();
      throttled();
      throttled();

      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should execute at regular intervals with continuous calls', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      // Call 10 times over 500ms (every 50ms)
      for (let i = 0; i < 10; i++) {
        throttled();
        vi.advanceTimersByTime(50);
      }

      // Should execute ~5-6 times (once every 100ms)
      expect(func.mock.calls.length).toBeGreaterThanOrEqual(5);
      expect(func.mock.calls.length).toBeLessThanOrEqual(6);
    });

    it('should pass latest arguments', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      throttled('first');
      throttled('second');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('second');
    });
  });

  describe('batch()', () => {
    it('should batch multiple calls into one execution', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      batched('a');
      batched('b');
      batched('c');

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith([['a'], ['b'], ['c']]);
    });

    it('should clear batch after execution', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      batched('a');
      vi.advanceTimersByTime(100);

      func.mockClear();

      batched('b');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith([['b']]);
    });

    it('should handle multiple arguments per call', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      batched('a', 1);
      batched('b', 2);
      batched('c', 3);

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith([['a', 1], ['b', 2], ['c', 3]]);
    });

    it('should not execute when no calls made', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      vi.advanceTimersByTime(100);

      expect(func).not.toHaveBeenCalled();
    });

    it('should handle rapid successive batches', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      batched('1');
      vi.advanceTimersByTime(100);

      batched('2');
      vi.advanceTimersByTime(100);

      batched('3');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(3);
      expect(func).toHaveBeenNthCalledWith(1, [['1']]);
      expect(func).toHaveBeenNthCalledWith(2, [['2']]);
      expect(func).toHaveBeenNthCalledWith(3, [['3']]);
    });

    it('should handle empty batches gracefully', () => {
      const func = vi.fn();
      const batched = batch(func, 100);

      // Don't call anything, just wait
      vi.advanceTimersByTime(100);

      expect(func).not.toHaveBeenCalled();
    });
  });
});
