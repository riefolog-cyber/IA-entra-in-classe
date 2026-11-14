import {
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Feather,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import type { SavedState, Step } from "../../lib/teacher-content";
import type { Go } from "./navigation";

type Phase = { name: string; items: { i: number; s: Step }[] };

type HomeProps = {
  data: SavedState;
  previousData: SavedState;
  steps: readonly Step[];
  stepCount: number;
  phases: Phase[];
  summaryStatus: "empty" | "progress" | "complete";
  nextStep: number;
  progressPct: number;
  answered: number;
  totalFields: number;
  phaseImage: (phase?: string) => string;
  go: Go;
  toggleComplete: (i?: number) => void;
  download: (previous?: boolean) => void;
  exporting: boolean;
};

export function HomeView(props: HomeProps) {
  const {
    data,
    previousData,
    steps,
    stepCount,
    phases,
    summaryStatus,
    nextStep,
    progressPct,
    answered,
    totalFields,
    phaseImage,
    go,
    toggleComplete,
    download,
    exporting,
  } = props;

  return (
    <>
      <>
        <aside className="home-credit-banner" aria-label="Crediti del percorso">
          <span className="home-credit-icon" aria-hidden="true">
            <Feather size={22} />
          </span>

          <span className="home-credit-copy">
            <span className="home-credit-label">Realizzato da</span>
            <strong className="home-credit-name">Prof. Riefolo Giovanni</strong>
            <span className="home-credit-role">Docente di IRC al Ferraris Fermi di Verona</span>
          </span>
        </aside>

        {(Object.keys(previousData.answers).length > 0 ||
          previousData.completed.length > 0 ||
          previousData.name) && (
          <div className="notice">
            <strong>Le tue risposte precedenti sono conservate.</strong>
            <p>
              Le attività sono cambiate: il quaderno docente usa uno spazio distinto, per non
              associare risposte vecchie a domande nuove.
            </p>
            <button className="text-button" disabled={exporting} onClick={() => download(true)}>
              Esporta il percorso precedente <Download size={15} />
            </button>
          </div>
        )}

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span />
              AGGIORNAMENTO DOCENTI · IA A SCUOLA
            </div>

            <h1>
              L’IA entra in classe.
              <br />
              La scelta resta <em>docente.</em>
            </h1>

            <p>
              Dalle abitudini professionali alle scelte didattiche.
              <br className="desktop-break" /> Rifletti, confronta casi di scuola e progetta
              <br className="desktop-break" /> un uso dell’IA che sostenga l’apprendimento.
            </p>

            <div className="hero-actions">
              <button className="button primary" onClick={() => go("step", data.current)}>
                {answered || data.completed.length ? "Riprendi il percorso" : "Inizia il percorso"}

                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <figure className="hero-visual" aria-hidden="true">
            <img
              className="hero-float"
              src="./images/theme/anim-core.svg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              width={200}
              height={200}
            />
            <img
              className="hero-theme-image"
              src="./images/theme/hero-discernimento.svg"
              alt=""
              loading="eager"
              decoding="async"
              width={420}
              height={320}
            />
            <figcaption className="art-caption">
              10 TAPPE · DALLA SCELTA ALLA REVISIONE
              <br />
              <strong>Il discernimento resta nostro.</strong>
            </figcaption>
          </figure>
        </section>

        <section className="progress-panel">
          <div className="progress-icon">
            <Sparkles size={22} />
          </div>

          <div className="progress-copy">
            <strong>
              {summaryStatus === "complete"
                ? "Percorso completato: puoi rivedere e esportare il tuo quaderno."
                : summaryStatus === "progress"
                  ? `Prossimo passo: tappa ${nextStep + 1} — ${steps[nextStep]?.title}`
                  : "Il tuo percorso comincia da qui."}
            </strong>

            <span>
              {stepCount} tappe, circa 50-70 minuti. Le risposte restano salvate in questo browser.
            </span>
          </div>

          <div className="progress-detail">
            <div>
              <span>Avanzamento</span>

              <strong>
                {data.completed.length} <small>/ {stepCount} tappe</small>
              </strong>
            </div>

            <progress
              className="progress-track"
              aria-label="Tappe concluse"
              value={data.completed.length}
              max={stepCount}
            />
            <small className="progress-caption">
              {progressPct}% dei campi compilati · {answered}/{totalFields}
            </small>
          </div>

          <button
            className="icon-button progress-arrow"
            onClick={() =>
              go(
                summaryStatus === "empty" ? "step" : "summary",
                summaryStatus === "empty" ? 0 : undefined,
              )
            }
            aria-label={summaryStatus === "empty" ? "Inizia dalla prima tappa" : "Apri riepilogo"}
            title={summaryStatus === "empty" ? "Inizia" : "Apri riepilogo"}
          >
            <ArrowRight size={20} />
          </button>
        </section>

        <section className="home-value">
          <div className="section-heading">
            <div className="section-heading-copy">
              <div className="eyebrow">COME FUNZIONA</div>
              <h2>Tre passaggi, nessuna scorciatoia.</h2>
              <p>Rifletti. Confronta. Porta in classe.</p>
            </div>
          </div>

          <ol className="how-list">
            <li>
              <span>01</span>
              <strong>Rifletti</strong>
              <p>
                Una tappa alla volta: una domanda sul tuo lavoro, un concetto, un caso di scuola.
              </p>
            </li>
            <li>
              <span>02</span>
              <strong>Confronta</strong>
              <p>
                Tre prospettive per ogni scenario. Nessun voto, nessuna risposta già confezionata.
              </p>
            </li>
            <li>
              <span>03</span>
              <strong>Porta in classe</strong>
              <p>Chiudi con un PDF del quaderno da conservare.</p>
            </li>
          </ol>
        </section>

        <section className="home-audience">
          <div>
            <div className="eyebrow">PER CHI È</div>
            <h2>Docenti di ogni disciplina.</h2>
            <p>
              Pensato per la secondaria di secondo grado, ma i criteri valgono anche altrove. Non
              serve esperienza tecnica: basta un’attività che conosci già.
            </p>
            <p className="home-meta">10 tappe · circa 70 minuti · nessun account</p>
          </div>

          <div>
            <div className="eyebrow">COSA OTTIENI</div>
            <h2>Un quaderno, non un attestato.</h2>
            <ul>
              <li>Le risposte, i quiz e gli scenari delle 10 tappe</li>
              <li>Un PDF con risposte, quiz e scenari</li>
              <li>PDF e JSON da conservare, stampare o spostare</li>
            </ul>
          </div>
        </section>

        <section className="path-section">
          <div className="section-heading section-heading-with-image">
            <div className="section-heading-copy">
              <div className="eyebrow">IL PERCORSO</div>
              <h2>{stepCount} tappe, dalla riflessione alla pratica.</h2>
              <p>Rifletti. Progetta. Verifica. Rivedi.</p>
            </div>
            <div className="section-visual">
              <img
                className="section-hero-image"
                src="./images/theme/anim-path.svg"
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                width={240}
                height={140}
              />
            </div>
          </div>

          <div className="path-phases">
            {phases.map((phase) => (
              <section key={phase.name} className="path-phase">
                <div className="path-phase-head">
                  <div className="path-phase-title">
                    <img
                      className="phase-thumb"
                      src={phaseImage(phase.name)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                    <h3>{phase.name}</h3>
                  </div>
                  <span>
                    {phase.items.filter(({ i }) => data.completed.includes(i)).length}/
                    {phase.items.length}
                  </span>
                </div>

                <div className="path-grid">
                  {phase.items.map(({ s, i }) => (
                    <article
                      className={`path-card ${i === data.current ? "current-card" : ""} ${data.completed.includes(i) ? "done-card" : ""}`}
                      key={s.title}
                    >
                      <a
                        className="card-link"
                        href={`#/tappa/${i + 1}`}
                        onClick={(event) => {
                          event.preventDefault();
                          go("step", i);
                        }}
                      >
                        <div className="card-top">
                          <span className="card-number">0{i + 1}</span>

                          <span className="card-time">
                            {data.completed.includes(i) ? (
                              <>
                                <CheckCircle2 size={13} />
                                Conclusa
                              </>
                            ) : null}
                          </span>
                        </div>

                        <div className="card-category">
                          {s.category}

                          {i === data.current && !data.completed.includes(i) && (
                            <span className="card-current-badge">In corso</span>
                          )}
                        </div>

                        <h3>{s.title}</h3>

                        <p>{s.subtitle}</p>

                        <div className="card-bottom">
                          <span>
                            {data.completed.includes(i) ? "Rivedi la tappa" : "Esplora la tappa"}
                          </span>

                          <ArrowUpRight size={18} />
                        </div>
                      </a>

                      <button
                        className="card-complete-toggle"
                        onClick={() => toggleComplete(i)}
                        aria-label={
                          data.completed.includes(i)
                            ? "Segna tappa come da rivedere"
                            : "Segna tappa come conclusa"
                        }
                        aria-pressed={data.completed.includes(i)}
                      >
                        {data.completed.includes(i) ? (
                          <Check size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="home-bottom">
          <div>
            <LockKeyhole size={20} />

            <span>
              Un quaderno professionale, non una certificazione.
              <small>
                Non inserire dati degli studenti. Su dispositivi condivisi, esporta e cancella le
                risposte.
              </small>
            </span>
          </div>

          <button className="text-button" onClick={() => go("summary")}>
            Il mio riepilogo <ArrowRight size={16} />
          </button>
        </section>

        <section className="quote-band quote-band-with-image">
          <div className="section-visual">
            <img
              className="section-hero-image"
              src="./images/theme/anim-balance.svg"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              width={200}
              height={160}
            />
          </div>

          <span className="quote-mark">{String.fromCharCode(8220)}</span>

          <blockquote>
            Che cosa deve restare umano
            <br />
            nel tuo modo di insegnare?
          </blockquote>

          <div>
            LA DOMANDA CHE CI ACCOMPAGNA
            <span>Responsabilità, relazione, discernimento</span>
          </div>
        </section>
      </>
    </>
  );
}
