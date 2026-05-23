// PWA service worker — network-first（線上永遠抓最新，離線回 cache）
const CACHE = 'squirrel-points-v12';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './daily-reset.js',
  './manage-sort.js',
  './after-school-alarm.js',
  './bingo-rules.js',
  './app.js',
  './manifest.json',
  './assets/squirrel-normal.svg',
  './assets/squirrel-happy.svg',
  './assets/squirrel-cheer.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // network-first：先抓 server 最新版，失敗才回 cache（離線也能用）
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
