// Il segnaposto viene sostituito in build da vite.config.ts (plugin sw-version):
// ogni deploy invalida la cache senza dover ricordare di cambiare un numero a mano.
const BUILD_ID = "__BUILD_ID__";
const CACHE = `restare-umani-${BUILD_ID.startsWith("__") ? "dev" : BUILD_ID}`;
// In build il segnaposto diventa l'elenco degli asset compilati: senza, il primo
// accesso senza rete troverebbe l'HTML e nessuno script. In sviluppo resta una
// stringa che il filtro scarta.
const PRECACHE = ["./", "./manifest.json", "./offline.html", "__PRECACHE__"].filter(
  (path) => path && !path.startsWith("__"),
);
// Marcatore di versione dentro la cache: serve ad `activate` per capire quale
// cache è la più recente, senza dover confrontare gli hash della build.
const VERSION_PATH = "./__version__";
// Quante cache oltre alla corrente si conservano. Una: la build appena
// precedente resta disponibile per le schede aperte durante un aggiornamento.
const KEEP_PREVIOUS = 1;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Un asset mancante non deve far fallire l'intera installazione: gli altri
      // restano comunque disponibili offline.
      .then(async (cache) => {
        await Promise.all(PRECACHE.map((path) => cache.add(path).catch(() => {})));
        await cache
          .put(new Request(VERSION_PATH), new Response(`${Date.now()}|${BUILD_ID}`))
          .catch(() => {});
      })
      .catch(() => {}),
  );
  // Niente `skipWaiting()` qui: il worker nuovo resta in attesa. Attivarsi subito
  // cancellerebbe le cache che la pagina aperta sta ancora usando, e un export
  // PDF a metà lezione troverebbe i chunk vecchi spariti.
});

// L'attivazione arriva dalla pagina, quando l'utente sceglie di aggiornare.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function versionOf(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const marker = await cache.match(VERSION_PATH);
    if (!marker) return 0;
    return Number((await marker.text()).split("|")[0]) || 0;
  } catch {
    return 0;
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        const others = keys.filter((key) => key !== CACHE);

        // Si conserva la cache più recente oltre alla corrente: una scheda
        // rimasta aperta su una build precedente può ancora chiedere i suoi
        // chunk (per esempio un export PDF iniziato prima dell'aggiornamento).
        const stamped = await Promise.all(
          others.map(async (key) => ({ key, at: await versionOf(key) })),
        );
        stamped.sort((a, b) => b.at - a.at);

        const keep = new Set([CACHE, ...stamped.slice(0, KEEP_PREVIOUS).map((item) => item.key)]);
        await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
      } catch {
        // Una cache non cancellabile non deve impedire l'attivazione.
      }
    })(),
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
        // Senza rete e senza copia in cache si mostra una pagina che rassicura:
        // le risposte sono comunque salve nel browser.
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("./offline.html"))
            .then((cached) => cached || Response.error()),
        ),
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
