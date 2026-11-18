import { describe, expect, test } from "bun:test";

import { prefilledFeedbackUrl } from "../use-feedback";

/**
 * Il questionario si compila qui e si invia su Google. Se il precompilamento
 * sbaglia un entry ID, l'utente apre un modulo vuoto e deve riscrivere tutto:
 * per questo l'indirizzo è verificabile senza aprire il browser.
 */
describe("indirizzo del questionario", () => {
  test("porta le risposte negli entry del modulo", () => {
    const url = new URL(prefilledFeedbackUrl({ u: 4, c: 5, open: "Più esempi di classe" }));

    expect(url.hostname).toBe("docs.google.com");
    expect(url.searchParams.get("usp")).toBe("pp_url");
    expect(url.searchParams.get("entry.154579810")).toBe("4");
    expect(url.searchParams.get("entry.298496945")).toBe("5");
    expect(url.searchParams.get("entry.948175716")).toBe("Più esempi di classe");
  });

  test("non manda campi vuoti: meglio un modulo parziale che uno con spazi", () => {
    const url = new URL(prefilledFeedbackUrl({ u: 3, c: 0, open: "   " }));

    expect(url.searchParams.get("entry.154579810")).toBe("3");
    expect(url.searchParams.has("entry.298496945")).toBe(false);
    expect(url.searchParams.has("entry.948175716")).toBe(false);
  });
});
