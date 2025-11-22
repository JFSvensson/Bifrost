const CACHE_NAME = 'bifrost-v4';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/base/reset.css',
    '/css/layouts/grid.css',
    '/css/components/card.css',
    '/css/components/todo.css',
    '/css/components/toasts.css',
    '/css/components/widgets.css',
    '/css/themes/dark.css',
    '/css/utilities/responsive.css',
    '/css/utilities/modes.css',
    '/js/main.js',
    '/js/widgetLoader.js',
    '/js/widgets/linkWidget.js',
    '/js/widgets/schoolMenu.js',
    '/js/services/linkService.js',
    '/js/services/menuService.js',
    '/js/utils/dateHelpers.js',
    '/js/utils/sanitizer.js',
    '/js/config/config.js',
    '/js/config/uiConfig.js',
    '/js/widgets/weatherWidget.js',
    '/js/services/weatherService.js',
    '/js/widgets/clockWidget.js',
    '/js/services/clockService.js',
    '/js/services/obsidianTodoService.js',
    '/assets/icons/favicon.svg',
    '/data/links.json'
];

// Security headers for responses
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Production-safe logging helper
const isDevelopment = () => {
    return self.location.hostname === 'localhost' ||
           self.location.hostname === '127.0.0.1';
};

const swLog = (message, ...args) => {
    if (isDevelopment()) {
        console.log('[SW]', message, ...args);
    }
};

const _swWarn = (message, ...args) => {
    console.warn('[SW]', message, ...args);
};

const _swError = (message, ...args) => {
    console.error('[SW]', message, ...args);
};

// Install event - cache static assets
self.addEventListener('install', (event: any) => {
    swLog('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                swLog('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => (self as any).skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
    swLog('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        swLog('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => (self as any).clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: any) => {
    const { request } = event;
    const url = new URL(request.url);

    // Security: Only handle same-origin requests and allowed external APIs
    const allowedHosts = ['smhi.se', 'accounts.google.com', 'www.googleapis.com', 'oauth2.googleapis.com'];
    const isAllowedExternal = allowedHosts.some(host => url.hostname.includes(host));
    const isSameOrigin = url.origin === self.location.origin;
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (!isSameOrigin && !isAllowedExternal && !isLocalhost) {
        // Block requests to unauthorized origins
        return;
    }

    // Add security headers to responses
    const addSecurityHeaders = (response) => {
        const newHeaders = new Headers(response.headers);
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
            newHeaders.set(key, value);
        });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    };

    // Handle weather API with cache fallback
    if (request.url.includes('smhi.se')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses for 10 minutes
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return addSecurityHeaders(response);
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    swLog('Weather API failed, serving from cache');
                    return caches.match(request).then(response =>
                        response ? addSecurityHeaders(response) : response
                    );
                })
        );
        return;
    }

    // Handle school menu API with cache fallback
    if (request.url.includes('/api/school-menu')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    swLog('Network failed, serving from cache');
                    return caches.match(request);
                })
        );
        return;
    }

    // Handle static assets - cache first strategy
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(request);
                })
        );
    }
});