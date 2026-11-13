import { useEffect, useState } from "react";

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
  | { ok: false; reason?: string; message?: string }
  | { ok: true; model: string; analysis: Analysis };

export function useAiAnalysis(data: SavedState) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<null | { model?: string; analysis: Analysis }>(null);
  const [apiCheckTick, setApiCheckTick] = useState(0);

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

  const recheckApi = () => {
    setApiAvailable(null);
    setApiCheckTick((tick) => tick + 1);
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const summary = buildAiSummary(data);

      // Chiamata diretta all'endpoint RPC: evita dipendenze dal client oRPC
      // lato browser e usa lo stesso formato richiesta/risposta del server.
      const response = await fetch(`${window.location.origin}/api/rpc/analyzeProfile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: { summary } }),
      });
      const payload = (await response.json().catch(() => null)) as { json?: unknown } | null;
      const res = payload?.json as AnalysisResponse | null;

      if (!res) {
        setAiError(
          "Analisi IA non disponibile in questa versione del sito. Puoi comunque esportare il tuo quaderno.",
        );
      } else if (!res.ok) {
        setAiError(res.message || "Analisi IA non disponibile.");
      } else {
        setAiResult(res);
      }
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Analisi IA non disponibile in questa versione del sito. Puoi comunque esportare il tuo quaderno.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  return {
    apiAvailable,
    aiConsent,
    setAiConsent,
    showAiPreview,
    setShowAiPreview,
    aiLoading,
    aiError,
    aiResult,
    runAiAnalysis,
    recheckApi,
    buildAiSummary: () => buildAiSummary(data),
  };
}
