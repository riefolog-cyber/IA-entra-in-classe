import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * Smoke test sul difetto corretto questa settimana: con un deep link
 * (`#/tappa/3`) la vista deve mostrare la tappa della rotta e usare le sue
 * chiavi di risposta, non quelle della tappa salvata nel quaderno.
 */
let dom: JSDOM;

beforeAll(() => {
  dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost/#/tappa/3",
  });

  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = dom.window;
  globals.document = dom.window.document;
  globals.navigator = dom.window.navigator;
  globals.HTMLElement = dom.window.HTMLElement;
  globals.Node = dom.window.Node;
  // wouter legge `location`/`history` come globali, non da `window`.
  globals.location = dom.window.location;
  globals.history = dom.window.history;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  globals.requestAnimationFrame = (cb: FrameRequestCallback) =>
    dom.window.setTimeout(() => cb(Date.now()), 0);
  globals.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);
});

afterAll(() => dom.window.close());

describe("deep link su una tappa", () => {
  test("mostra la tappa della rotta con le sue chiavi di risposta", async () => {
    const { act } = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { default: Learning } = await import("../../index");

    const container = dom.window.document.getElementById("root");
    expect(container).not.toBeNull();

    const root = createRoot(container as HTMLElement);
    await act(async () => {
      root.render(<Learning />);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const text = container?.textContent ?? "";
    expect(text).toContain("Valutare senza delegare il giudizio");
    expect(text).toContain("TAPPA 3 / 10");

    const firstRadio = container?.querySelector("input[type=radio]");
    expect(firstRadio?.getAttribute("name")).toBe("quiz-2");

    await act(async () => {
      root.unmount();
    });
  });
});
