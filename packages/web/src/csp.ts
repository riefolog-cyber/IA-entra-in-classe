/**
 * Unica fonte delle policy di sicurezza.
 *
 * Le stesse direttive servono in tre punti: l'header del server Bun, il `<meta>`
 * del mirror statico su GitHub Pages (che non può inviare header) e l'header
 * `Report-Only` dello sviluppo. Tenerle qui evita che un'aggiunta fatta per il
 * sito rompa in silenzio il mirror: prima erano quattro copie a mano.
 */

/**
 * Il sito non carica script di terzi: le eccezioni sono quelle che servono
 * davvero — moduli Google per il feedback, miniature YouTube e i video
 * incorporati nelle pagine di approfondimento.
 */
export const SITE_CSP: string[] = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.youtube.com",
  "font-src 'self'",
  "connect-src 'self' https://docs.google.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

/** Pagina «confini»: artefatto autonomo con la sua policy, limitata al percorso. */
export const LEGACY_PAGE = "/confini-morali-dell-ai.html";

/**
 * Script inline, quattro CDN, immagini remote: la policy stretta spegnerebbe
 * questa pagina. Resta candidata alla sostituzione con una pagina statica
 * autoconsistente.
 */
export const LEGACY_CSP: string[] = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://d3js.org https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  // Font Awesome arriva da cdnjs insieme ai suoi fogli di stile.
  "font-src 'self' data: https://cdnjs.cloudflare.com",
  "connect-src 'self' https://generativelanguage.googleapis.com https://gemini.google.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://learningapps.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

/** In sviluppo Vite serve moduli con `eval` e parla con l'HMR via WebSocket. */
export const DEV_CSP: string[] = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: http: https:",
  "frame-src https:",
  "object-src 'none'",
];

export function cspHeader(directives: string[]): string {
  return directives.join("; ");
}

/** Policy dell'header: quella della pagina legacy vale solo sul suo percorso. */
export function cspForPath(pathname: string): string {
  return cspHeader(pathname === LEGACY_PAGE ? LEGACY_CSP : SITE_CSP);
}

/**
 * Policy del `<meta>` per il mirror statico. `frame-ancestors` non è supportato
 * in un meta: incluso verrebbe solo ignorato dal browser.
 */
export const META_CSP = cspHeader(SITE_CSP.filter((line) => !line.startsWith("frame-ancestors")));
