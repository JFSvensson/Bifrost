import { beforeEach, describe, expect, it, vi } from 'vitest';

const importWithConfig = async (configOverride, importer) => {
    vi.resetModules();
    vi.doMock('../../src/config/config.js', () => ({
        appMode: {
            network: configOverride?.appMode?.network ?? 'online',
            allowLocalhost: configOverride?.appMode?.allowLocalhost ?? true
        },
        integrations: {
            schoolMenu: configOverride?.integrations?.schoolMenu ?? true,
            weather: configOverride?.integrations?.weather ?? true,
            googleCalendar: configOverride?.integrations?.googleCalendar ?? true,
            obsidian: configOverride?.integrations?.obsidian ?? true
        },
        schoolMenu: {
            apiUrl: 'http://localhost:8787/api/school-menu',
            timeout: 1000,
            fallbackData: {
                days: [{ dayName: 'Mondag', meals: [{ name: 'Fallback' }] }]
            }
        },
        weather: {
            location: { latitude: 56.594, longitude: 16.1536, name: 'Vassmolosa' },
            updateInterval: 1000
        },
        todos: {
            obsidian: {
                bridgeUrl: 'http://localhost:8081/obsidian/todos',
                updateInterval: 30000,
                showSource: true,
                priorityColors: { high: '#f00', medium: '#ff0', normal: '#0af', low: '#999' }
            }
        }
    }));

    return importer();
};

describe('Phase 1B network enforcement', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it('returns menu fallback when schoolMenu integration is disabled', async () => {
        const { MenuService } = await importWithConfig(
            { integrations: { schoolMenu: false } },
            () => import('../../src/services/menuService.ts')
        );

        const service = new MenuService();
        const result = await service.fetchMenu();

        expect(result.days.length).toBeGreaterThan(0);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns weather fallback when external network is blocked in no-network mode', async () => {
        const { WeatherService } = await importWithConfig(
            { appMode: { network: 'no-network', allowLocalhost: true } },
            () => import('../../src/services/weatherService.ts')
        );

        const service = new WeatherService();
        const result = await service.getCurrentWeather();

        expect(result.fallback).toBe(true);
        expect(result.location).toBe('Vassmolosa');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('keeps obsidian sync local-only when integration is disabled', async () => {
        const { ObsidianTodoService } = await importWithConfig(
            { integrations: { obsidian: false } },
            () => import('../../src/services/obsidianTodoService.ts')
        );

        const service = new ObsidianTodoService();
        const todos = await service.syncWithLocal();

        expect(Array.isArray(todos)).toBe(true);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
