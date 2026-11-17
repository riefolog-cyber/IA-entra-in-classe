import { useEffect, useMemo, useRef, useState } from "react";

import type { Analysis } from "../../api/routes/analysis/schema";
import { buildAnalysisPayload } from "../lib/ai-summary";
import {
  clearAnalysis,
  loadAnalysis,
  saveAnalysis,
  type SavedAnalysis,
} from "../lib/analysis-store";
import { checkApiHealth } from "../lib/api-health";
import type { SavedState } from "../lib/teacher-content";

type AnalysisResult = {
  model: string;
  analysis: Analysis;
  cached?: boolean;
  /** Quando è stata prodotta: per le letture riprese da `localStorage`. */
  at?: number;
  stepsMapped?: number;
  droppedQuotes?: number;
};

type AnalysisResponse =
  | { ok: false; reason?: string; message?: string; requestId?: string }
  | (AnalysisResult & { ok: true; requestId?: string });

// Il server chiude la chiamata al provider a 90 s: qui si lascia un margine,
// così il messaggio che arriva all'utente è quello dell'endpoint. La lettura in
// due fasi fa più chiamate, quindi il margine è più largo.
const ANALYSIS_TIMEOUT_MS = 120_000;

export function useAiAnalysis(data: SavedState) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRequestId, setAiRequestId] = useState("");
  const [saved, setSaved] = useState<SavedAnalysis | null>(() => loadAnalysis());
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(() => {
    const stored = loadAnalysis();
    return stored
      ? { model: stored.model, analysis: stored.analysis, at: stored.at, cached: true }
      : null;
  });
  const [apiCheckTick, setApiCheckTick] = useState(0);
  // Senza rete la richiesta non parte: meglio dirlo subito che attendere il timeout.
  const [online, setOnline] = useState(() => navigator.onLine);
  const requestRef = useRef<AbortController | null>(null);

  // La sintesi si ricalcola solo quando il quaderno cambia: prima veniva
  // ricostruita a ogni render dell'anteprima.
  const payload = useMemo(() => buildAnalysisPayload(data), [data]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);

    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Il servizio è opzionale: se il sito è pubblicato in forma statica l'analisi
  // esterna non c'è e la vista mostra quella locale accanto a un pulsante di
  // riprova. Su Render (server Bun) il controllo deve riuscire anche a freddo:
  // il timeout è largo per non declassare l'analisi IA durante un avvio.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    void checkApiHealth((input, init) => fetch(input, { ...init, signal: controller.signal }))
      .then((available) => {
        if (!cancelled) setApiAvailable(available);
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [apiCheckTick]);

  // Una lettura in corso non deve sopravvivere alla vista che l'ha avviata.
  useEffect(() => () => requestRef.current?.abort(), []);

  const recheckApi = () => {
    setApiAvailable(null);
    setApiCheckTick((tick) => tick + 1);
  };

  /**
   * `correction` è la precisazione del docente ("questo non mi rappresenta
   * perché…"): entra nella chiave di cache e nel prompt, quindi la nuova
   * lettura non è la stessa di prima.
   */
  const runAiAnalysis = async (correction?: string) => {
    if (!navigator.onLine) {
      setAiError(
        "Sei offline: l'analisi IA richiede una connessione. Le risposte restano salvate e puoi esportare il quaderno.",
      );
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiRequestId("");

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      // Chiamata diretta all'endpoint RPC: evita dipendenze dal client oRPC
      // lato browser e usa lo stesso formato richiesta/risposta del server.
      const response = await fetch(`${window.location.origin}/api/rpc/analyzeProfile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          json: {
            summary: payload.summary,
            dossier: payload.dossier,
            ...(correction?.trim() ? { correction: correction.trim() } : {}),
          },
        }),
        signal: controller.signal,
      });
      const body = (await response.json().catch(() => null)) as { json?: unknown } | null;
      const res = body?.json as AnalysisResponse | null;

      if (res?.requestId) setAiRequestId(res.requestId);

      if (!res) {
        setAiError(
          response.ok
            ? "Analisi IA non disponibile in questa versione del sito. Puoi comunque esportare il tuo quaderno."
            : `Il servizio IA ha risposto con un errore (HTTP ${response.status}). Riprova tra poco oppure esporta il quaderno.`,
        );
      } else if (!res.ok) {
        setAiError(res.message || "Analisi IA non disponibile.");
      } else {
        const entry: SavedAnalysis = {
          at: Date.now(),
          model: res.model,
          analysis: res.analysis,
        };
        saveAnalysis(entry);
        setSaved(entry);
        setAiResult({
          model: res.model,
          analysis: res.analysis,
          cached: res.cached,
          at: entry.at,
          stepsMapped: res.stepsMapped,
          droppedQuotes: res.droppedQuotes,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setAiError("Lettura annullata. Puoi riprovare quando vuoi.");
      } else {
        // Il testo tecnico del browser («Failed to fetch») non aiuta un docente:
        // vale il messaggio scritto, come per tutti gli altri esiti.
        setAiError(
          "Richiesta IA non riuscita per un problema di rete. Controlla la connessione e riprova: le risposte sono già salvate e puoi esportare il quaderno.",
        );
      }
    } finally {
      clearTimeout(timer);
      requestRef.current = null;
      setAiLoading(false);
    }
  };

  const cancelAiAnalysis = () => requestRef.current?.abort();

  /** Elimina la lettura conservata: il quaderno resta, l'interpretazione no. */
  const forgetAnalysis = () => {
    clearAnalysis();
    setSaved(null);
    setAiResult(null);
  };

  return {
    apiAvailable,
    aiConsent,
    setAiConsent,
    showAiPreview,
    setShowAiPreview,
    aiLoading,
    aiError,
    aiRequestId,
    aiResult,
    saved,
    forgetAnalysis,
    /** Testo inviato: l'anteprima deve mostrare esattamente questo. */
    aiSummary: payload.summary,
    aiDossier: payload.dossier,
    redactions: payload.redactions,
    online,
    runAiAnalysis,
    cancelAiAnalysis,
    recheckApi,
  };
}
