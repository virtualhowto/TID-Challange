
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('tid-challenge-cache').then(cache => {
      return cache.addAll([
        './index.html','./style.css','./script.js','./data.json','./manifest.json',
        './correct.mp3','./wrong.mp3','./icon-192.png','./icon-512.png','./mdcnsw.png'
      ]);
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});
