import { useState } from "react";

import { robustGetSync, robustRemove, robustSet } from "../lib/safe-storage";

const SENT_KEY = "restare-umani-feedback";

// Form pubblico: https://docs.google.com/forms/d/1hxlD_cUGAbZ973Ban5wpU0IqdExpGPa4HB8okZfh-b0/edit
const FORM_VIEW =
  "https://docs.google.com/forms/d/e/1FAIpQLScHacKURs-Exni9nb62SenSPPXZu_gSUq1HggdWYRF6wNQY0A/viewform";

// Entry ID estratti automaticamente dal form pubblico.
const ENTRIES = {
  utility: "entry.154579810",
  clarity: "entry.298496945",
  open: "entry.948175716",
};

/** «Cancella i miei dati» rimuove anche il segno «feedback già inviato». */
export function clearFeedbackFlag(): void {
  robustRemove(SENT_KEY);
}

/**
 * Apre un indirizzo in una nuova scheda e dice se il browser l'ha permesso.
 *
 * `window.open(url, "_blank", "noopener")` restituisce **sempre** `null` (lo
 * impone la specifica), quindi non si può usare `noopener` per decidere se la
 * finestra si è aperta: si apre senza feature e si recide il riferimento dopo.
 */
export function openInNewTab(
  url: string,
  open: typeof window.open = window.open.bind(window),
): boolean {
  const opened = open(url, "_blank");
  if (!opened) return false;
  try {
    opened.opener = null;
  } catch {
    /* cross-origin: la nuova scheda è già isolata */
  }
  return true;
}

/** Indirizzo del questionario con le risposte già compilate (esportato per il test). */
export function prefilledFeedbackUrl(feedback: { u: number; c: number; open: string }): string {
  const params = new URLSearchParams({ usp: "pp_url" });
  if (feedback.u) params.set(ENTRIES.utility, String(feedback.u));
  if (feedback.c) params.set(ENTRIES.clarity, String(feedback.c));
  if (feedback.open.trim()) params.set(ENTRIES.open, feedback.open.trim());
  return `${FORM_VIEW}?${params.toString()}`;
}

export function useFeedback(notify: (message: string) => void) {
  const [feedback, setFeedback] = useState({ u: 0, c: 0, open: "" });
  const [feedbackSent, setFeedbackSent] = useState(() => robustGetSync(SENT_KEY) === "1");
  const [feedbackError, setFeedbackError] = useState("");
  /** Se il browser blocca la finestra, il link resta a portata di mano. */
  const [feedbackFallback, setFeedbackFallback] = useState("");

  /**
   * Apre il modulo Google in una nuova scheda, con le risposte già compilate.
   * Prima il sito inviava con `fetch(..., { mode: "no-cors" })`: quella
   * richiesta "riesce" anche se Google risponde 400 o il modulo è chiuso, e
   * l'utente vedeva «Grazie» senza che nulla fosse arrivato.
   */
  const submitFeedback = () => {
    setFeedbackError("");
    setFeedbackFallback("");

    const url = prefilledFeedbackUrl(feedback);

    if (!openInNewTab(url)) {
      setFeedbackFallback(url);
      setFeedbackError(
        "Il browser ha bloccato la nuova scheda: apri il questionario con il link qui sotto.",
      );
      return;
    }

    void robustSet(SENT_KEY, "1");
    setFeedbackSent(true);
    notify("Questionario aperto in una nuova scheda: invialo da lì.");
  };

  const resetFeedback = () => {
    robustRemove(SENT_KEY);
    setFeedbackSent(false);
    setFeedbackError("");
    setFeedbackFallback("");
    setFeedback({ u: 0, c: 0, open: "" });
  };

  return {
    feedback,
    setFeedback,
    feedbackSent,
    feedbackError,
    feedbackFallback,
    submitFeedback,
    resetFeedback,
  };
}
