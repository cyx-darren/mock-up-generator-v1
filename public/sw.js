// Service Worker for MockupGen - Caching and Performance
const CACHE_NAME = 'mockupgen-v1.0.0';
const STATIC_CACHE = 'mockupgen-static-v1.0.0';
const DYNAMIC_CACHE = 'mockupgen-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/catalog',
  '/how-it-works',
  '/pricing',
  '/offline.html',
  // Add critical CSS and JS chunks
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
];

// API routes to cache with different strategies
const API_ROUTES = {
  '/api/products': 'stale-while-revalidate',
  '/api/admin/statistics': 'network-first',
  '/api/generate-mockup': 'network-only',
  '/api/remove-background': 'network-only',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and dev server requests
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) {
    event.respondWith(handleImages(request));
  } else {
    event.respondWith(handlePageRequests(request));
  }
});

// Handle API requests with different caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Determine caching strategy
  const strategy = Object.keys(API_ROUTES).find((route) => pathname.startsWith(route));

  if (!strategy) {
    return fetch(request);
  }

  switch (API_ROUTES[strategy]) {
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, DYNAMIC_CACHE);
    case 'network-first':
      return networkFirst(request, DYNAMIC_CACHE);
    case 'network-only':
      return fetch(request);
    default:
      return fetch(request);
  }
}

// Handle static assets (long-term caching)
async function handleStaticAssets(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Handle images with cache-first strategy
async function handleImages(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return fallback image if available
    return (
      cache.match('/fallback-image.png') || new Response('Image not available', { status: 404 })
    );
  }
}

// Handle page requests
async function handlePageRequests(request) {
  try {
    const response = await fetch(request);

    // Cache successful page responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline.html') || new Response('Offline', { status: 404 });
    }

    throw error;
  }
}

// Caching strategies
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cachedResponse || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-mockup-generation') {
    event.waitUntil(retryFailedMockupRequests());
  }
});

async function retryFailedMockupRequests() {
  // Implementation for retrying failed mockup generation requests
  console.log('Retrying failed mockup requests...');
}
