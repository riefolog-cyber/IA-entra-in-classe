import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import app from "../../index";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function makeRequest(summary = "prova") {
  return new Request("http://localhost/api/rpc/analyzeProfile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: { summary } }),
  });
}

async function readResult(response: Response) {
  const body = (await response.json()) as { json: Record<string, unknown> };
  return body.json;
}

beforeEach(() => {
  process.env = { ...originalEnv };
  setEnv({
    AI_ANALYSIS_RATE_LIMIT: "0",
    AI_ANALYSIS_RATE_LIMIT_GLOBAL: "0",
  });
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

describe("analisi IA - rami di errore", () => {
  test("configurazione mancante → missing_config, senza chiamare il provider", async () => {
    setEnv({ AI_GATEWAY_BASE_URL: undefined, AI_GATEWAY_API_KEY: undefined });

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("nope", { status: 500 });
    }) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("missing_config");
    expect(calls).toBe(0);
  });

  test("timeout del provider → reason timeout, messaggio dedicato", async () => {
    setEnv({
      AI_GATEWAY_BASE_URL: "https://example.test",
      AI_GATEWAY_API_KEY: "chiave-di-prova",
    });

    globalThis.fetch = (async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    }) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("timeout");
    expect(String(result.message)).toContain("troppo tempo");
  });

  test("errore di rete → retry una volta, poi network_error", async () => {
    setEnv({
      AI_GATEWAY_BASE_URL: "https://example.test",
      AI_GATEWAY_API_KEY: "chiave-di-prova",
    });

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new TypeError("Unable to connect");
    }) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("network_error");
    expect(String(result.message)).toContain("problema di rete");
    expect(calls).toBe(2);
  });

  test("provider non ok → provider_error con il codice HTTP", async () => {
    setEnv({
      AI_GATEWAY_BASE_URL: "https://example.test",
      AI_GATEWAY_API_KEY: "chiave-di-prova",
    });

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("boom", { status: 503 });
    }) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("provider_error");
    expect(String(result.message)).toContain("503");
    expect(calls).toBe(1);
  });

  test("risposta non JSON → invalid_response", async () => {
    setEnv({
      AI_GATEWAY_BASE_URL: "https://example.test",
      AI_GATEWAY_API_KEY: "chiave-di-prova",
    });

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "non è json" } }] }), {
        status: 200,
      })) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalid_response");
  });

  test("successo → ok con l'analisi parsata", async () => {
    setEnv({
      AI_GATEWAY_BASE_URL: "https://example.test",
      AI_GATEWAY_API_KEY: "chiave-di-prova",
    });

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '{"headline":"Titolo","narrative":"Testo","strengths":["a"],"tensions":["b"],"questions":["c"],"nextStep":"d","caution":"e"}',
              },
            },
          ],
        }),
        { status: 200 },
      )) as typeof fetch;

    const result = await readResult(await app.fetch(makeRequest()));

    expect(result.ok).toBe(true);
    expect((result.analysis as { headline: string }).headline).toBe("Titolo");
    expect((result.analysis as { strengths: string[] }).strengths).toEqual(["a"]);
  });
});
