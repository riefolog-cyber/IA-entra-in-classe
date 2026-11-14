import path from "node:path";

import app from "./api";

/**
 * Server HTTP di produzione (Bun).
 *
 * Vive fuori dai file `__` protetti dal template, che la piattaforma può
 * riscrivere: qui stanno le regole che devono restare nostre — URL malformati,
 * contenimento dentro `dist/`, `Cache-Control` coerente con il service worker e
 * header di sicurezza.
 */
const distDir = path.resolve(import.meta.dirname, "../dist");
const indexPath = path.join(distDir, "index.html");

const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "no-cache";
const SHORT = "public, max-age=3600";

/**
 * Il sito non carica script di terzi: la CSP può essere stretta. Le eccezioni
 * sono quelle che servono davvero — moduli Google per il feedback, miniature
 * YouTube e i video incorporati della pagina «confini».
 */
const CONTENT_SECURITY_POLICY = [
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
].join("; ");

/**
 * La pagina «confini» è un artefatto autonomo, con script inline, quattro CDN e
 * immagini remote: la policy stretta la spegnerebbe. Ha quindi una policy
 * propria, più larga, limitata al suo percorso. Resta candidata alla
 * sostituzione con una pagina statica autoconsistente.
 */
const LEGACY_PAGE = "/confini-morali-dell-ai.html";
const LEGACY_CONTENT_SECURITY_POLICY = [
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
].join("; ");

const BASE_SECURITY_HEADERS: Record<string, string> = {
  // Il sito è sempre servito in HTTPS da Render: niente downgrade.
  "Strict-Transport-Security": "max-age=15552000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function contentSecurityPolicy(pathname: string): string {
  return pathname === LEGACY_PAGE ? LEGACY_CONTENT_SECURITY_POLICY : CONTENT_SECURITY_POLICY;
}

function applySecurityHeaders(headers: Headers, pathname = "/"): Headers {
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) headers.set(name, value);
  headers.set("Content-Security-Policy", contentSecurityPolicy(pathname));
  return headers;
}

function cacheControl(pathname: string): string {
  // L'HTML porta con sé le regole (policy, meta): va sempre rivalidato.
  if (pathname === "/" || pathname.endsWith("/") || pathname.endsWith(".html")) return REVALIDATE;
  if (pathname.endsWith("sw.js") || pathname.endsWith("manifest.json")) return REVALIDATE;
  if (pathname.startsWith("/assets/")) return IMMUTABLE;
  return SHORT;
}

function headersFor(pathname: string): Headers {
  return applySecurityHeaders(new Headers({ "Cache-Control": cacheControl(pathname) }), pathname);
}

function text(body: string, status: number, pathname = "/"): Response {
  const headers = applySecurityHeaders(
    new Headers({ "Cache-Control": REVALIDATE, "Content-Type": "text/plain; charset=utf-8" }),
    pathname,
  );
  return new Response(body, { status, headers });
}

/**
 * Percorso dentro `dist/`, oppure null quando la richiesta non è accettabile:
 * un URL malformato non deve far cadere il server, e `..`/percorsi assoluti non
 * devono uscire dalla cartella dei file statici.
 */
function resolveInsideDist(rawPath: string): string | null {
  const decoded = decodePath(rawPath);
  if (decoded === null) return null;

  const relative = decoded.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!relative) return indexPath;

  const resolved = path.resolve(distDir, relative);
  const prefix = distDir.endsWith(path.sep) ? distDir : `${distDir}${path.sep}`;
  if (resolved !== distDir && !resolved.startsWith(prefix)) return null;

  return resolved;
}

function decodePath(rawPath: string): string | null {
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return null;
  }
}

/** Una navigazione riceve l'app; un asset mancante resta un 404. */
function isNavigation(request: Request, pathname: string): boolean {
  if ((request.headers.get("accept") ?? "").includes("text/html")) return true;
  const decoded = decodePath(pathname) ?? pathname;
  return !path.posix.extname(decoded);
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    const response = await app.fetch(request);
    return new Response(response.body, {
      status: response.status,
      headers: applySecurityHeaders(new Headers(response.headers), url.pathname),
    });
  }

  const filePath = resolveInsideDist(url.pathname);
  if (!filePath) return text("Richiesta non valida", 400, url.pathname);

  const file = Bun.file(filePath);
  if (await file.exists()) return new Response(file, { headers: headersFor(url.pathname) });

  if (!isNavigation(request, url.pathname)) return text("Not found", 404, url.pathname);

  // Fallback SPA: solo per le navigazioni, con l'HTML sempre rivalidato.
  const index = Bun.file(indexPath);
  if (!(await index.exists())) {
    return text("Build output not found. Run `bun run build` first.", 500, url.pathname);
  }

  const headers = applySecurityHeaders(
    new Headers({ "Cache-Control": REVALIDATE, "Content-Type": "text/html; charset=utf-8" }),
    url.pathname,
  );
  return new Response(index, { headers });
}

export function startServer(port = Number(process.env.PORT ?? 3000)) {
  const server = Bun.serve({ port, fetch: handleRequest });
  console.log(`Web server listening on http://localhost:${server.port}`);
  return server;
}
