/**
 * Service for handling school menu data from the Matilda platform
 */
class SchoolMenuService {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:8787/api/school-menu';
        this.timeout = options.timeout || 8000;
        this.cache = new Map();
        this.cacheTimeout = options.cacheTimeout || 900000; // 15 minutes
    }

    /**
     * Fetch menu data from the API
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Menu data
     */
    async fetchMenuData(options = {}) {
        const cacheKey = this.getCacheKey(options);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const data = await this.performRequest(options);
            const validatedData = this.validateMenuData(data);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: validatedData,
                timestamp: Date.now()
            });
            
            return validatedData;
        } catch (error) {
            throw new SchoolMenuError(`Failed to fetch menu data: ${error.message}`, 'FETCH_ERROR', error);
        }
    }

    /**
     * Perform the actual HTTP request
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async performRequest(options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const url = this.buildRequestUrl(options);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(`Unexpected content-type: ${contentType}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Build request URL with parameters
     * @param {Object} options - Request options
     * @returns {string} Complete URL
     */
    buildRequestUrl(options = {}) {
        const url = new URL(this.apiUrl);
        
        if (options.id) {
            url.searchParams.set('id', options.id);
        }
        if (options.startDate) {
            url.searchParams.set('startDate', options.startDate);
        }
        if (options.endDate) {
            url.searchParams.set('endDate', options.endDate);
        }
        
        return url.toString();
    }

    /**
     * Validate menu data structure
     * @param {Object} data - Raw menu data
     * @returns {Object} Validated menu data
     */
    validateMenuData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: expected object');
        }

        if (!Array.isArray(data.days)) {
            throw new Error('Invalid data format: missing or invalid days array');
        }

        // Validate each day
        const validatedDays = data.days.map((day, index) => {
            if (!day || typeof day !== 'object') {
                throw new Error(`Invalid day data at index ${index}`);
            }

            return {
                dayName: String(day.dayName || '').trim() || `Dag ${index + 1}`,
                meals: this.validateMeals(day.meals || [])
            };
        });

        return {
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            days: validatedDays,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Validate meals array
     * @param {Array} meals - Raw meals data
     * @returns {Array} Validated meals
     */
    validateMeals(meals) {
        if (!Array.isArray(meals)) {
            return [];
        }

        return meals
            .filter(meal => meal && typeof meal === 'object' && meal.name)
            .map(meal => ({
                name: String(meal.name).trim(),
                description: meal.description ? String(meal.description).trim() : null,
                allergens: Array.isArray(meal.allergens) ? meal.allergens : [],
                tags: Array.isArray(meal.tags) ? meal.tags : []
            }))
            .filter(meal => meal.name.length > 0);
    }

    /**
     * Generate cache key for request options
     * @param {Object} options - Request options
     * @returns {string} Cache key
     */
    getCacheKey(options = {}) {
        const params = [
            options.id || 'default',
            options.startDate || '',
            options.endDate || ''
        ];
        return params.join('|');
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Health check for the service
     * @returns {Promise<boolean>} Service health status
     */
    async healthCheck() {
        try {
            const healthUrl = this.apiUrl.replace('/api/school-menu', '/health');
            const response = await fetch(healthUrl, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Custom error class for school menu service errors
 */
class SchoolMenuError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
        super(message);
        this.name = 'SchoolMenuError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

export { SchoolMenuService, SchoolMenuError };