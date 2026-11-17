import type { Analysis } from "../../api/routes/analysis/schema";

/**
 * La lettura IA si conserva sul dispositivo insieme al quaderno.
 *
 * Prima viveva solo nella memoria della scheda: chi ricaricava la pagina la
 * perdeva, e il PDF non poteva contenerla. Sta in `localStorage` come le
 * risposte, con la data e il modello usato, così il docente sa sempre che cosa
 * sta rileggendo.
 */
export const ANALYSIS_KEY = "restare-umani-analisi-v1";

/** Oltre questa età la lettura è vecchia: si mostra, ma segnalata. */
export const ANALYSIS_STALE_MS = 30 * 24 * 60 * 60 * 1000;

export type SavedAnalysis = {
  at: number;
  model: string;
  analysis: Analysis;
};

function storage(): Storage | null {
  try {
    // Prerender e build statica non hanno `localStorage`.
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Forma minima: una lettura rotta non deve rompere la pagina. */
function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Analysis>;
  return typeof candidate.headline === "string" && typeof candidate.narrative === "string";
}

export function loadAnalysis(): SavedAnalysis | null {
  const store = storage();
  if (!store) return null;
  try {
    const parsed: unknown = JSON.parse(store.getItem(ANALYSIS_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const entry = parsed as Partial<SavedAnalysis>;
    if (typeof entry.at !== "number" || typeof entry.model !== "string") return null;
    if (!isAnalysis(entry.analysis)) return null;
    return { at: entry.at, model: entry.model, analysis: entry.analysis };
  } catch {
    return null;
  }
}

export function saveAnalysis(entry: SavedAnalysis): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(ANALYSIS_KEY, JSON.stringify(entry));
  } catch {
    // Quota piena o storage negato: la lettura resta visibile in memoria.
  }
}

export function clearAnalysis(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(ANALYSIS_KEY);
  } catch {
    // Niente da fare: la vista aggiorna comunque il proprio stato.
  }
}

/** Data leggibile: il docente deve poter dire quando è stata fatta la lettura. */
export function formatAnalysisDate(at: number): string {
  return new Date(at).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
