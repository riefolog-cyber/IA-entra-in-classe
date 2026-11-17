import { z } from "zod";

/**
 * Contratto dell'analisi IA.
 *
 * Il modello non produce solo un testo: produce un **quadro** in cui ogni
 * affermazione importante porta con sé una citazione breve delle parole del
 * docente. Le citazioni vengono ricontrollate sul testo originale prima della
 * risposta: quello che il modello inventa non arriva all'utente.
 *
 * Versione dello schema: cambiare la forma invalida la cache (la chiave include
 * `PROMPT_VERSION`), così una lettura vecchia non viene servita con la forma
 * nuova.
 */
export const ANALYSIS_SCHEMA_VERSION = 2;

/** Le tappe del percorso. Il quadro le considera tutte, anche quelle vuote. */
export const STEP_COUNT = 10;

/** Dimensione trasversale osservata dal quadro. */
export const DIMENSIONS = [
  "progettazione",
  "verifica delle fonti",
  "valutazione e feedback",
  "processo visibile",
  "regole condivise",
  "comunicazione",
  "inclusione e dati",
  "sperimentazione",
  "sostenibilità",
  "relazione professionale",
] as const;

const shortText = z.string().trim().max(600);

/**
 * Citazione letterale dell'utente, con la tappa da cui proviene.
 * Il numero della tappa è **1-based** come nel testo del percorso (tappa 1..10):
 * è la stessa numerazione che vede il docente e che il modello legge nel prompt.
 */
export const evidenceSchema = z.object({
  step: z.number().int().min(1).max(STEP_COUNT),
  quote: z.string().trim().min(1).max(240),
  /** Calcolato dal server: true se la frase esiste davvero nel quaderno. */
  verified: z.boolean().optional(),
});

/** Lettura di una singola tappa: c'è sempre, anche quando è ancora vuota. */
export const stepReadingSchema = z.object({
  step: z.number().int().min(1).max(STEP_COUNT),
  title: shortText.optional(),
  worked: z.boolean().default(false),
  reading: z.string().trim().max(900).default(""),
  evidence: z.array(evidenceSchema).max(3).default([]),
});

/** Dimensione trasversale: che cosa emerge, con prove e una domanda aperta. */
export const dimensionSchema = z.object({
  dimension: z.enum(DIMENSIONS),
  whatEmerges: z.string().trim().min(1).max(700),
  evidence: z.array(evidenceSchema).max(3).default([]),
  openQuestion: z.string().trim().max(300).default(""),
});

/** Coerenza tra ciò che il docente dichiara e ciò che sceglie. */
export const coherenceSchema = z.object({
  intention: z.string().trim().min(1).max(400),
  practice: z.string().trim().min(1).max(400),
  kind: z.enum(["allineata", "tensione"]).default("tensione"),
  evidence: z.array(evidenceSchema).max(3).default([]),
});

/** Passo concreto, con il modo per accorgersi che ha funzionato. */
export const nextStepSchema = z.object({
  action: z.string().trim().min(1).max(400),
  howYouWillKnow: z.string().trim().max(300).default(""),
  within: z.string().trim().max(80).default(""),
});

/** Quanto la lettura può dirsi fondata sui dati presenti. */
export const confidenceSchema = z.object({
  level: z.enum(["bassa", "media", "alta"]),
  because: z.string().trim().max(300).default(""),
  whatWouldChangeIt: z.string().trim().max(300).default(""),
});

/** Copertura: quante tappe hanno davvero qualcosa da leggere. */
export const coverageSchema = z.object({
  stepsTotal: z.number().int().min(1).max(STEP_COUNT),
  stepsWorked: z.number().int().min(0).max(STEP_COUNT),
  emptySteps: z.array(z.number().int().min(1).max(STEP_COUNT)).max(STEP_COUNT).default([]),
});

export const analysisSchema = z.object({
  headline: z.string().trim().min(1).max(120),
  narrative: z.string().trim().min(1).max(2000),
  /** Le dieci tappe, sempre presenti: il quadro non salta le tappe vuote. */
  steps: z.array(stepReadingSchema).max(STEP_COUNT).default([]),
  dimensions: z.array(dimensionSchema).max(6).default([]),
  coherence: z.array(coherenceSchema).max(4).default([]),
  strengths: z.array(z.string().trim().min(1).max(500)).max(4).default([]),
  tensions: z.array(z.string().trim().min(1).max(500)).max(4).default([]),
  blindSpots: z.array(z.string().trim().min(1).max(400)).max(4).default([]),
  questions: z.array(z.string().trim().min(1).max(500)).max(4).default([]),
  nextStep: z.string().trim().max(500).default(""),
  nextSteps: z.array(nextStepSchema).max(3).default([]),
  confidence: confidenceSchema.optional(),
  coverage: coverageSchema.optional(),
  caution: z.string().trim().max(500).default(""),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type AnalysisDimension = z.infer<typeof dimensionSchema>;
export type AnalysisCoherence = z.infer<typeof coherenceSchema>;
export type AnalysisNextStep = z.infer<typeof nextStepSchema>;
export type AnalysisCoverage = z.infer<typeof coverageSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type StepReading = z.infer<typeof stepReadingSchema>;

/**
 * Scheda strutturata inviata insieme al testo: sono i dati che il sito già
 * conosce (tappe concluse, quiz corretti, campi pieni). Il modello non deve
 * dedurli, e l'analisi può dire con precisione su cosa si fonda.
 */
export const dossierStepSchema = z.object({
  step: z
    .number()
    .int()
    .min(0)
    .max(STEP_COUNT - 1),
  title: z.string().trim().max(200),
  short: z.string().trim().max(120),
  phase: z.string().trim().max(80),
  worked: z.boolean(),
  answers: z
    .array(
      z.object({
        field: z.string().trim().max(40),
        question: z.string().trim().max(600),
        answer: z.string().trim().max(4000),
      }),
    )
    .max(6)
    .default([]),
  quiz: z
    .object({
      question: z.string().trim().max(800),
      chosen: z.string().trim().max(800),
      correct: z.string().trim().max(800),
      isCorrect: z.boolean(),
    })
    .nullable()
    .default(null),
  scenario: z
    .object({
      prompt: z.string().trim().max(1200),
      chosen: z.string().trim().max(800),
    })
    .nullable()
    .default(null),
  reason: z.string().trim().max(4000).default(""),
});

export const dossierSchema = z.object({
  coverage: z.object({
    stepsTotal: z.number().int().min(1).max(STEP_COUNT),
    stepsWorked: z.number().int().min(0).max(STEP_COUNT),
    fieldsAnswered: z.number().int().min(0).max(200),
    fieldsTotal: z.number().int().min(1).max(200),
    quizAnswered: z.number().int().min(0).max(STEP_COUNT),
    quizCorrect: z.number().int().min(0).max(STEP_COUNT),
    emptySteps: z
      .array(
        z
          .number()
          .int()
          .min(0)
          .max(STEP_COUNT - 1),
      )
      .max(STEP_COUNT)
      .default([]),
  }),
  steps: z.array(dossierStepSchema).min(1).max(STEP_COUNT),
});

export type AnalysisDossier = z.infer<typeof dossierSchema>;
export type DossierStep = z.infer<typeof dossierStepSchema>;

/** Testo normalizzato per confrontare una citazione con il quaderno. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[«»"'’“”]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Spezza una citazione in parole: le citazioni del modello possono cambiare
 * punteggiatura o contrarre le parole. Si accetta la citazione se la sequenza
 * delle sue parole compare nel testo, saltando le parole troppo corte.
 */
function wordsMatch(quote: string, haystack: string): boolean {
  const normalizedQuote = normalizeForMatch(quote);
  if (!normalizedQuote) return false;
  if (haystack.includes(normalizedQuote)) return true;

  const words = normalizedQuote.split(" ").filter((word) => word.length > 2);
  if (words.length < 3) return haystack.includes(normalizedQuote);

  // Metà delle parole, in ordine, deve comparire nel testo della tappa: tollera
  // una parola cambiata, non una citazione inventata.
  const needed = Math.ceil(words.length * 0.6);
  let matched = 0;
  let from = 0;
  for (const word of words) {
    const at = haystack.indexOf(word, from);
    if (at === -1) continue;
    matched += 1;
    from = at + word.length;
    if (matched >= needed) return true;
  }
  return false;
}

/** Testo su cui verificare le citazioni di una tappa. */
function stepText(step: DossierStep): string {
  return normalizeForMatch(
    [
      ...step.answers.map((entry) => entry.answer),
      step.reason,
      step.quiz?.chosen ?? "",
      step.scenario?.chosen ?? "",
    ].join(" \n "),
  );
}

export type VerificationResult = { analysis: Analysis; droppedQuotes: number };

/**
 * Controlla ogni citazione sul testo originale del quaderno.
 *
 * - citazione trovata → `verified: true`, resta;
 * - citazione non trovata → viene **scartata**, così una frase inventata non
 *   arriva all'utente travestita da citazione.
 *
 * Il conteggio delle citazioni scartate viaggia nella risposta: se il modello
 * inventa molto, si vede dai log e dai test invece di restare invisibile.
 */
export function verifyQuotes(
  analysis: Analysis,
  dossier: AnalysisDossier | undefined,
  fallbackText = "",
): VerificationResult {
  const byStep = new Map<number, string>();
  if (dossier) {
    for (const step of dossier.steps) byStep.set(step.step, stepText(step));
  }
  const everything = normalizeForMatch(`${fallbackText} ${[...byStep.values()].join(" ")}`);

  let droppedQuotes = 0;

  const check = (evidence: Evidence[]): Evidence[] =>
    evidence.filter((item) => {
      const haystack = byStep.get(item.step - 1) ?? everything;
      if (haystack && wordsMatch(item.quote, haystack)) {
        item.verified = true;
        return true;
      }
      droppedQuotes += 1;
      return false;
    });

  for (const step of analysis.steps) step.evidence = check(step.evidence);
  for (const dimension of analysis.dimensions) dimension.evidence = check(dimension.evidence);
  for (const coherence of analysis.coherence) coherence.evidence = check(coherence.evidence);

  return { analysis, droppedQuotes };
}

/**
 * Garanzia richiesta dal percorso: il quadro parla di **tutte e dieci** le
 * tappe. Se il modello ne salta una, la voce viene ricostruita dalla scheda
 * (marcata come non lavorata o senza lettura) invece di sparire.
 */
export function ensureAllSteps(analysis: Analysis, dossier: AnalysisDossier | undefined): Analysis {
  const present = new Map(analysis.steps.map((entry) => [entry.step, entry]));
  const steps = (dossier?.steps ?? []).map((step) => {
    const number = step.step + 1;
    const existing = present.get(number);
    if (existing) {
      return { ...existing, title: existing.title || step.title, worked: step.worked };
    }
    return {
      step: number,
      title: step.title,
      worked: step.worked,
      reading: step.worked ? "" : "Tappa non ancora lavorata: il quadro non la interpreta.",
      evidence: [],
    };
  });

  // Senza scheda (chiamata in un solo passaggio) si tiene quello che il
  // modello ha prodotto, senza inventare tappe che non conosce.
  return { ...analysis, steps: dossier ? steps : analysis.steps };
}
