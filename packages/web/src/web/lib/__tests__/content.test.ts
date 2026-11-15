import { describe, expect, test } from "bun:test";

import { glossary, references, stepSources, steps } from "../teacher-content";

/**
 * Controlli di **struttura**: numero di opzioni, indici validi, prospettive
 * abbinate alle scelte. Le lunghezze dei testi non sono verificate qui — sono
 * scelte editoriali, e una soglia di caratteri romperebbe la CI per una frase
 * accorciata senza che nulla sia rotto (la forma è già validata al caricamento).
 */
describe("contenuti del percorso", () => {
  test("dieci tappe con titoli e etichette distinte", () => {
    expect(steps.length).toBe(10);
    expect(new Set(steps.map((step) => step.title)).size).toBe(steps.length);
    expect(new Set(steps.map((step) => step.short)).size).toBe(steps.length);
  });

  test("ogni verifica ha tre opzioni e una soluzione dentro l'intervallo", () => {
    for (const step of steps) {
      expect(step.options.length).toBe(3);
      expect(Number.isInteger(step.correct)).toBe(true);
      expect(step.correct).toBeGreaterThanOrEqual(0);
      expect(step.correct).toBeLessThan(step.options.length);
      expect(step.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  test("ogni scenario ha una prospettiva per scelta", () => {
    for (const step of steps) {
      expect(step.choices.length).toBe(step.perspectives.length);
      step.choices.forEach((choice, index) => {
        expect(choice.trim().length).toBeGreaterThan(0);
        expect(step.perspectives[index]?.trim().length).toBeGreaterThan(0);
      });
    }
  });

  test("riferimenti e glossario puntano a risorse e tappe esistenti", () => {
    expect(stepSources.length).toBe(steps.length);

    stepSources.forEach((sources) => {
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach((index) => expect(references[index]).toBeDefined());
    });

    glossary.forEach(([term, definition, mentionedIn]) => {
      expect(term.trim().length).toBeGreaterThan(0);
      expect(definition.trim().length).toBeGreaterThan(0);
      expect(mentionedIn.length).toBeGreaterThan(0);
      mentionedIn.forEach((number) => {
        expect(number).toBeGreaterThanOrEqual(1);
        expect(number).toBeLessThanOrEqual(steps.length);
      });
    });
  });

  test("ogni tappa ha domande aperte e uno scenario", () => {
    for (const step of steps) {
      expect(step.prompts.length).toBeGreaterThan(0);
      step.prompts.forEach((prompt) => expect(prompt.trim().length).toBeGreaterThan(0));
      expect(step.scenario.trim().length).toBeGreaterThan(0);
    }
  });
});
