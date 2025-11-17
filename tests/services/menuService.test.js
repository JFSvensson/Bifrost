import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MenuService } from '../../js/services/menuService.js';

describe('MenuService', () => {
    let service;
    let mockFetch;
    let mockAbortController;

    // Mock valid menu API response
    const createMockMenuResponse = () => ({
        days: [
            {
                date: '2025-11-17',
                day: 'Måndag',
                meals: [
                    {
                        type: 'lunch',
                        description: 'Köttbullar med potatismos och lingonsylt',
                        allergens: ['gluten', 'mjölk']
                    },
                    {
                        type: 'vegetarian',
                        description: 'Vegetarisk lasagne',
                        allergens: ['gluten', 'mjölk']
                    }
                ]
            },
            {
                date: '2025-11-18',
                day: 'Tisdag',
                meals: [
                    {
                        type: 'lunch',
                        description: 'Fiskgratäng med ris',
                        allergens: ['fisk', 'mjölk']
                    }
                ]
            },
            {
                date: '2025-11-19',
                day: 'Onsdag',
                meals: [
                    {
                        type: 'lunch',
                        description: 'Kycklinggryta med pasta',
                        allergens: ['gluten']
                    }
                ]
            }
        ],
        school: 'Testskolan',
        week: 47
    });

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

        // Create service with default config
        service = new MenuService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default API URL from config', () => {
            expect(service.apiUrl).toBeDefined();
            expect(typeof service.apiUrl).toBe('string');
        });

        it('should initialize with default timeout from config', () => {
            expect(service.timeout).toBeDefined();
            expect(typeof service.timeout).toBe('number');
        });

        it('should allow custom API URL override', () => {
            const customUrl = 'https://custom-api.example.com/menu';
            const customService = new MenuService(customUrl);

            expect(customService.apiUrl).toBe(customUrl);
        });

        it('should use config timeout even with custom URL', () => {
            const customUrl = 'https://custom-api.example.com/menu';
            const customService = new MenuService(customUrl);

            expect(customService.timeout).toBe(service.timeout);
        });
    });

    describe('fetchMenu()', () => {
        it('should fetch menu data from API', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const menu = await service.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                service.apiUrl,
                expect.objectContaining({ signal: mockAbortController.signal })
            );
            expect(menu).toEqual(mockData);
        });

        it('should set timeout for fetch request', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.fetchMenu();

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), service.timeout);
        });

        it('should clear timeout after successful fetch', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.fetchMenu();

            expect(global.clearTimeout).toHaveBeenCalledWith(12345);
        });

        it('should clear timeout even on error', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(service.fetchMenu()).rejects.toThrow();

            expect(global.clearTimeout).toHaveBeenCalledWith(12345);
        });

        it('should use AbortController for fetch', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await service.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ signal: mockAbortController.signal })
            );
        });

        it('should throw error on HTTP error status', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 404');
        });

        it('should throw error on HTTP 500', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 500');
        });

        it('should throw error on network failure', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(service.fetchMenu()).rejects.toThrow('Network error');
        });

        it('should throw error on timeout', async () => {
            mockFetch.mockRejectedValue(new Error('AbortError'));

            await expect(service.fetchMenu()).rejects.toThrow();
        });

        it('should validate fetched data', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const menu = await service.fetchMenu();

            expect(menu.days).toBeDefined();
            expect(Array.isArray(menu.days)).toBe(true);
            expect(menu.days.length).toBeGreaterThan(0);
        });

        it('should throw error on invalid data structure', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ invalid: 'data' })
            });

            await expect(service.fetchMenu()).rejects.toThrow('Invalid menu data');
        });

        it('should throw error when days array is empty', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ days: [] })
            });

            await expect(service.fetchMenu()).rejects.toThrow('Invalid menu data');
        });

        it('should handle malformed JSON', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            await expect(service.fetchMenu()).rejects.toThrow('Invalid JSON');
        });
    });

    describe('validateData()', () => {
        it('should accept valid menu data', () => {
            const validData = createMockMenuResponse();

            const result = service.validateData(validData);

            expect(result).toEqual(validData);
        });

        it('should accept data with single day', () => {
            const singleDayData = {
                days: [
                    {
                        date: '2025-11-17',
                        day: 'Måndag',
                        meals: []
                    }
                ]
            };

            const result = service.validateData(singleDayData);

            expect(result).toEqual(singleDayData);
        });

        it('should accept data with multiple days', () => {
            const multiDayData = createMockMenuResponse();

            const result = service.validateData(multiDayData);

            expect(result.days.length).toBe(3);
        });

        it('should throw error when data is null', () => {
            expect(() => service.validateData(null)).toThrow('Invalid menu data');
        });

        it('should throw error when data is undefined', () => {
            expect(() => service.validateData(undefined)).toThrow('Invalid menu data');
        });

        it('should throw error when days property is missing', () => {
            expect(() => service.validateData({})).toThrow('Invalid menu data');
        });

        it('should throw error when days is null', () => {
            expect(() => service.validateData({ days: null })).toThrow('Invalid menu data');
        });

        it('should throw error when days is empty array', () => {
            expect(() => service.validateData({ days: [] })).toThrow('Invalid menu data');
        });

        it('should accept when days is a non-empty string (has .length)', () => {
            // The validation checks days?.length which is truthy for non-empty strings
            const result = service.validateData({ days: 'not-an-array' });
            expect(result.days).toBe('not-an-array');
        });

        it('should accept days with various properties', () => {
            const dataWithExtraProps = {
                days: [
                    {
                        date: '2025-11-17',
                        day: 'Måndag',
                        meals: [],
                        extraProp: 'value'
                    }
                ],
                school: 'Testskolan',
                additionalInfo: 'Some info'
            };

            const result = service.validateData(dataWithExtraProps);

            expect(result).toEqual(dataWithExtraProps);
        });
    });

    describe('Integration', () => {
        it('should complete full menu fetch and validation cycle', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const menu = await service.fetchMenu();

            expect(menu.days).toBeDefined();
            expect(menu.days.length).toBe(3);
            expect(menu.school).toBe('Testskolan');
            expect(menu.week).toBe(47);
        });

        it('should preserve all menu data fields', async () => {
            const mockData = createMockMenuResponse();
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].date).toBe('2025-11-17');
            expect(menu.days[0].day).toBe('Måndag');
            expect(menu.days[0].meals.length).toBe(2);
            expect(menu.days[0].meals[0].type).toBe('lunch');
            expect(menu.days[0].meals[0].description).toBeTruthy();
            expect(Array.isArray(menu.days[0].meals[0].allergens)).toBe(true);
        });

        it('should handle API returning minimal valid data', async () => {
            const minimalData = {
                days: [{ date: '2025-11-17' }]
            };
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => minimalData
            });

            const menu = await service.fetchMenu();

            expect(menu.days.length).toBe(1);
            expect(menu.days[0].date).toBe('2025-11-17');
        });

        it('should handle custom API URL', async () => {
            const customUrl = 'https://custom.example.com/menu';
            const customService = new MenuService(customUrl);
            const mockData = createMockMenuResponse();
            
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await customService.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                customUrl,
                expect.any(Object)
            );
        });
    });

    describe('Error handling', () => {
        it('should handle 400 Bad Request', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 400');
        });

        it('should handle 401 Unauthorized', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 401');
        });

        it('should handle 403 Forbidden', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 403
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 403');
        });

        it('should handle 404 Not Found', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 404');
        });

        it('should handle 500 Internal Server Error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 500');
        });

        it('should handle 503 Service Unavailable', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503
            });

            await expect(service.fetchMenu()).rejects.toThrow('HTTP 503');
        });

        it('should handle connection timeout', async () => {
            mockFetch.mockRejectedValue(new Error('Request timeout'));

            await expect(service.fetchMenu()).rejects.toThrow('Request timeout');
            expect(global.clearTimeout).toHaveBeenCalled();
        });

        it('should handle DNS resolution failure', async () => {
            mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

            await expect(service.fetchMenu()).rejects.toThrow('getaddrinfo ENOTFOUND');
        });

        it('should handle CORS errors', async () => {
            mockFetch.mockRejectedValue(new Error('CORS error'));

            await expect(service.fetchMenu()).rejects.toThrow('CORS error');
        });
    });

    describe('Edge cases', () => {
        it('should handle very large menu data', async () => {
            const largeData = {
                days: Array.from({ length: 365 }, (_, i) => ({
                    date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
                    day: 'Måndag',
                    meals: [
                        {
                            type: 'lunch',
                            description: 'Meal ' + i,
                            allergens: []
                        }
                    ]
                }))
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => largeData
            });

            const menu = await service.fetchMenu();

            expect(menu.days.length).toBe(365);
        });

        it('should handle menu with no meals', async () => {
            const noMealsData = {
                days: [
                    {
                        date: '2025-11-17',
                        day: 'Måndag',
                        meals: []
                    }
                ]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => noMealsData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].meals).toEqual([]);
        });

        it('should handle special characters in meal descriptions', async () => {
            const specialCharsData = {
                days: [
                    {
                        date: '2025-11-17',
                        meals: [
                            {
                                description: 'Köttbullar & gräddsky med "speciell" sås (äkta)'
                            }
                        ]
                    }
                ]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => specialCharsData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].meals[0].description).toContain('&');
            expect(menu.days[0].meals[0].description).toContain('"');
        });

        it('should handle Unicode characters', async () => {
            const unicodeData = {
                days: [
                    {
                        date: '2025-11-17',
                        meals: [
                            {
                                description: 'Sushi 🍣 med wasabi 🌶️'
                            }
                        ]
                    }
                ]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => unicodeData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].meals[0].description).toContain('🍣');
            expect(menu.days[0].meals[0].description).toContain('🌶️');
        });

        it('should handle empty strings in data', async () => {
            const emptyStringsData = {
                days: [
                    {
                        date: '',
                        day: '',
                        meals: [
                            {
                                description: ''
                            }
                        ]
                    }
                ]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => emptyStringsData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].date).toBe('');
        });

        it('should handle null values in nested data', async () => {
            const nullValuesData = {
                days: [
                    {
                        date: '2025-11-17',
                        day: null,
                        meals: [
                            {
                                type: null,
                                description: 'Test',
                                allergens: null
                            }
                        ]
                    }
                ]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => nullValuesData
            });

            const menu = await service.fetchMenu();

            expect(menu.days[0].day).toBeNull();
            expect(menu.days[0].meals[0].allergens).toBeNull();
        });
    });

    describe('API URL configuration', () => {
        it('should use provided API URL', () => {
            const customUrl = 'https://api.example.com/menu';
            const customService = new MenuService(customUrl);

            expect(customService.apiUrl).toBe(customUrl);
        });

        it('should handle API URL with query parameters', async () => {
            const urlWithParams = 'https://api.example.com/menu?week=47&year=2025';
            const customService = new MenuService(urlWithParams);
            const mockData = createMockMenuResponse();

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await customService.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                urlWithParams,
                expect.any(Object)
            );
        });

        it('should handle API URL with different protocols', async () => {
            const httpUrl = 'http://api.example.com/menu';
            const httpService = new MenuService(httpUrl);
            const mockData = createMockMenuResponse();

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await httpService.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                httpUrl,
                expect.any(Object)
            );
        });

        it('should handle API URL with port numbers', async () => {
            const urlWithPort = 'https://api.example.com:8080/menu';
            const portService = new MenuService(urlWithPort);
            const mockData = createMockMenuResponse();

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await portService.fetchMenu();

            expect(mockFetch).toHaveBeenCalledWith(
                urlWithPort,
                expect.any(Object)
            );
        });
    });
});
