import { BaseComponent } from './BaseComponent.js';
import { SchoolMenuService } from './SchoolMenuService.js';
import { DateUtils } from '../utils/dateUtils.js';
import { DomUtils } from '../utils/domUtils.js';
import { schoolMenuStyles } from '../styles/schoolMenu.css.js';

/**
 * School Menu Web Component
 * Displays weekly school menu with today highlighted
 */
class SchoolMenu extends BaseComponent {
    constructor() {
        super();
        
        // Initialize service
        this.menuService = new SchoolMenuService({
            apiUrl: 'http://localhost:8787/api/school-menu',
            timeout: 8000,
            cacheTimeout: 900000 // 15 minutes
        });

        // Initialize state
        this.setState({
            status: 'idle', // idle, loading, loaded, error
            menuData: null,
            error: null,
            lastUpdated: null
        });

        // Bind methods
        this.loadMenu = this.loadMenu.bind(this);
        this.handleRetry = this.handleRetry.bind(this);
    }

    /**
     * Component lifecycle - called when connected to DOM
     */
    onConnected() {
        this.injectStyles(schoolMenuStyles);
        this.setState({ status: 'loading' });
        this.loadMenu();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
    }

    /**
     * Component lifecycle - called when disconnected from DOM
     */
    onDisconnected() {
        this.cleanup();
        this.clearAutoRefresh();
    }

    /**
     * Set up automatic refresh every 15 minutes
     */
    setupAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            if (this.getState().status !== 'loading') {
                this.refreshMenu();
            }
        }, 15 * 60 * 1000); // 15 minutes
    }

    /**
     * Clear auto-refresh interval
     */
    clearAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    /**
     * Load menu data from service
     */
    async loadMenu() {
        try {
            this.setState({ status: 'loading', error: null });
            
            const menuData = await this.menuService.fetchMenuData();
            
            this.setState({
                status: 'loaded',
                menuData: menuData,
                lastUpdated: new Date().toISOString()
            });
            
            this.emit('menuLoaded', menuData);
        } catch (error) {
            console.error('SchoolMenu load failed:', error);
            
            this.setState({
                status: 'error',
                error: error.message || 'Kunde inte hämta skolmaten'
            });
            
            this.emit('menuError', error);
        }
    }

    /**
     * Refresh menu data (force reload)
     */
    async refreshMenu() {
        this.menuService.clearCache();
        await this.loadMenu();
    }

    /**
     * Handle retry button click
     */
    handleRetry() {
        this.refreshMenu();
    }

    /**
     * Render component based on current state
     */
    render() {
        const { status, menuData, error } = this.getState();
        
        switch (status) {
            case 'loading':
                this.shadowRoot.innerHTML = this.getLoadingTemplate();
                break;
                
            case 'loaded':
                this.shadowRoot.innerHTML = this.getMenuTemplate(menuData);
                this.attachEventListeners();
                break;
                
            case 'error':
                this.shadowRoot.innerHTML = this.getErrorTemplate(error);
                this.attachEventListeners();
                break;
                
            default:
                this.shadowRoot.innerHTML = this.getLoadingTemplate();
        }
    }

    /**
     * Get loading state template
     */
    getLoadingTemplate() {
        return `
            <div class="menu-container">
                <div class="loading">Laddar skolmat...</div>
            </div>
        `;
    }

    /**
     * Get error state template
     */
    getErrorTemplate(error) {
        return `
            <div class="menu-container">
                <div class="error">
                    ${DomUtils.escapeHtml(error)}
                    <br><br>
                    <button class="retry-button" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.875rem;
                    ">
                        Försök igen
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get menu template with data
     */
    getMenuTemplate(menuData) {
        if (!this.isValidMenuData(menuData)) {
            return this.getErrorTemplate('Ogiltig menydata');
        }

        const menuItems = menuData.days
            .map((day, index) => this.getMenuItemTemplate(day, index, menuData))
            .join('');

        const dateRange = this.getDateRangeText(menuData);

        return `
            <div class="menu-container">
                <h2 class="menu-title">Skolmat denna vecka</h2>
                <ul class="menu-list">
                    ${menuItems}
                </ul>
                ${dateRange ? `<div class="menu-meta">${dateRange}</div>` : ''}
            </div>
        `;
    }

    /**
     * Get individual menu item template
     */
    getMenuItemTemplate(day, index, menuData) {
        const dayName = DomUtils.escapeHtml(day.dayName || 'Okänd dag');
        const meals = this.formatMeals(day.meals);
        const isToday = this.isDayToday(day, index, menuData);
        const todayClass = isToday ? 'today' : '';

        return `
            <li class="menu-item ${todayClass}">
                <span class="day-name">${dayName}:</span>
                <span class="meals">${meals}</span>
            </li>
        `;
    }

    /**
     * Get date range text for display
     */
    getDateRangeText(menuData) {
        if (menuData.startDate && menuData.endDate) {
            return DateUtils.formatDateRange(menuData.startDate, menuData.endDate);
        }
        return '';
    }

    /**
     * Attach event listeners after render
     */
    attachEventListeners() {
        const retryButton = this.$('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', this.handleRetry);
        }
    }

    /**
     * Check if menu data is valid
     */
    isValidMenuData(data) {
        return data && Array.isArray(data.days) && data.days.length > 0;
    }

    /**
     * Format meals array for display
     */
    formatMeals(meals) {
        if (!Array.isArray(meals) || meals.length === 0) {
            return 'Ingen information';
        }
        
        const mealNames = meals
            .map(meal => meal.name)
            .filter(name => name && name.trim())
            .map(name => DomUtils.escapeHtml(name.trim()));

        return mealNames.length > 0 ? mealNames.join(', ') : 'Ingen information';
    }

    /**
     * Check if a day is today
     */
    isDayToday(day, dayIndex, menuData) {
        const todayByDate = DateUtils.getTodayIndex(menuData.startDate, menuData.days.length);
        
        if (todayByDate !== -1) {
            return todayByDate === dayIndex;
        }
        
        return DateUtils.isTodayByName(day.dayName);
    }

    /**
     * Public API: Refresh menu data
     */
    refresh() {
        return this.refreshMenu();
    }

    /**
     * Public API: Get current menu data
     */
    getMenuData() {
        return this.getState().menuData;
    }

    /**
     * Public API: Get service health status
     */
    async getHealthStatus() {
        return await this.menuService.healthCheck();
    }
}

// Define the custom element
customElements.define('school-menu', SchoolMenu);

export { SchoolMenu };