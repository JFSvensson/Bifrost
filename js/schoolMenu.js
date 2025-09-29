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

    // Helper: normalize to local date (midnight)
    toLocalDate(dLike) {
        const d = new Date(dLike);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // Helper: get today's index within the returned week (or -1 if out of range)
    getTodayIndex(data) {
        if (!data?.startDate || !Array.isArray(data.days)) return -1;
        const start = this.toLocalDate(data.startDate);
        const today = this.toLocalDate(new Date());
        const diff = Math.floor((today - start) / 86400000);
        return diff >= 0 && diff < data.days.length ? diff : -1;
    }

    // Fallback if startDate saknas
    isTodayByName(dayName) {
        const todayName = new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
        return (dayName || '').toLowerCase() === todayName.toLowerCase();
    }

    renderMenu(data) {
        if (!data || !Array.isArray(data.days)) {
            this.renderError();
            return;
        }

        const todayIndex = this.getTodayIndex(data);

        let html = `
            <style>
                :host { display: block; }
                ul { padding-left: 1em; margin: 0; }
                li.today { color: #d00; font-weight: 600; }
            </style>
            <h2>Skolmat denna vecka</h2>
            <ul>
        `;

        data.days.forEach((day, idx) => {
            const dayName = day.dayName || '';
            const meals = Array.isArray(day.meals) ? day.meals : [];
            const isToday = (todayIndex === idx) || (todayIndex === -1 && this.isTodayByName(dayName));

            html += `<li class="${isToday ? 'today' : ''}"><strong>${dayName}:</strong> `;
            html += meals.length ? meals.map(m => m.name).join(', ') : 'Ingen information';
            html += `</li>`;
        });

        html += `</ul>`;
        this.shadowRoot.innerHTML = html;
    }
}

customElements.define('school-menu', SchoolMenu);