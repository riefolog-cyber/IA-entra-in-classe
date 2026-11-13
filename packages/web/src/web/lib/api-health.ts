/**
 * Verifica che l'API esista davvero.
 *
 * Su un host statico con fallback SPA (Netlify, Vercel, `vite preview`) la
 * richiesta a `/api/health` restituisce 200 con l'HTML della pagina: fidarsi
 * del solo status mostrerebbe l'analisi IA su un sito che non ha backend.
 */
export async function checkApiHealth(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetchImpl("/api/health", {
      headers: { accept: "application/json" },
    });

    if (!response.ok) return false;
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) return false;

    const payload = (await response.json()) as { status?: unknown } | null;
    return payload?.status === "ok";
  } catch {
    return false;
  }
}
