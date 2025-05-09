
// PharmaLens Service Worker
const CACHE_NAME = 'pharmalens-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  '/placeholder.svg',
  // Add more static assets to cache
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker active, claiming clients...');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Enhanced network-first strategy for API requests with better error handling
self.addEventListener('fetch', (event) => {
  // For Supabase function calls, use a more resilient strategy
  if (event.request.url.includes('/functions/') || event.request.url.includes('/rest/')) {
    event.respondWith(
      fetchWithTimeout(event.request.clone(), 30000)
        .then(response => {
          // If online and response is valid, cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('Caching API response for:', event.request.url);
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(error => {
          console.warn('Network request failed, trying cache:', error);
          // If offline or error, try to get from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('Serving cached response for:', event.request.url);
                return cachedResponse;
              }
              
              // If no cached version, return a generic offline response
              if (event.request.headers.get('accept').includes('application/json')) {
                return new Response(JSON.stringify({ 
                  error: 'Network error. Please check your connection.',
                  offline: true 
                }), {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                });
              }
              
              // Return offline page for HTML requests
              return caches.match('/index.html');
            });
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
              // For HTML navigation, serve the index page as a fallback
              if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
              }
              
              // If asset can't be fetched, return appropriate error
              return new Response('Network error', { status: 503 });
            });
        })
    );
  }
});

// Utility function to fetch with timeout
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    // Set timeout timer
    const timeoutId = setTimeout(() => {
      console.warn('Request timeout for:', request.url);
      reject(new Error('Request timeout'));
    }, timeout);
    
    fetch(request).then(
      (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle refresh message
  if (event.data && event.data.type === 'REFRESH') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.navigate(client.url));
    });
  }
});

// Periodic background sync for important data if supported
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
      event.waitUntil(updateCache());
    }
  });
}

// Background sync for deferred operations when coming online
self.addEventListener('sync', (event) => {
  if (event.tag === 'deferred-operations') {
    event.waitUntil(performDeferredOperations());
  }
});

// Helper functions
async function updateCache() {
  // Update critical resources
  const criticalAssets = ['/', '/index.html'];
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    criticalAssets.map(url => 
      fetch(url)
        .then(response => cache.put(url, response))
        .catch(err => console.warn('Failed to update cache for:', url, err))
    )
  );
}

async function performDeferredOperations() {
  // Process any operations that failed while offline
  console.log('Performing deferred operations now that we are online');
  // Implement deferred operations logic here
}
