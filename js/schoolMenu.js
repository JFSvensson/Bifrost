import { MenuService } from './menuService.js';
import { isToday } from './dateHelpers.js';

class SchoolMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.menuService = new MenuService();
    }

    connectedCallback() {
        this.loadMenu();
    }

    async loadMenu() {
        this.render('loading');

        try {
            const data = await this.menuService.fetchMenu();
            this.render('menu', data);
        } catch (error) {
            console.error('Menu load failed:', error);
            this.render('error');
        }
    }

    render(state, data = null) {
        this.shadowRoot.innerHTML = this.getHTML(state, data);
    }

    getHTML(state, data) {
        const styles = this.getStyles();

        switch (state) {
            case 'loading':
                return `${styles}<div class="message">Laddar skolmat...</div>`;
            case 'error':
                return `${styles}<div class="message error">Kunde inte hämta skolmaten</div>`;
            case 'menu':
                return `${styles}${this.getMenuHTML(data)}`;
            default:
                return `${styles}<div class="message error">Okänt fel</div>`;
        }
    }

    getMenuHTML(data) {
        const items = data.days.map((day, index) => {
            const todayClass = isToday(day.dayName, index, data) ? 'today' : '';
            const meals = this.formatMeals(day.meals);

            return `
                <li class="day ${todayClass}">
                    <strong>${day.dayName || 'Okänd dag'}:</strong>
                    <span>${meals}</span>
                </li>
            `;
        }).join('');

        return `
            <div class="menu">
                <h2>Skolmat denna vecka</h2>
                <ul>${items}</ul>
            </div>
        `;
    }

    formatMeals(meals) {
        if (!Array.isArray(meals) || meals.length === 0) {
            return 'Ingen information';
        }

        return meals
            .map(meal => meal.name)
            .filter(name => name?.trim())
            .join(', ') || 'Ingen information';
    }

    getStyles() {
        return `
            <style>
                :host { display: block; font-family: inherit; }
                .menu { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .menu h2 { margin: 0 0 1rem 0; color: #333; }
                .menu ul { list-style: none; padding: 0; margin: 0; }
                .day { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
                .day:last-child { border-bottom: none; }
                .day strong { margin-right: 0.5rem; }
                .today { color: #d00; font-weight: bold; }
                .message { padding: 1rem; text-align: center; color: #666; font-style: italic; }
                .error { color: #d00; }
            </style>
        `;
    }
}

customElements.define('school-menu', SchoolMenu);