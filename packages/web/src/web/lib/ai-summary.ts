import type { SavedState } from "./teacher-content";
import { steps } from "./teacher-content";

/**
 * Sintesi testuale del quaderno inviata al servizio IA.
 *
 * Non contiene il nome, anche quando è stato inserito: il campo è visibile in
 * anteprima e l'utente può verificarlo prima del consenso.
 */
export function buildAiSummary(data: SavedState): string {
  const answered = Object.values(data.answers).filter((v) => v.trim()).length;
  const total = steps.reduce((n, s) => n + s.prompts.length + 3, 0);

  const lines = [
    `Percorso: ${data.completed.length}/${steps.length} tappe concluse; ${answered}/${total} campi compilati.`,
  ];

  steps.forEach((s, i) => {
    const prompt = s.prompts
      .map((q, n) => `Riflessione ${n + 1} (${q}): ${data.answers[`${i}-p${n}`] || "[vuoto]"}`)
      .join("\n");

    const quiz =
      data.answers[`${i}-quiz`] !== undefined
        ? s.options[Number(data.answers[`${i}-quiz`])]
        : "[nessuna]";

    const scenario =
      data.answers[`${i}-scenario`] !== undefined
        ? s.choices[Number(data.answers[`${i}-scenario`])]
        : "[nessuna]";

    const reason = data.answers[`${i}-reason`] || "[vuota]";

    lines.push(
      `\nTappa ${i + 1} - ${s.title} (${s.phase || s.category})\n${prompt}\nQuiz: domanda "${s.question}" | risposta scelta: ${quiz} | corretta: ${s.options[s.correct]}\nScenario: ${s.scenario}\nScelta: ${scenario}\nMotivazione: ${reason}`,
    );
  });

  return lines.join("\n").slice(0, 11000);
}
