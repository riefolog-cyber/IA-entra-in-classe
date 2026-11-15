import raw from "./teacher-content.json";

export type Answers = Record<string, string>;
export type SavedState = { answers: Answers; completed: number[]; current: number; name: string };
export const emptyState: SavedState = { answers: {}, completed: [], current: 0, name: "" };

/**
 * I contenuti del percorso vivono in `teacher-content.json`: il testo si
 * modifica senza toccare il codice e le pagine statiche delle tappe nascono
 * dallo stesso file.
 *
 * La forma viene controllata **al caricamento**, non solo nei test: un JSON
 * malformato deve fermarsi qui con un messaggio preciso, invece di arrivare
 * fino alla vista in classe sotto forma di `undefined`.
 */
export type Step = (typeof raw.steps)[number];
export type Reference = (typeof raw.references)[number];
/** Termine, definizione e numeri delle tappe in cui compare (1-based). */
export type GlossaryEntry = [term: string, definition: string, steps: number[]];

function fail(message: string): never {
  throw new Error(`teacher-content.json: ${message}`);
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label}: atteso un elenco non vuoto`);
  return value;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) fail(`${label}: testo mancante`);
  return value;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label}: atteso un intero tra ${min} e ${max}`);
  }
  return value as number;
}

function validate(): void {
  const steps = list(raw.steps, "steps");

  steps.forEach((value, index) => {
    const step = value as Partial<Step>;
    const label = `steps[${index}]`;

    text(step.title, `${label}.title`);
    list(step.prompts, `${label}.prompts`).forEach((prompt, promptIndex) =>
      text(prompt, `${label}.prompts[${promptIndex}]`),
    );

    const options = list(step.options, `${label}.options`);
    if (options.length < 2) fail(`${label}.options: servono almeno due opzioni`);
    // La soluzione è un indice: fuori intervallo la verifica non ha risposta.
    integer(step.correct, `${label}.correct`, 0, options.length - 1);

    const choices = list(step.choices, `${label}.choices`);
    const perspectives = list(step.perspectives, `${label}.perspectives`);
    if (perspectives.length !== choices.length) fail(`${label}.perspectives: una per scelta`);
  });

  const references = list(raw.references, "references");
  const stepSources = list(raw.stepSources, "stepSources");
  if (stepSources.length !== steps.length) fail("stepSources: una voce per tappa");

  stepSources.forEach((value, index) => {
    list(value, `stepSources[${index}]`).forEach((source) =>
      integer(source, `stepSources[${index}]`, 0, references.length - 1),
    );
  });

  list(raw.glossary, "glossary").forEach((value, index) => {
    if (!Array.isArray(value) || value.length !== 3) fail(`glossary[${index}]: attesi tre valori`);
    text(value[0], `glossary[${index}][0]`);
    text(value[1], `glossary[${index}][1]`);
    list(value[2], `glossary[${index}][2]`).forEach((step) =>
      integer(step, `glossary[${index}][2]`, 1, steps.length),
    );
  });
}

try {
  validate();
} catch (error) {
  const dev = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
  // In sviluppo e nei test l'errore deve fermare subito. In produzione il build
  // ha già eseguito gli stessi controlli: se si arriva qui è un pacchetto che
  // non li esegue, e una pagina bianca sarebbe peggio di un contenuto parziale.
  if (dev) throw error;
  console.error(error);
}

export const steps: Step[] = raw.steps;
export const stepSources: number[][] = raw.stepSources;
export const references: Reference[] = raw.references;
export const glossary = raw.glossary as unknown as GlossaryEntry[];
