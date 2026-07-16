const CACHE_NAME = 'gitx-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/public/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Игнорируем API вызовы, внешние ИИ-интеграции и любые файлы разработки (Vite, src, node_modules)
  if (
    e.request.url.includes('/api/') || 
    e.request.url.includes('api.openai.com') || 
    e.request.url.includes('generativelanguage.googleapis.com') ||
    e.request.url.includes('/src/') ||
    e.request.url.includes('/node_modules/') ||
    e.request.url.includes('@vite') ||
    e.request.url.includes('?import') ||
    e.request.url.includes('hot-update')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Не кэшируем динамические файлы разработки на лету
        const url = new URL(e.request.url);
        if (url.pathname.startsWith('/src/') || url.pathname.includes('node_modules') || url.pathname.includes('@vite')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Оффлайн заглушка при потере сети для html страниц
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
