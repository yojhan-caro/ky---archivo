/* KY SpA Archivo — funciona sin internet.
   Al publicar cambios, sube el número de VERSION para que la tablet tome la versión nueva. */
const VERSION = 'ky-archivo-v2';
const BASE = ['./', 'index.html', 'style.css?v=3', 'data.js?v=1', 'app.js?v=2', 'mesa.js?v=1', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Página y archivos propios: primero la red (para ver cambios), si no hay internet, lo guardado
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
    return;
  }
  // Tipografías de Google: lo guardado primero
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(r, c)); return res; })));
  }
});
