import { schoolMenu } from './config.js';
import errorHandler, { ErrorCode } from './errorHandler.js';

/**
 * Simple service for school menu API calls
 */
export class MenuService {
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
    validateData(data) {
        if (!data?.days?.length) {
            throw new Error('Invalid menu data');
        }
        return data;
    }
}