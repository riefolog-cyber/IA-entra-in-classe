import { steps, type SavedState } from "./teacher-content";

/**
 * Che cosa il quaderno contiene davvero.
 *
 * La regola è una sola in tutto il sito: una tappa è "lavorata" se ha almeno
 * una risposta scritta, una verifica, uno scenario scelto o è segnata come
 * conclusa. Serve a dire al docente, prima dell'invio, su che cosa il modello
 * potrà fondarsi e quali tappe resteranno mute.
 */
export const MIN_MEANINGFUL = 12;

export type Coverage = {
  /** Indici 0-based delle tappe lavorate. */
  worked: number[];
  /** Indici 0-based delle tappe ancora vuote. */
  empty: number[];
  total: number;
  fieldsAnswered: number;
  fieldsTotal: number;
  quizAnswered: number;
  quizCorrect: number;
};

function hasAnswer(value: string | undefined): boolean {
  return (value ?? "").trim().length >= MIN_MEANINGFUL;
}

export function notebookCoverage(data: SavedState): Coverage {
  const worked: number[] = [];

  const fieldsTotal = steps.reduce((total, step) => total + step.prompts.length + 3, 0);

  const fieldsAnswered = steps.reduce((total, step, index) => {
    const prompts = step.prompts.filter((_, n) => hasAnswer(data.answers[`${index}-p${n}`])).length;
    const reason = hasAnswer(data.answers[`${index}-reason`]) ? 1 : 0;
    const quiz = data.answers[`${index}-quiz`] !== undefined ? 1 : 0;
    const scenario = data.answers[`${index}-scenario`] !== undefined ? 1 : 0;
    return total + prompts + reason + quiz + scenario;
  }, 0);

  steps.forEach((step, index) => {
    const prompts = step.prompts.some((_, n) => hasAnswer(data.answers[`${index}-p${n}`]));
    const reason = hasAnswer(data.answers[`${index}-reason`]);
    const quiz = data.answers[`${index}-quiz`] !== undefined;
    const scenario = data.answers[`${index}-scenario`] !== undefined;

    if (prompts || reason || quiz || scenario || data.completed.includes(index)) {
      worked.push(index);
    }
  });

  const quizAnswered = steps.filter(
    (_, index) => data.answers[`${index}-quiz`] !== undefined,
  ).length;
  const quizCorrect = steps.filter(
    (step, index) => data.answers[`${index}-quiz`] === String(step.correct),
  ).length;

  return {
    worked,
    empty: steps.map((_, index) => index).filter((index) => !worked.includes(index)),
    total: steps.length,
    fieldsAnswered,
    fieldsTotal,
    quizAnswered,
    quizCorrect,
  };
}

/** Frase pronta per l'interfaccia: "6 tappe lavorate su 10; vuote: 4, 5, 9". */
export function describeCoverage(coverage: Coverage): string {
  const empty = coverage.empty.map((index) => index + 1).join(", ");
  return `${coverage.worked.length} ${coverage.worked.length === 1 ? "tappa lavorata" : "tappe lavorate"} su ${coverage.total}${
    empty ? `; ancora vuote: ${empty}` : ""
  }.`;
}
