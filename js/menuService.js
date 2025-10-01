/**
 * Simple service for school menu API calls
 */
export class MenuService {
    constructor(apiUrl = 'http://localhost:8787/api/school-menu') {
        this.apiUrl = apiUrl;
        this.timeout = 8000;
    }

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
        } finally {
            clearTimeout(timeoutId);
        }
    }

    validateData(data) {
        if (!data?.days?.length) {
            throw new Error('Invalid menu data');
        }
        return data;
    }
}