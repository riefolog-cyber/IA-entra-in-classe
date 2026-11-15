import { describe, expect, test } from "bun:test";

import { renderStepPage, renderStepsIndex } from "../prerender";
import { steps } from "../teacher-content";

describe("pagine statiche delle tappe", () => {
  test("la pagina contiene testo, opzioni e il rimando alla tappa nell'app", () => {
    const html = renderStepPage(steps[0], 0);

    expect(html).toContain("Tappa 1 di 10");
    expect(html).toContain(steps[0].title);
    expect(html).toContain('href="../#/tappa/1"');
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
    // Le opzioni sono pubblicate nell'ordine originale, la soluzione no: né la
    // spiegazione né un contrassegno dell'opzione corretta finiscono nella pagina.
    steps[0].options.forEach((option) => expect(html).toContain(option));
    expect(html).not.toContain(steps[0].explanation);
    expect(html).not.toContain('class="correct"');
  });

  test("il testo dei contenuti non può iniettare markup", () => {
    const hostile = { ...steps[0], title: "<script>alert('x')</script>", subtitle: 'a "b" & c' };
    const html = renderStepPage(hostile, 0);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;b&quot; &amp; c");
  });

  test("l'indice elenca tutte le tappe", () => {
    const html = renderStepsIndex();

    steps.forEach((_, index) => {
      expect(html).toContain(`./tappa-${index + 1}.html`);
    });
  });
});
