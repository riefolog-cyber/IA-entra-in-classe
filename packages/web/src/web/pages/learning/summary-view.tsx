import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import type { ReactNode, RefObject } from "react";

import { useAiAnalysis } from "../../hooks/use-ai-analysis";
import { useFeedback } from "../../hooks/use-feedback";
import { steps, type SavedState } from "../../lib/teacher-content";
import { buildTeacherProfile } from "../../lib/teacher-profile";
import type { Go } from "./navigation";

type SummaryProps = {
  data: SavedState;
  setData: (updater: (d: SavedState) => SavedState) => void;
  phases: { name: string; items: { i: number }[] }[];
  summaryStatus: "empty" | "progress" | "complete";
  nextStep: number;
  progressPct: number;
  answered: number;
  totalFields: number;
  go: Go;
  exportButton: ReactNode;
  exportJson: () => void;
  importJson: (file: File) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  notify: (message: string) => void;
};

export function SummaryView(props: SummaryProps) {
  const {
    data,
    setData,
    phases,
    summaryStatus,
    nextStep,
    progressPct,
    answered,
    totalFields,
    go,
    exportButton,
    exportJson,
    importJson,
    fileInputRef,
    notify,
  } = props;
  const stepCount = steps.length;

  const {
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
    buildAiSummary,
  } = useAiAnalysis(data);

  const { feedback, setFeedback, feedbackSent, submitFeedback, resetFeedback } =
    useFeedback(notify);

  // Analisi deterministica calcolata nel browser: sostituisce il servizio
  // esterno quando il sito è pubblicato in forma statica.
  const localProfile = buildTeacherProfile(data);

  return (
    <div className="reading-page">
      <div className="eyebrow">CIÒ CHE PORTO CON ME</div>

      <div className="step-head-visual">
        <div>
          <h1>Il mio percorso, fin qui.</h1>
          <p className="page-lead">
            Il tuo quaderno di aggiornamento: decisioni, consegne e materiali da portare in classe.
          </p>
        </div>
        <img
          className="step-visual"
          src="./images/theme/fase-revisione.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={240}
          height={120}
        />
      </div>

      <section
        className={`summary-status summary-status-${summaryStatus}`}
        aria-label="Stato del percorso"
      >
        <div className="summary-status-copy">
          <strong>
            {summaryStatus === "empty"
              ? "Il quaderno è ancora vuoto"
              : summaryStatus === "complete"
                ? "Percorso completato"
                : "Percorso in corso"}
          </strong>
          <p>
            {summaryStatus === "empty"
              ? "Puoi iniziare da una tappa qualsiasi: le risposte si salvano automaticamente in questo browser e puoi esportare il PDF in ogni momento."
              : summaryStatus === "complete"
                ? "Hai concluso tutte le tappe. Rivedi le risposte e scarica il PDF come traccia del tuo aggiornamento."
                : `Hai compilato il ${progressPct}% dei campi (${answered}/${totalFields}) e concluso ${data.completed.length}/${stepCount} tappe. Puoi continuare da dove eri rimasto.`}
          </p>
        </div>
        <div className="summary-status-actions">
          {summaryStatus !== "complete" && (
            <button
              className="button primary"
              onClick={() => go("step", summaryStatus === "empty" ? 0 : nextStep)}
            >
              {summaryStatus === "empty"
                ? "Inizia dalla prima tappa"
                : `Continua: tappa ${nextStep + 1}`}
              <ArrowRight size={16} />
            </button>
          )}
          <button
            className="button outline"
            onClick={() =>
              document
                .querySelector<HTMLElement>(".summary-export-pdf")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Vai all’export PDF
          </button>
        </div>
        <div className="summary-progress-bar" aria-hidden="true">
          <span style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <div className="summary-metrics">
        <div>
          <strong>
            {data.completed.length}

            <small>/{stepCount}</small>
          </strong>

          <span>Tappe segnate come concluse</span>
        </div>

        <div>
          <strong>
            {answered}

            <small>/{totalFields}</small>
          </strong>

          <span>Domande e scelte compilate</span>
        </div>
        <div>
          <strong>
            {progressPct}
            <small>%</small>
          </strong>

          <span>Campi compilati</span>
        </div>
      </div>

      <div className="path-phases summary-phases">
        {phases.map((phase) => (
          <section key={phase.name} className="path-phase">
            <div className="path-phase-head">
              <h3>{phase.name}</h3>

              <span>
                {phase.items.filter(({ i }) => data.completed.includes(i)).length}/
                {phase.items.length}
              </span>
            </div>
          </section>
        ))}
      </div>

      <div className="concept-box summary-export-pdf">
        <Download size={24} />

        <div>
          <span className="summary-cta-badge">Consigliato</span>
          <strong>Esporta il quaderno in PDF</strong>

          <p>
            Include le {stepCount} tappe, le domande, le tue risposte, i quiz con spiegazioni, tutti
            gli scenari e il glossario. Le risposte mancanti sono indicate: puoi esportare in
            qualsiasi momento.
          </p>

          {exportButton}
        </div>
      </div>

      <div className="concept-box">
        <Download size={24} />

        <div>
          <strong>Trasferisci i tuoi dati</strong>

          <p>
            Esporta le risposte in JSON per conservarle o spostarle su un altro dispositivo; importa
            un file precedentemente esportato per riprendere il lavoro.
          </p>

          <div className="hero-actions">
            <button className="button outline" onClick={exportJson}>
              Esporta JSON
            </button>

            <button className="button outline" onClick={() => fileInputRef.current?.click()}>
              Importa JSON
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];

              if (f) importJson(f);

              e.target.value = "";
            }}
          />
        </div>
      </div>

      <label className="text-field">
        <span>Nome</span>

        <input
          aria-label="Nome"
          value={data.name}
          placeholder="Inserisci il tuo nome"
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        />
      </label>

      {steps.map((s, i) => {
        const stepAnswered =
          s.prompts.some((_, n) => (data.answers[`${i}-p${n}`] || "").trim()) ||
          data.answers[`${i}-quiz`] !== undefined ||
          data.answers[`${i}-scenario`] !== undefined ||
          (data.answers[`${i}-reason`] || "").trim();
        return (
          <details className="summary-step" key={s.title}>
            <summary>
              <span>
                <span className="summary-number">0{i + 1}</span>

                {s.title}
              </span>

              <span>
                {data.completed.includes(i) ? (
                  <CheckCircle2 size={18} />
                ) : stepAnswered ? (
                  <span className="pending">In corso</span>
                ) : (
                  <span className="pending">Non iniziata</span>
                )}

                <ChevronDown size={16} />
              </span>
            </summary>

            <div>
              {!stepAnswered && (
                <div className="summary-step-empty">
                  <p>Nessuna risposta ancora per questa tappa.</p>
                  <button className="text-button" onClick={() => go("step", i)}>
                    Vai alla tappa <ArrowRight size={15} />
                  </button>
                </div>
              )}
              {s.prompts.map((p, n) => (
                <div key={p}>
                  <h4>{p}</h4>

                  <p className="answer-text">
                    {data.answers[`${i}-p${n}`] || "Non ancora compilata."}
                  </p>
                </div>
              ))}

              <h4>Quiz: {s.question}</h4>

              <p>
                {data.answers[`${i}-quiz`] !== undefined
                  ? s.options[Number(data.answers[`${i}-quiz`])]
                  : "Nessuna scelta."}
              </p>

              <h4>Scenario: {s.scenario}</h4>

              <p>
                {data.answers[`${i}-scenario`] !== undefined
                  ? s.choices[Number(data.answers[`${i}-scenario`])]
                  : "Nessuna scelta."}
              </p>

              <h4>La mia motivazione</h4>

              <p className="answer-text">
                {data.answers[`${i}-reason`] || "Non ancora compilata."}
              </p>

              <button className="text-button" onClick={() => go("step", i)}>
                Rivedi e modifica <ArrowRight size={15} />
              </button>
            </div>
          </details>
        );
      })}

      <div className="activity">
        <h2>Il mio profilo e l’autocomprensione</h2>
        <p>
          L’analisi IA rilegge le tue risposte come un testo professionale: cerca il senso delle
          scelte, le tensioni e le contraddizioni che emergono dal percorso e propone punti di
          forza, punti da chiarire, domande aperte e un possibile prossimo passo. Non interpreta i
          campi vuoti come segnali personali: un silenzio resta un silenzio.
        </p>
        {apiAvailable === false ? (
          <div className="concept-box">
            <ShieldCheck size={24} />
            <div>
              <strong>Il servizio IA non ha risposto</strong>
              <p>
                L’analisi con IA resta disponibile su questa installazione: il controllo del backend
                non è andato a buon fine, per esempio durante un avvio a freddo o per un problema di
                rete. Attendi qualche secondo e riprova.
              </p>

              <button className="button outline" type="button" onClick={recheckApi}>
                Riprova a contattare il servizio IA
              </button>

              <h4>Nel frattempo: analisi locale</h4>
              <p>Questa lettura è calcolata nel browser, senza inviare nulla.</p>

              <h4>{localProfile.headline}</h4>
              <p>{localProfile.summary}</p>

              <h4>Risorse che riconosci</h4>
              <ul>
                {localProfile.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h4>Punti da esplorare</h4>
              <ul>
                {localProfile.growth.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h4>Domande per te</h4>
              <ul>
                {localProfile.questions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="ai-analysis ai-analysis-with-visual">
            <div className="ai-visual">
              <img
                className="ai-hero-image"
                src="./images/theme/anim-brain.svg"
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                width={220}
                height={180}
              />
            </div>
            <label className="ai-consent">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(event) => setAiConsent(event.target.checked)}
              />
              <span>
                Ho letto le informazioni sopra e acconsento all’invio del testo al servizio IA
                esterno.
              </span>
            </label>
            <div className="ai-actions">
              <button
                className="button outline"
                type="button"
                onClick={() => setShowAiPreview((v) => !v)}
              >
                {showAiPreview ? "Nascondi dati inviati" : "Mostra dati inviati"}
              </button>
              <button
                className="button primary"
                type="button"
                disabled={aiLoading || apiAvailable === null || !aiConsent}
                onClick={runAiAnalysis}
              >
                {aiLoading ? "Lettura in corso…" : "Leggi il mio percorso"}
              </button>
            </div>
            {showAiPreview && (
              <textarea
                className="ai-preview"
                readOnly
                value={buildAiSummary()}
                aria-label="Dati inviati per l’analisi IA"
              />
            )}
            {aiLoading && (
              <output className="ai-loading" aria-live="polite">
                <span className="ai-loading-dot" aria-hidden="true" />
                <span>
                  Sto preparando la lettura del tuo percorso… può richiedere qualche secondo.
                </span>
              </output>
            )}
            {aiError && (
              <div className="ai-error" role="alert">
                {aiError}
              </div>
            )}
            {aiResult?.analysis && (
              <div className="ai-result">
                <div className="ai-badge">
                  ANALISI IA · {aiResult.model || "modello configurato"}
                </div>
                <h4>{aiResult.analysis.headline}</h4>
                <p>{aiResult.analysis.narrative}</p>
                <div className="grid">
                  <section>
                    <h4>Punti di forza</h4>
                    <ul>
                      {aiResult.analysis.strengths.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4>Tensioni utili</h4>
                    <ul>
                      {aiResult.analysis.tensions.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4>Domande per te</h4>
                    <ul>
                      {aiResult.analysis.questions.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <p>
                  <strong>Prossimo passo:</strong> {aiResult.analysis.nextStep}
                </p>
                <p className="profile-footnote">{aiResult.analysis.caution}</p>
                <div className="profile-print">
                  <button className="button outline" type="button" onClick={() => window.print()}>
                    Stampa l’analisi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!feedbackSent ? (
        <div className="concept-box">
          <MessageCircle size={24} />

          <div>
            <strong>Aiutaci a migliorare il percorso</strong>

            <p>
              3 domande, anonime, 30 secondi. I risultati ci aiutano a capire se il percorso è
              utile, chiaro e ben calibrato nei tempi.
            </p>

            <fieldset className="option-list feedback-block">
              <legend className="feedback-legend">1. Quanto è stato utile?</legend>

              <div className="feedback-scale">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`option feedback-scale-button ${feedback.u === n ? "chosen" : ""}`}
                    onClick={() => setFeedback((f) => ({ ...f, u: n }))}
                    aria-pressed={feedback.u === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="option-list feedback-block">
              <legend className="feedback-legend">2. Quanto erano chiare le attività?</legend>

              <div className="feedback-scale">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`option feedback-scale-button ${feedback.c === n ? "chosen" : ""}`}
                    onClick={() => setFeedback((f) => ({ ...f, c: n }))}
                    aria-pressed={feedback.c === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="text-field feedback-open">
              <span>Altro da segnalare?</span>

              <textarea
                rows={3}
                value={feedback.open}
                onChange={(e) => setFeedback((f) => ({ ...f, open: e.target.value }))}
                placeholder="Suggerimenti, difficoltà, idee…"
              />
            </label>

            <div className="hero-actions feedback-actions">
              <button
                className="button primary"
                onClick={submitFeedback}
                disabled={!feedback.u || !feedback.c}
              >
                Invia feedback
              </button>
            </div>

            <p className="feedback-privacy">
              Il feedback è anonimo e viene inviato a un modulo Google esterno: il servizio può
              registrare dati tecnici come l’indirizzo IP. Non inserire dati personali nel campo
              libero.
            </p>
          </div>
        </div>
      ) : (
        <div className="notice">
          Grazie per il tuo feedback!{" "}
          <button className="text-button" onClick={resetFeedback}>
            Modifica risposta
          </button>
        </div>
      )}
    </div>
  );
}
