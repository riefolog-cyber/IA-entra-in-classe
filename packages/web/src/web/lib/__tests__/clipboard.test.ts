import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * Appunti e download sono i due modi con cui il docente porta fuori il prompt
 * e le letture. Se il ripiego non funziona, non c'è un terzo modo: il test
 * copre il percorso che i browser limitano davvero (appunti negati, http non
 * sicuro) e il download.
 */
let dom: JSDOM;
let clicked: Array<{ download: string; href: string }> = [];
let lastBlob: Blob | null = null;

beforeAll(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = dom.window;
  globals.document = dom.window.document;
  globals.HTMLElement = dom.window.HTMLElement;
  globals.navigator = dom.window.navigator;

  // jsdom non implementa gli object URL: bastano due sostituti registrabili.
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: (blob: Blob) => {
      lastBlob = blob;
      return "blob:test";
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });

  dom.window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    clicked.push({ download: this.download, href: this.href });
  };
});

afterAll(() => dom.window.close());

beforeEach(() => {
  clicked = [];
  lastBlob = null;
});

describe("appunti e download", () => {
  test("copia con l'API degli appunti quando c'è", async () => {
    const { copyText } = await import("../clipboard");
    let copied: string | null = null;
    Object.defineProperty(dom.window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => void (copied = text) },
    });

    expect(await copyText("ciao")).toBe(true);
    expect(copied).toBe("ciao");
  });

  test("se gli appunti sono negati usa il ripiego e dice se è riuscito", async () => {
    const { copyText } = await import("../clipboard");
    Object.defineProperty(dom.window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("NotAllowedError");
        },
      },
    });

    (dom.window.document as Document & { execCommand: (command: string) => boolean }).execCommand =
      () => true;
    expect(await copyText("testo")).toBe(true);

    (dom.window.document as Document & { execCommand: (command: string) => boolean }).execCommand =
      () => false;
    expect(await copyText("testo")).toBe(false);
  });

  test("il download propone un file con il nome richiesto", async () => {
    const { downloadText } = await import("../clipboard");

    downloadText("contenuto", "prompt-gemini-quaderno.txt");

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe("prompt-gemini-quaderno.txt");
    expect(clicked[0].href).toContain("blob:test");
    expect(lastBlob?.type).toBe("text/plain;charset=utf-8");
  });

  test("il tipo del file si può scegliere: il backup JSON resta JSON", async () => {
    const { downloadText } = await import("../clipboard");

    downloadText("{}", "restare-umani-dati.json", "application/json;charset=utf-8");

    expect(clicked[0].download).toBe("restare-umani-dati.json");
    expect(lastBlob?.type).toBe("application/json;charset=utf-8");
  });
});
