import { describe, expect, test } from "bun:test";

import { handleRequest } from "./http-server";

/**
 * Questi test girano senza build: verificano ciò che il server garantisce
 * sempre (header, errori, routing), non il contenuto di `dist/`.
 */
function request(pathname: string, headers: Record<string, string> = {}) {
  return handleRequest(new Request(`http://localhost${pathname}`, { headers }));
}

describe("server di produzione", () => {
  test("l'HTML porta la policy stretta e gli header di sicurezza", async () => {
    const response = await request("/");
    const csp = response.headers.get("content-security-policy") ?? "";

    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-inline' https://cdn.tailwindcss.com");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=");
  });

  test("la pagina legacy ha una policy propria, larga solo quanto le serve", async () => {
    const response = await request("/confini-morali-dell-ai.html");
    const csp = response.headers.get("content-security-policy") ?? "";

    expect(csp).toContain("https://cdn.tailwindcss.com");
    expect(csp).toContain("https://d3js.org");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("un URL malformato risponde 400 e resta una risposta completa", async () => {
    const response = await request("/%E0%A4%A");

    expect(response.status).toBe(400);
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
  });

  test("un asset mancante resta 404 con gli header di sicurezza", async () => {
    const response = await request("/assets/manca.js");

    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("il tentativo di uscire da dist/ viene rifiutato", async () => {
    const response = await request("/../../package.json");

    expect([400, 404]).toContain(response.status);
  });

  test("l'HTML non si può mettere in cache: una policy nuova deve arrivare subito", async () => {
    expect((await request("/")).headers.get("cache-control")).toBe("no-cache");
    expect((await request("/confini-morali-dell-ai.html")).headers.get("cache-control")).toBe(
      "no-cache",
    );
  });

  test("/api risponde con la policy dell'app, non con quella della pagina legacy", async () => {
    const response = await request("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(response.headers.get("content-security-policy")).not.toContain("cdn.tailwindcss.com");
  });
});
