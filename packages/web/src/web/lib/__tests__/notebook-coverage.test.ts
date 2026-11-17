import { describe, expect, test } from "bun:test";

import { describeCoverage, notebookCoverage } from "../notebook-coverage";
import { steps, type SavedState } from "../teacher-content";

const empty: SavedState = { answers: {}, completed: [], current: 0, name: "" };

describe("copertura del quaderno", () => {
  test("un quaderno vuoto dichiara tutte le tappe da lavorare", () => {
    const coverage = notebookCoverage(empty);
    expect(coverage.worked).toEqual([]);
    expect(coverage.empty).toHaveLength(steps.length);
    expect(coverage.fieldsAnswered).toBe(0);
    expect(describeCoverage(coverage)).toContain("0 tappe lavorate su 10");
    expect(describeCoverage(coverage)).toContain("ancora vuote: 1, 2, 3");
  });

  test("una risposta troppo breve non conta come tappa lavorata", () => {
    const coverage = notebookCoverage({ ...empty, answers: { "0-p0": "sì" } });
    expect(coverage.worked).toEqual([]);
  });

  test("una riflessione vera rende la tappa lavorata", () => {
    const coverage = notebookCoverage({
      ...empty,
      answers: { "0-p0": "Ho verificato le fonti prima di usare la scheda in classe." },
    });
    expect(coverage.worked).toEqual([0]);
    expect(describeCoverage(coverage)).toContain("1 tappa lavorata su 10");
  });

  test("basta la verifica, lo scenario o la tappa conclusa", () => {
    expect(notebookCoverage({ ...empty, answers: { "1-quiz": "0" } }).worked).toEqual([1]);
    expect(notebookCoverage({ ...empty, answers: { "2-scenario": "1" } }).worked).toEqual([2]);
    expect(notebookCoverage({ ...empty, completed: [3] }).worked).toEqual([3]);
  });

  test("conta campi e verifiche corrette", () => {
    const coverage = notebookCoverage({
      ...empty,
      answers: {
        "0-p0": "Riflessione abbastanza lunga da contare.",
        "0-quiz": String(steps[0].correct),
        "1-quiz": String((steps[1].correct + 1) % steps[1].options.length),
      },
    });

    expect(coverage.fieldsAnswered).toBe(3);
    expect(coverage.quizAnswered).toBe(2);
    expect(coverage.quizCorrect).toBe(1);
  });
});
