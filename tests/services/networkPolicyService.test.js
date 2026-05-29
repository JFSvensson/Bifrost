import { describe, it, expect, vi, beforeEach } from 'vitest';

const originalLocation = window.location;

describe('networkPolicyService', () => {
    beforeEach(() => {
        vi.resetModules();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                origin: 'http://localhost:3000'
            }
        });
    });

    it('defaults to online mode', async () => {
        const { networkPolicyService } = await import('../../src/services/networkPolicyService.ts');

        expect(networkPolicyService.getMode()).toBe('online');
        expect(networkPolicyService.isNoNetworkMode()).toBe(false);
    });

    it('allows external network requests in online mode', async () => {
        const { networkPolicyService } = await import('../../src/services/networkPolicyService.ts');

        expect(networkPolicyService.isNetworkAllowed('https://example.com/api')).toBe(true);
    });

    it('recognizes enabled integrations from config', async () => {
        const { networkPolicyService } = await import('../../src/services/networkPolicyService.ts');

        expect(networkPolicyService.isIntegrationEnabled('weather')).toBe(true);
        expect(networkPolicyService.shouldInitIntegration('googleCalendar')).toBe(true);
    });

    it('classifies localhost and same-origin as local requests', async () => {
        const { networkPolicyService } = await import('../../src/services/networkPolicyService.ts');

        expect(networkPolicyService.isLocalRequest('/api/school-menu')).toBe(true);
        expect(networkPolicyService.isLocalRequest('http://localhost:8787/api/school-menu')).toBe(true);
        expect(networkPolicyService.isLocalRequest('http://127.0.0.1:8081/obsidian/todos')).toBe(true);
    });

    it('classifies non-local origin as external', async () => {
        const { networkPolicyService } = await import('../../src/services/networkPolicyService.ts');

        expect(networkPolicyService.isLocalRequest('https://www.googleapis.com/calendar/v3')).toBe(false);
    });
});

afterAll(() => {
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation
    });
});
