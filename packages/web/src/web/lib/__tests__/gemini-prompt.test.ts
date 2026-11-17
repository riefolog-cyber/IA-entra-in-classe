import { describe, expect, test } from "bun:test";

import {
  GEMINI_ANALYSIS_PROMPT,
  GEMINI_CORRECTION_PROMPT,
  GEMINI_JSON_SUFFIX,
  GEMINI_PRIVACY_NOTE,
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
