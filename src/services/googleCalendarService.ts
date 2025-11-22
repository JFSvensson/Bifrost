/**
 * Google Calendar Service
 * Handles OAuth 2.0 authentication and Google Calendar API interactions
 */

import eventBus from '../core/eventBus.js';
import stateManager from '../core/stateManager.js';
import errorHandler, { ErrorCode } from '../core/errorHandler.js';
import { logger } from '../utils/logger.js';

export class GoogleCalendarService {
    CLIENT_ID: string | null;
    API_KEY: string | null;
    DISCOVERY_DOC: string;
    SCOPES: string;
    tokenClient: any;
    gapiInited: boolean;
    gisInited: boolean;
    accessToken: string | null;

    constructor() {
        this.CLIENT_ID = null;
        this.API_KEY = null;
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.accessToken = null;

        // Load credentials from config
        this.loadCredentials();
    }

    /**
     * Load Google API credentials from config file
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadCredentials() {
        try {
            const response = await fetch('/google-credentials.json');
            if (!response.ok) {
                errorHandler.warning(
                    'GOOGLE_CALENDAR_NO_CREDS',
                    'Google Calendar credentials not found. Please add google-credentials.json'
                );
                return false;
            }

            const credentials = await response.json();
            this.CLIENT_ID = credentials.client_id;
            this.API_KEY = credentials.api_key;

            logger.debug('Google Calendar credentials loaded');
            logger.debug('Client ID:', this.CLIENT_ID);
            logger.debug(credentials);
            return true;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.SERVICE_INIT_FAILED,
                context: 'Loading Google Calendar credentials'
            });
            return false;
        }
    }

    /**
     * Initialize Google API and OAuth
     * @throws {Error} If credentials not configured
     */
    async initialize() {
        if (!this.CLIENT_ID) {
            const loaded = await this.loadCredentials();
            if (!loaded) {
                throw new Error('Google Calendar credentials not configured');
            }
        }

        // Load Google API scripts
        await this.loadGoogleScripts();

        // Initialize GAPI (Google API Platform Library)
        await this.initializeGapi();

        // Initialize GIS (Google Identity Services)
        await this.initializeGis();

        // Check if user is already authenticated
        this.checkStoredAuth();

        logger.debug('Google Calendar Service initialized');
    }

    /**
     * Load Google API scripts dynamically
     */
    async loadGoogleScripts() {
        return Promise.all([
            this.loadScript('https://apis.google.com/js/api.js'),
            this.loadScript('https://accounts.google.com/gsi/client')
        ]);
    }

    /**
     * Load a script dynamically
     */
    loadScript(src) {
        return new Promise<void>((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize Google API Platform Library
     * @returns {Promise<void>}
     */
    async initializeGapi() {
        return new Promise<void>((resolve) => {
            // @ts-ignore - gapi is loaded dynamically
            window.gapi.load('client', async () => {
                // @ts-ignore - gapi is loaded dynamically
                await window.gapi.client.init({
                    apiKey: this.API_KEY,
                    discoveryDocs: [this.DISCOVERY_DOC]
                });
                this.gapiInited = true;
                resolve();
            });
        });
    }

    /**
     * Initialize Google Identity Services (OAuth)
     * @returns {Promise<void>}
     */
    async initializeGis() {
        return new Promise<void>((resolve) => {
            // @ts-ignore - google.accounts is loaded dynamically
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.error) {
                        errorHandler.handle(new Error(response.error), {
                            code: ErrorCode.VALIDATION_ERROR,
                            context: 'Google OAuth'
                        });
                        eventBus.emit('googleCalendar:authFailed', { error: response.error });
                        return;
                    }

                    this.accessToken = response.access_token;
                    this.saveAuthToken(response.access_token);
                    eventBus.emit('googleCalendar:authenticated', { authenticated: true });
                }
            });
            this.gisInited = true;
            resolve();
        });
    }

    /**
     * Check if user has stored authentication
     * @returns {boolean} True if restored successfully
     */
    checkStoredAuth() {
        const stored = stateManager.get('googleCalendarToken', null);
        if (stored) {
            try {
                const { token, expiry } = stored;
                if (expiry > Date.now()) {
                    this.accessToken = token;
                    // @ts-ignore - gapi is loaded dynamically
                    window.gapi.client.setToken({ access_token: token });
                    eventBus.emit('googleCalendar:authenticated', { authenticated: true });
                    logger.info('Restored Google Calendar authentication');
                    return true;
                }
            } catch (error) {
                errorHandler.handle(error, {
                    code: ErrorCode.STORAGE_ERROR,
                    context: 'Restoring Google Calendar auth'
                });
            }
        }
        return false;
    }

    /**
     * Save authentication token
     * @param {string} token - Access token
     */
    saveAuthToken(token) {
        const expiry = Date.now() + (3600 * 1000); // 1 hour
        stateManager.set('googleCalendarToken', { token, expiry });
        // @ts-ignore - gapi is loaded dynamically
        window.gapi.client.setToken({ access_token: token });
    }

    /**
     * Sign in to Google Calendar
     */
    async signIn() {
        if (!this.gisInited) {
            await this.initialize();
        }

        // Request token
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }

    /**
     * Sign out from Google Calendar
     */
    signOut() {
        if (this.accessToken) {
            // @ts-ignore - google is loaded dynamically
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                logger.debug('Token revoked');
            });
        }

        this.accessToken = null;
        stateManager.remove('googleCalendarToken');
        // @ts-ignore - gapi is loaded dynamically
        window.gapi.client.setToken(null);
        eventBus.emit('googleCalendar:signedOut', { authenticated: false });
        logger.info('Signed out from Google Calendar');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Get today's events
     * @returns {Promise<Array<Object>>} Today's calendar events
     * @throws {Error} If not authenticated
     */
    async getTodaysEvents() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        return this.getEvents(startOfDay, endOfDay);
    }

    /**
     * Get upcoming events (next N days)
     * @param {number} [days=7] - Number of days to look ahead
     * @returns {Promise<Array<Object>>} Upcoming calendar events
     * @throws {Error} If not authenticated
     */
    async getUpcomingEvents(days = 7) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const now = new Date();
        const future = new Date(now);
        future.setDate(future.getDate() + days);

        return this.getEvents(now, future);
    }

    /**
     * Get events within date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {number} [maxResults=50] - Maximum number of events
     * @returns {Promise<Array<Object>>} Calendar events
     * @throws {Error} If not authenticated or fetch fails
     */
    async getEvents(startDate, endDate, maxResults = 50) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            // @ts-ignore - gapi is loaded dynamically
            const response = await window.gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: maxResults,
                orderBy: 'startTime'
            });

            return response.result.items || [];
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Fetching Google Calendar events'
            });
            throw error;
        }
    }

    /**
     * Create a calendar event
     * @param {Object} event - Event data
     * @returns {Promise<Object>} Created event
     * @throws {Error} If not authenticated or creation fails
     */
    async createEvent(event) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            // @ts-ignore - gapi is loaded dynamically
            const response = await window.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            logger.info('Event created:', response.result);
            eventBus.emit('googleCalendar:eventCreated', { event: response.result });
            return response.result;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Creating Google Calendar event',
                showToast: true
            });
            throw error;
        }
    }

    /**
     * Update a calendar event
     * @param {string} eventId - Event ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated event
     * @throws {Error} If not authenticated or update fails
     */
    async updateEvent(eventId, updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            // First get the event
            // @ts-ignore - gapi is loaded dynamically
            const event = await window.gapi.client.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            // Merge updates
            const updatedEvent = { ...event.result, ...updates };

            // Update
            // @ts-ignore - gapi is loaded dynamically
            const response = await window.gapi.client.calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: updatedEvent
            });

            logger.info('Event updated:', response.result);
            eventBus.emit('googleCalendar:eventUpdated', { event: response.result });
            return response.result;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Updating Google Calendar event',
                showToast: true
            });
            throw error;
        }
    }

    /**
     * Delete a calendar event
     * @param {string} eventId - Event ID
     * @returns {Promise<boolean>} True if deleted
     * @throws {Error} If not authenticated or deletion fails
     */
    async deleteEvent(eventId) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            // @ts-ignore - gapi is loaded dynamically
            await window.gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });

            logger.info('Event deleted:', eventId);
            eventBus.emit('googleCalendar:eventDeleted', { eventId });
            return true;
        } catch (error) {
            errorHandler.handle(error, {
                code: ErrorCode.API_ERROR,
                context: 'Deleting Google Calendar event',
                showToast: true
            });
            throw error;
        }
    }

    /**
     * Create event from todo
     * @param {Object} todo - Todo to convert
     * @returns {Promise<Object>} Created event
     * @throws {Error} If todo missing due date
     */
    async createEventFromTodo(todo) {
        if (!todo.dueDate) {
            throw new Error('Todo must have a due date');
        }

        const dueDate = new Date(todo.dueDate);
        const event: any = {
            summary: todo.text,
            description: `Created from Bifrost todo\nPriority: ${todo.priority || 'normal'}`,
            start: {
                date: dueDate.toISOString().split('T')[0] // All-day event
            },
            end: {
                date: dueDate.toISOString().split('T')[0]
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 } // 1 hour before
                ]
            }
        };

        // Add tags as extended properties
        if (todo.tags && todo.tags.length > 0) {
            event.extendedProperties = {
                private: {
                    bifrostTags: todo.tags.join(','),
                    bifrostId: todo.id
                }
            };
        }

        return this.createEvent(event);
    }

    /**
     * Format event for display
     * @param {Object} event - Raw calendar event
     * @returns {Object} Formatted event
     * @property {string} id - Event ID
     * @property {string} title - Event title
     * @property {string} description - Event description
     * @property {Date} start - Start date/time
     * @property {Date} end - End date/time
     * @property {boolean} allDay - True if all-day event
     * @property {string|null} location - Event location
     * @property {string} link - Calendar link
     * @property {Object} raw - Raw event object
     */
    formatEvent(event) {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;

        return {
            id: event.id,
            title: event.summary || '(No title)',
            description: event.description || '',
            start: new Date(start),
            end: new Date(end),
            allDay: !event.start.dateTime,
            location: event.location || null,
            link: event.htmlLink,
            raw: event
        };
    }

}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
