import { describe, expect, test } from "bun:test";

import fs from "node:fs";
import path from "node:path";

import {
  GEMINI_ANALYSIS_PROMPT,
  GEMINI_CORRECTION_PROMPT,
  GEMINI_JSON_SUFFIX,
  GEMINI_OTHER_MODELS,
  GEMINI_PRIVACY_NOTE,
  buildGeminiStepPrompt,
} from "../gemini-prompt";

describe("prompt per l'analisi esterna", () => {
  test("chiede di considerare tutte e dieci le tappe", () => {
    expect(GEMINI_ANALYSIS_PROMPT).toContain("ha 10 tappe");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("tappa 1 … tappa 10");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("non ancora lavorata");
  });

  test("pretende citazioni letterali e vieta di inventarle", () => {
    expect(GEMINI_ANALYSIS_PROMPT).toContain("citazione letterale");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Non inventare citazioni");
  });

  test("distingue le parole del docente dal materiale del corso", () => {
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Considera MIE SOLO");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("«Una chiave di lettura»");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("«Risposta corretta»");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("La mia motivazione");
  });

  test("usa le etichette che il PDF contiene davvero", () => {
    // Le etichette sono quelle stampate da export-pdf.ts: se cambiano là, il
    // prompt deve cambiare qui, altrimenti il modello non trova le risposte.
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Risposta scelta");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Scelta personale");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Tappa segnata come conclusa");
    expect(GEMINI_ANALYSIS_PROMPT).not.toContain("Riflessione 1");
  });

  test("mantiene le cautele: nessuna diagnosi, nessun voto", () => {
    expect(GEMINI_ANALYSIS_PROMPT).toContain("Non fare diagnosi");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("non dare punteggi");
    expect(GEMINI_ANALYSIS_PROMPT).toContain("campo vuoto è un dato mancante");
  });

  test("chiede tutte le sezioni del quadro", () => {
    for (let section = 1; section <= 11; section += 1) {
      expect(GEMINI_ANALYSIS_PROMPT).toContain(`\n${section}. `);
    }
  });

  test("la correzione resta ancorata alle dieci tappe", () => {
    expect(GEMINI_CORRECTION_PROMPT).toContain("tutte e dieci le tappe");
  });

  test("la variante JSON elenca i campi del quadro", () => {
    expect(GEMINI_JSON_SUFFIX).toContain("nextSteps");
    expect(GEMINI_JSON_SUFFIX).toContain("confidence");
    expect(GEMINI_JSON_SUFFIX).toContain("evidence");
  });

  test("l'avviso privacy nomina il nome in copertina", () => {
    expect(GEMINI_PRIVACY_NOTE).toContain("nome in copertina");
  });
});

describe("contratto tra prompt e PDF", () => {
  test("ogni etichetta citata nel prompt esiste nel PDF", () => {
    // Se export-pdf.ts rinomina una sezione, il prompt non deve più citarla o
    // il modello cerca parole che nel PDF non ci sono.
    const pdfSource = fs.readFileSync(path.join(import.meta.dir, "..", "export-pdf.ts"), "utf8");
    const labels = [...GEMINI_ANALYSIS_PROMPT.matchAll(/«([^»]+)»/g)].map((match) => match[1]);

    expect(labels.length).toBeGreaterThan(3);
    for (const label of labels) {
      expect(pdfSource).toContain(label);
    }
  });

  test("indica come usare un altro modello", () => {
    expect(GEMINI_OTHER_MODELS).toContain("ChatGPT");
    expect(GEMINI_OTHER_MODELS).toContain("PDF");
  });

  test("il prompt di una tappa parla di quella tappa", () => {
    const prompt = buildGeminiStepPrompt(4, "Valutazione e feedback");
    expect(prompt).toContain("tappa 4");
    expect(prompt).toContain("Valutazione e feedback");
    expect(prompt).toContain("citazione letterale");
    expect(prompt).toContain("una sola tappa");
  });
});
