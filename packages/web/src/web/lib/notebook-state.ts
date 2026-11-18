import { steps, type SavedState } from "./teacher-content";

export const KEY = "restare-umani-docenti-v2";
export const PREVIOUS_KEY = "restare-umani-v1";
export const BACKUP_KEY = "restare-umani-copie-v1";
/**
 * Chiavi di funzioni rimosse (l'analisi IA locale) che contenevano testo
 * libero. Non si leggono più, ma restano nello storage di chi usava la
 * versione precedente: «Cancella i miei dati» deve portarle via.
 */
export const LEGACY_KEYS = ["restare-umani-analisi-v1"];
export const MAX_BACKUPS = 3;
export const stepCount = steps.length;

/** Tetto per una singola risposta: un incolla enorme non deve pesare su storage e PDF. */
export const MAX_ANSWER_LENGTH = 4000;

/** Il nome compare solo nel PDF: uno spazio breve è sufficiente. */
export const MAX_NAME_LENGTH = 80;

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
      Object.entries(parsed.answers || {})
        .filter(([k, v]) => typeof v === "string" && isAnswerKey(k))
        .map(([k, v]) => [k, (v as string).slice(0, MAX_ANSWER_LENGTH)]),
    ) as Record<string, string>;

    // Un valore di quiz/scenario fuori range non deve rompere il rendering.
    // Il limite è il numero di opzioni della tappa: se i contenuti cambiano
    // (una scelta in più o in meno) le risposte salvate restano coerenti.
    for (const [k, value] of Object.entries(answers)) {
      const field = /^(\d+)-(quiz|scenario)$/.exec(k);
      if (!field) continue;
      const target = steps[Number(field[1])];
      const count = (field[2] === "quiz" ? target.options : target.choices).length;
      const choice = Number(value);
      if (!Number.isInteger(choice) || choice < 0 || choice >= count) delete answers[k];
    }

    return {
      answers: answers as Record<string, string>,
      name: typeof parsed.name === "string" ? parsed.name.slice(0, MAX_NAME_LENGTH) : "",
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

/** Copia di sicurezza locale, creata prima di importare un file nel quaderno. */
export type NotebookBackup = {
  savedAt: number;
  reason: "manuale" | "importazione";
  state: SavedState;
};

/** Le copie seguono le stesse regole di sanificazione del quaderno: nessun dato in più. */
export function parseBackups(raw: string | null): NotebookBackup[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is { savedAt: number; reason?: unknown; state?: unknown } =>
          Boolean(item) && typeof item === "object" && typeof item.savedAt === "number",
      )
      .map((item) => ({
        savedAt: item.savedAt,
        reason: item.reason === "importazione" ? ("importazione" as const) : ("manuale" as const),
        state: parseState(JSON.stringify(item.state ?? {})),
      }))
      .slice(0, MAX_BACKUPS);
  } catch {
    return [];
  }
}

/** La copia più recente sta in cima; oltre il limite le più vecchie escono. */
export function pushBackup(
  list: NotebookBackup[],
  state: SavedState,
  reason: NotebookBackup["reason"],
): NotebookBackup[] {
  // Timestamp crescente: due copie ravvicinate non devono condividere la chiave
  // (il ripristino cerca la copia per data).
  const savedAt = Math.max(Date.now(), (list[0]?.savedAt ?? 0) + 1);

  return [{ savedAt, reason, state: serializableState(state) }, ...list].slice(0, MAX_BACKUPS);
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
