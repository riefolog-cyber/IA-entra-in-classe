import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Stato del servizio IA, letto da `/api/status`.
 *
 * L'endpoint esisteva già ma nessuno lo vedeva: qui diventa una risposta alle
 * domande che un docente si fa davanti a un errore («l'IA è configurata? quanto
 * budget resta oggi?»), senza mostrare chiavi o testo del quaderno.
 */
type StatusPayload = {
  ok?: boolean;
  ai?: {
    configured?: boolean;
    model?: string;
    limits?: { perMinute?: number; globalPerMinute?: number; daily?: number };
    usage?: { dailyUsed?: number; cachedAnalyses?: number };
  };
};

type State =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; payload: StatusPayload };

export function ServiceStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/status", {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("status");
        const payload = (await response.json()) as StatusPayload;
        setState({ kind: "ready", payload });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setState({ kind: "unavailable" });
      });

    return () => controller.abort();
  }, []);

  if (state.kind === "loading") {
    return <p className="page-meta">Verifico lo stato del servizio…</p>;
  }

  if (state.kind === "unavailable") {
    return (
      <p>
        Questa versione del sito è pubblicata senza backend: l’analisi del percorso è calcolata
        interamente nel browser e nessun testo lascia il dispositivo.
      </p>
    );
  }

  const ai = state.payload.ai;
  const dailyLimit = ai?.limits?.daily ?? 0;

  return (
    <ul className="plain-list">
      <li>
        <ShieldCheck size={15} aria-hidden="true" /> Analisi IA:{" "}
        {ai?.configured ? `attiva (${ai.model})` : "non configurata su questo server"}
      </li>
      {ai?.configured && (
        <li>
          Letture disponibili oggi:{" "}
          {dailyLimit > 0
            ? `${Math.max(dailyLimit - (ai.usage?.dailyUsed ?? 0), 0)}/${dailyLimit}`
            : "senza limite configurato"}
        </li>
      )}
      <li>Letture già calcolate conservate in memoria: {ai?.usage?.cachedAnalyses ?? 0}</li>
      <li>Il quaderno non viene inviato: viaggia solo la sintesi, senza il nome.</li>
    </ul>
  );
}
