import { CalendarDays, ChevronDown, Gauge, Quote, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Analysis, Evidence } from "../../../api/routes/analysis/schema";
import { formatAnalysisDate } from "../../lib/analysis-store";

/** Citazioni: chiuse per difetto, si aprono solo se il docente vuole vedere le prove. */
function EvidenceList({ items }: { items: Evidence[] }) {
  if (items.length === 0) return null;
  return (
    <details className="analysis-evidence">
      <summary>
        <Quote size={13} aria-hidden="true" /> Le tue parole
        <span className="analysis-evidence-count">{items.length}</span>
      </summary>
      <ul>
        {items.map((item) => (
          <li key={`${item.step}-${item.quote}`}>
            <blockquote>«{item.quote}»</blockquote>
            <span className="analysis-evidence-step">tappa {item.step}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

type AnalysisViewProps = {
  model: string;
  analysis: Analysis;
  /** Quando è stata prodotta la lettura. */
  at?: number;
  cached?: boolean;
  droppedQuotes?: number;
  loading: boolean;
  onCorrection: (text: string) => void;
  onForget: () => void;
};

/**
 * Il quadro completo: copertura, dieci tappe, dimensioni, coerenza, passi.
 *
 * Le citazioni sono sempre facoltative da aprire: il docente può leggere
 * l'interpretazione e, se vuole, controllare le proprie parole.
 */
export function AnalysisView({
  model,
  analysis,
  at,
  cached,
  droppedQuotes,
  loading,
  onCorrection,
  onForget,
}: AnalysisViewProps) {
  const [correction, setCorrection] = useState("");
  const [sending, setSending] = useState(false);

  const coverage = analysis.coverage;
  const worked = analysis.steps.filter((step) => step.worked).length;
  const total = analysis.steps.length || coverage?.stepsTotal || 10;

  const submit = () => {
    if (!correction.trim()) return;
    setSending(true);
    onCorrection(correction.trim());
    // Il testo resta: se la lettura fallisce, la precisazione non va persa.
    setTimeout(() => setSending(false), 1500);
  };

  return (
    <div className="ai-result analysis-full" aria-live="polite">
      <div className="ai-badge">
        ANALISI IA · {model || "modello configurato"}
        {at ? (
          <span className="analysis-date">
            <CalendarDays size={12} aria-hidden="true" /> {formatAnalysisDate(at)}
          </span>
        ) : null}
        {cached ? <span className="analysis-cached">lettura conservata</span> : null}
      </div>

      <h4>{analysis.headline}</h4>
      <p>{analysis.narrative}</p>

      <div className="analysis-coverage">
        <Gauge size={18} aria-hidden="true" />
        <div>
          <strong>
            {coverage
              ? `Lettura fondata su ${coverage.stepsWorked} tappe su ${coverage.stepsTotal}`
              : `Tappe lavorate: ${worked} su ${total}`}
          </strong>
          {coverage && coverage.emptySteps.length > 0 ? (
            <p>
              Ancora non lavorate: {coverage.emptySteps.map((step) => `tappa ${step}`).join(", ")}.
              Il quadro non le interpreta: le dichiara come assenti.
            </p>
          ) : (
            <p>Il percorso è completo: la lettura può contare su tutte le tappe.</p>
          )}
          {analysis.confidence ? (
            <p className="profile-footnote">
              Confidenza {analysis.confidence.level}
              {analysis.confidence.because ? ` · ${analysis.confidence.because}` : ""}
              {analysis.confidence.whatWouldChangeIt
                ? ` Per cambiarla: ${analysis.confidence.whatWouldChangeIt}`
                : ""}
            </p>
          ) : null}
          {droppedQuotes ? (
            <p className="profile-footnote">
              {droppedQuotes === 1
                ? "Una citazione non è stata trovata nel quaderno ed è stata rimossa."
                : `${droppedQuotes} citazioni non sono state trovate nel quaderno e sono state rimosse.`}
            </p>
          ) : null}
        </div>
      </div>

      {analysis.steps.length > 0 ? (
        <details className="analysis-block" open>
          <summary>
            <ChevronDown size={15} aria-hidden="true" /> Le dieci tappe, una per una
            <span className="analysis-evidence-count">{total}</span>
          </summary>
          <ol className="analysis-steps">
            {analysis.steps.map((step) => (
              <li key={step.step} className={step.worked ? "" : "analysis-step-empty"}>
                <span className="analysis-step-number">{String(step.step).padStart(2, "0")}</span>
                <div>
                  <strong>{step.title || `Tappa ${step.step}`}</strong>
                  <p>
                    {step.reading ||
                      (step.worked
                        ? "Tappa lavorata, senza elementi da commentare."
                        : "Non ancora lavorata.")}
                  </p>
                  <EvidenceList items={step.evidence} />
                </div>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {analysis.dimensions.length > 0 ? (
        <details className="analysis-block" open>
          <summary>
            <ChevronDown size={15} aria-hidden="true" /> Che cosa emerge, per dimensione
            <span className="analysis-evidence-count">{analysis.dimensions.length}</span>
          </summary>
          <div className="analysis-dimensions">
            {analysis.dimensions.map((dimension) => (
              <section key={dimension.dimension}>
                <h5>{dimension.dimension}</h5>
                <p>{dimension.whatEmerges}</p>
                <EvidenceList items={dimension.evidence} />
                {dimension.openQuestion ? (
                  <p className="analysis-question">{dimension.openQuestion}</p>
                ) : null}
              </section>
            ))}
          </div>
        </details>
      ) : null}

      {analysis.coherence.length > 0 ? (
        <details className="analysis-block" open>
          <summary>
            <ChevronDown size={15} aria-hidden="true" /> Intenzioni e pratiche
            <span className="analysis-evidence-count">{analysis.coherence.length}</span>
          </summary>
          <ul className="analysis-coherence">
            {analysis.coherence.map((item, index) => (
              <li key={index} className={item.kind === "tensione" ? "is-tension" : "is-aligned"}>
                <span className="analysis-tag">
                  {item.kind === "tensione" ? "tensione" : "allineata"}
                </span>
                <p>
                  <strong>Dichiari:</strong> {item.intention}
                </p>
                <p>
                  <strong>Scegli:</strong> {item.practice}
                </p>
                <EvidenceList items={item.evidence} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="grid">
        <section>
          <h4>Punti di forza</h4>
          <ul>
            {analysis.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Tensioni utili</h4>
          <ul>
            {analysis.tensions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
        {analysis.blindSpots.length > 0 ? (
          <section>
            <h4>Temi non ancora affrontati</h4>
            <ul>
              {analysis.blindSpots.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section>
          <h4>Domande per te</h4>
          <ul>
            {analysis.questions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {analysis.nextSteps.length > 0 ? (
        <div className="analysis-next-steps">
          <h4>Passi concreti</h4>
          <ul>
            {analysis.nextSteps.map((item, index) => (
              <li key={index}>
                <strong>{item.action}</strong>
                {item.howYouWillKnow ? <p>Te ne accorgi da: {item.howYouWillKnow}</p> : null}
                {item.within ? <span className="analysis-tag">{item.within}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.nextStep ? (
        <p>
          <strong>Prossimo passo:</strong> {analysis.nextStep}
        </p>
      ) : null}

      <p className="profile-footnote">{analysis.caution}</p>

      <div className="analysis-correction">
        <label htmlFor="analysis-correction">
          <strong>Questa lettura non ti rappresenta?</strong>
          <span>
            Scrivi che cosa non torna: la lettura viene rifatta tenendo conto della tua
            precisazione.
          </span>
        </label>
        <textarea
          id="analysis-correction"
          value={correction}
          onChange={(event) => setCorrection(event.target.value)}
          maxLength={1500}
          rows={3}
          placeholder="Per esempio: «Nella tappa 3 ho scelto quella risposta perché…»"
        />
        <div className="analysis-actions">
          <button
            className="button outline"
            type="button"
            disabled={!correction.trim() || loading || sending}
            onClick={submit}
          >
            {loading ? "Nuova lettura in corso…" : "Rileggi con questa precisazione"}
          </button>
          <button className="text-button" type="button" onClick={onForget}>
            <Trash2 size={14} aria-hidden="true" /> Elimina questa lettura
          </button>
        </div>
      </div>

      <div className="profile-print">
        <button className="button outline" type="button" onClick={() => window.print()}>
          Stampa l’analisi
        </button>
      </div>
    </div>
  );
}
