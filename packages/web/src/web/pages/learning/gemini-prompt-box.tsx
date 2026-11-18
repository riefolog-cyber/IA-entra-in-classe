import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  GEMINI_ANALYSIS_PROMPT,
  GEMINI_CORRECTION_PROMPT,
  GEMINI_OTHER_MODELS,
  GEMINI_PRIVACY_NOTE,
  GEMINI_URL,
  buildGeminiStepPrompt,
} from "../../lib/gemini-prompt";
import { copyText, downloadText } from "../../lib/clipboard";
import { describeCoverage, notebookCoverage } from "../../lib/notebook-coverage";
import { steps, type SavedState } from "../../lib/teacher-content";
import { ReadingLog } from "./reading-log";

type GeminiPromptBoxProps = {
  /** Quaderno corrente: serve a dichiarare la copertura prima dell'invio. */
  data: SavedState;
  /** Pulsante di esportazione già pronto nella vista: evita due comandi diversi. */
  exportButton?: ReactNode;
  /** PDF della sola tappa: lo stesso comando della pagina della tappa. */
  onExportStep?: (index: number) => void;
  notify?: (message: string) => void;
};

/**
 * La lettura del percorso, affidata a un modello scelto dal docente.
 *
 * Il sito prepara il prompt, dichiara su quante tappe si fonderà e lascia
 * scegliere se portare tutto il quaderno o una sola tappa. Nessun testo esce
 * dal dispositivo per iniziativa del sito: l'invio lo fa il docente, altrove.
 */
export function GeminiPromptBox({
  data,
  exportButton,
  onExportStep,
  notify,
}: GeminiPromptBoxProps) {
  const [copied, setCopied] = useState<"analysis" | "correction" | null>(null);
  const [failed, setFailed] = useState(false);
  /** -1 = tutto il quaderno, altrimenti indice della tappa. */
  const [scope, setScope] = useState(-1);
  // Il timer del messaggio "copiato" non deve sopravvivere al componente.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const coverage = useMemo(() => notebookCoverage(data), [data]);

  const prompt = useMemo(
    () =>
      scope === -1
        ? GEMINI_ANALYSIS_PROMPT
        : buildGeminiStepPrompt(scope + 1, steps[scope]?.title ?? "Tappa"),
    [scope],
  );

  const filename =
    scope === -1 ? "prompt-gemini-quaderno.txt" : `prompt-gemini-tappa-${scope + 1}.txt`;

  const copy = async (kind: "analysis" | "correction") => {
    const text = kind === "analysis" ? prompt : GEMINI_CORRECTION_PROMPT;
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
        ? "Prompt copiato: incollalo nel modello."
        : "Prompt di correzione copiato.",
    );
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2500);
  };

  return (
    <section className="gemini-box" aria-labelledby="gemini-title">
      <h4 id="gemini-title">Leggi il percorso con Gemini</h4>
      <p>
        Il quaderno in PDF contiene tutto ciò che hai scritto. Puoi caricarlo in Gemini, o in un
        altro modello, con un prompt già scritto: il sito non chiama alcun modello e non conserva
        chiavi.
      </p>

      <ol className="gemini-steps">
        <li>
          <strong>Esporta il quaderno in PDF.</strong>
          {exportButton ? <div className="gemini-export">{exportButton}</div> : null}
          <p className="gemini-coverage">
            {describeCoverage(coverage)} Il modello leggerà solo ciò che c’è: le tappe vuote restano
            mute.
          </p>
        </li>
        <li>
          <strong>Apri il modello e allega il PDF.</strong>
          <a className="text-button" href={GEMINI_URL} target="_blank" rel="noreferrer noopener">
            Apri Gemini <ExternalLink size={14} aria-hidden="true" />
          </a>
        </li>
        <li>
          <strong>Scegli che cosa far leggere, poi incolla il prompt.</strong>
          <label className="gemini-scope">
            <span>Ambito del prompt</span>
            <select value={scope} onChange={(event) => setScope(Number(event.target.value))}>
              <option value={-1}>Tutto il quaderno</option>
              {steps.map((step, index) => (
                <option key={step.title} value={index}>
                  {`Tappa ${index + 1} — ${step.short}`}
                  {coverage.worked.includes(index) ? "" : " (vuota)"}
                </option>
              ))}
            </select>
          </label>
          {scope !== -1 ? (
            <p className="gemini-coverage">
              Il prompt qui sopra è scritto per la tappa {scope + 1}. Per farlo leggere insieme alle
              altre serve il PDF di quella sola tappa:{" "}
              {onExportStep ? (
                <button className="text-button" type="button" onClick={() => onExportStep(scope)}>
                  <Download size={14} aria-hidden="true" /> Esporta la tappa {scope + 1} in PDF
                </button>
              ) : (
                "usa «Esporta la tappa in PDF» nella pagina della tappa."
              )}
            </p>
          ) : null}
          <div className="gemini-actions">
            <button className="button outline" type="button" onClick={() => void copy("analysis")}>
              {copied === "analysis" ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {copied === "analysis" ? "Prompt copiato" : "Copia il prompt"}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                downloadText(prompt, filename);
                notify?.(`Prompt scaricato: ${filename}`);
              }}
            >
              <Download size={14} aria-hidden="true" /> Scarica .txt
            </button>
            <button className="text-button" type="button" onClick={() => void copy("correction")}>
              Copia il prompt di correzione (dopo la lettura)
            </button>
          </div>
          {/* Il cambio di etichetta non basta ai lettori di schermo. */}
          <output className="screen-reader-only" aria-live="polite">
            {copied === "analysis"
              ? "Prompt copiato"
              : copied === "correction"
                ? "Prompt di correzione copiato"
                : ""}
          </output>
        </li>
      </ol>

      <details className="gemini-prompt-preview">
        <summary>Che cosa contiene il prompt</summary>
        <pre>{prompt}</pre>
      </details>

      <details className="gemini-prompt-preview">
        <summary>Se usi un altro modello</summary>
        <p>{GEMINI_OTHER_MODELS}</p>
      </details>

      <p className="profile-footnote gemini-privacy">{GEMINI_PRIVACY_NOTE}</p>

      <ReadingLog scope={scope} notify={notify} />
      {failed ? (
        <p className="profile-footnote">
          La copia automatica non è disponibile: apri «Che cosa contiene il prompt» e copia il testo
          a mano, oppure scarica il file .txt.
        </p>
      ) : null}
    </section>
  );
}
