import { describe, expect, test } from "bun:test";

import {
  buildAiSummary,
  buildAnalysisPayload,
  MAX_SUMMARY_CHARS,
  redactPersonalData,
} from "../ai-summary";
import { steps, type SavedState } from "../teacher-content";

/** Quaderno con tutte le tappe compilate: il caso in cui il vecchio taglio faceva danno. */
function fullNotebook(answer = "Riflessione sull'uso dell'IA in classe, con criteri e verifiche.") {
  const answers: Record<string, string> = {};
  steps.forEach((step, i) => {
    step.prompts.forEach((_, n) => {
      answers[`${i}-p${n}`] = answer;
    });
    answers[`${i}-quiz`] = String(step.correct);
    answers[`${i}-scenario`] = "0";
    answers[`${i}-reason`] = "Motivo della scelta, con un esempio di classe.";
  });
  return {
    answers,
    completed: steps.map((_, i) => i),
    current: 0,
    name: "Maria Rossi",
  } satisfies SavedState;
}

describe("testo inviato all'analisi IA", () => {
  test("contiene tutte e dieci le tappe, anche quando le risposte sono lunghissime", () => {
    const long = "parola ".repeat(1200);
    const summary = buildAiSummary(fullNotebook(long));

    for (let i = 1; i <= steps.length; i += 1) {
      expect(summary).toContain(`TAPPA ${i} DI ${steps.length}`);
    }
    expect(summary.length).toBeLessThanOrEqual(MAX_SUMMARY_CHARS);
  });

  test("le tappe non lavorate sono dichiarate, non omesse", () => {
    const summary = buildAiSummary({ answers: {}, completed: [], current: 0, name: "" });
    expect(summary).toContain("TAPPA 1 DI 10");
    expect(summary).toContain("TAPPA 10 DI 10");
    expect(summary).toContain("non ancora lavorata");
  });

  test("il nome del docente non viene inviato", () => {
    const summary = buildAiSummary(fullNotebook());
    expect(summary).not.toContain("Maria Rossi");
  });

  test("email e numeri lunghi vengono rimossi e contati", () => {
    const { text, count } = redactPersonalData(
      "Scrivi a mario.bianchi@scuola.it oppure chiama 333 123 4567.",
    );
    expect(text).not.toContain("mario.bianchi@scuola.it");
    expect(text).toContain("[email rimossa]");
    expect(text).toContain("[numero rimosso]");
    expect(count).toBe(2);
  });

  test("le date e i numeri brevi restano", () => {
    const { text, count } = redactPersonalData("Il 12/03/2025 ho fatto 3 prove con 24 studenti.");
    expect(count).toBe(0);
    expect(text).toContain("12/03/2025");
  });

  test("la scheda strutturata descrive la copertura reale", () => {
    const partial: SavedState = {
      answers: { "0-p0": "Ho verificato le fonti prima di usare la scheda." },
      completed: [0],
      current: 0,
      name: "",
    };
    const { dossier, redactions } = buildAnalysisPayload(partial);

    expect(dossier.steps).toHaveLength(steps.length);
    expect(dossier.coverage.stepsTotal).toBe(steps.length);
    expect(dossier.coverage.stepsWorked).toBe(1);
    expect(dossier.coverage.emptySteps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(dossier.steps[0].worked).toBe(true);
    expect(dossier.steps[1].worked).toBe(false);
    expect(redactions).toBe(0);
  });

  test("la verifica segnala corretto e non corretto", () => {
    const state = fullNotebook();
    const wrong = (steps[0].correct + 1) % steps[0].options.length;
    state.answers["0-quiz"] = String(wrong);
    const { dossier } = buildAnalysisPayload(state);

    expect(dossier.steps[0].quiz?.isCorrect).toBe(false);
    expect(dossier.steps[1].quiz?.isCorrect).toBe(true);
    expect(dossier.coverage.quizCorrect).toBe(steps.length - 1);
  });
});
