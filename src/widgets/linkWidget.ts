import eventBus from '../core/eventBus.js';
import linkService from '../services/linkService.js';

/**
 * Web Component for displaying quick links
 * Uses Shadow DOM for style isolation
 */
class LinkWidget extends HTMLElement {
    shadowRoot!: ShadowRoot;
    links: any[];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.links = [];
    }

    /**
     * Called when element is added to DOM
     */
    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }

    /**
     * Setup event listeners for link changes
     * @private
     */
    _setupEventListeners() {
        eventBus.on('links:loaded', (links) => {
            this.links = links;
            this.render();
        });

        eventBus.on('links:added', () => {
            this.links = linkService.getLinks();
            this.render();
        });

        eventBus.on('links:removed', () => {
            this.links = linkService.getLinks();
            this.render();
        });

        eventBus.on('links:updated', () => {
            this.links = linkService.getLinks();
            this.render();
        });

        eventBus.on('theme:changed', () => {
            this.render();
        });
    }

    /**
     * Render the widget
     */
    render() {
        this.links = linkService.getLinks();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                li {
                    margin: 0.5rem 0;
                }

                a {
                    color: var(--link-color, #3498db);
                    text-decoration: none;
                    display: block;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }

                a:hover {
                    background-color: var(--hover-bg, rgba(52, 152, 219, 0.1));
                    text-decoration: underline;
                }

                .empty-state {
                    color: var(--text-secondary, #666);
                    font-style: italic;
                    padding: 1rem;
                    text-align: center;
                }
            </style>

            ${this.links.length > 0 ? `
                <ul>
                    ${this.links.map(link => `
                        <li>
                            <a href="${this._escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="Öppna ${this._escapeHtml(link.name)} i ny flik">
                                ${this._escapeHtml(link.name)}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            ` : `
                <div class="empty-state">
                    Inga länkar tillgängliga
                </div>
            `}
        `;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Register the custom element
customElements.define('link-widget', LinkWidget);
