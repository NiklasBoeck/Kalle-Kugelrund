// Offline cache: app files and Kenney assets up front, fonts as they load.
const CACHE = 'kalle-v17';
const SFX = ['jump','boing','coin','hurt','magic','gem','duck','power','shrink','grow','click','land','landhard',
  'step_grass0','step_grass1','step_grass2','step_concrete0','step_concrete1','step_concrete2','step_snow0','step_snow1','step_snow2'];
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'assets/kenney.js', 'assets/sprites.png', ...SFX.map(n => 'assets/sfx/' + n + '.mp3')];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // The game page itself: try the network first so updates arrive, fall back to the cache offline.
  if (e.request.mode === 'navigate') {
    // cache:'no-cache' skips the browser's 10-minute HTTP cache on GitHub Pages, so a new version shows up right away
    e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
