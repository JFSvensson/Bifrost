const CACHE_NAME = 'bifrost-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/linkHandler.js',
    '/js/schoolMenu.js',
    '/js/menuService.js',
    '/js/dateHelpers.js',
    '/js/config.js',
    '/js/uiConfig.js',
    '/js/weatherWidget.js',
    '/js/weatherService.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    
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
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    console.log('Weather API failed, serving from cache');
                    return caches.match(request);
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
                    console.log('Network failed, serving from cache');
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