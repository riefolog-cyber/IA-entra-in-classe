const CACHE = "restare-umani-v5";
const PRECACHE = ["./", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .catch(() => {}),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Le risorse di altri domini (video, modulo feedback) restano alla rete.
  if (url.origin !== self.location.origin) return;

  // Network-first per index.html: evita che una versione in cache
  // rimandi a asset JS/CSS con hash obsoleti dopo un deploy.
  if (
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("index.html")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || Response.error())),
    );
    return;
  }

  // Gli asset di build hanno l'hash nel nome: sono immutabili, quindi si
  // servono dalla cache e si memorizzano al primo accesso. Evita di
  // riscaricare ~800 kB di JS/CSS a ogni visita.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
