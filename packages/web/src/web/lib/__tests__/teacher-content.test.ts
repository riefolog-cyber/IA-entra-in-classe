import { describe, expect, test } from "bun:test";

import { emptyState, references, steps, glossary } from "../teacher-content";
import { buildTeacherProfile } from "../teacher-profile";

const serialized = JSON.stringify(steps);

describe("contenuti del percorso docenti", () => {
  test("ci sono dieci tappe complete", () => {
    expect(steps).toHaveLength(10);
  });

  test("ogni tappa ha i campi richiesti e indici validi", () => {
    for (const step of steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.intro.length).toBeGreaterThan(0);
      expect(step.concept.length).toBeGreaterThan(0);
      expect(step.prompts.length).toBeGreaterThan(0);
      expect(step.options.length).toBeGreaterThanOrEqual(3);
      expect(step.correct).toBeGreaterThanOrEqual(0);
      expect(step.correct).toBeLessThan(step.options.length);
      expect(step.choices.length).toBe(step.perspectives.length);
      expect(new Set(step.options).size).toBe(step.options.length);
    }
  });

  test("non usa più il linguaggio della scuola di base né micro-quiz", () => {
    expect(serialized).not.toMatch(/alunn/i);
    expect(serialized).not.toMatch(/microQuestion|microOptions|microCorrect|microExplanation/);
  });

  test("non contiene mojibake o refusi noti", () => {
    expect(serialized).not.toContain("Ã");
    expect(serialized).not.toContain("correta");
    expect(serialized).not.toContain("velocita ");
    expect(serialized).not.toContain("perche ");
  });

  test("i riferimenti sono URL https", () => {
    expect(references.length).toBeGreaterThanOrEqual(4);
    for (const reference of references) {
      expect(reference.title.length).toBeGreaterThan(0);
      expect(reference.url.startsWith("https://")).toBe(true);
    }
  });

  test("i rimandi del glossario puntano a tappe esistenti", () => {
    for (const [, , refs] of glossary) {
      if (!Array.isArray(refs)) continue;
      for (const ref of refs) {
        expect(ref).toBeGreaterThanOrEqual(1);
        expect(ref).toBeLessThanOrEqual(steps.length);
      }
    }
  });
});

describe("profilo locale", () => {
  test("resta utilizzabile senza il servizio IA", () => {
    const profile = buildTeacherProfile({
      ...emptyState,
      answers: {
        "0-p0": "Vorrei verificare le fonti e controllare gli errori dei materiali generati.",
        "0-quiz": "1",
        "0-scenario": "0",
        "0-reason": "Mi confronto con un collega e documento le scelte fatte in classe.",
      },
      completed: [0],
    });

    expect(profile.headline.length).toBeGreaterThan(0);
    expect(profile.strengths.length).toBeGreaterThan(0);
    expect(profile.questions.length).toBeGreaterThan(0);
  });
});
