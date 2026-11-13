import { describe, expect, test } from "bun:test";

import { checkApiHealth } from "../api-health";

const jsonOk = () =>
  new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("disponibilità dell'API", () => {
  test("riconosce il backend quando risponde JSON con status ok", async () => {
    expect(await checkApiHealth((async () => jsonOk()) as typeof fetch)).toBe(true);
  });

  test("rifiuta il fallback SPA: 200 con HTML non è un backend", async () => {
    const html = new Response("<!doctype html><title>app</title>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    expect(await checkApiHealth((async () => html) as typeof fetch)).toBe(false);
  });

  test("rifiuta un JSON che non dichiara lo stato atteso", async () => {
    const wrong = new Response(JSON.stringify({ hello: "world" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    expect(await checkApiHealth((async () => wrong) as typeof fetch)).toBe(false);
  });

  test("un errore di rete vale come backend assente", async () => {
    const failing = (async () => {
      throw new TypeError("offline");
    }) as typeof fetch;

    expect(await checkApiHealth(failing)).toBe(false);
  });
});
