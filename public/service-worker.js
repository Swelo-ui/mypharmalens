
// PharmaLens Service Worker
const CACHE_NAME = 'pharmalens-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Updated network-first strategy for API requests
self.addEventListener('fetch', (event) => {
  // Check if this is a Supabase function call
  if (event.request.url.includes('/functions/') || event.request.url.includes('/rest/')) {
    // For API requests, prefer network and fall back to cache only if necessary
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online and response is valid, cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, check cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response if available
          if (response) {
            return response;
          }
          
          // Clone the request
          const fetchRequest = event.request.clone();
          
          // Make network request and cache the response
          return fetch(fetchRequest)
            .then(response => {
              // Check if valid response
              if(!response || response.status !== 200) {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(error => {
              console.error('Fetch error:', error);
              // You might want to return a custom offline page here
            });
        })
    );
  }
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
