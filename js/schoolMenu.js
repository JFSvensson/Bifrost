class SchoolMenu extends HTMLElement {
    static get styles() {
        return `
            :host {
                display: block;
                font-family: inherit;
            }
            
            .menu-container {
                margin: 0;
            }
            
            .menu-title {
                margin: 0 0 1rem 0;
                font-size: 1.5rem;
                color: #333;
            }
            
            .menu-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .menu-item {
                padding: 0.5rem 0;
                border-bottom: 1px solid #eee;
            }
            
            .menu-item:last-child {
                border-bottom: none;
            }
            
            .day-name {
                font-weight: 600;
                margin-right: 0.5rem;
            }
            
            .meals {
                color: #666;
            }
            
            .today .day-name {
                color: #d00;
            }
            
            .today .meals {
                color: #d00;
                font-weight: 500;
            }
            
            .loading, .error {
                padding: 1rem;
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            .error {
                color: #d00;
            }
        `;
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.apiUrl = 'http://localhost:8787/api/school-menu';
        this.timeout = 8000;
    }

    connectedCallback() {
        this.render('loading');
        this.loadMenu();
    }

    async loadMenu() {
        try {
            const data = await this.fetchMenuData();
            this.render('menu', data);
        } catch (error) {
            console.error('SchoolMenu failed:', error.message);
            this.render('error');
        }
    }

    async fetchMenuData() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.apiUrl, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
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

    render(state, data = null) {
        const template = this.getTemplate(state, data);
        this.shadowRoot.innerHTML = template;
    }

    getTemplate(state, data) {
        const styles = `<style>${SchoolMenu.styles}</style>`;
        
        switch (state) {
            case 'loading':
                return `${styles}<div class="loading">Laddar skolmat...</div>`;
            
            case 'error':
                return `${styles}<div class="error">Kunde inte hämta skolmaten.</div>`;
            
            case 'menu':
                return `${styles}${this.getMenuTemplate(data)}`;
            
            default:
                return `${styles}<div class="error">Okänt tillstånd</div>`;
        }
    }

    getMenuTemplate(data) {
        if (!this.isValidMenuData(data)) {
            return '<div class="error">Ogiltig menydata</div>';
        }

        const menuItems = data.days
            .map((day, index) => this.getMenuItemTemplate(day, index, data))
            .join('');

        return `
            <div class="menu-container">
                <h2 class="menu-title">Skolmat denna vecka</h2>
                <ul class="menu-list">
                    ${menuItems}
                </ul>
            </div>
        `;
    }

    getMenuItemTemplate(day, index, menuData) {
        const dayName = day.dayName || 'Okänd dag';
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

    isValidMenuData(data) {
        return data && Array.isArray(data.days) && data.days.length > 0;
    }

    formatMeals(meals) {
        if (!Array.isArray(meals) || meals.length === 0) {
            return 'Ingen information';
        }
        
        return meals
            .map(meal => meal.name)
            .filter(name => name && name.trim())
            .join(', ') || 'Ingen information';
    }

    isDayToday(day, dayIndex, menuData) {
        const todayByDate = this.isTodayByDate(dayIndex, menuData);
        const todayByName = this.isTodayByName(day.dayName);
        
        return todayByDate !== -1 ? todayByDate === dayIndex : todayByName;
    }

    isTodayByDate(dayIndex, menuData) {
        if (!menuData?.startDate || !Array.isArray(menuData.days)) {
            return -1;
        }

        const startDate = this.normalizeToLocalDate(menuData.startDate);
        const today = this.normalizeToLocalDate(new Date());
        const daysDifference = this.getDaysDifference(today, startDate);

        return daysDifference >= 0 && daysDifference < menuData.days.length 
            ? daysDifference 
            : -1;
    }

    isTodayByName(dayName) {
        if (!dayName) return false;
        
        const todayName = new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
        return dayName.toLowerCase() === todayName.toLowerCase();
    }

    normalizeToLocalDate(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    getDaysDifference(date1, date2) {
        const msPerDay = 86400000; // 24 * 60 * 60 * 1000
        return Math.floor((date1 - date2) / msPerDay);
    }
}

customElements.define('school-menu', SchoolMenu);