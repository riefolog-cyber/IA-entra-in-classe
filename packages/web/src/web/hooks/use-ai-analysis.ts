import { useEffect, useMemo, useRef, useState } from "react";

import { buildAiSummary } from "../lib/ai-summary";
import { checkApiHealth } from "../lib/api-health";
import type { SavedState } from "../lib/teacher-content";

type Analysis = {
  headline: string;
  narrative: string;
  strengths: string[];
  tensions: string[];
  questions: string[];
  nextStep: string;
  caution: string;
};

type AnalysisResponse =
  | { ok: false; reason?: string; message?: string; requestId?: string }
  | { ok: true; model: string; analysis: Analysis; cached?: boolean; requestId?: string };

// Il server chiude la chiamata al provider a 90 s: qui si lascia un margine,
// così il messaggio che arriva all'utente è quello dell'endpoint.
const ANALYSIS_TIMEOUT_MS = 95_000;

export function useAiAnalysis(data: SavedState) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRequestId, setAiRequestId] = useState("");
  const [aiResult, setAiResult] = useState<null | { model?: string; analysis: Analysis }>(null);
  const [apiCheckTick, setApiCheckTick] = useState(0);
  // Senza rete la richiesta non parte: meglio dirlo subito che attendere il timeout.
  const [online, setOnline] = useState(() => navigator.onLine);
  const requestRef = useRef<AbortController | null>(null);

  // La sintesi si ricalcola solo quando il quaderno cambia: prima veniva
  // ricostruita a ogni render dell'anteprima.
  const aiSummary = useMemo(() => buildAiSummary(data), [data]);

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

  const runAiAnalysis = async () => {
    if (!navigator.onLine) {
      setAiError(
        "Sei offline: l'analisi IA richiede una connessione. Le risposte restano salvate e puoi esportare il quaderno.",
      );
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiRequestId("");
    setAiResult(null);

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      // Chiamata diretta all'endpoint RPC: evita dipendenze dal client oRPC
      // lato browser e usa lo stesso formato richiesta/risposta del server.
      const response = await fetch(`${window.location.origin}/api/rpc/analyzeProfile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: { summary: aiSummary } }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as { json?: unknown } | null;
      const res = payload?.json as AnalysisResponse | null;

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
        setAiResult(res);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setAiError("Lettura annullata. Puoi riprovare quando vuoi.");
      } else {
        setAiError(
          error instanceof Error
            ? error.message
            : "Analisi IA non disponibile in questa versione del sito. Puoi comunque esportare il tuo quaderno.",
        );
      }
    } finally {
      clearTimeout(timer);
      requestRef.current = null;
      setAiLoading(false);
    }
  };

  const cancelAiAnalysis = () => requestRef.current?.abort();

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
    aiSummary,
    online,
    runAiAnalysis,
    cancelAiAnalysis,
    recheckApi,
  };
}
