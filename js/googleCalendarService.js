/**
 * Google Calendar Service
 * Handles OAuth 2.0 authentication and Google Calendar API interactions
 */

export class GoogleCalendarService {
    constructor() {
        this.CLIENT_ID = null;
        this.API_KEY = null;
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
        
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.accessToken = null;
        
        this.callbacks = new Set();
        
        // Load credentials from config
        this.loadCredentials();
    }
    
    /**
     * Load Google API credentials
     */
    async loadCredentials() {
        try {
            const response = await fetch('/google-credentials.json');
            if (!response.ok) {
                console.warn('⚠️ Google Calendar credentials not found. Please add google-credentials.json');
                return false;
            }
            
            const credentials = await response.json();
            this.CLIENT_ID = credentials.client_id;
            this.API_KEY = credentials.api_key;
            
            console.log('✅ Google Calendar credentials loaded');
            console.log('Client ID:', this.CLIENT_ID);
            console.log(credentials);
            return true;
        } catch (error) {
            console.error('❌ Failed to load Google Calendar credentials:', error);
            return false;
        }
    }
    
    /**
     * Initialize Google API and OAuth
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
        
        console.log('✅ Google Calendar Service initialized');
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
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize Google API Platform Library
     */
    async initializeGapi() {
        return new Promise((resolve) => {
            window.gapi.load('client', async () => {
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
     */
    async initializeGis() {
        return new Promise((resolve) => {
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response);
                        this.notifyListeners({ authenticated: false, error: response.error });
                        return;
                    }
                    
                    this.accessToken = response.access_token;
                    this.saveAuthToken(response.access_token);
                    this.notifyListeners({ authenticated: true });
                }
            });
            this.gisInited = true;
            resolve();
        });
    }
    
    /**
     * Check if user has stored authentication
     */
    checkStoredAuth() {
        const stored = localStorage.getItem('googleCalendarToken');
        if (stored) {
            try {
                const { token, expiry } = JSON.parse(stored);
                if (expiry > Date.now()) {
                    this.accessToken = token;
                    window.gapi.client.setToken({ access_token: token });
                    this.notifyListeners({ authenticated: true });
                    console.log('✅ Restored Google Calendar authentication');
                    return true;
                }
            } catch (error) {
                console.error('Failed to restore auth:', error);
            }
        }
        return false;
    }
    
    /**
     * Save authentication token
     */
    saveAuthToken(token) {
        const expiry = Date.now() + (3600 * 1000); // 1 hour
        localStorage.setItem('googleCalendarToken', JSON.stringify({ token, expiry }));
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
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Token revoked');
            });
        }
        
        this.accessToken = null;
        localStorage.removeItem('googleCalendarToken');
        window.gapi.client.setToken(null);
        this.notifyListeners({ authenticated: false });
        console.log('✅ Signed out from Google Calendar');
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }
    
    /**
     * Get today's events
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
     * Get upcoming events (next 7 days)
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
     */
    async getEvents(startDate, endDate, maxResults = 50) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        try {
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
            console.error('Failed to fetch events:', error);
            throw error;
        }
    }
    
    /**
     * Create a calendar event
     */
    async createEvent(event) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        try {
            const response = await window.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });
            
            console.log('✅ Event created:', response.result);
            return response.result;
        } catch (error) {
            console.error('Failed to create event:', error);
            throw error;
        }
    }
    
    /**
     * Update a calendar event
     */
    async updateEvent(eventId, updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        try {
            // First get the event
            const event = await window.gapi.client.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });
            
            // Merge updates
            const updatedEvent = { ...event.result, ...updates };
            
            // Update
            const response = await window.gapi.client.calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: updatedEvent
            });
            
            console.log('✅ Event updated:', response.result);
            return response.result;
        } catch (error) {
            console.error('Failed to update event:', error);
            throw error;
        }
    }
    
    /**
     * Delete a calendar event
     */
    async deleteEvent(eventId) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        try {
            await window.gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });
            
            console.log('✅ Event deleted:', eventId);
            return true;
        } catch (error) {
            console.error('Failed to delete event:', error);
            throw error;
        }
    }
    
    /**
     * Create event from todo
     */
    async createEventFromTodo(todo) {
        if (!todo.dueDate) {
            throw new Error('Todo must have a due date');
        }
        
        const dueDate = new Date(todo.dueDate);
        const event = {
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
    
    /**
     * Subscribe to authentication changes
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    
    /**
     * Notify all listeners
     */
    notifyListeners(data) {
        this.callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
