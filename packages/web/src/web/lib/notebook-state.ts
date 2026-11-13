import { steps, type SavedState } from "./teacher-content";

export const KEY = "restare-umani-docenti-v2";
export const PREVIOUS_KEY = "restare-umani-v1";
export const stepCount = steps.length;

/** Campi totali del quaderno: 1 riflessione + quiz + scenario + motivazione per tappa. */
export const totalFields = steps.reduce((n, s) => n + s.prompts.length + 3, 0);

export type Phase = { name: string; items: { i: number; s: (typeof steps)[number] }[] };

/** Raggruppa le tappe per fase: è una proprietà statica dei contenuti. */
export const phases: Phase[] = (() => {
  const order: string[] = [];
  steps.forEach((s) => {
    const name = s.phase || "Percorso";
    if (!order.includes(name)) order.push(name);
  });
  return order.map((name) => ({
    name,
    items: steps.map((s, i) => ({ s, i })).filter(({ s }) => (s.phase || "Percorso") === name),
  }));
})();

/** Chiave di risposta valida: indice di tappa esistente e campo previsto. */
function isAnswerKey(key: string): boolean {
  const match = /^(\d+)-(p\d+|quiz|scenario|reason)$/.exec(key);
  if (!match) return false;
  const step = Number(match[1]);
  if (step < 0 || step >= stepCount) return false;
  if (match[2].startsWith("p")) {
    const prompt = Number(match[2].slice(1));
    return prompt >= 0 && prompt < (steps[step]?.prompts.length ?? 0);
  }
  return true;
}

/** Stato vuoto sempre nuovo: condividere un oggetto mutabile è una fonte di bug. */
export function freshState(): SavedState {
  return { answers: {}, completed: [], current: 0, name: "" };
}

export function parseState(raw: string | null): SavedState {
  try {
    const parsed = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object") return freshState();

    const answers = Object.fromEntries(
      Object.entries(parsed.answers || {}).filter(
        ([k, v]) => typeof v === "string" && isAnswerKey(k),
      ),
    );

    // Un valore di quiz/scenario fuori range non deve rompere il rendering.
    for (const k of Object.keys(answers))
      if (/(quiz|scenario)$/.test(k) && !["0", "1", "2"].includes(answers[k] as string))
        delete answers[k];

    return {
      answers: answers as Record<string, string>,
      name: typeof parsed.name === "string" ? parsed.name : "",
      completed: Array.isArray(parsed.completed)
        ? [
            ...new Set<number>(
              parsed.completed.filter(
                (n: unknown) =>
                  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < stepCount,
              ),
            ),
          ]
        : [],
      current:
        typeof parsed.current === "number" && parsed.current >= 0 && parsed.current < stepCount
          ? Math.floor(parsed.current)
          : 0,
    };
  } catch {
    return freshState();
  }
}

/** Sanifica prima di scrivere: solo numeri interi nell'elenco delle tappe concluse. */
export function serializableState(state: SavedState): SavedState {
  return {
    ...state,
    completed: state.completed.filter(
      (n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < stepCount,
    ),
  };
}

export function isEmptyState(state: SavedState): boolean {
  return (
    Object.keys(state.answers).length === 0 &&
    state.name === "" &&
    state.completed.length === 0 &&
    state.current === 0
  );
}
