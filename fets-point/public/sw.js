// Bump versions to force update after deploy - Mobile Optimized Build
const CACHE_NAME = 'fets-point-v3.0';
const STATIC_CACHE = 'fets-point-static-v3.0';
const DYNAMIC_CACHE = 'fets-point-dynamic-v3.0';
const API_CACHE = 'fets-point-api-v3.0';
const IMAGES_CACHE = 'fets-point-images-v3.0';

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000,    // 1 day
  api: 5 * 60 * 1000,              // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Files to cache on install
// Do not cache index.html to avoid stale shell
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/fets-point-logo.png',
  '/fets-point-logo-512.png',
  '/fets-live-golden-logo.jpg',
  '/vite.svg'
];

// Critical CSS and JS will be added dynamically
const CRITICAL_RESOURCES = [
  /\/assets\/index-.*\.js$/,
  /\/assets\/index-.*\.css$/
];

// API endpoints to cache
const API_PATTERNS = [
  /\/rest\/v1\/candidates/,
  /\/rest\/v1\/incidents/,
  /\/rest\/v1\/roster_schedules/,
  /\/rest\/v1\/profiles/
];

// Background sync queue for offline actions
let syncQueue = [];

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  errors: 0
};

/**
 * Utility Functions
 */
function log(message, data = null) {
  console.log(`🔧 SW [${new Date().toISOString()}]: ${message}`, data || '');
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         CRITICAL_RESOURCES.some(pattern => pattern.test(url.pathname));
}

function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
}

function shouldSkipCache(request) {
  // Skip caching for certain requests
  return request.method !== 'GET' ||
         request.url.includes('chrome-extension') ||
         request.url.includes('webpack') ||
         request.url.includes('hot-update');
}

async function cleanExpiredCache(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  const deletePromises = requests.map(async (request) => {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('sw-cached-date');
      if (dateHeader) {
        const cachedDate = new Date(dateHeader);
        if (Date.now() - cachedDate.getTime() > maxAge) {
          log(`Deleting expired cache entry: ${request.url}`);
          return cache.delete(request);
        }
      }
    }
  });
  
  await Promise.all(deletePromises);
}

async function addToCache(cacheName, request, response, addTimestamp = true) {
  try {
    const cache = await caches.open(cacheName);
    
    if (addTimestamp) {
      // Clone response and add timestamp header
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const newResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      await cache.put(request, newResponse);
    } else {
      await cache.put(request, response);
    }
    
    log(`Cached: ${request.url}`);
  } catch (error) {
    log(`Cache error for ${request.url}:`, error);
    performanceMetrics.errors++;
  }
}

/**
 * Installation
 */
self.addEventListener('install', (event) => {
  log('Installing Service Worker v3.0 - Mobile Optimized...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache static assets
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(STATIC_ASSETS);
        
        log('✅ Static assets cached successfully');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        log('❌ Installation failed:', error);
        performanceMetrics.errors++;
      }
    })()
  );
});

/**
 * Activation
 */
self.addEventListener('activate', (event) => {
  log('Activating Service Worker v3.0 - Mobile Optimized...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => 
            name.startsWith('fets-point-') && 
            ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGES_CACHE].includes(name)
          )
          .map(name => {
            log(`Deleting old cache: ${name}`);
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        
        // Clean expired entries
        await cleanExpiredCache(DYNAMIC_CACHE, CACHE_DURATIONS.dynamic);
        await cleanExpiredCache(API_CACHE, CACHE_DURATIONS.api);
        await cleanExpiredCache(IMAGES_CACHE, CACHE_DURATIONS.images);
        
        // Take control of all clients
        await clients.claim();
        
        log('✅ Service Worker activated successfully');
      } catch (error) {
        log('❌ Activation failed:', error);
        performanceMetrics.errors++;
      }
    })()
  );
});

/**
 * Fetch Strategy Router
 */
self.addEventListener('fetch', (event) => {
  if (shouldSkipCache(event.request)) {
    return;
  }
  
  const url = new URL(event.request.url);

  // Always use network-first for navigation requests (HTML documents)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirstStrategy(event.request, DYNAMIC_CACHE));
    return;
  }
  
  // Route to appropriate strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(event.request, IMAGES_CACHE));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(event.request, DYNAMIC_CACHE));
  }
});

/**
 * Caching Strategies
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      log(`Cache hit: ${request.url}`);
      return cachedResponse;
    }
    
    // Fallback to network
    performanceMetrics.cacheMisses++;
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await addToCache(cacheName, request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    log(`Cache-first strategy failed for ${request.url}:`, error);
    performanceMetrics.errors++;
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    return new Response('Service Unavailable', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await addToCache(cacheName, request, networkResponse.clone());
      log(`Network success: ${request.url}`);
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    log(`Network failed for ${request.url}, trying cache...`);
    
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      log(`Cache fallback success: ${request.url}`);
      return cachedResponse;
    }
    
    performanceMetrics.errors++;
    
    // Add to sync queue for retry
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      await addToSyncQueue(request);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Network unavailable and no cached data',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // Return cached version immediately if available
  const cachedResponse = await cache.match(request);
  
  // Update cache in background
  const networkUpdate = (async () => {
    try {
      performanceMetrics.networkRequests++;
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await addToCache(cacheName, request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      log(`Background update failed for ${request.url}:`, error);
      return null;
    }
  })();
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    log(`Stale-while-revalidate cache hit: ${request.url}`);
    return cachedResponse;
  }
  
  // No cache, wait for network
  performanceMetrics.cacheMisses++;
  const networkResponse = await networkUpdate;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  performanceMetrics.errors++;
  return new Response('Service Unavailable', { status: 503 });
}

/**
 * Background Sync
 */
async function addToSyncQueue(request) {
  try {
    const body = await request.text();
    syncQueue.push({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    });
    
    log(`Added to sync queue: ${request.method} ${request.url}`);
    
    // Register background sync
    if (self.registration && self.registration.sync) {
      await self.registration.sync.register('background-sync');
    }
  } catch (error) {
    log('Failed to add to sync queue:', error);
  }
}

self.addEventListener('sync', (event) => {
  log('Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processBackgroundSync());
  }
});

async function processBackgroundSync() {
  log(`Processing ${syncQueue.length} queued requests...`);
  
  const processedItems = [];
  
  for (const item of syncQueue) {
    try {
      const request = new Request(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        log(`Sync success: ${item.method} ${item.url}`);
        processedItems.push(item);
        performanceMetrics.backgroundSyncs++;
      } else {
        log(`Sync failed: ${item.method} ${item.url} - ${response.status}`);
      }
    } catch (error) {
      log(`Sync error for ${item.url}:`, error);
      
      // Remove old items (older than 24 hours)
      if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
        processedItems.push(item);
      }
    }
  }
  
  // Remove processed items
  syncQueue = syncQueue.filter(item => !processedItems.includes(item));
  
  log(`Background sync completed. ${processedItems.length} items processed, ${syncQueue.length} remaining.`);
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  log('Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update from FETS Point',
    icon: '/fets-point-logo.png',
    badge: '/fets-point-logo.png',
    tag: data.tag || 'fets-point-update',
    renotify: true,
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/fets-point-logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/fets-point-logo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'FETS Point', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * Message handling
 */
self.addEventListener('message', (event) => {
  log('Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
    event.ports[0].postMessage({
      type: 'PERFORMANCE_METRICS',
      data: {
        ...performanceMetrics,
        syncQueueLength: syncQueue.length,
        timestamp: new Date().toISOString()
      }
    });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('fets-point-'))
        .map(name => caches.delete(name))
    );
    
    log('✅ All caches cleared');
  } catch (error) {
    log('❌ Failed to clear caches:', error);
  }
}

// Periodic cleanup
setInterval(() => {
  if (syncQueue.length > 100) {
    // Remove oldest items if queue gets too large
    syncQueue = syncQueue.slice(-50);
    log('Cleaned up sync queue');
  }
}, 30 * 60 * 1000); // Every 30 minutes

log('🚀 FETS Point Service Worker v3.0 - Mobile Optimized - Loaded successfully');
