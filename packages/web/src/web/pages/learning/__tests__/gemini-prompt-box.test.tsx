import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * Il prompt per Gemini è l'unica lettura rimasta: se il pulsante non copia,
 * il docente resta senza nulla. Il test controlla il percorso reale: clic,
 * appunti, etichetta di conferma.
 */
let dom: JSDOM;
let copied: string | null = null;

const state = {
  answers: { "0-p0": "Ho verificato le fonti prima di usare la scheda in classe." },
  completed: [0],
  current: 0,
  name: "",
};

beforeAll(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/#/riepilogo",
  });

  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = dom.window;
  globals.document = dom.window.document;
  globals.HTMLElement = dom.window.HTMLElement;
  globals.Node = dom.window.Node;
  globals.IS_REACT_ACT_ENVIRONMENT = true;

  Object.defineProperty(dom.window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  globals.navigator = dom.window.navigator;
});

afterAll(() => dom.window.close());

describe("prompt per Gemini", () => {
  test("il pulsante copia il prompt e conferma", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { GeminiPromptBox } = await import("../gemini-prompt-box");

    const container = dom.window.document.getElementById("root");
    expect(container).not.toBeNull();
    const root = createRoot(container as HTMLElement);

    await act(async () => {
      root.render(<GeminiPromptBox data={state} />);
    });

    const copyButton = [...dom.window.document.querySelectorAll("button")].find((button) =>
      /Copia il prompt/.test(button.textContent ?? ""),
    );
    expect(copyButton).toBeDefined();

    await act(async () => {
      copyButton?.click();
      // La copia è asincrona: si lascia girare la microtask prima dell'assert.
      await Promise.resolve();
    });

    expect(copied ?? "").toContain("10 tappe");
    expect(copied ?? "").toContain("citazione letterale");
    expect(dom.window.document.body.textContent ?? "").toContain("Prompt copiato");

    await act(async () => {
      root.unmount();
    });
  });

  test("avvisa che caricare il PDF invia il nome in copertina", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { GeminiPromptBox } = await import("../gemini-prompt-box");

    const container = dom.window.document.createElement("div");
    dom.window.document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeminiPromptBox data={state} />);
    });

    expect(container.textContent ?? "").toContain("nome in copertina");
    expect(container.textContent ?? "").toContain("1 tappa lavorata su 10");
    expect(container.textContent ?? "").toContain("ancora vuote");
    expect(container.querySelector("select")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
