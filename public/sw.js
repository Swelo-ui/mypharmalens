// PharmaLens Service Worker
// Handles offline caching, automatic updates, and PWA functionality

const CACHE_NAME = 'pharmalens-v1.0.0';
const STATIC_CACHE = 'pharmalens-static-v1';
const DYNAMIC_CACHE = 'pharmalens-dynamic-v1';
const MEDICATIONS_CACHE = 'pharmalens-medications-v1';
const SYMPTOM_CACHE = 'pharmalens-symptoms-v1';

// Files to cache immediately (app shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  // Add other critical static files
];

// API endpoints to cache for offline access
const CACHE_PATTERNS = {
  medications: /\/rest\/v1\/drug_identification_cache/,
  symptoms: /\/rest\/v1\/symptom_checker/,
  interactions: /\/rest\/v1\/drug_interactions/,
  subscriptions: /\/rest\/v1\/subscription_plans/,
  profiles: /\/rest\/v1\/profiles/
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== MEDICATIONS_CACHE && 
                cacheName !== SYMPTOM_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('/functions/v1/')) {
    // Drug identification APIs - always go to network (require internet)
    event.respondWith(fetch(request));
  } else if (CACHE_PATTERNS.medications.test(request.url)) {
    // Medications data - cache first strategy
    event.respondWith(cacheFirstStrategy(request, MEDICATIONS_CACHE));
  } else if (CACHE_PATTERNS.symptoms.test(request.url)) {
    // Symptom checker data - cache first strategy
    event.respondWith(cacheFirstStrategy(request, SYMPTOM_CACHE));
  } else if (CACHE_PATTERNS.interactions.test(request.url)) {
    // Drug interactions - cache first strategy
    event.respondWith(cacheFirstStrategy(request, MEDICATIONS_CACHE));
  } else if (CACHE_PATTERNS.subscriptions.test(request.url) || 
             CACHE_PATTERNS.profiles.test(request.url)) {
    // User data - network first with cache fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else if (request.destination === 'image') {
    // Images - cache first strategy
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  } else if (url.origin === location.origin) {
    // Same origin requests - stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  }
});

// Cache First Strategy - for medications, symptoms, interactions
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      
      // Update cache in background if online
      if (navigator.onLine) {
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          })
          .catch(() => {}); // Ignore background update errors
      }
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      console.log('🌐 Caching new response:', request.url);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first strategy failed:', error);
    
    // Return offline fallback for critical data
    if (request.url.includes('medications') || 
        request.url.includes('symptoms') || 
        request.url.includes('interactions')) {
      return new Response(JSON.stringify({
        error: 'Offline - cached data not available',
        offline: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Network First Strategy - for user data
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Network failed, trying cache:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy - for app shell
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse); // Fallback to cache on network error
  
  return cachedResponse || fetchPromise;
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Skipping waiting - activating new service worker');
    self.skipWaiting();
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    // Handle offline actions when back online
  }
});

console.log('🎉 PharmaLens Service Worker loaded successfully!');
