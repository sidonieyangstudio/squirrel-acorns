// PWA service worker — network-first（線上永遠抓最新，離線回 cache）
const CACHE = 'squirrel-points-v20';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './daily-reset.js',
  './manage-sort.js',
  './after-school-alarm.js',
  './bingo-rules.js',
  './reflection-rules.js',
  './app.js',
  './manifest.json',
  './assets/squirrel-normal.svg',
  './assets/squirrel-happy.svg',
  './assets/squirrel-cheer.svg',
  './assets/stickers/daily/1F308.svg',
  './assets/stickers/daily/1F33A.svg',
  './assets/stickers/daily/1F344.svg',
  './assets/stickers/daily/1F347.svg',
  './assets/stickers/daily/1F349.svg',
  './assets/stickers/daily/1F34A.svg',
  './assets/stickers/daily/1F34E.svg',
  './assets/stickers/daily/1F352.svg',
  './assets/stickers/daily/1F353.svg',
  './assets/stickers/daily/1F361.svg',
  './assets/stickers/daily/1F3A1.svg',
  './assets/stickers/daily/1F3AA.svg',
  './assets/stickers/daily/1F41E.svg',
  './assets/stickers/daily/1F420.svg',
  './assets/stickers/daily/1F422.svg',
  './assets/stickers/daily/1F427.svg',
  './assets/stickers/daily/1F433.svg',
  './assets/stickers/daily/1F43B-200D-2744-FE0F.svg',
  './assets/stickers/daily/1F99C.svg',
  './assets/stickers/daily/1F9AB.svg',
  './assets/stickers/daily/1F9C1.svg',
  './assets/stickers/daily/1FA85.svg',
  './assets/stickers/daily/1FAA9.svg',
  './assets/stickers/daily/2603.svg',
  './assets/stickers/vehicle/1F680.svg',
  './assets/stickers/vehicle/1F681.svg',
  './assets/stickers/vehicle/1F682.svg',
  './assets/stickers/vehicle/1F683.svg',
  './assets/stickers/vehicle/1F688.svg',
  './assets/stickers/vehicle/1F68E.svg',
  './assets/stickers/vehicle/1F691.svg',
  './assets/stickers/vehicle/1F692.svg',
  './assets/stickers/vehicle/1F693.svg',
  './assets/stickers/vehicle/1F695.svg',
  './assets/stickers/vehicle/1F69C.svg',
  './assets/stickers/vehicle/1F69E.svg',
  './assets/stickers/vehicle/1F6E9.svg',
  './assets/stickers/vehicle/1F6FB.svg',
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
