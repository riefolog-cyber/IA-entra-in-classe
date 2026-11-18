import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { useState, type ReactNode, type RefObject } from "react";

import { useFeedback } from "../../hooks/use-feedback";
import { lastBackupAt, shouldSuggestBackup, snoozeBackupReminder } from "../../lib/backup-reminder";
import { buildCalendarEvent } from "../../lib/calendar";
import { downloadText } from "../../lib/clipboard";
import { canExportAttestation } from "../../lib/export-attestation";
import { MAX_NAME_LENGTH, type NotebookBackup } from "../../lib/notebook-state";
import { siteMeta } from "../../lib/site-meta";
import { steps, type SavedState } from "../../lib/teacher-content";
import { GeminiPromptBox } from "./gemini-prompt-box";
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
  downloadAttestation: () => void;
  downloadStep: (index: number) => void;
  notify: (message: string) => void;
  backups: NotebookBackup[];
  restoreBackup: (savedAt: number) => void;
};

const backupReason: Record<NotebookBackup["reason"], string> = {
  manuale: "copia manuale",
  importazione: "prima di un'importazione",
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
    downloadAttestation,
    downloadStep,
    notify,
    backups,
    restoreBackup,
  } = props;
  const stepCount = steps.length;
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  // Il ripristino sostituisce il quaderno: un clic solo è troppo poco.
  const [pendingRestore, setPendingRestore] = useState<number | null>(null);

  const {
    feedback,
    setFeedback,
    feedbackSent,
    feedbackError,
    feedbackFallback,
    submitFeedback,
    resetFeedback,
  } = useFeedback(notify);

  const attestationReady = canExportAttestation(data);
  const hasNotebookContent = answered > 0 || data.completed.length > 0;
  const [suggestBackup, setSuggestBackup] = useState(() => shouldSuggestBackup(hasNotebookContent));
  const lastExport = lastBackupAt();

  // Promemoria locale: una data scelta, un file .ics, nessun server.
  const [reminderDate, setReminderDate] = useState(() => {
    const inAWeek = new Date();
    inAWeek.setDate(inAWeek.getDate() + 7);
    return [
      inAWeek.getFullYear(),
      String(inAWeek.getMonth() + 1).padStart(2, "0"),
      String(inAWeek.getDate()).padStart(2, "0"),
    ].join("-");
  });

  const addReminder = () => {
    const [year, month, day] = reminderDate.split("-").map(Number);
    if (!year || !month || !day) return;

    const ics = buildCalendarEvent({
      date: new Date(year, month - 1, day),
      title: "Riprendi il percorso: Restare umani",
      description:
        "Torna al quaderno di aggiornamento. Le risposte sono salvate nel browser del dispositivo su cui le hai scritte.",
      url: `${siteMeta.url}#/riepilogo`,
    });

    downloadText(ics, "restare-umani-promemoria.ics", "text/calendar;charset=utf-8");
    notify("Promemoria scaricato: aprilo con il tuo calendario.");
  };

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
          <button className="button outline" onClick={() => window.print()}>
            Stampa il riepilogo
          </button>
        </div>
        <div className="summary-reminder">
          <label className="text-field">
            <span>Riprendi più avanti</span>
            <input
              type="date"
              value={reminderDate}
              onChange={(event) => setReminderDate(event.target.value)}
            />
          </label>
          <button
            className="text-button"
            type="button"
            onClick={addReminder}
            disabled={!reminderDate}
            title={reminderDate ? "Scarica un promemoria per il calendario" : "Scegli una data"}
          >
            <Download size={14} aria-hidden="true" /> Aggiungi al calendario (.ics)
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

          <span>Campi con una risposta</span>
        </div>
        <div>
          <strong>
            {progressPct}
            <small>%</small>
          </strong>

          <span>Campi con una risposta</span>
        </div>
      </div>

      <div className="path-phases summary-phases">
        {phases.map((phase) => (
          <section key={phase.name} className="path-phase">
            <div className="path-phase-head">
              <h2>{phase.name}</h2>

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

          <button
            className="button outline"
            type="button"
            onClick={() => {
              if (!attestationReady) {
                // Un clic che non fa nulla sembra un guasto: porta al campo che manca.
                document.querySelector<HTMLInputElement>('input[aria-label="Nome"]')?.focus();
                return;
              }
              downloadAttestation();
            }}
            aria-disabled={!attestationReady}
            aria-describedby="attestation-hint"
          >
            Scarica l'attestazione di partecipazione
          </button>

          <p className="page-meta" id="attestation-hint" aria-live="polite">
            {attestationReady
              ? "Autocertificazione di ciò che hai svolto: non è una certificazione e non attribuisce crediti formativi."
              : "Inserisci il tuo nome nel campo qui sotto per generare l'attestazione: serve solo a intestarla e resta in questo browser."}
          </p>
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

          {suggestBackup ? (
            <div className="notice">
              <p>
                {lastExport === null
                  ? "Non hai ancora esportato una copia."
                  : "Sono passate più di tre settimane dall’ultimo backup."}{" "}
                Le risposte vivono solo in questo browser: se cancelli i dati del sito o cambi
                dispositivo, senza un file JSON non si recuperano.
              </p>
              <div className="hero-actions">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    exportJson();
                    setSuggestBackup(false);
                  }}
                >
                  Esporta JSON ora
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    snoozeBackupReminder();
                    setSuggestBackup(false);
                  }}
                >
                  Non ora (tra una settimana)
                </button>
              </div>
            </div>
          ) : null}

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

              if (f) setPendingImport(f);

              e.target.value = "";
            }}
          />

          {pendingImport && (
            <div className="notice" role="alert">
              <strong>Sostituire il quaderno con «{pendingImport.name}»?</strong>
              <p>
                Le risposte attuali restano in questo browser come copia di sicurezza: potrai
                ripristinarle da «Copie di sicurezza». Il file importato prende il loro posto.
              </p>
              <div className="hero-actions">
                <button
                  className="button primary"
                  onClick={() => {
                    importJson(pendingImport);
                    setPendingImport(null);
                  }}
                >
                  Importa e salva copia
                </button>
                <button className="button outline" onClick={() => setPendingImport(null)}>
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="concept-box">
        <ShieldCheck size={24} />

        <div>
          <strong>Copie di sicurezza</strong>

          <p>
            Prima di un’importazione il quaderno viene copiato in questo browser: fino a tre copie,
            le più recenti. Restano sul dispositivo e spariscono con «Cancella i miei dati».
          </p>

          {backups.length === 0 ? (
            <p className="page-meta">Nessuna copia: verrà creata alla prima importazione.</p>
          ) : (
            <ul className="plain-list">
              {backups.map((item) => (
                <li key={item.savedAt}>
                  {new Date(item.savedAt).toLocaleString("it-IT")} · {backupReason[item.reason]} ·{" "}
                  {Object.values(item.state.answers).filter((answer) => answer.trim()).length}{" "}
                  risposte{" "}
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setPendingRestore(item.savedAt)}
                  >
                    Ripristina
                  </button>
                  {pendingRestore === item.savedAt && (
                    <span className="backup-confirm">
                      <span>Il quaderno attuale verrà conservato come copia. Confermi?</span>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => {
                          restoreBackup(item.savedAt);
                          setPendingRestore(null);
                        }}
                      >
                        Ripristina questa copia
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setPendingRestore(null)}
                      >
                        Annulla
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <label className="text-field">
        <span>Nome</span>

        <input
          aria-label="Nome"
          value={data.name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Inserisci il tuo nome"
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        />

        <small className="page-meta">
          Serve solo per intestare il PDF e l'attestazione; resta in questo browser.
        </small>
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
                  <h3>{p}</h3>

                  <p className="answer-text">
                    {data.answers[`${i}-p${n}`] || "Non ancora compilata."}
                  </p>
                </div>
              ))}

              <h3>Quiz: {s.question}</h3>

              <p>
                {data.answers[`${i}-quiz`] !== undefined
                  ? s.options[Number(data.answers[`${i}-quiz`])]
                  : "Nessuna scelta."}
              </p>

              <h3>Scenario: {s.scenario}</h3>

              <p>
                {data.answers[`${i}-scenario`] !== undefined
                  ? s.choices[Number(data.answers[`${i}-scenario`])]
                  : "Nessuna scelta."}
              </p>

              <h3>La mia motivazione</h3>

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
        <h2>La lettura del percorso</h2>
        <p>
          Il sito non interpreta le tue risposte e non invia nulla a nessun modello: il quaderno
          resta sul tuo dispositivo. Per una lettura professionale del percorso puoi però portarlo
          con te: esporta il PDF, allegalo a Gemini e incolla il prompt già scritto. Il prompt
          chiede tutte e dieci le tappe, citazioni letterali delle tue parole, dimensioni, coerenza
          tra intenzioni e pratiche e passi concreti.
        </p>
        <p className="profile-footnote">
          Il modello che scegli è una tua decisione, fuori dal sito: il PDF che alleghi contiene
          anche il tuo nome in copertina.
        </p>

        <GeminiPromptBox
          data={data}
          exportButton={exportButton}
          onExportStep={downloadStep}
          notify={notify}
        />
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
                Apri il questionario
              </button>
            </div>

            {feedbackError && (
              <div className="notice" role="alert">
                {feedbackError}{" "}
                {feedbackFallback ? (
                  <a href={feedbackFallback} target="_blank" rel="noreferrer noopener">
                    Apri il questionario
                  </a>
                ) : null}
              </div>
            )}

            <p className="feedback-privacy">
              Il feedback è anonimo e viene inviato a un modulo Google esterno: il servizio può
              registrare dati tecnici come l’indirizzo IP. Non inserire dati personali nel campo
              libero.
            </p>
          </div>
        </div>
      ) : (
        <div className="notice">
          Il questionario si è aperto in una nuova scheda: l’invio lo conferma Google.{" "}
          <button className="text-button" onClick={resetFeedback}>
            Modifica risposta
          </button>
        </div>
      )}
    </div>
  );
}
