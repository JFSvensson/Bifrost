import { appMode, integrations } from '../config/config.js';

export type NetworkMode = 'online' | 'no-network';
export type IntegrationKey = 'schoolMenu' | 'weather' | 'googleCalendar' | 'obsidian';

interface NetworkPolicyState {
    mode: NetworkMode;
    allowLocalhost: boolean;
    integrations: Record<IntegrationKey, boolean>;
}

class NetworkPolicyService {
    private readonly state: NetworkPolicyState;

    constructor() {
        this.state = {
            mode: this.resolveMode(appMode.network),
            allowLocalhost: Boolean(appMode.allowLocalhost),
            integrations: {
                schoolMenu: Boolean(integrations.schoolMenu),
                weather: Boolean(integrations.weather),
                googleCalendar: Boolean(integrations.googleCalendar),
                obsidian: Boolean(integrations.obsidian)
            }
        };
    }

    getMode(): NetworkMode {
        return this.state.mode;
    }

    isNoNetworkMode(): boolean {
        return this.state.mode === 'no-network';
    }

    isIntegrationEnabled(integration: IntegrationKey): boolean {
        return this.state.integrations[integration];
    }

    shouldInitIntegration(integration: IntegrationKey): boolean {
        return this.isIntegrationEnabled(integration);
    }

    isNetworkAllowed(url?: string): boolean {
        if (!this.isNoNetworkMode()) {
            return true;
        }

        if (!url) {
            return false;
        }

        return this.isLocalRequest(url);
    }

    isExternalUrlAllowed(url: string): boolean {
        return this.isNetworkAllowed(url) && !this.isLocalRequest(url);
    }

    isLocalRequest(url: string): boolean {
        try {
            const parsed = new URL(url, window.location.origin);
            const hostname = parsed.hostname;
            const isSameOrigin = parsed.origin === window.location.origin;
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

            if (!this.state.allowLocalhost) {
                return isSameOrigin;
            }

            return isSameOrigin || isLocalhost;
        } catch {
            return false;
        }
    }

    private resolveMode(value: string): NetworkMode {
        return value === 'no-network' ? 'no-network' : 'online';
    }
}

export const networkPolicyService = new NetworkPolicyService();
