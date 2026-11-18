import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * Il registro delle letture è coperto anche dall'e2e, ma l'eliminazione in due
 * passi e l'annullamento sono proprio i gesti in cui un errore costa il testo
 * incollato: qui si provano in isolamento, senza browser.
 */
let dom: JSDOM;
let container: HTMLElement;

const READING =
  "Lettura di prova abbastanza lunga da essere conservata: contiene una riflessione sul quaderno.";

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
  globals.navigator = dom.window.navigator;

  const data = new Map<string, string>();
  globals.localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };

  container = dom.window.document.getElementById("root") as HTMLElement;
});

afterAll(() => dom.window.close());

beforeEach(() => {
  localStorage.clear();
  container.innerHTML = "";
});

function button(label: RegExp): HTMLButtonElement {
  const found = [...container.querySelectorAll("button")].find((element) =>
    label.test(element.textContent ?? ""),
  );
  if (!found) throw new Error(`Pulsante non trovato: ${label}`);
  return found as HTMLButtonElement;
}

/** React ascolta l'evento `input`: impostare `value` da solo non basta. */
function type(element: HTMLTextAreaElement | HTMLInputElement, value: string) {
  const prototype =
    element instanceof dom.window.HTMLTextAreaElement
      ? dom.window.HTMLTextAreaElement.prototype
      : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

describe("registro delle letture", () => {
  test("conserva una lettura e la elimina solo dopo conferma", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { ReadingLog } = await import("../reading-log");

    const root = createRoot(container);
    await act(async () => {
      root.render(<ReadingLog scope={-1} />);
    });

    await act(async () => {
      type(container.querySelector("textarea") as HTMLTextAreaElement, READING);
    });
    await act(async () => {
      button(/Conserva la lettura/).click();
    });

    expect(container.textContent).toContain("Leggi la lettura conservata");

    // Primo clic: chiede conferma, non elimina.
    await act(async () => {
      button(/Elimina/).click();
    });
    expect(container.textContent).toContain("Conferma eliminazione");
    expect(container.textContent).toContain("Leggi la lettura conservata");

    // Annulla: la lettura resta.
    await act(async () => {
      button(/Annulla/).click();
    });
    expect(container.textContent).toContain("Leggi la lettura conservata");

    // Elimina e conferma: sparisce dal registro e dallo storage.
    await act(async () => {
      button(/Elimina/).click();
    });
    await act(async () => {
      button(/Conferma eliminazione/).click();
    });

    expect(container.textContent).not.toContain("Leggi la lettura conservata");
    expect(localStorage.getItem("restare-umani-letture-v1")).toBe("[]");

    await act(async () => root.unmount());
  });

  test("«Cancella i miei dati» svuota anche il registro aperto", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { ReadingLog } = await import("../reading-log");

    const root = createRoot(container);
    await act(async () => {
      root.render(<ReadingLog scope={2} />);
    });
    await act(async () => {
      type(container.querySelector("textarea") as HTMLTextAreaElement, READING);
    });
    await act(async () => {
      button(/Conserva la lettura/).click();
    });
    expect(container.textContent).toContain("Leggi la lettura conservata");
    expect(container.textContent).toContain("tappa 3");

    await act(async () => {
      localStorage.removeItem("restare-umani-letture-v1");
      dom.window.dispatchEvent(new dom.window.Event("notebook:cleared"));
    });

    expect(container.textContent).not.toContain("Leggi la lettura conservata");
    await act(async () => root.unmount());
  });
});
