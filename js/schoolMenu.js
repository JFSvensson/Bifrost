class SchoolMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.renderLoading();
        this.loadMenu();
    }

    async loadMenu() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('http://localhost:8787/api/school-menu', {
                signal: controller.signal
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error(`Unexpected content-type: ${ct}`);

            const data = await res.json();
            this.renderMenu(data);
        } catch (e) {
            console.error('SchoolMenu fetch failed:', e);
            this.renderError();
        } finally {
            clearTimeout(timeout);
        }
    }

    renderLoading() {
        this.shadowRoot.innerHTML = `<div>Laddar skolmat...</div>`;
    }

    renderError() {
        this.shadowRoot.innerHTML = `<div>Kunde inte hämta skolmaten.</div>`;
    }

    renderMenu(data) {
        if (!data || !Array.isArray(data.days)) {
            this.renderError();
            return;
        }
        let html = `<h2>Skolmat denna vecka</h2><ul>`;
        data.days.forEach(day => {
            const dayName = day.dayName || '';
            const meals = Array.isArray(day.meals) ? day.meals : [];
            html += `<li><strong>${dayName}:</strong> `;
            if (meals.length) {
                html += meals.map(meal => meal.name).join(', ');
            } else {
                html += 'Ingen information';
            }
            html += `</li>`;
        });
        html += `</ul>`;
        this.shadowRoot.innerHTML = html;
    }
}

customElements.define('school-menu', SchoolMenu);