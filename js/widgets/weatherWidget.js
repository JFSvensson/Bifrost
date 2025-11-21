import { WeatherService } from '../services/weatherService.js';
import { weather as weatherConfig } from '../config/config.js';
import { logger } from '../utils/logger.js';

class WeatherWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.weatherService = new WeatherService();
        this.updateInterval = weatherConfig.updateInterval;
        this.intervalId = null;
    }

    connectedCallback() {
        this.loadWeather();
        this.startAutoUpdate();
    }

    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    async loadWeather() {
        this.render('loading');

        try {
            const data = await this.weatherService.getCurrentWeather();
            this.render('weather', data);
        } catch (error) {
            logger.error('Weather load failed', error);
            this.render('error', error.message);
        }
    }

    startAutoUpdate() {
        this.intervalId = setInterval(() => {
            this.loadWeather();
        }, this.updateInterval);
    }

    render(state, data = null) {
        this.shadowRoot.innerHTML = this.getHTML(state, data);
    }

    getHTML(state, data) {
        const styles = this.getStyles();

        switch (state) {
            case 'loading':
                return `${styles}<div class="message">Laddar väder...</div>`;
            case 'error':
                return `${styles}<div class="message error">${data}</div>`;
            case 'weather':
                return `${styles}${this.getWeatherHTML(data)}`;
            default:
                return `${styles}<div class="message error">Okänt fel</div>`;
        }
    }

    getWeatherHTML(data) {
        const current = data.current;
        const icon = this.weatherService.getWeatherIcon(current.weatherSymbol);
        const temp = Math.round(current.temperature);
        const humidity = Math.round(current.humidity);
        const wind = Math.round(current.windSpeed);
        const precipProbability = this.weatherService.getPrecipitationProbability(current.precipitationCategory);

        // Get next few hours for mini forecast
        const nextHours = data.forecast.slice(1, 6);
        const hourlyForecast = nextHours.map(hour => {
            const time = hour.time.getHours().toString().padStart(2, '0');
            const hourTemp = Math.round(hour.temperature);
            const hourIcon = this.weatherService.getWeatherIcon(hour.weatherSymbol);
            const hourPrecip = this.weatherService.getPrecipitationProbability(hour.precipitationCategory);

            return `
                <div class="hour-forecast">
                    <div class="hour-time">${time}:00</div>
                    <div class="hour-icon">${hourIcon}</div>
                    <div class="hour-temp">${hourTemp}°</div>
                    ${hourPrecip > 0 ? `<div class="hour-precip">${hourPrecip}%</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="weather-widget">
                <div class="current-weather">
                    <div class="weather-main">
                        <div class="weather-icon">${icon}</div>
                        <div class="weather-info">
                            <div class="temperature">${temp}°C</div>
                            <div class="location">${data.location}</div>
                        </div>
                    </div>
                    
                    <div class="weather-details">
                        <div class="detail">
                            <span class="detail-label">Luftfuktighet:</span>
                            <span class="detail-value">${humidity}%</span>
                        </div>
                        <div class="detail">
                            <span class="detail-label">Vind:</span>
                            <span class="detail-value">${wind} m/s</span>
                        </div>
                        ${precipProbability > 0 ? `
                        <div class="detail">
                            <span class="detail-label">Nederbörd:</span>
                            <span class="detail-value">${precipProbability}%</span>
                        </div>
                        ` : ''}
                        ${current.precipitation > 0 ? `
                        <div class="detail">
                            <span class="detail-label">Mängd:</span>
                            <span class="detail-value">${current.precipitation} mm/h</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="hourly-forecast">
                    <h4>Kommande timmar</h4>
                    <div class="forecast-hours">
                        ${hourlyForecast}
                    </div>
                </div>
                
                <div class="last-updated">
                    Uppdaterat: ${data.lastUpdated.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    })}
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    font-family: inherit;
                }
                
                .weather-widget {
                    padding: 0;
                }
                
                .current-weather {
                    margin-bottom: 1rem;
                }
                
                .weather-main {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                
                .weather-icon {
                    font-size: 3rem;
                    line-height: 1;
                }
                
                .weather-info {
                    flex: 1;
                }
                
                .temperature {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2c3e50;
                    line-height: 1;
                }
                
                .location {
                    color: #666;
                    font-size: 0.9rem;
                    margin-top: 0.25rem;
                }
                
                .weather-details {
                    display: grid;
                    gap: 0.5rem;
                }
                
                .detail {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }
                
                .detail-label {
                    color: #666;
                }
                
                .detail-value {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .hourly-forecast {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #eee;
                }
                
                .hourly-forecast h4 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.9rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .forecast-hours {
                    display: flex;
                    gap: 1rem;
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                }
                
                .hour-forecast {
                    flex: 0 0 auto;
                    text-align: center;
                    font-size: 0.8rem;
                }
                
                .hour-time {
                    color: #666;
                    margin-bottom: 0.25rem;
                }
                
                .hour-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                }
                
                .hour-temp {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .hour-precip {
                    font-size: 0.7rem;
                    color: #3498db;
                    margin-top: 0.1rem;
                }
                
                .last-updated {
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid #eee;
                    font-size: 0.8rem;
                    color: #888;
                    text-align: center;
                }
                
                .message {
                    padding: 1rem;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }
                
                .error {
                    color: #d00;
                }
                
                @media (max-width: 480px) {
                    .weather-main {
                        flex-direction: column;
                        text-align: center;
                        gap: 0.5rem;
                    }
                    
                    .forecast-hours {
                        gap: 0.5rem;
                    }
                    
                    .hour-forecast {
                        font-size: 0.75rem;
                    }
                }
            </style>
        `;
    }
}

customElements.define('weather-widget', WeatherWidget);