import type { AnalysisDossier, DossierStep } from "../../api/routes/analysis/schema";
import type { SavedState } from "./teacher-content";
import { steps } from "./teacher-content";

/**
 * Sintesi testuale del quaderno inviata al servizio IA.
 *
 * Due regole non negoziabili:
 * 1. **tutte e dieci le tappe** sono presenti, anche quelle vuote: prima il
 *    testo veniva tagliato a 11.000 caratteri e le ultime tappe sparivano in
 *    silenzio, quindi l'analisi riguardava un quaderno diverso da quello reale;
 * 2. nessun dato identificativo: il nome del docente è escluso e il testo
 *    viene ripulito da email, numeri di telefono e codici prima dell'invio.
 *
 * Le risposte molto lunghe vengono abbreviate **dentro** la tappa: si perde
 * qualche riga, non un capitolo.
 */

/** Tetto complessivo del testo inviato: dieci tappe complete stanno largamente qui. */
export const MAX_SUMMARY_CHARS = 30_000;

/** Sotto questa soglia una tappa non ha materiale su cui dire qualcosa. */
const MIN_MEANINGFUL = 12;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
/** Numeri lunghi (telefono, cellulare, documento): sequenze di almeno 9 cifre. */
const LONG_NUMBER = /(?:\+?\d[\d\s./-]{7,}\d)/g;

/** Sostituisce i dati che non devono uscire dal dispositivo. */
export function redactPersonalData(text: string): { text: string; count: number } {
  let count = 0;
  const replaced = text
    .replace(EMAIL, () => {
      count += 1;
      return "[email rimossa]";
    })
    .replace(LONG_NUMBER, (match) => {
      // Solo sequenze davvero lunghe: un numero civico o un anno resta.
      const digits = match.replace(/\D/g, "");
      if (digits.length < 9) return match;
      count += 1;
      return "[numero rimosso]";
    });
  return { text: replaced, count };
}

function shorten(text: string, limit: number): string {
  const clean = text.trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, Math.max(0, limit - 1));
  // Chiude sulla parola intera: una frase a metà si legge male.
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > limit * 0.6 ? cut.slice(0, boundary) : cut).trimEnd()}…`;
}

/** Materiale di una tappa, già ripulito. */
function stepMaterial(data: SavedState, index: number) {
  const step = steps[index];
  const answers = step.prompts.map((question, n) => {
    const raw = data.answers[`${index}-p${n}`] || "";
    const { text, count } = redactPersonalData(raw);
    return { field: `Riflessione ${n + 1}`, question, answer: text, redactions: count };
  });

  const reason = redactPersonalData(data.answers[`${index}-reason`] || "");
  const quizKey = data.answers[`${index}-quiz`];
  const scenarioKey = data.answers[`${index}-scenario`];

  return {
    step,
    answers,
    reason: reason.text,
    redactions: answers.reduce((total, entry) => total + entry.redactions, 0) + reason.count,
    quiz: quizKey !== undefined ? (step.options[Number(quizKey)] ?? "") : "",
    quizCorrect: quizKey !== undefined && Number(quizKey) === step.correct,
    scenario: scenarioKey !== undefined ? (step.choices[Number(scenarioKey)] ?? "") : "",
  };
}

function workedStep(data: SavedState, index: number, material: ReturnType<typeof stepMaterial>) {
  return (
    data.completed.includes(index) ||
    material.answers.some((entry) => entry.answer.trim().length >= MIN_MEANINGFUL) ||
    material.reason.trim().length >= MIN_MEANINGFUL ||
    material.quiz !== "" ||
    material.scenario !== ""
  );
}

export type AnalysisPayload = {
  summary: string;
  dossier: AnalysisDossier;
  /** Quanti dati identificativi sono stati rimossi prima dell'invio. */
  redactions: number;
};

/**
 * Costruisce ciò che viene inviato: la scheda strutturata (fase 1) e il testo
 * completo (fase 2, e ripiego per i client che non inviano la scheda).
 */
export function buildAnalysisPayload(data: SavedState): AnalysisPayload {
  const materials = steps.map((_, index) => stepMaterial(data, index));
  const worked = materials.filter((material, index) => workedStep(data, index, material));
  const filledFields = materials.reduce(
    (total, material) =>
      total +
      material.answers.filter((entry) => entry.answer.trim() !== "").length +
      (material.reason.trim() ? 1 : 0) +
      (material.quiz ? 1 : 0) +
      (material.scenario ? 1 : 0),
    0,
  );
  const totalFields = steps.reduce((total, step) => total + step.prompts.length + 3, 0);
  const quizAnswered = materials.filter((material) => material.quiz !== "").length;
  const quizCorrect = materials.filter(
    (material) => material.quiz !== "" && material.quizCorrect,
  ).length;

  const header = [
    `Percorso: ${data.completed.length}/${steps.length} tappe concluse; ${filledFields}/${totalFields} campi compilati; ${quizAnswered} verifiche risposte (${quizCorrect} corrette).`,
    `Tappe lavorate: ${worked.length}/${steps.length}. Tappe non ancora lavorate: ${
      materials
        .map((_, index) => (workedStep(data, index, materials[index]) ? null : index + 1))
        .filter((value): value is number => value !== null)
        .join(", ") || "nessuna"
    }.`,
  ].join("\n");

  // Ogni tappa riceve la stessa quota: nessuna tappa viene sacrificata per
  // fare spazio alle altre.
  const perStepBudget = Math.floor((MAX_SUMMARY_CHARS - header.length) / steps.length);
  const blocks: string[] = [];

  materials.forEach((material, index) => {
    const { step } = material;
    const isWorked = workedStep(data, index, material);

    // Spazio fisso (titolo, quiz, scenario) riservato prima di dividere il resto
    // tra le risposte scritte.
    const fixed = [
      `\nTAPPA ${index + 1} DI ${steps.length} — ${step.title} (${step.phase || step.category})`,
      isWorked ? "Stato: lavorata." : "Stato: non ancora lavorata.",
    ].join("\n");

    const quizLine = material.quiz
      ? `Verifica: ${step.question} | scelta: ${material.quiz} | corretta: ${step.options[step.correct]} | esito: ${material.quizCorrect ? "corretto" : "non corretto"}`
      : `Verifica: non compilata.`;
    const scenarioLine = material.scenario
      ? `Scenario: ${step.scenario.split("\n")[0]} | scelta: ${material.scenario} | motivazione: ${material.reason || "[vuota]"}`
      : `Scenario: non scelto.`;

    const promptLines = material.answers.map(
      (entry) => `${entry.field} — ${entry.question}\nRisposta: ${entry.answer || "[vuota]"}`,
    );

    // Quota per risposta: si abbrevia il testo, non si elimina la riga.
    const fixedLength = fixed.length + quizLine.length + scenarioLine.length + 200;
    const perAnswer = Math.max(
      120,
      Math.floor((perStepBudget - fixedLength) / Math.max(1, promptLines.length)),
    );

    const shortened = material.answers.map(
      (entry) =>
        `${entry.field} — ${entry.question}\nRisposta: ${shorten(entry.answer, perAnswer) || "[vuota]"}`,
    );

    blocks.push([fixed, ...shortened, quizLine, scenarioLine].join("\n"));
  });

  const summary = [header, ...blocks].join("\n").slice(0, MAX_SUMMARY_CHARS);

  // Scheda strutturata: la stessa informazione in forma leggibile dal codice.
  const dossierSteps: DossierStep[] = materials.map((material, index) => {
    const { step } = material;
    return {
      step: index,
      title: step.title,
      short: step.short,
      phase: step.phase || step.category,
      worked: workedStep(data, index, material),
      answers: material.answers.map((entry) => ({
        field: entry.field,
        question: entry.question,
        answer: entry.answer,
      })),
      quiz: material.quiz
        ? {
            question: step.question,
            chosen: material.quiz,
            correct: step.options[step.correct],
            isCorrect: material.quizCorrect,
          }
        : null,
      scenario: material.scenario ? { prompt: step.scenario, chosen: material.scenario } : null,
      reason: material.reason,
    };
  });

  return {
    summary,
    dossier: {
      coverage: {
        stepsTotal: steps.length,
        stepsWorked: dossierSteps.filter((step) => step.worked).length,
        fieldsAnswered: filledFields,
        fieldsTotal: totalFields,
        quizAnswered,
        quizCorrect,
        emptySteps: dossierSteps.filter((step) => !step.worked).map((step) => step.step),
      },
      steps: dossierSteps,
    },
    redactions: materials.reduce((total, material) => total + material.redactions, 0),
  };
}

/** Solo il testo: utile per l'anteprima e per chi non ha bisogno della scheda. */
export function buildAiSummary(data: SavedState): string {
  return buildAnalysisPayload(data).summary;
}
