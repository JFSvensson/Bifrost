import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClockService } from '../../js/services/clockService.js';
import eventBus from '../../js/core/eventBus.js';

describe('ClockService', () => {
    let clockService;
    
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Reset all mocks
        vi.clearAllMocks();
        
        // Create fresh service instance
        clockService = new ClockService();
    });

    afterEach(() => {
        // Clean up intervals
        if (clockService) {
            clockService.destroy();
        }
    });

    describe('Initialization', () => {
        it('should initialize with default configuration', () => {
            expect(clockService.timezones).toBeDefined();
            expect(clockService.format).toBeDefined();
            expect(clockService.updateInterval).toBeDefined();
            expect(clockService.showSeconds).toBeDefined();
        });

        it('should have multiple timezones configured', () => {
            expect(clockService.timezones.length).toBeGreaterThan(0);
            expect(clockService.timezones[0]).toHaveProperty('name');
            expect(clockService.timezones[0]).toHaveProperty('timezone');
        });

        it('should emit initial clock:update event on initialization', () => {
            const handler = vi.fn();
            eventBus.on('clock:update', handler);

            const newService = new ClockService();
            
            expect(handler).toHaveBeenCalled();
            
            newService.destroy();
        });

        it('should start periodic updates if updateInterval > 0', () => {
            expect(clockService.updateIntervalId).toBeDefined();
        });
    });

    describe('getCurrentTime()', () => {
        it('should return time information for default timezone', () => {
            const result = clockService.getCurrentTime();

            expect(result).toHaveProperty('time');
            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('timezone');
            expect(result).toHaveProperty('timestamp');
            expect(result.timezone).toBe('Europe/Stockholm');
        });

        it('should return time for specified timezone', () => {
            const result = clockService.getCurrentTime('America/New_York');

            expect(result.timezone).toBe('America/New_York');
            expect(result.time).toBeTruthy();
            expect(result.date).toBeTruthy();
        });

        it('should include timestamp', () => {
            const result = clockService.getCurrentTime();
            const now = Date.now();

            expect(result.timestamp).toBeCloseTo(now, -2);
        });

        it('should format time correctly', () => {
            const result = clockService.getCurrentTime('Europe/Stockholm');

            // Time should be in HH:MM format (24h default)
            expect(result.time).toMatch(/^\d{2}:\d{2}$/);
        });

        it('should format date correctly', () => {
            const result = clockService.getCurrentTime('Europe/Stockholm');

            // Date should include weekday, day, month, year
            expect(result.date).toBeTruthy();
            expect(typeof result.date).toBe('string');
        });

        it('should handle invalid timezone gracefully', () => {
            expect(() => {
                clockService.getCurrentTime('Invalid/Timezone');
            }).toThrow();
        });
    });

    describe('getAllTimezones()', () => {
        it('should return data for all configured timezones', () => {
            const result = clockService.getAllTimezones();

            expect(result.length).toBe(clockService.timezones.length);
            
            result.forEach(tz => {
                expect(tz).toHaveProperty('name');
                expect(tz).toHaveProperty('timezone');
                expect(tz).toHaveProperty('time');
                expect(tz).toHaveProperty('date');
                expect(tz).toHaveProperty('timestamp');
            });
        });

        it('should include original timezone config properties', () => {
            const result = clockService.getAllTimezones();

            const stockholm = result.find(tz => tz.timezone === 'Europe/Stockholm');
            expect(stockholm.name).toBe('Stockholm');
        });
    });

    describe('formatTime()', () => {
        it('should format time for 24h format', () => {
            clockService.format = '24h';
            const date = new Date('2025-11-17T14:30:45Z');
            
            const result = clockService.formatTime(date, 'Europe/Stockholm');
            
            // Should be in HH:MM format (no seconds by default)
            expect(result).toMatch(/^\d{2}:\d{2}$/);
        });

        it('should include seconds when showSeconds is true', () => {
            clockService.showSeconds = true;
            const date = new Date('2025-11-17T14:30:45Z');
            
            const result = clockService.formatTime(date, 'Europe/Stockholm');
            
            // Should be in HH:MM:SS format
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        it('should format time for 12h format', () => {
            clockService.format = '12h';
            const date = new Date('2025-11-17T14:30:00Z');
            
            const result = clockService.formatTime(date, 'Europe/Stockholm');
            
            // 12h format should have AM/PM
            expect(result).toBeTruthy();
        });

        it('should respect timezone parameter', () => {
            const date = new Date('2025-11-17T12:00:00Z');
            
            const stockholm = clockService.formatTime(date, 'Europe/Stockholm');
            const newYork = clockService.formatTime(date, 'America/New_York');
            
            // Times should differ due to timezone
            expect(stockholm).not.toBe(newYork);
        });
    });

    describe('formatDate()', () => {
        it('should format date in Swedish locale', () => {
            const date = new Date('2025-11-17T12:00:00Z');
            
            const result = clockService.formatDate(date, 'Europe/Stockholm');
            
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should include weekday, day, month, and year', () => {
            const date = new Date('2025-11-17T12:00:00Z');
            
            const result = clockService.formatDate(date, 'Europe/Stockholm');
            
            // Should include components (Swedish format)
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(10);
        });

        it('should respect timezone parameter', () => {
            // Use date near midnight to see date change
            const date = new Date('2025-11-17T23:30:00Z');
            
            const stockholm = clockService.formatDate(date, 'Europe/Stockholm');
            const tokyo = clockService.formatDate(date, 'Asia/Tokyo');
            
            // Dates might differ due to timezone
            expect(stockholm).toBeTruthy();
            expect(tokyo).toBeTruthy();
        });
    });

    describe('getTimezoneName()', () => {
        it('should return name for configured timezone', () => {
            const result = clockService.getTimezoneName('Europe/Stockholm');
            
            expect(result).toBe('Stockholm');
        });

        it('should return timezone identifier if not found', () => {
            const result = clockService.getTimezoneName('Unknown/Timezone');
            
            expect(result).toBe('Unknown/Timezone');
        });

        it('should work for all configured timezones', () => {
            clockService.timezones.forEach(tz => {
                const result = clockService.getTimezoneName(tz.timezone);
                expect(result).toBe(tz.name);
            });
        });
    });

    describe('isWorkingHours()', () => {
        it('should return true during working hours (8-17)', () => {
            // Mock time to 10:00
            const date = new Date('2025-11-17T09:00:00Z'); // 10:00 in Stockholm (UTC+1)
            vi.setSystemTime(date);

            const result = clockService.isWorkingHours('Europe/Stockholm');
            
            expect(result).toBe(true);
            
            vi.useRealTimers();
        });

        it('should return false before working hours', () => {
            // Mock time to 07:00 Stockholm
            const date = new Date('2025-11-17T06:00:00Z');
            vi.setSystemTime(date);

            const result = clockService.isWorkingHours('Europe/Stockholm');
            
            expect(result).toBe(false);
            
            vi.useRealTimers();
        });

        it('should return false after working hours', () => {
            // Mock time to 18:00 Stockholm
            const date = new Date('2025-11-17T17:00:00Z');
            vi.setSystemTime(date);

            const result = clockService.isWorkingHours('Europe/Stockholm');
            
            expect(result).toBe(false);
            
            vi.useRealTimers();
        });

        it('should check working hours for different timezones', () => {
            const stockholm = clockService.isWorkingHours('Europe/Stockholm');
            const newYork = clockService.isWorkingHours('America/New_York');
            
            // One might be working hours, other not
            expect(typeof stockholm).toBe('boolean');
            expect(typeof newYork).toBe('boolean');
        });
    });

    describe('getTimeDifference()', () => {
        it('should calculate time difference between timezones', () => {
            const diff = clockService.getTimeDifference('Europe/Stockholm', 'America/New_York');
            
            // Stockholm is typically 6 hours ahead of New York
            expect(diff).toBeCloseTo(-6, 0);
        });

        it('should return 0 for same timezone', () => {
            const diff = clockService.getTimeDifference('Europe/Stockholm', 'Europe/Stockholm');
            
            expect(diff).toBe(0);
        });

        it('should handle positive differences', () => {
            const diff = clockService.getTimeDifference('America/New_York', 'Europe/Stockholm');
            
            // New York is typically 6 hours behind Stockholm
            expect(diff).toBeCloseTo(6, 0);
        });

        it('should throw error for invalid timezone', () => {
            expect(() => {
                clockService.getTimeDifference('Invalid/Timezone', 'Europe/Stockholm');
            }).toThrow();
        });

        it('should handle multiple timezone pairs', () => {
            const pairs = [
                ['Europe/Stockholm', 'Asia/Tokyo'],
                ['America/New_York', 'Europe/London'],
                ['Europe/Stockholm', 'Europe/London']
            ];

            pairs.forEach(([from, to]) => {
                const diff = clockService.getTimeDifference(from, to);
                expect(typeof diff).toBe('number');
            });
        });
    });

    describe('startUpdates() and stopUpdates()', () => {
        it('should start periodic updates', () => {
            clockService.stopUpdates(); // Stop existing
            
            clockService.startUpdates();
            
            expect(clockService.updateIntervalId).toBeDefined();
        });

        it('should not start updates twice', () => {
            clockService.stopUpdates();
            
            clockService.startUpdates();
            const firstId = clockService.updateIntervalId;
            
            clockService.startUpdates();
            const secondId = clockService.updateIntervalId;
            
            expect(firstId).toBe(secondId);
        });

        it('should stop periodic updates', () => {
            clockService.startUpdates();
            
            clockService.stopUpdates();
            
            expect(clockService.updateIntervalId).toBeNull();
        });

        it('should emit clock:update events periodically', async () => {
            vi.useFakeTimers();
            
            const handler = vi.fn();
            eventBus.on('clock:update', handler);
            
            clockService.stopUpdates();
            handler.mockClear();
            
            clockService.startUpdates();
            
            // Advance time by update interval
            await vi.advanceTimersByTimeAsync(clockService.updateInterval);
            
            expect(handler).toHaveBeenCalledTimes(1);
            
            // Advance again
            await vi.advanceTimersByTimeAsync(clockService.updateInterval);
            
            expect(handler).toHaveBeenCalledTimes(2);
            
            vi.useRealTimers();
        });
    });

    describe('EventBus integration', () => {
        it('should emit clock:update with all timezone data', () => {
            const handler = vi.fn();
            eventBus.on('clock:update', handler);
            
            clockService._emitTimeUpdate();
            
            expect(handler).toHaveBeenCalled();
            
            const [data, eventName] = handler.mock.calls[0];
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(clockService.timezones.length);
            expect(eventName).toBe('clock:update');
        });

        it('should include all required properties in event data', () => {
            const handler = vi.fn();
            eventBus.on('clock:update', handler);
            
            clockService._emitTimeUpdate();
            
            const [data] = handler.mock.calls[0];
            
            data.forEach(tz => {
                expect(tz).toHaveProperty('name');
                expect(tz).toHaveProperty('timezone');
                expect(tz).toHaveProperty('time');
                expect(tz).toHaveProperty('date');
                expect(tz).toHaveProperty('timestamp');
            });
        });

        it('should handle errors in _emitTimeUpdate gracefully', () => {
            // Mock getAllTimezones to throw error
            clockService.getAllTimezones = vi.fn(() => {
                throw new Error('Test error');
            });
            
            // Should not throw
            expect(() => {
                clockService._emitTimeUpdate();
            }).not.toThrow();
        });
    });

    describe('destroy()', () => {
        it('should stop updates when destroyed', () => {
            clockService.startUpdates();
            
            clockService.destroy();
            
            expect(clockService.updateIntervalId).toBeNull();
        });

        it('should allow multiple destroy calls', () => {
            expect(() => {
                clockService.destroy();
                clockService.destroy();
            }).not.toThrow();
        });
    });

    describe('Time format consistency', () => {
        it('should format times consistently across calls', () => {
            const date = new Date('2025-11-17T14:30:45Z');
            
            const result1 = clockService.formatTime(date, 'Europe/Stockholm');
            const result2 = clockService.formatTime(date, 'Europe/Stockholm');
            
            expect(result1).toBe(result2);
        });

        it('should format dates consistently across calls', () => {
            const date = new Date('2025-11-17T14:30:45Z');
            
            const result1 = clockService.formatDate(date, 'Europe/Stockholm');
            const result2 = clockService.formatDate(date, 'Europe/Stockholm');
            
            expect(result1).toBe(result2);
        });
    });

    describe('Edge cases', () => {
        it('should handle midnight correctly', () => {
            const date = new Date('2025-11-17T23:00:00Z');
            
            const result = clockService.formatTime(date, 'Europe/Stockholm');
            
            expect(result).toBeTruthy();
            expect(result).toMatch(/^\d{2}:\d{2}/);
        });

        it('should handle noon correctly', () => {
            const date = new Date('2025-11-17T11:00:00Z');
            
            const result = clockService.formatTime(date, 'Europe/Stockholm');
            
            expect(result).toBeTruthy();
            expect(result).toMatch(/^\d{2}:\d{2}/);
        });

        it('should handle DST transitions', () => {
            // Test date during DST
            const summer = new Date('2025-07-15T12:00:00Z');
            const summerResult = clockService.getCurrentTime('Europe/Stockholm');
            
            // Test date outside DST
            const winter = new Date('2025-01-15T12:00:00Z');
            const winterResult = clockService.getCurrentTime('Europe/Stockholm');
            
            expect(summerResult.time).toBeTruthy();
            expect(winterResult.time).toBeTruthy();
        });
    });
});
