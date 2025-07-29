const CACHE_NAME = 'inventory-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './styles.css',       // 外部CSS化していれば追加
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール時にキャッシュ登録
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// フェッチ時にキャッシュ優先で応答
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
  );
});

// アクティベートで古いキャッシュをクリーンアップ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});