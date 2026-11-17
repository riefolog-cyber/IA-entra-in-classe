import { PROMPT_VERSION } from "./prompts";
import { ANALYSIS_SCHEMA_VERSION, type Analysis } from "./schema";

/** Finestra dei limiti al minuto. */
const WINDOW_MS = 60_000;
const DEFAULT_PER_CLIENT = 20;
const DEFAULT_GLOBAL = 120;
const DEFAULT_DAILY = 500;
const MAX_TRACKED_CLIENTS = 2000;

const LIMIT_HINT =
  "Le risposte sono già salvate: riprova tra poco oppure esporta il quaderno in PDF.";

const perClient = new Map<string, number[]>();
const globalHits: number[] = [];

function prune(timestamps: number[], now: number) {
  while (timestamps.length && now - timestamps[0] > WINDOW_MS) timestamps.shift();
}

export function readLimit(key: string, fallback: number): number {
  const raw = (process.env as Record<string, string | undefined>)[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

/** IP del client, oppure null quando non è affidabile (sviluppo locale, assenza di proxy). */
export function clientKey(headers: Headers): string | null {
  // Dietro un proxy (Vercel, Netlify, nginx) l'IP reale arriva in questi header.
  // Se il server è esposto direttamente l'header può essere inventato: per
  // questo esiste anche il tetto globale. Non è un sistema di autenticazione.
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  // Nessun limite per-utente sul lavoro locale: in sviluppo si prova e si riprova.
  if (ip === "::1" || ip === "localhost" || ip.startsWith("127.") || ip.startsWith("::ffff:127."))
    return null;
  return ip;
}

export function allowRequest(
  key: string | null,
  perClientLimit: number,
  globalLimit: number,
): boolean {
  // Limiti entrambi a 0: controllo disattivato dall'ambiente.
  if (perClientLimit <= 0 && globalLimit <= 0) return true;

  const now = Date.now();

  prune(globalHits, now);
  if (globalLimit > 0 && globalHits.length >= globalLimit) return false;

  if (key && perClientLimit > 0) {
    // Evita che la mappa cresca senza limite quando arrivano molti IP diversi.
    if (!perClient.has(key) && perClient.size >= MAX_TRACKED_CLIENTS) perClient.clear();

    const hits = perClient.get(key) ?? [];
    prune(hits, now);

    if (hits.length >= perClientLimit) {
      perClient.set(key, hits);
      return false;
    }

    hits.push(now);
    perClient.set(key, hits);
  }

  globalHits.push(now);
  return true;
}

/** Analisi identiche entro 24 ore non raggiungono il provider. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

export type CachedAnalysis = {
  at: number;
  model: string;
  analysis: Analysis;
  droppedQuotes: number;
};

const analysisCache = new Map<string, CachedAnalysis>();

/** SHA-256 via Web Crypto: niente import di `node:*`. */
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * La chiave contiene istruzioni, schema, modello, testo, scheda e precisazione:
 * cambiare il prompt o una risposta del docente produce una lettura nuova,
 * senza dover ricordare di cambiare un numero a mano.
 */
export async function analysisKey(parts: {
  model: string;
  summary: string;
  dossier?: unknown;
  correction?: string;
}): Promise<string> {
  return sha256(
    [
      PROMPT_VERSION,
      `schema:${ANALYSIS_SCHEMA_VERSION}`,
      parts.model,
      parts.correction ? `correzione:${parts.correction}` : "",
      JSON.stringify(parts.dossier ?? null),
      parts.summary,
    ].join("\n"),
  );
}

export function readCache(key: string): CachedAnalysis | null {
  const cached = analysisCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at >= CACHE_TTL_MS) {
    analysisCache.delete(key);
    return null;
  }
  return cached;
}

export function rememberAnalysis(key: string, entry: CachedAnalysis) {
  // Aggiorna la posizione: le voci più vecchie escono per prime.
  analysisCache.delete(key);
  if (analysisCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = analysisCache.keys().next().value;
    if (oldest) analysisCache.delete(oldest);
  }
  analysisCache.set(key, entry);
}

/**
 * Ultimo guasto di rete del provider, in memoria e senza segreti.
 *
 * "Problema di rete" da solo non permette di capire nulla: qui restano il
 * codice d'errore (`ENOTFOUND`, `ECONNRESET`, `CERT_HAS_EXPIRED`...), il tipo e
 * l'istante. Serve al docente per una segnalazione e a chi gestisce il sito per
 * distinguere un DNS sbagliato da un gateway spento.
 */
export type AnalysisFailure = {
  at: number;
  requestId: string;
  kind: string;
  status?: number;
  detail: string;
};

let lastFailure: AnalysisFailure | null = null;

export function recordFailure(failure: AnalysisFailure): void {
  lastFailure = { ...failure, detail: failure.detail.slice(0, 300) };
}

export function lastAnalysisFailure(): AnalysisFailure | null {
  return lastFailure;
}

let dailyDate = "";
let dailyCount = 0;

/** Azzera il contatore quando cambia il giorno (fuso UTC, come il resto del file). */
function refreshDailyWindow() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyDate !== today) {
    dailyDate = today;
    dailyCount = 0;
  }
}

/**
 * Il budget giornaliero si controlla prima della chiamata ma si consuma solo a
 * lettura riuscita: un errore di rete o del provider non deve bruciare la
 * quota. Con richieste simultanee il tetto può essere superato di poco:
 * preferibile a far pagare all'utente un tentativo fallito.
 */
export function hasDailyBudget(limit: number): boolean {
  if (limit <= 0) return true;
  refreshDailyWindow();
  return dailyCount < limit;
}

/** Registra una lettura consegnata al docente (non le singole chiamate interne). */
export function consumeDaily(limit: number): void {
  if (limit <= 0) return;
  refreshDailyWindow();
  dailyCount += 1;
}

export function limitHint(): string {
  return LIMIT_HINT;
}

/** Solo per i test: azzera cache e contatori di processo tra uno scenario e l'altro. */
export function resetAnalysisStateForTests() {
  analysisCache.clear();
  lastFailure = null;
  dailyDate = "";
  dailyCount = 0;
  globalHits.length = 0;
  perClient.clear();
}

/** Stato del servizio IA senza segreti: serve a capire un errore dal browser. */
export function analysisStatus() {
  const env = (key: string) => (process.env as Record<string, string | undefined>)[key];
  const today = new Date().toISOString().slice(0, 10);

  return {
    ok: true,
    ai: {
      configured: Boolean(env("AI_GATEWAY_BASE_URL") && env("AI_GATEWAY_API_KEY")),
      model: env("AI_PROFILE_MODEL") || "openai/gpt-4.1-mini",
      mapModel: env("AI_PROFILE_MAP_MODEL") || env("AI_PROFILE_MODEL") || "openai/gpt-4.1-mini",
      enabled: env("AI_ANALYSIS_ENABLED") !== "0",
      twoPhase: env("AI_ANALYSIS_TWO_PHASE") !== "0",
      schemaVersion: ANALYSIS_SCHEMA_VERSION,
      limits: {
        perMinute: readLimit("AI_ANALYSIS_RATE_LIMIT", DEFAULT_PER_CLIENT),
        globalPerMinute: readLimit("AI_ANALYSIS_RATE_LIMIT_GLOBAL", DEFAULT_GLOBAL),
        daily: readLimit("AI_ANALYSIS_DAILY_LIMIT", DEFAULT_DAILY),
      },
      usage: {
        dailyDate: today,
        dailyUsed: dailyDate === today ? dailyCount : 0,
        cachedAnalyses: analysisCache.size,
      },
      // Nessuna chiave, nessun testo del docente: solo il guasto tecnico.
      lastError: lastFailure,
    },
  };
}

export const defaults = {
  perClient: DEFAULT_PER_CLIENT,
  global: DEFAULT_GLOBAL,
  daily: DEFAULT_DAILY,
};
