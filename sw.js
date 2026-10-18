// SC-26: funzionamento offline. La pagina si aggiorna da sola quando c'è rete.
const CACHE = 'sc26-v1';
const FILES = ['./', './index.html', './manifest.webmanifest',
               './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {            // pagina: prima la rete (per gli aggiornamenti), poi la copia salvata
    e.respondWith(fetch(req).then(res => {
      caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {   // altri file: prima la copia
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
