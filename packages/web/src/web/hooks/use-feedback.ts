import { useState } from "react";

import { robustGetSync, robustRemove, robustSet } from "../lib/safe-storage";

const SENT_KEY = "restare-umani-feedback";

// Form pubblico: https://docs.google.com/forms/d/1hxlD_cUGAbZ973Ban5wpU0IqdExpGPa4HB8okZfh-b0/edit
const FORM_RESPONSE =
  "https://docs.google.com/forms/d/e/1FAIpQLScHacKURs-Exni9nb62SenSPPXZu_gSUq1HggdWYRF6wNQY0A/formResponse";

// Entry ID estratti automaticamente dal form pubblico.
const ENTRIES = {
  utility: "entry.154579810",
  clarity: "entry.298496945",
  open: "entry.948175716",
};

export function useFeedback(notify: (message: string) => void) {
  const [feedback, setFeedback] = useState({ u: 0, c: 0, open: "" });
  const [feedbackSent, setFeedbackSent] = useState(() => robustGetSync(SENT_KEY) === "1");

  const submitFeedback = async () => {
    const params = new URLSearchParams();
    if (feedback.u) params.set(ENTRIES.utility, String(feedback.u));
    if (feedback.c) params.set(ENTRIES.clarity, String(feedback.c));
    if (feedback.open.trim()) params.set(ENTRIES.open, feedback.open.trim());

    try {
      await fetch(FORM_RESPONSE, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
    } catch {
      // no-cors: la risposta è opaca, ma l'invio è partito
    }

    void robustSet(SENT_KEY, "1");
    setFeedbackSent(true);
    notify("Grazie per il feedback!");
  };

  const resetFeedback = () => {
    robustRemove(SENT_KEY);
    setFeedbackSent(false);
    setFeedback({ u: 0, c: 0, open: "" });
  };

  return { feedback, setFeedback, feedbackSent, submitFeedback, resetFeedback };
}
