import { weather as weatherConfig } from './config.js';
import errorHandler, { ErrorCode } from './errorHandler.js';

/**
 * Weather service using SMHI API
 * Free, no API key required
 */
export class WeatherService {
    /**
     * Create weather service
     */
    constructor() {
        // Use config values with fallbacks
        this.latitude = weatherConfig.location.latitude;
        this.longitude = weatherConfig.location.longitude;
        this.locationName = weatherConfig.location.name;
        this.timeout = 8000;
        this.updateInterval = weatherConfig.updateInterval;
    }

    /**
     * Get current weather data from SMHI
     * @returns {Promise<Object>} Weather data
     * @property {Object} current - Current weather
     * @property {Array<Object>} forecast - Today's forecast
     * @property {string} location - Location name
     * @property {Date} lastUpdated - Last update time
     */
    async getCurrentWeather() {
        try {
            // SMHI Weather API endpoint
            const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${this.longitude}/lat/${this.latitude}/data.json`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                const response = await fetch(url, {
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                return this.parseWeatherData(data);
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Fetching weather data',
                showToast: false
            });
            throw new Error('Kunde inte hämta väderdata');
        }
    }

    /**
     * Parse SMHI API response
     * @param {Object} data - SMHI API response
     * @returns {Object} Parsed weather data
     * @private
     */
    parseWeatherData(data) {
        if (!data.timeSeries || data.timeSeries.length === 0) {
            throw new Error('Ingen väderdata tillgänglig');
        }

        const now = new Date();
        const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

        // Find current weather (closest to current hour)
        const current = data.timeSeries.find(ts => {
            const tsDate = new Date(ts.validTime);
            return tsDate >= currentHour;
        }) || data.timeSeries[0];

        // Get today's forecast (next 24 hours)
        const endOfDay = new Date(currentHour);
        endOfDay.setHours(23, 59, 59);

        const todayForecast = data.timeSeries.filter(ts => {
            const tsDate = new Date(ts.validTime);
            return tsDate <= endOfDay;
        });

        return {
            current: this.parseTimeSeriesEntry(current),
            forecast: todayForecast.map(ts => this.parseTimeSeriesEntry(ts)),
            location: this.locationName,
            lastUpdated: new Date()
        };
    }

    /**
     * Parse single time series entry
     * @param {Object} entry - Time series entry
     * @returns {Object} Parsed weather parameters
     * @private
     */
    parseTimeSeriesEntry(entry) {
        const params = entry.parameters;

        return {
            time: new Date(entry.validTime),
            temperature: this.getParameter(params, 't'), // Temperature (°C)
            humidity: this.getParameter(params, 'r'), // Relative humidity (%)
            windSpeed: this.getParameter(params, 'ws'), // Wind speed (m/s)
            precipitation: this.getParameter(params, 'pmin'), // Precipitation (mm/h)
            precipitationCategory: this.getParameter(params, 'pcat'), // Precipitation category (0-6)
            precipitationMedian: this.getParameter(params, 'pmedian'), // Precipitation median (mm/h)
            cloudiness: this.getParameter(params, 'tcc_mean'), // Cloud cover (0-8)
            weatherSymbol: this.getParameter(params, 'Wsymb2') // Weather symbol
        };
    }

    /**
     * Extract parameter value from SMHI data
     * @param {Array<Object>} params - Parameters array
     * @param {string} name - Parameter name
     * @returns {number|null} Parameter value
     * @private
     */
    getParameter(params, name) {
        const param = params.find(p => p.name === name);
        return param ? param.values[0] : null;
    }

    /**
     * Get precipitation probability from category
     * @param {number} category - SMHI precipitation category (0-6)
     * @returns {number} Probability percentage
     */
    getPrecipitationProbability(category) {
        // SMHI precipitation category to probability mapping
        const probabilities = {
            0: 0, // No precipitation
            1: 10, // Very light precipitation
            2: 25, // Light precipitation
            3: 50, // Moderate precipitation
            4: 75, // Heavy precipitation
            5: 90, // Very heavy precipitation
            6: 95 // Extreme precipitation
        };

        return probabilities[category] || 0;
    }

    /**
     * Get emoji icon for weather symbol code
     * @param {number} symbolCode - SMHI weather symbol code
     * @returns {string} Weather emoji
     */
    getWeatherIcon(symbolCode) {
        const icons = {
            1: '☀️', // Clear sky
            2: '🌤️', // Nearly clear sky
            3: '⛅', // Variable cloudiness
            4: '☁️', // Halfclear sky
            5: '☁️', // Cloudy sky
            6: '☁️', // Overcast
            7: '🌫️', // Fog
            8: '🌦️', // Light rain showers
            9: '🌧️', // Moderate rain showers
            10: '🌧️', // Heavy rain showers
            11: '⛈️', // Thunderstorm
            12: '🌨️', // Light sleet showers
            13: '🌨️', // Moderate sleet showers
            14: '🌨️', // Heavy sleet showers
            15: '❄️', // Light snow showers
            16: '❄️', // Moderate snow showers
            17: '❄️', // Heavy snow showers
            18: '🌧️', // Light rain
            19: '🌧️', // Moderate rain
            20: '🌧️', // Heavy rain
            21: '⛈️', // Thunder
            22: '🌨️', // Light sleet
            23: '🌨️', // Moderate sleet
            24: '🌨️', // Heavy sleet
            25: '❄️', // Light snowfall
            26: '❄️', // Moderate snowfall
            27: '❄️' // Heavy snowfall
        };

        return icons[symbolCode] || '🌡️';
    }

    /**
     * Set location for weather data
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} [name=null] - Location name
     */
    setLocation(lat, lon, name = null) {
        this.latitude = lat;
        this.longitude = lon;
        if (name) {
            this.locationName = name;
        }
    }

    /**
     * Get current location settings
     * @returns {Object} Location data
     * @property {number} latitude - Latitude
     * @property {number} longitude - Longitude
     * @property {string} name - Location name
     */
    getLocation() {
        return {
            latitude: this.latitude,
            longitude: this.longitude,
            name: this.locationName
        };
    }
}