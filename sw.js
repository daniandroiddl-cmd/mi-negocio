// Guarda la app en el celular para que funcione sin internet.
// Si cambiás algo de la app, subí el número de versión para que se actualice.
const CACHE = 'mi-negocio-v1';
const APP = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Las tipografías de Google: se guardan la primera vez y después se usan sin internet.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; })))
        .catch(() => new Response('', { status: 504 }))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Abrir la app: primero intenta la versión nueva, y si no hay internet usa la guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto de los archivos: lo guardado primero.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
