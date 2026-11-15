/**
 * Rete di sicurezza all'avvio.
 *
 * Se il caricamento dell'app fallisce prima che React monti — per esempio per
 * contenuti malformati — il browser mostrerebbe una pagina bianca. Qui si
 * scrive un messaggio leggibile dentro `#root`, con l'unica informazione che
 * conta davvero per un docente: le risposte sono salvate nel browser.
 *
 * Nessuna dipendenza e nessuno stile esterno: gira anche quando il bundle
 * dell'app è la cosa rotta.
 */
const FALLBACK_ID = "boot-fallback";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showFallback(reason: string) {
  const root = document.getElementById("root");
  // Se l'app è già a schermo, un errore successivo non deve cancellarla.
  if (!root || root.childElementCount > 0 || document.getElementById(FALLBACK_ID)) return;

  const box = document.createElement("div");
  box.id = FALLBACK_ID;
  box.setAttribute("role", "alert");
  box.style.cssText =
    "max-width:44rem;margin:4rem auto;padding:1.5rem;border-radius:16px;" +
    "background:#1d2b25;color:#e8f0ea;font-family:system-ui,sans-serif;line-height:1.6";
  box.innerHTML =
    '<h1 style="margin:0 0 .5rem;font-size:1.4rem">Il percorso non si è caricato</h1>' +
    '<p style="margin:0 0 .75rem">Le risposte già salvate restano in questo browser: ' +
    "ricarica la pagina. Se il problema continua, segnalalo indicando il messaggio qui sotto.</p>" +
    `<pre style="margin:0;padding:.75rem;border-radius:10px;background:#16211d;white-space:pre-wrap;font-size:.8rem">${escapeHtml(reason)}</pre>` +
    '<p style="margin:.75rem 0 0"><button type="button" id="boot-reload" style="padding:.5rem 1rem;border-radius:999px;border:1px solid #3a5749;background:#2f6b52;color:#f4f8f5;font:inherit">Ricarica</button></p>';

  root.append(box);
  document.getElementById("boot-reload")?.addEventListener("click", () => window.location.reload());
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

window.addEventListener("error", (event) => {
  // Le risorse mancanti (immagini, video) non sono un errore d'avvio.
  if (event.target instanceof HTMLElement && event.target !== window.document.body) return;
  showFallback(describe(event.error ?? event.message));
});

window.addEventListener("unhandledrejection", (event) => {
  showFallback(describe(event.reason));
});
