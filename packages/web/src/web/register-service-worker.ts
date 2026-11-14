// Il service worker viene registrato solo in produzione: in sviluppo
// (localhost/127.0.0.1) metterebbe in cache i moduli serviti da Vite e
// nasconderebbe le modifiche appena salvate.
//
// Sta in un file separato, non inline in index.html, perché la CSP del server
// di produzione ammette solo script della stessa origine.
if ("serviceWorker" in navigator && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
