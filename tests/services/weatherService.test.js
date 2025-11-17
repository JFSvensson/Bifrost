import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WeatherService } from '../../js/services/weatherService.js';

describe('WeatherService', () => {
    let service;
    let mockFetch;
    let mockAbortController;

    // Mock SMHI API response
    const createMockSMHIResponse = (timeSeriesCount = 24) => {
        const now = new Date('2025-11-17T14:00:00Z');
        const timeSeries = [];

        for (let i = 0; i < timeSeriesCount; i++) {
            const validTime = new Date(now.getTime() + i * 3600000); // Add i hours
            timeSeries.push({
                validTime: validTime.toISOString(),
                parameters: [
                    { name: 't', values: [15 + i * 0.5] }, // Temperature
                    { name: 'r', values: [70 - i] }, // Humidity
                    { name: 'ws', values: [5 + i * 0.2] }, // Wind speed
                    { name: 'pmin', values: [i % 3 === 0 ? 0.5 : 0] }, // Precipitation
                    { name: 'pcat', values: [i % 4] }, // Precipitation category
                    { name: 'pmedian', values: [i % 3 === 0 ? 0.3 : 0] }, // Precipitation median
                    { name: 'tcc_mean', values: [i % 8] }, // Cloudiness
                    { name: 'Wsymb2', values: [1 + (i % 27)] } // Weather symbol
                ]
            });
        }

        return {
            timeSeries,
            approvedTime: now.toISOString(),
            referenceTime: now.toISOString()
        };
    };

    beforeEach(() => {
        // Setup fetch mock
        mockAbortController = {
            signal: {},
            abort: vi.fn()
        };
        
        // Mock AbortController as a class
        global.AbortController = class {
            constructor() {
                return mockAbortController;
            }
        };
        
        global.setTimeout = vi.fn((fn) => 12345);
        global.clearTimeout = vi.fn();

        mockFetch = vi.fn();
        global.fetch = mockFetch;

        // Create service
        service = new WeatherService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default config values', () => {
            expect(service.latitude).toBeDefined();
            expect(service.longitude).toBeDefined();
            expect(service.locationName).toBeDefined();
            expect(service.timeout).toBe(8000);
            expect(service.updateInterval).toBeDefined();
        });

        it('should use config location settings', () => {
            const location = service.getLocation();
            expect(location.latitude).toBe(service.latitude);
            expect(location.longitude).toBe(service.longitude);
            expect(location.name).toBe(service.locationName);
        });
    });

    describe('getCurrentWeather()', () => {
        it('should fetch weather data from SMHI API', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const weather = await service.getCurrentWeather();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('opendata-download-metfcst.smhi.se'),
                expect.objectContaining({ signal: mockAbortController.signal })
            );
            expect(weather).toBeDefined();
            expect(weather.current).toBeDefined();
            expect(weather.forecast).toBeDefined();
            expect(weather.location).toBeDefined();
            expect(weather.lastUpdated).toBeInstanceOf(Date);
        });

        it('should include latitude and longitude in API URL', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            service.setLocation(59.3293, 18.0686, 'Stockholm');
            await service.getCurrentWeather();

            const callUrl = mockFetch.mock.calls[0][0];
            expect(callUrl).toContain('/lon/18.0686/lat/59.3293/');
        });

        it('should set timeout for fetch request', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.getCurrentWeather();

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 8000);
            expect(global.clearTimeout).toHaveBeenCalledWith(12345);
        });

        it('should clear timeout after successful fetch', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.getCurrentWeather();

            expect(global.clearTimeout).toHaveBeenCalledWith(12345);
        });

        it('should clear timeout even on error', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(service.getCurrentWeather()).rejects.toThrow();

            expect(global.clearTimeout).toHaveBeenCalledWith(12345);
        });

        it('should throw error on HTTP error status', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(service.getCurrentWeather()).rejects.toThrow('Kunde inte hämta väderdata');
        });

        it('should throw error on network failure', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(service.getCurrentWeather()).rejects.toThrow('Kunde inte hämta väderdata');
        });

        it('should handle abort signal', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.getCurrentWeather();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ signal: mockAbortController.signal })
            );
        });
    });

    describe('parseWeatherData()', () => {
        it('should parse valid SMHI data', () => {
            const mockData = createMockSMHIResponse();
            const parsed = service.parseWeatherData(mockData);

            expect(parsed.current).toBeDefined();
            expect(parsed.forecast).toBeInstanceOf(Array);
            expect(parsed.location).toBe(service.locationName);
            expect(parsed.lastUpdated).toBeInstanceOf(Date);
        });

        it('should throw error when timeSeries is missing', () => {
            expect(() => service.parseWeatherData({})).toThrow('Ingen väderdata tillgänglig');
        });

        it('should throw error when timeSeries is empty', () => {
            expect(() => service.parseWeatherData({ timeSeries: [] })).toThrow('Ingen väderdata tillgänglig');
        });

        it('should select current hour data', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-11-17T14:30:00Z'));

            const mockData = createMockSMHIResponse();
            const parsed = service.parseWeatherData(mockData);

            // Should select first entry at or after current hour (14:00)
            expect(parsed.current.time).toBeInstanceOf(Date);
            expect(parsed.current.time.getHours()).toBeGreaterThanOrEqual(14);

            vi.useRealTimers();
        });

        it('should fallback to first entry if no future data', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-11-18T00:00:00Z')); // After all mock data

            const mockData = createMockSMHIResponse();
            const parsed = service.parseWeatherData(mockData);

            expect(parsed.current).toBeDefined();
            expect(parsed.current.temperature).toBeDefined();

            vi.useRealTimers();
        });

        it('should filter forecast to end of day', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-11-17T14:00:00Z'));

            const mockData = createMockSMHIResponse(48); // 48 hours of data
            const parsed = service.parseWeatherData(mockData);

            // Should only include entries until 23:59 today
            const allToday = parsed.forecast.every(entry => {
                const entryDate = new Date(entry.time);
                const today = new Date('2025-11-17T14:00:00Z');
                return entryDate.getDate() === today.getDate() &&
                       entryDate.getMonth() === today.getMonth() &&
                       entryDate.getFullYear() === today.getFullYear();
            });

            expect(allToday).toBe(true);
            expect(parsed.forecast.length).toBeLessThan(48);

            vi.useRealTimers();
        });

        it('should include location name', () => {
            const mockData = createMockSMHIResponse();
            service.setLocation(59.3293, 18.0686, 'Stockholm');

            const parsed = service.parseWeatherData(mockData);

            expect(parsed.location).toBe('Stockholm');
        });

        it('should set lastUpdated to current time', () => {
            const before = new Date();
            const mockData = createMockSMHIResponse();
            const parsed = service.parseWeatherData(mockData);
            const after = new Date();

            expect(parsed.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(parsed.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('parseTimeSeriesEntry()', () => {
        it('should extract all weather parameters', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: [
                    { name: 't', values: [15.5] },
                    { name: 'r', values: [70] },
                    { name: 'ws', values: [5.2] },
                    { name: 'pmin', values: [0.5] },
                    { name: 'pcat', values: [2] },
                    { name: 'pmedian', values: [0.3] },
                    { name: 'tcc_mean', values: [4] },
                    { name: 'Wsymb2', values: [3] }
                ]
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.time).toBeInstanceOf(Date);
            expect(parsed.temperature).toBe(15.5);
            expect(parsed.humidity).toBe(70);
            expect(parsed.windSpeed).toBe(5.2);
            expect(parsed.precipitation).toBe(0.5);
            expect(parsed.precipitationCategory).toBe(2);
            expect(parsed.precipitationMedian).toBe(0.3);
            expect(parsed.cloudiness).toBe(4);
            expect(parsed.weatherSymbol).toBe(3);
        });

        it('should handle missing parameters gracefully', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: [
                    { name: 't', values: [15.5] }
                ]
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.temperature).toBe(15.5);
            expect(parsed.humidity).toBeNull();
            expect(parsed.windSpeed).toBeNull();
            expect(parsed.precipitation).toBeNull();
        });

        it('should parse validTime as Date', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: []
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.time).toBeInstanceOf(Date);
            expect(parsed.time.toISOString()).toBe('2025-11-17T14:00:00.000Z');
        });
    });

    describe('getParameter()', () => {
        it('should extract parameter value by name', () => {
            const params = [
                { name: 't', values: [15.5] },
                { name: 'r', values: [70] },
                { name: 'ws', values: [5.2] }
            ];

            expect(service.getParameter(params, 't')).toBe(15.5);
            expect(service.getParameter(params, 'r')).toBe(70);
            expect(service.getParameter(params, 'ws')).toBe(5.2);
        });

        it('should return null for missing parameter', () => {
            const params = [
                { name: 't', values: [15.5] }
            ];

            expect(service.getParameter(params, 'nonexistent')).toBeNull();
        });

        it('should return first value from values array', () => {
            const params = [
                { name: 't', values: [15.5, 16.0, 14.5] }
            ];

            expect(service.getParameter(params, 't')).toBe(15.5);
        });

        it('should handle empty values array', () => {
            const params = [
                { name: 't', values: [] }
            ];

            expect(service.getParameter(params, 't')).toBeUndefined();
        });
    });

    describe('getPrecipitationProbability()', () => {
        it('should return 0% for category 0 (no precipitation)', () => {
            expect(service.getPrecipitationProbability(0)).toBe(0);
        });

        it('should return 10% for category 1 (very light)', () => {
            expect(service.getPrecipitationProbability(1)).toBe(10);
        });

        it('should return 25% for category 2 (light)', () => {
            expect(service.getPrecipitationProbability(2)).toBe(25);
        });

        it('should return 50% for category 3 (moderate)', () => {
            expect(service.getPrecipitationProbability(3)).toBe(50);
        });

        it('should return 75% for category 4 (heavy)', () => {
            expect(service.getPrecipitationProbability(4)).toBe(75);
        });

        it('should return 90% for category 5 (very heavy)', () => {
            expect(service.getPrecipitationProbability(5)).toBe(90);
        });

        it('should return 95% for category 6 (extreme)', () => {
            expect(service.getPrecipitationProbability(6)).toBe(95);
        });

        it('should return 0% for unknown category', () => {
            expect(service.getPrecipitationProbability(999)).toBe(0);
            expect(service.getPrecipitationProbability(-1)).toBe(0);
        });
    });

    describe('getWeatherIcon()', () => {
        it('should return ☀️ for clear sky (1)', () => {
            expect(service.getWeatherIcon(1)).toBe('☀️');
        });

        it('should return 🌤️ for nearly clear sky (2)', () => {
            expect(service.getWeatherIcon(2)).toBe('🌤️');
        });

        it('should return ⛅ for variable cloudiness (3)', () => {
            expect(service.getWeatherIcon(3)).toBe('⛅');
        });

        it('should return ☁️ for cloudy sky (4-6)', () => {
            expect(service.getWeatherIcon(4)).toBe('☁️');
            expect(service.getWeatherIcon(5)).toBe('☁️');
            expect(service.getWeatherIcon(6)).toBe('☁️');
        });

        it('should return 🌫️ for fog (7)', () => {
            expect(service.getWeatherIcon(7)).toBe('🌫️');
        });

        it('should return 🌦️ for light rain showers (8)', () => {
            expect(service.getWeatherIcon(8)).toBe('🌦️');
        });

        it('should return 🌧️ for rain (9-10, 18-20)', () => {
            expect(service.getWeatherIcon(9)).toBe('🌧️');
            expect(service.getWeatherIcon(10)).toBe('🌧️');
            expect(service.getWeatherIcon(18)).toBe('🌧️');
            expect(service.getWeatherIcon(19)).toBe('🌧️');
            expect(service.getWeatherIcon(20)).toBe('🌧️');
        });

        it('should return ⛈️ for thunderstorm (11, 21)', () => {
            expect(service.getWeatherIcon(11)).toBe('⛈️');
            expect(service.getWeatherIcon(21)).toBe('⛈️');
        });

        it('should return 🌨️ for sleet (12-14, 22-24)', () => {
            expect(service.getWeatherIcon(12)).toBe('🌨️');
            expect(service.getWeatherIcon(13)).toBe('🌨️');
            expect(service.getWeatherIcon(14)).toBe('🌨️');
            expect(service.getWeatherIcon(22)).toBe('🌨️');
            expect(service.getWeatherIcon(23)).toBe('🌨️');
            expect(service.getWeatherIcon(24)).toBe('🌨️');
        });

        it('should return ❄️ for snow (15-17, 25-27)', () => {
            expect(service.getWeatherIcon(15)).toBe('❄️');
            expect(service.getWeatherIcon(16)).toBe('❄️');
            expect(service.getWeatherIcon(17)).toBe('❄️');
            expect(service.getWeatherIcon(25)).toBe('❄️');
            expect(service.getWeatherIcon(26)).toBe('❄️');
            expect(service.getWeatherIcon(27)).toBe('❄️');
        });

        it('should return 🌡️ for unknown symbol', () => {
            expect(service.getWeatherIcon(999)).toBe('🌡️');
            expect(service.getWeatherIcon(0)).toBe('🌡️');
            expect(service.getWeatherIcon(-1)).toBe('🌡️');
        });
    });

    describe('setLocation()', () => {
        it('should update latitude and longitude', () => {
            service.setLocation(59.3293, 18.0686);

            expect(service.latitude).toBe(59.3293);
            expect(service.longitude).toBe(18.0686);
        });

        it('should update location name when provided', () => {
            service.setLocation(59.3293, 18.0686, 'Stockholm');

            expect(service.locationName).toBe('Stockholm');
        });

        it('should not update location name when null', () => {
            const originalName = service.locationName;
            service.setLocation(59.3293, 18.0686, null);

            expect(service.locationName).toBe(originalName);
        });

        it('should not update location name when undefined', () => {
            const originalName = service.locationName;
            service.setLocation(59.3293, 18.0686);

            expect(service.locationName).toBe(originalName);
        });

        it('should handle negative coordinates', () => {
            service.setLocation(-33.8688, -151.2093, 'Sydney');

            expect(service.latitude).toBe(-33.8688);
            expect(service.longitude).toBe(-151.2093);
        });

        it('should handle coordinates at extremes', () => {
            service.setLocation(90, 180, 'North Pole');

            expect(service.latitude).toBe(90);
            expect(service.longitude).toBe(180);
        });
    });

    describe('getLocation()', () => {
        it('should return current location data', () => {
            service.setLocation(59.3293, 18.0686, 'Stockholm');

            const location = service.getLocation();

            expect(location.latitude).toBe(59.3293);
            expect(location.longitude).toBe(18.0686);
            expect(location.name).toBe('Stockholm');
        });

        it('should return object with latitude, longitude, and name', () => {
            const location = service.getLocation();

            expect(location).toHaveProperty('latitude');
            expect(location).toHaveProperty('longitude');
            expect(location).toHaveProperty('name');
        });

        it('should return new object each time', () => {
            const location1 = service.getLocation();
            const location2 = service.getLocation();

            expect(location1).not.toBe(location2);
            expect(location1).toEqual(location2);
        });
    });

    describe('Integration', () => {
        it('should complete full weather fetch and parse cycle', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const weather = await service.getCurrentWeather();

            expect(weather.current.temperature).toBeDefined();
            expect(weather.current.humidity).toBeDefined();
            expect(weather.current.windSpeed).toBeDefined();
            expect(weather.forecast.length).toBeGreaterThan(0);
            expect(weather.forecast[0]).toHaveProperty('temperature');
            expect(weather.forecast[0]).toHaveProperty('time');
        });

        it('should use updated location in API calls', async () => {
            const mockData = createMockSMHIResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            service.setLocation(57.7089, 11.9746, 'Göteborg');
            const weather = await service.getCurrentWeather();

            const callUrl = mockFetch.mock.calls[0][0];
            expect(callUrl).toContain('/lon/11.9746/lat/57.7089/');
            expect(weather.location).toBe('Göteborg');
        });

        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(service.getCurrentWeather()).rejects.toThrow('Kunde inte hämta väderdata');
        });
    });

    describe('Edge cases', () => {
        it('should handle very large forecast arrays', () => {
            const mockData = createMockSMHIResponse(1000);
            const parsed = service.parseWeatherData(mockData);

            expect(parsed.forecast).toBeInstanceOf(Array);
            expect(parsed.current).toBeDefined();
        });

        it('should handle single time series entry', () => {
            const mockData = createMockSMHIResponse(1);
            const parsed = service.parseWeatherData(mockData);

            expect(parsed.current).toBeDefined();
            expect(parsed.forecast.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle zero values for all parameters', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: [
                    { name: 't', values: [0] },
                    { name: 'r', values: [0] },
                    { name: 'ws', values: [0] },
                    { name: 'pmin', values: [0] },
                    { name: 'pcat', values: [0] },
                    { name: 'tcc_mean', values: [0] },
                    { name: 'Wsymb2', values: [0] }
                ]
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.temperature).toBe(0);
            expect(parsed.humidity).toBe(0);
            expect(parsed.windSpeed).toBe(0);
            expect(parsed.precipitation).toBe(0);
        });

        it('should handle negative temperatures', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: [
                    { name: 't', values: [-15.5] }
                ]
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.temperature).toBe(-15.5);
        });

        it('should handle high wind speeds', () => {
            const entry = {
                validTime: '2025-11-17T14:00:00Z',
                parameters: [
                    { name: 'ws', values: [50.5] }
                ]
            };

            const parsed = service.parseTimeSeriesEntry(entry);

            expect(parsed.windSpeed).toBe(50.5);
        });
    });
});
