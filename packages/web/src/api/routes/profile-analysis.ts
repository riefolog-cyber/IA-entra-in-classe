import { z } from "zod";

import { base } from "../__core/app";
import { FORBIDDEN_ORIGIN_MESSAGE, isForeignOrigin } from "../security";
import {
  allowRequest,
  analysisKey,
  analysisStatus,
  clientKey,
  consumeDaily,
  defaults,
  hasDailyBudget,
  lastAnalysisFailure,
  limitHint,
  readCache,
  readLimit,
  recordFailure,
  rememberAnalysis,
  resetAnalysisStateForTests,
} from "./analysis/limits";
import {
  buildSingleShotPrompt,
  buildStepMapPrompt,
  buildSynthesisPrompt,
} from "./analysis/prompts";
import { REQUEST_TIMEOUT_MS, requestJson, type ProviderFailure } from "./analysis/provider";
import {
  analysisSchema,
  dossierSchema,
  ensureAllSteps,
  verifyQuotes,
  STEP_COUNT,
  type Analysis,
  type AnalysisCoverage,
  type AnalysisDossier,
  type DossierStep,
} from "./analysis/schema";

export { analysisStatus, resetAnalysisStateForTests };

const inputSchema = z.object({
  /** Testo completo del quaderno: le dieci tappe, sempre tutte presenti. */
  summary: z.string().max(60_000),
  /** Scheda strutturata: tappe lavorate, quiz, scenari. Assente nei client vecchi. */
  dossier: dossierSchema.optional(),
  /** Precisazione del docente dopo una lettura che non lo rappresenta. */
  correction: z.string().trim().max(1500).optional(),
});

/** Quante letture di tappa in parallelo: enough per finire in pochi secondi, senza raffiche. */
const MAP_CONCURRENCY = 4;
const MAP_MAX_TOKENS = 500;
const SYNTHESIS_MAX_TOKENS = 4000;

const SYSTEM_JSON = "Rispondi solo con JSON valido.";

/** Lettura di una tappa prodotta dalla fase 1. */
const stepMapSchema = z.object({
  criterion: z.string().max(600).optional().default(""),
  decision: z.string().max(600).optional().default(""),
  tension: z.string().max(600).optional().default(""),
  quotes: z
    .array(z.object({ field: z.string().max(60), quote: z.string().max(300) }))
    .max(3)
    .optional()
    .default([]),
});

type StepMap = z.infer<typeof stepMapSchema>;

/** Pool semplice: poche richieste insieme, senza dipendenze. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** Riga leggibile per la fase 2: il modello riceve la mappa, non tutto il testo. */
function renderMapEntry(step: DossierStep, map: StepMap | null): string {
  const number = step.step + 1;
  if (!step.worked) return `Tappa ${number} — ${step.title}: non ancora lavorata.`;
  if (!map) return `Tappa ${number} — ${step.title}: lavorata, lettura non disponibile.`;
  const lines = [`Tappa ${number} — ${step.title} (${step.phase})`];
  if (map.criterion) lines.push(`Criterio dichiarato: ${map.criterion}`);
  if (map.decision) lines.push(`Decisione: ${map.decision}`);
  if (map.tension) lines.push(`Tensione: ${map.tension}`);
  for (const quote of map.quotes) {
    if (quote.quote.trim())
      lines.push(`Citazione (${quote.field || "risposta"}): "${quote.quote}"`);
  }
  return lines.join("\n");
}

function coverageFromDossier(dossier: AnalysisDossier): AnalysisCoverage {
  return {
    stepsTotal: dossier.coverage.stepsTotal,
    stepsWorked: dossier.coverage.stepsWorked,
    emptySteps: dossier.coverage.emptySteps.map((step) => step + 1),
  };
}

/** Se il modello non dichiara la confidenza, la ricava dalla copertura reale. */
function confidenceFor(
  analysis: Analysis,
  dossier: AnalysisDossier | undefined,
): Analysis["confidence"] {
  if (analysis.confidence) return analysis.confidence;
  if (!dossier) return undefined;
  const ratio = dossier.coverage.stepsWorked / Math.max(1, dossier.coverage.stepsTotal);
  const level = ratio >= 0.8 ? "alta" : ratio >= 0.4 ? "media" : "bassa";
  return {
    level,
    because: `${dossier.coverage.stepsWorked} tappe lavorate su ${dossier.coverage.stepsTotal}.`,
    whatWouldChangeIt: "Completare le tappe ancora vuote cambierebbe il quadro.",
  };
}

/** Messaggio d'errore per l'utente a partire da un guasto del provider. */
function failureOf(failure: ProviderFailure) {
  if (failure.kind === "timeout") {
    return {
      reason: "timeout",
      message: `La lettura IA ha impiegato troppo tempo (oltre ${REQUEST_TIMEOUT_MS / 1000} secondi). Riprova tra poco. ${limitHint()}`,
    };
  }
  if (failure.kind === "network") {
    return {
      reason: "network_error",
      message:
        "Il sito non è riuscito a raggiungere il servizio IA. Le risposte sono già salvate: riprova tra poco oppure esporta il quaderno. Se il problema continua, la causa è tecnica e riguarda il server, non le tue risposte.",
    };
  }
  if (failure.kind === "provider") {
    return {
      reason: "provider_error",
      message:
        failure.status === 429
          ? "Il servizio IA ha raggiunto il limite di richieste o la quota disponibile (429). Attendi qualche minuto e riprova; se il problema persiste, verifica quota/limiti e configurazione del modello."
          : `Errore dal servizio IA (${failure.status}). Verifica configurazione/modello o riprova.`,
    };
  }
  return {
    reason: "invalid_response",
    message:
      "La risposta IA non era in un formato utilizzabile. Riprova più tardi o esporta il quaderno in PDF.",
  };
}

export const analyzeProfile = base.input(inputSchema).handler(async ({ input, context }) => {
  // Read env through an index access so the same source type-checks in the
  // mobile package, which does not include @types/bun's ProcessEnv.
  const env = (key: string) => (process.env as Record<string, string | undefined>)[key];
  // Riferimento breve e cercabile nei log: l'utente può citarlo in una segnalazione.
  const requestId = crypto.randomUUID().slice(0, 8);
  // `requestId` è un campo, non parte del messaggio: la vista lo mostra una volta sola.
  const fail = (reason: string, message: string) => ({
    ok: false as const,
    reason,
    message,
    requestId,
    // Dettaglio tecnico utile a chi gestisce il sito: nessun testo del docente.
    lastError: lastAnalysisFailure(),
  });

  // Prima di ogni altra cosa: una chiamata cross-origin non deve consumare quota.
  if (isForeignOrigin(context.headers)) {
    return fail("forbidden_origin", FORBIDDEN_ORIGIN_MESSAGE);
  }

  // Interruttore d'emergenza: spegne l'analisi interna senza toccare il codice
  // (per esempio se il gateway è inaffidabile). La strada del prompt esterno
  // resta disponibile nella vista.
  if (env("AI_ANALYSIS_ENABLED") === "0") {
    return fail(
      "disabled",
      "L'analisi IA interna è disattivata su questa installazione. Puoi comunque esportare il quaderno in PDF e leggerlo con il prompt pronto per Gemini, qui sotto.",
    );
  }

  const baseUrl = (env("AI_GATEWAY_BASE_URL") || "").replace(/\/$/, "");
  const apiKey = (env("AI_GATEWAY_API_KEY") || "").trim();
  if (!baseUrl || !apiKey) {
    return fail(
      "missing_config",
      "Analisi IA non configurata sul server. Imposta AI_GATEWAY_BASE_URL e AI_GATEWAY_API_KEY, poi riavvia il server.",
    );
  }

  const dossier = input.dossier;
  // Un quaderno quasi vuoto non produce una lettura utile: meglio dirlo subito,
  // senza occupare quota del provider.
  if (input.summary.trim().length < 40 && !(dossier && dossier.coverage.stepsWorked > 0)) {
    return fail(
      "empty_summary",
      "Il quaderno è ancora troppo vuoto per un’analisi utile. Compila almeno una tappa e riprova.",
    );
  }

  const model = env("AI_PROFILE_MODEL") || "openai/gpt-4.1-mini";
  const mapModel = env("AI_PROFILE_MAP_MODEL") || model;
  // La lettura in due fasi si può spegnere dall'ambiente (gateway senza concorrenza).
  const twoPhase = env("AI_ANALYSIS_TWO_PHASE") !== "0";

  // Modello e cache prima dei limiti: riaprire lo stesso quaderno nello stesso
  // giorno non deve consumare la quota, perché il provider non viene contattato.
  const key = await analysisKey({
    model,
    summary: input.summary,
    dossier,
    correction: input.correction,
  });
  const cached = readCache(key);
  if (cached) {
    return {
      ok: true as const,
      model: cached.model,
      analysis: cached.analysis,
      cached: true,
      droppedQuotes: cached.droppedQuotes,
      requestId,
    };
  }

  // Il limite entra in gioco solo quando la richiesta può davvero raggiungere
  // il provider: una configurazione mancante non consuma quota.
  const perClientLimit = readLimit("AI_ANALYSIS_RATE_LIMIT", defaults.perClient);
  const globalLimit = readLimit("AI_ANALYSIS_RATE_LIMIT_GLOBAL", defaults.global);

  if (!allowRequest(clientKey(context.headers), perClientLimit, globalLimit)) {
    const scope =
      perClientLimit > 0
        ? `max ${perClientLimit} al minuto per utente`
        : `max ${globalLimit} al minuto in totale`;

    return fail(
      "rate_limited",
      `Troppe richieste di analisi in poco tempo (${scope}). ${limitHint()}`,
    );
  }

  const dailyLimit = readLimit("AI_ANALYSIS_DAILY_LIMIT", defaults.daily);
  if (!hasDailyBudget(dailyLimit)) {
    return fail(
      "daily_limit",
      `Il budget giornaliero di analisi IA del sito è esaurito (max ${dailyLimit} al giorno). Riprova domani, oppure esporta il quaderno in PDF: le risposte sono già salvate.`,
    );
  }

  const url = baseUrl.includes("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

  // ---------------------------------------------------------------- fase 1
  // Una lettura per tappa: il testo di ogni tappa arriva intero, senza tagli.
  // Una tappa che non risponde non fa fallire il quadro: viene solo saltata.
  let maps: Array<StepMap | null> = [];
  let mapped = 0;
  if (twoPhase && dossier) {
    const worked = dossier.steps.filter((step) => step.worked);
    const outcomes = await mapWithLimit(worked, MAP_CONCURRENCY, async (step) => {
      const outcome = await requestJson({
        url,
        apiKey,
        model: mapModel,
        system: SYSTEM_JSON,
        user: buildStepMapPrompt(step),
        maxTokens: MAP_MAX_TOKENS,
        temperature: 0,
        attempts: 1,
      });
      if (outcome.kind !== "ok") {
        recordFailure({
          at: Date.now(),
          requestId,
          kind: `map:${outcome.kind}`,
          status: outcome.status,
          detail: outcome.detail,
        });
        console.error(
          `[analisi-ia ${requestId}] mappa tappa ${step.step + 1} non riuscita: ${outcome.kind} ${outcome.detail.slice(0, 160)}`,
        );
        return null;
      }
      const parsed = stepMapSchema.safeParse(outcome.json);
      return parsed.success ? parsed.data : null;
    });

    const byStep = new Map<number, StepMap>();
    outcomes.forEach((map, index) => {
      if (map) byStep.set(worked[index].step, map);
    });
    mapped = byStep.size;
    maps = dossier.steps.map((step) => byStep.get(step.step) ?? null);
  }

  const useMap = Boolean(dossier && twoPhase && mapped > 0);
  const mapText = dossier
    ? dossier.steps.map((step, i) => renderMapEntry(step, maps[i])).join("\n\n")
    : "";
  const prompt = useMap
    ? buildSynthesisPrompt({
        summary: input.summary,
        dossier,
        map: mapText,
        correction: input.correction,
      })
    : buildSingleShotPrompt(input.summary, input.correction);

  // ---------------------------------------------------------------- fase 2
  const askSynthesis = (text: string) =>
    requestJson({
      url,
      apiKey,
      model,
      system: SYSTEM_JSON,
      user: text,
      maxTokens: SYNTHESIS_MAX_TOKENS,
      temperature: 0.25,
      attempts: 2,
    });

  let outcome = await askSynthesis(prompt);
  let fallbackUsed = false;

  // Se la pipeline a più chiamate incontra un guasto di rete, si riprova con
  // UNA sola richiesta più piccola: a volte il problema è la raffica, non il
  // servizio. Meglio una lettura meno ricca che nessuna lettura.
  if (outcome.kind === "network" && useMap) {
    console.error(
      `[analisi-ia ${requestId}] due fasi non raggiungibili, nuovo tentativo in una sola chiamata`,
    );
    outcome = await askSynthesis(buildSingleShotPrompt(input.summary, input.correction));
    fallbackUsed = outcome.kind === "ok";
  }

  if (outcome.kind !== "ok") {
    const failure = failureOf(outcome);
    recordFailure({
      at: Date.now(),
      requestId,
      kind: outcome.kind,
      status: outcome.status,
      detail: outcome.detail,
    });
    console.error(
      `[analisi-ia ${requestId}] sintesi non riuscita: ${outcome.kind} ${outcome.detail.slice(0, 200)}`,
    );
    return fail(failure.reason, failure.message);
  }

  const parsed = analysisSchema.safeParse(outcome.json);
  if (!parsed.success) {
    recordFailure({
      at: Date.now(),
      requestId,
      kind: "schema",
      detail: parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(" | "),
    });
    console.error(
      `[analisi-ia ${requestId}] schema non valido:`,
      parsed.error.issues.slice(0, 3).map((issue) => issue.path.join(".")),
    );
    return fail(
      "invalid_response",
      "La risposta IA non era in un formato utilizzabile. Riprova più tardi o esporta il quaderno in PDF.",
    );
  }

  // Le citazioni si controllano sul testo originale: ciò che il modello ha
  // inventato non arriva all'utente sotto forma di citazione.
  const { analysis: verified, droppedQuotes } = verifyQuotes(parsed.data, dossier, input.summary);
  const analysis: Analysis = ensureAllSteps(
    {
      ...verified,
      coverage: dossier ? coverageFromDossier(dossier) : verified.coverage,
      confidence: confidenceFor(verified, dossier),
      caution:
        verified.caution ||
        "Interpretazione probabilistica: rileggi criticamente e verifica nel tuo contesto.",
    },
    dossier,
  );

  if (droppedQuotes > 0) {
    console.error(`[analisi-ia ${requestId}] citazioni scartate: ${droppedQuotes}`);
  }

  consumeDaily(dailyLimit);
  rememberAnalysis(key, { at: Date.now(), model, analysis, droppedQuotes });
  return {
    ok: true as const,
    model,
    analysis,
    requestId,
    droppedQuotes,
    stepsMapped: fallbackUsed ? 0 : mapped,
    stepsTotal: dossier?.coverage.stepsTotal ?? STEP_COUNT,
    twoPhase: useMap && !fallbackUsed,
    fallbackUsed,
  };
});
