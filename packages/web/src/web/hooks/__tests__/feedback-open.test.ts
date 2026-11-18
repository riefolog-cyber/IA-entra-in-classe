import { describe, expect, test } from "bun:test";

import { openInNewTab } from "../use-feedback";

/**
 * Il questionario si apre in una nuova scheda. `window.open(url, "_blank",
 * "noopener")` restituisce sempre `null` per specifica: usarlo per capire se la
 * scheda si è aperta fa credere al sito che il browser l'abbia bloccata, ogni
 * volta. Il test fissa il comportamento corretto con entrambe le risposte.
 */
describe("apertura del questionario", () => {
  test("una finestra aperta vale come successo e perde il riferimento all'opener", () => {
    const fake = { opener: {} as unknown, closed: false };
    const calls: string[] = [];
    const open = (url: string, target: string) => {
      calls.push(`${url} ${target}`);
      return fake as unknown as Window;
    };

    expect(openInNewTab("https://example.test/form", open as typeof window.open)).toBe(true);
    expect(calls[0]).toBe("https://example.test/form _blank");
    expect(fake.opener).toBeNull();
  });

  test("nessuna finestra (popup bloccato) vale come fallimento", () => {
    const open = () => null;

    expect(openInNewTab("https://example.test/form", open as typeof window.open)).toBe(false);
  });
});
