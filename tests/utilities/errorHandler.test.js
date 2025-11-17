/**
 * Tests for errorHandler.js
 * Tests error handling, toast notifications, history, and recovery strategies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import errorHandler, { ErrorLevel, ErrorCode } from '../../js/core/errorHandler.js';

// Mock Event class for testing environment
if (!globalThis.Event) {
    globalThis.Event = class Event {
        constructor(type, eventInitDict = {}) {
            this.type = type;
            this.bubbles = eventInitDict.bubbles || false;
            this.cancelable = eventInitDict.cancelable || false;
        }
    };
}

// Mock ErrorEvent for testing environment
globalThis.ErrorEvent = class ErrorEvent extends globalThis.Event {
    constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.error = eventInitDict.error;
        this.message = eventInitDict.message || '';
        this.filename = eventInitDict.filename || '';
        this.lineno = eventInitDict.lineno || 0;
        this.colno = eventInitDict.colno || 0;
    }
};

// Mock PromiseRejectionEvent for testing environment
globalThis.PromiseRejectionEvent = class PromiseRejectionEvent extends globalThis.Event {
    constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.promise = eventInitDict.promise;
        this.reason = eventInitDict.reason;
    }
};

describe('ErrorHandler', () => {
    beforeEach(() => {
    // Clear error history and stats before each test
        errorHandler.errorHistory = [];
        errorHandler.errorCounts = {};
        errorHandler.toastFunction = null;

        // Reset console spies
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    describe('ErrorCode enum', () => {
        it('should have all required error codes', () => {
            expect(ErrorCode.STORAGE_ERROR).toBe('STORAGE_ERROR');
            expect(ErrorCode.API_ERROR).toBe('API_ERROR');
            expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
            expect(ErrorCode.SERVICE_INIT_FAILED).toBe('SERVICE_INIT_FAILED');
            expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
        });
    });

    describe('ErrorLevel enum', () => {
        it('should have all severity levels', () => {
            expect(ErrorLevel.DEBUG).toBe('debug');
            expect(ErrorLevel.INFO).toBe('info');
            expect(ErrorLevel.WARNING).toBe('warning');
            expect(ErrorLevel.ERROR).toBe('error');
            expect(ErrorLevel.CRITICAL).toBe('critical');
        });
    });

    describe('handle()', () => {
        it('should handle Error objects', () => {
            const error = new Error('Test error');
            const result = errorHandler.handle(error, {
                code: ErrorCode.STORAGE_ERROR,
                context: 'Test context',
                showToast: false
            });

            expect(result.code).toBe(ErrorCode.STORAGE_ERROR);
            expect(result.message).toBe('Test error');
            expect(result.context).toBe('Test context');
            expect(result.level).toBe(ErrorLevel.ERROR);
            expect(result.timestamp).toBeTypeOf('number');
        });

        it('should handle string errors', () => {
            const result = errorHandler.handle('Simple error message', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });

            expect(result.message).toBe('Simple error message');
            expect(result.code).toBe(ErrorCode.API_ERROR);
            expect(result.stack).toBeNull();
        });

        it('should use default options when not provided', () => {
            const result = errorHandler.handle('Error', { showToast: false });

            expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
            expect(result.level).toBe(ErrorLevel.ERROR);
            expect(result.context).toBe('');
        });

        it('should capture error stack trace', () => {
            const error = new Error('Stack test');
            const result = errorHandler.handle(error, {
                code: ErrorCode.VALIDATION_ERROR,
                showToast: false
            });

            expect(result.stack).toBeTruthy();
            expect(result.stack).toContain('Stack test');
        });

        it('should add error to history', () => {
            errorHandler.handle('Test error', {
                code: ErrorCode.STORAGE_ERROR,
                showToast: false
            });

            expect(errorHandler.errorHistory).toHaveLength(1);
            expect(errorHandler.errorHistory[0].code).toBe(ErrorCode.STORAGE_ERROR);
        });

        it('should update error statistics', () => {
            errorHandler.handle('Error 1', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });
            errorHandler.handle('Error 2', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });

            expect(errorHandler.errorCounts[ErrorCode.API_ERROR]).toBe(2);
        });

        it('should log to console based on level', () => {
            errorHandler.handle('Critical error', {
                code: ErrorCode.CRITICAL,
                level: ErrorLevel.CRITICAL,
                showToast: false
            });

            expect(console.error).toHaveBeenCalled();
        });

        it('should include metadata in error info', () => {
            const metadata = { userId: 123, action: 'save' };
            const result = errorHandler.handle('Error', {
                code: ErrorCode.STORAGE_ERROR,
                metadata,
                showToast: false
            });

            expect(result.metadata).toEqual(metadata);
        });
    });

    describe('log()', () => {
        it('should log warning without toast', () => {
            errorHandler.log(ErrorCode.API_ERROR, 'API failed', { endpoint: '/test' });

            expect(errorHandler.errorHistory).toHaveLength(1);
            expect(errorHandler.errorHistory[0].level).toBe(ErrorLevel.WARNING);
            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('info()', () => {
        it('should log info message', () => {
            errorHandler.info('Info message', { test: true });

            expect(console.info).toHaveBeenCalled();
            // Info messages don't go to history by default
        });
    });

    describe('warning()', () => {
        it('should log warning with code', () => {
            errorHandler.warning(ErrorCode.VALIDATION_ERROR, 'Invalid data');

            expect(errorHandler.errorHistory).toHaveLength(1);
            expect(errorHandler.errorHistory[0].level).toBe(ErrorLevel.WARNING);
            expect(errorHandler.errorHistory[0].code).toBe(ErrorCode.VALIDATION_ERROR);
        });
    });

    describe('critical()', () => {
        it('should log critical error and show toast', () => {
            const mockToast = vi.fn();
            errorHandler.setToastFunction(mockToast);

            errorHandler.critical(ErrorCode.SERVICE_INIT_FAILED, 'Service crashed');

            expect(errorHandler.errorHistory).toHaveLength(1);
            expect(errorHandler.errorHistory[0].level).toBe(ErrorLevel.CRITICAL);
            expect(mockToast).toHaveBeenCalled();
        });
    });

    describe('validateRequired()', () => {
        it('should pass validation when all fields present', () => {
            const data = { name: 'Test', age: 25 };

            expect(() => {
                errorHandler.validateRequired(data, ['name', 'age']);
            }).not.toThrow();
        });

        it('should throw when required fields missing', () => {
            const data = { name: 'Test' };

            expect(() => {
                errorHandler.validateRequired(data, ['name', 'age', 'email']);
            }).toThrow('Missing required fields: age, email');
        });

        it('should log validation error when fields missing', () => {
            const data = { name: 'Test' };

            try {
                errorHandler.validateRequired(data, ['name', 'age']);
            } catch (e) {
                // Expected to throw
            }

            expect(errorHandler.errorHistory).toHaveLength(1);
            expect(errorHandler.errorHistory[0].code).toBe(ErrorCode.MISSING_REQUIRED);
        });
    });

    describe('toast notifications', () => {
        it('should call toast function when showToast is true', () => {
            const mockToast = vi.fn();
            errorHandler.setToastFunction(mockToast);

            errorHandler.handle('Test error', {
                code: ErrorCode.STORAGE_ERROR,
                showToast: true
            });

            expect(mockToast).toHaveBeenCalled();
            // Toast is called with (message, options)
            expect(mockToast.mock.calls[0][0]).toBeTypeOf('string');
            expect(mockToast.mock.calls[0][1]).toHaveProperty('type');
        });

        it('should not call toast when showToast is false', () => {
            const mockToast = vi.fn();
            errorHandler.setToastFunction(mockToast);

            errorHandler.handle('Test error', {
                code: ErrorCode.STORAGE_ERROR,
                showToast: false
            });

            expect(mockToast).not.toHaveBeenCalled();
        });

        it('should not crash if toast function not set', () => {
            expect(() => {
                errorHandler.handle('Test error', {
                    code: ErrorCode.STORAGE_ERROR,
                    showToast: true
                });
            }).not.toThrow();
        });
    });

    describe('error history', () => {
        it('should maintain error history', () => {
            errorHandler.handle('Error 1', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });
            errorHandler.handle('Error 2', {
                code: ErrorCode.STORAGE_ERROR,
                showToast: false
            });

            expect(errorHandler.errorHistory).toHaveLength(2);
            expect(errorHandler.errorHistory[0].message).toBe('Error 1');
            expect(errorHandler.errorHistory[1].message).toBe('Error 2');
        });

        it('should limit history size', () => {
            const originalMaxSize = errorHandler.maxHistorySize;
            errorHandler.maxHistorySize = 5;

            for (let i = 0; i < 10; i++) {
                errorHandler.handle(`Error ${i}`, {
                    code: ErrorCode.API_ERROR,
                    showToast: false
                });
            }

            expect(errorHandler.errorHistory.length).toBeLessThanOrEqual(5);

            // Restore original
            errorHandler.maxHistorySize = originalMaxSize;
        });

        it('should provide getHistory() method', () => {
            errorHandler.handle('Test error', {
                code: ErrorCode.VALIDATION_ERROR,
                showToast: false
            });

            const history = errorHandler.getHistory();
            expect(history).toHaveLength(1);
            expect(history[0].code).toBe(ErrorCode.VALIDATION_ERROR);
        });

        it('should provide clearHistory() method', () => {
            errorHandler.handle('Test error', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });

            expect(errorHandler.errorHistory).toHaveLength(1);

            errorHandler.clearHistory();

            expect(errorHandler.errorHistory).toHaveLength(0);
        });
    });

    describe('error statistics', () => {
        it('should track error counts by code', () => {
            errorHandler.handle('Error 1', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });
            errorHandler.handle('Error 2', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });
            errorHandler.handle('Error 3', {
                code: ErrorCode.STORAGE_ERROR,
                showToast: false
            });

            expect(errorHandler.errorCounts[ErrorCode.API_ERROR]).toBe(2);
            expect(errorHandler.errorCounts[ErrorCode.STORAGE_ERROR]).toBe(1);
        });

        it('should provide getStats() method', () => {
            errorHandler.handle('Error 1', {
                code: ErrorCode.VALIDATION_ERROR,
                showToast: false
            });
            errorHandler.handle('Error 2', {
                code: ErrorCode.VALIDATION_ERROR,
                showToast: false
            });

            const stats = errorHandler.getStats();
            expect(stats[ErrorCode.VALIDATION_ERROR]).toBe(2);
        });

        it('should provide clearStats() method', () => {
            errorHandler.handle('Error', {
                code: ErrorCode.API_ERROR,
                showToast: false
            });

            expect(errorHandler.errorCounts[ErrorCode.API_ERROR]).toBe(1);

            errorHandler.clearStats();

            expect(Object.keys(errorHandler.errorCounts)).toHaveLength(0);
        });
    });

    describe('recovery strategies', () => {
        it('should provide recovery suggestions for storage errors', () => {
            const result = errorHandler.handle('Storage full', {
                code: ErrorCode.STORAGE_QUOTA_EXCEEDED,
                showToast: false
            });

            const recovery = errorHandler.getRecoverySuggestion(result.code);
            expect(recovery).toBeTruthy();
            expect(recovery.toLowerCase()).toContain('storage');
        });

        it('should provide recovery suggestions for API errors', () => {
            const recovery = errorHandler.getRecoverySuggestion(ErrorCode.API_TIMEOUT);
            expect(recovery).toBeTruthy();
            expect(recovery).toContain('retry');
        });

        it('should return generic suggestion for unknown errors', () => {
            const recovery = errorHandler.getRecoverySuggestion('NONEXISTENT_CODE');
            expect(recovery).toBeTruthy();
        });
    });

    describe('global error handlers', () => {
        it('should catch uncaught window errors', () => {
            const errorEvent = new globalThis.ErrorEvent('error', {
                error: new Error('Uncaught error'),
                message: 'Uncaught error'
            });

            window.dispatchEvent(errorEvent);

            // Should be logged to history
            expect(errorHandler.errorHistory.length).toBeGreaterThan(0);
        });

        it('should catch unhandled promise rejections', () => {
            const promiseEvent = new globalThis.PromiseRejectionEvent('unhandledrejection', {
                promise: Promise.reject('Rejected'),
                reason: 'Rejected'
            });

            window.dispatchEvent(promiseEvent);

            // Should be logged to history
            expect(errorHandler.errorHistory.length).toBeGreaterThan(0);
        });
    });
});
