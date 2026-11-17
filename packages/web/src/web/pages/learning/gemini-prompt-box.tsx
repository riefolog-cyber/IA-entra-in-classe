import { Check, Copy, ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  GEMINI_ANALYSIS_PROMPT,
  GEMINI_CORRECTION_PROMPT,
  GEMINI_PRIVACY_NOTE,
  GEMINI_URL,
} from "../../lib/gemini-prompt";

/** Copia negli appunti con ripiego per i browser che negano `navigator.clipboard`. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

type GeminiPromptBoxProps = {
  /** Pulsante di esportazione già pronto nella vista: evita due comandi diversi. */
  exportButton?: ReactNode;
  /** Una lettura esiste già: la correzione ha senso solo in quel caso. */
  hasReading?: boolean;
  notify?: (message: string) => void;
};

/**
 * Strada alternativa all'analisi interna: il docente porta il proprio quaderno
 * in un modello esterno con un prompt che chiede lo stesso quadro.
 *
 * Non è un ripiego nascosto: è un'opzione visibile, perché il PDF è suo e il
 * modello che usa è una sua scelta.
 */
export function GeminiPromptBox({ exportButton, hasReading, notify }: GeminiPromptBoxProps) {
  const [copied, setCopied] = useState<"analysis" | "correction" | null>(null);
  const [failed, setFailed] = useState(false);

  const copy = async (kind: "analysis" | "correction") => {
    const text = kind === "analysis" ? GEMINI_ANALYSIS_PROMPT : GEMINI_CORRECTION_PROMPT;
    const ok = await copyText(text);
    if (!ok) {
      setFailed(true);
      // Il testo resta leggibile qui sotto: anche senza appunti si può selezionarlo.
      notify?.("Copia non riuscita: seleziona il testo del prompt e copialo a mano.");
      return;
    }
    setFailed(false);
    setCopied(kind);
    notify?.(
      kind === "analysis"
        ? "Prompt copiato: incollalo in Gemini."
        : "Prompt di correzione copiato.",
    );
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <section className="gemini-box" aria-labelledby="gemini-title">
      <h4 id="gemini-title">Oppure: leggi il percorso con Gemini</h4>
      <p>
        Il quaderno in PDF contiene tutto ciò che hai scritto. Puoi caricarlo in Gemini (o in un
        altro modello) e chiedergli lo stesso quadro che produce questa pagina, con un prompt già
        scritto: nessun dato passa da questo sito.
      </p>

      <ol className="gemini-steps">
        <li>
          <strong>Esporta il quaderno in PDF.</strong>
          {exportButton ? <div className="gemini-export">{exportButton}</div> : null}
        </li>
        <li>
          <strong>Apri Gemini e allega il PDF.</strong>
          <a className="text-button" href={GEMINI_URL} target="_blank" rel="noreferrer noopener">
            Apri Gemini <ExternalLink size={14} aria-hidden="true" />
          </a>
        </li>
        <li>
          <strong>Incolla il prompt.</strong>
          <div className="gemini-actions">
            <button className="button outline" type="button" onClick={() => void copy("analysis")}>
              {copied === "analysis" ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {copied === "analysis" ? "Prompt copiato" : "Copia il prompt"}
            </button>
            {hasReading ? (
              <button className="text-button" type="button" onClick={() => void copy("correction")}>
                Copia il prompt di correzione
              </button>
            ) : null}
          </div>
        </li>
      </ol>

      <details className="gemini-prompt-preview">
        <summary>Che cosa contiene il prompt</summary>
        <pre>{GEMINI_ANALYSIS_PROMPT}</pre>
      </details>

      <p className="profile-footnote gemini-privacy">{GEMINI_PRIVACY_NOTE}</p>
      {failed ? (
        <p className="profile-footnote">
          La copia automatica non è disponibile: apri «Che cosa contiene il prompt» e copia il testo
          a mano.
        </p>
      ) : null}
    </section>
  );
}
