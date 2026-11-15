// Il service worker viene registrato solo in produzione: in sviluppo
// (localhost/127.0.0.1) metterebbe in cache i moduli serviti da Vite e
// nasconderebbe le modifiche appena salvate.
//
// Sta in un file separato, non inline in index.html, perché la CSP del server
// di produzione ammette solo script della stessa origine.

let registration: ServiceWorkerRegistration | null = null;
let applying = false;

function announceUpdate() {
  window.dispatchEvent(new CustomEvent("app:update-ready"));
}

/**
 * Attiva il worker in attesa e ricarica quando ha preso il controllo.
 *
 * Il worker nuovo non si attiva da solo: farlo subito cancellerebbe le cache
 * che questa pagina sta ancora usando. È l'utente a decidere quando, e la
 * ricarica avviene solo a cambio di controllo avvenuto.
 */
export function applyServiceWorkerUpdate() {
  const waiting = registration?.waiting;

  if (!waiting) {
    window.location.reload();
    return;
  }

  if (applying) return;
  applying = true;

  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
    once: true,
  });
  waiting.postMessage("SKIP_WAITING");
}

/**
 * In sviluppo il service worker resta spento, altrimenti nasconde le modifiche
 * di Vite. `?sw=1` lo accende anche su loopback: i test end-to-end hanno bisogno
 * di provare la registrazione vera, non di simularla.
 */
const onLoopback = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const forced =
  new URLSearchParams(location.search).get("sw") === "1" ||
  new URLSearchParams(location.search).get("sw") === "force";

if ("serviceWorker" in navigator && (!onLoopback || forced)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registered) => {
        registration = registered;

        // Un worker già in attesa all'apertura della pagina: l'aggiornamento è
        // stato scaricato in una visita precedente e non è mai stato applicato.
        if (registered.waiting && navigator.serviceWorker.controller) announceUpdate();

        registered.addEventListener("updatefound", () => {
          const installing = registered.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // `controller` presente = c'era già una versione attiva, quindi questa
            // è un aggiornamento e non la prima installazione.
            if (installing.state === "installed" && navigator.serviceWorker.controller)
              announceUpdate();
          });
        });

        // Tornare sulla scheda dopo una pausa è il momento in cui è più probabile
        // che sia uscita una versione nuova: si controlla senza disturbare.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void registered.update().catch(() => {});
        });
      })
      .catch(() => {});
  });
}
