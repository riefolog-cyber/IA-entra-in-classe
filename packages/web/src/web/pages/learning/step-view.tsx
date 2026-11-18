import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Feather,
  MessageCircle,
} from "lucide-react";

import type { ReactElement } from "react";

import { StepEmblem } from "../../components/step-emblem";
import { MAX_ANSWER_LENGTH } from "../../lib/notebook-state";
import {
  glossary,
  references,
  stepSources,
  steps,
  type SavedState,
  type Step,
} from "../../lib/teacher-content";
import type { Go } from "./navigation";

type StepProps = {
  data: SavedState;
  step: Step;
  /** Indice della tappa mostrata: viene dalla rotta, non dallo stato salvato. */
  stepIndex: number;
  phaseImage: (phase?: string) => string;
  go: Go;
  toggleComplete: (i?: number) => void;
  downloadStep: (index: number) => void;
  write: (key: string, value: string) => void;
  openGlossary: (term: string) => void;
};

export function StepView({
  data,
  step,
  stepIndex,
  phaseImage,
  go,
  toggleComplete,
  downloadStep,
  write,
  openGlossary,
}: StepProps) {
  const stepCount = steps.length;
  const sources = (stepSources[stepIndex] ?? []).map((i) => references[i]).filter(Boolean);
  const stepText = [
    step.title,
    step.subtitle,
    step.intro,
    step.concept,
    step.takeaway,
    step.scenario,
  ]
    .join(" ")
    .toLowerCase();
  const keywords = glossary
    .filter(
      ([term, , refs]) => stepText.includes(term.toLowerCase()) || refs.includes(stepIndex + 1),
    )
    .slice(0, 6)
    .map(([term]) => term);

  const field = (
    key: string,
    label: string,
    placeholder = "Parti dal tuo contesto professionale. Usa esempi inventati, senza dati degli studenti.",
  ): ReactElement => (
    <label className="text-field" key={key}>
      <span>{label}</span>
      <textarea
        aria-label={label}
        value={data.answers[key] || ""}
        onChange={(e) => write(key, e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_ANSWER_LENGTH}
        rows={4}
      />
      <small>
        Riflessione professionale · niente nomi o dati identificativi degli studenti
        {/* Il limite è 4.000 caratteri: meglio dirlo prima che il campo si fermi. */}
        {(data.answers[key] || "").length >= MAX_ANSWER_LENGTH - 400
          ? ` · ${(data.answers[key] || "").length}/${MAX_ANSWER_LENGTH} caratteri`
          : ""}
      </small>
    </label>
  );

  return (
    <div className="reading-page step-reading">
      <div className="page-eyebrow">
        TAPPA {stepIndex + 1} / {stepCount}
        {step.phase ? <span>{step.phase}</span> : null}
      </div>

      <div className="step-head-visual">
        <div>
          <h1>{step.title}</h1>
          <p className="page-lead">{step.subtitle}</p>
        </div>
        <StepEmblem index={stepIndex} />
      </div>

      <div className="step-pills" aria-label="Avanzamento tappe">
        {steps.map((_, i) => (
          <button
            key={i}
            className={`${stepIndex === i ? "active" : ""} ${data.completed.includes(i) ? "done" : ""}`.trim()}
            onClick={() => go("step", i)}
            aria-label={`Apri tappa ${i + 1}`}
            title={`Tappa ${i + 1}`}
          >
            {data.completed.includes(i) ? <Check size={14} /> : i + 1}
          </button>
        ))}
      </div>

      <p className="intro-text">{step.intro}</p>

      <div className="concept-box concept-box-with-image">
        <div className="concept-visual">
          <img
            className="concept-hero-image"
            src="./images/theme/anim-book.svg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            width={200}
            height={160}
          />
        </div>

        <div>
          <strong>Una chiave di lettura</strong>

          <p>{step.concept}</p>
        </div>
      </div>

      <div className="step-takeaway">
        <strong>In sintesi</strong>

        <p>{step.takeaway}</p>
      </div>

      {keywords.length > 0 && (
        <div className="keyword-row">
          <span className="keyword-label">Parole chiave</span>
          {keywords.map((term) => (
            <button
              key={term}
              type="button"
              className="keyword-chip"
              onClick={() => openGlossary(term)}
            >
              {term}
            </button>
          ))}
        </div>
      )}

      <section className="activity">
        <div className="activity-visual">
          <img
            className="activity-hero-image"
            src="./images/theme/anim-brain.svg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            width={220}
            height={180}
          />
        </div>

        <div className="activity-label">
          <Feather size={17} />
          01 · RIFLETTI E PROGETTA
        </div>

        <h2>Rispondi in poche righe.</h2>

        <p>Una domanda per il tuo contesto. La tua risposta entrerà nel quaderno finale.</p>

        {step.prompts.map((p, i) => field(`${stepIndex}-p${i}`, p))}
      </section>

      <section className="activity">
        <div className="activity-visual">
          <img
            className="activity-hero-image"
            src={phaseImage(step.phase)}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="activity-label">
          <CheckCircle2 size={17} />
          02 · VERIFICA LA COMPRENSIONE
        </div>

        <h2>{step.question}</h2>

        <p>Il quiz verifica un concetto, non valuta chi sei.</p>

        <fieldset className="option-list" aria-label="Risposte al quiz">
          {step.options.map((o, i) => (
            <label
              key={o}
              className={`option ${data.answers[`${stepIndex}-quiz`] === String(i) ? "chosen" : ""}`}
            >
              <input
                type="radio"
                name={`quiz-${stepIndex}`}
                value={i}
                checked={data.answers[`${stepIndex}-quiz`] === String(i)}
                onChange={() => write(`${stepIndex}-quiz`, String(i))}
              />

              <span className="radio-dot" aria-hidden="true" />

              <span>{o}</span>
            </label>
          ))}
        </fieldset>

        {data.answers[`${stepIndex}-quiz`] !== undefined && (
          <output className="feedback" aria-live="polite">
            <strong>
              {Number(data.answers[`${stepIndex}-quiz`]) === step.correct
                ? "Hai individuato il concetto."
                : "Un’occasione per approfondire."}
            </strong>

            <p>{step.explanation}</p>

            <small>Risposta corretta: {step.options[step.correct]}</small>
          </output>
        )}
      </section>

      <section className="activity">
        <div className="activity-visual">
          <img
            className="activity-hero-image"
            src="./images/theme/anim-people.svg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            width={240}
            height={120}
          />
        </div>

        <div className="activity-label">
          <MessageCircle size={17} />
          03 · ESPLORA UNO SCENARIO
        </div>

        <h2>Nel tuo ruolo docente, che cosa faresti?</h2>

        <div className="scenario-visual">
          <img
            className="scenario-hero-image"
            src="./images/theme/anim-core.svg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            width={200}
            height={200}
          />
        </div>

        <div className="scenario-story">{step.scenario}</div>

        {step.decisionFocus && (
          <p className="decision-focus">
            <strong>Focus della decisione:</strong> {step.decisionFocus}
          </p>
        )}

        <p>Non c’è un voto. Scegli un punto di partenza e discuti le sue conseguenze.</p>

        <div className="option-list">
          {step.choices.map((c, i) => (
            <label
              key={c}
              className={`option ${data.answers[`${stepIndex}-scenario`] === String(i) ? "chosen" : ""}`}
            >
              <input
                type="radio"
                name={`scenario-${stepIndex}`}
                value={i}
                checked={data.answers[`${stepIndex}-scenario`] === String(i)}
                onChange={() => write(`${stepIndex}-scenario`, String(i))}
              />

              <span className="radio-dot" aria-hidden="true" />

              <span>{c}</span>
            </label>
          ))}
        </div>

        {data.answers[`${stepIndex}-scenario`] !== undefined && (
          <div className="feedback">
            <strong>Una domanda per andare oltre</strong>

            <p>{step.perspectives[Number(data.answers[`${stepIndex}-scenario`])]}</p>
          </div>
        )}

        {field(
          `${stepIndex}-reason`,

          "Quali condizioni rendono sostenibile la mia scelta? Quale rischio o obiezione discuterei con un collega?",
        )}

        <details className="perspectives">
          <summary>
            Confronta tutte le prospettive <ChevronDown size={16} />
          </summary>

          {step.choices.map((c, i) => (
            <div key={c}>
              <strong>{c}</strong>

              <p>{step.perspectives[i]}</p>
            </div>
          ))}
        </details>
      </section>

      <div className="completion-box completion-box-with-image">
        <div className="completion-visual">
          <img
            className="completion-hero-image"
            src="./images/theme/anim-shield.svg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            width={120}
            height={140}
          />
        </div>

        <div>
          <strong>
            {data.completed.includes(stepIndex)
              ? "Questa tappa è segnata come conclusa."
              : "Hai dedicato del tempo a questa tappa?"}
          </strong>
        </div>

        <button className="button primary" onClick={() => toggleComplete(stepIndex)}>
          <Check size={17} />

          {data.completed.includes(stepIndex) ? "Riapri la tappa" : "Segna come conclusa"}
        </button>

        <button className="button outline" onClick={() => downloadStep(stepIndex)}>
          <Download size={16} />
          Esporta questa tappa
        </button>
      </div>

      {sources.length > 0 && (
        <section className="step-sources" aria-labelledby="step-sources-title">
          <h2 id="step-sources-title">Riferimenti per questa tappa</h2>
          <p>Documenti da cui partire, se vuoi portare il tema in dipartimento.</p>
          <ul>
            {sources.map((reference) => (
              <li key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.title}
                </a>
                <span>{reference.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="page-navigation">
        <button
          className="text-button"
          onClick={() => (stepIndex ? go("step", stepIndex - 1) : go("home"))}
        >
          <ArrowLeft size={16} />

          {stepIndex ? "Tappa precedente" : "Il percorso"}
        </button>

        <button
          className="button outline"
          onClick={() => (stepIndex < stepCount - 1 ? go("step", stepIndex + 1) : go("summary"))}
        >
          {stepIndex < stepCount - 1 ? "Tappa successiva" : "Vai al riepilogo"}

          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mobile-step-cta">
        <button className="button primary" onClick={() => toggleComplete(stepIndex)}>
          <Check size={16} />

          {data.completed.includes(stepIndex) ? "Riapri questa tappa" : "Concludi questa tappa"}
        </button>
      </div>
    </div>
  );
}
