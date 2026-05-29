import { schoolMenu } from '../config/config.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { networkPolicyService } from './networkPolicyService.js';

/**
 * Simple service for school menu API calls
 */
export class MenuService {
    apiUrl: string;
    timeout: number;

    /**
     * Create menu service
     * @param {string} [apiUrl] - Override API URL from config
     */
    constructor(apiUrl = schoolMenu.apiUrl) {
        this.apiUrl = apiUrl;
        this.timeout = schoolMenu.timeout;
    }

    /**
     * Fetch menu data from API
     * @returns {Promise<Object>} Menu data
     * @throws {Error} If fetch fails or data is invalid
     */
    async fetchMenu() {
        if (!networkPolicyService.shouldInitIntegration('schoolMenu')) {
            return this.getFallbackData();
        }

        if (!networkPolicyService.isNetworkAllowed(this.apiUrl)) {
            return this.getFallbackData();
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.apiUrl, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return this.validateData(data);
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Fetching school menu',
                showToast: false
            });
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Validate menu data structure
     * @param {Object} data - Menu data to validate
     * @returns {Object} Validated data
     * @throws {Error} If data is invalid
     * @private
     */
    validateData(data: { days?: unknown[] } & Record<string, unknown>) {
        if (!data?.days?.length) {
            throw new Error('Invalid menu data');
        }
        return data;
    }

    /**
     * Return deterministic fallback payload for local/no-network mode
     * @returns {Object} Fallback menu model
     * @private
     */
    getFallbackData() {
        return this.validateData(schoolMenu.fallbackData);
    }
}