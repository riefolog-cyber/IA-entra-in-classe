import { ArrowUpRight, ChevronDown, Search } from "lucide-react";

import { glossary, references } from "../../lib/teacher-content";

type ResourcesProps = {
  search: string;
  setSearch: (value: string) => void;
  openPerspective: number | null;
  setOpenPerspective: (value: number | null) => void;
};

export function ResourcesView({
  search,
  setSearch,
  openPerspective,
  setOpenPerspective,
}: ResourcesProps) {
  return (
    <div className="reading-page">
      <div className="eyebrow">STRUMENTI PER PENSARE</div>

      <div className="step-head-visual">
        <div>
          <h1>Andare un po’ più a fondo.</h1>
          <p className="page-lead">Parole da chiarire e prospettive da tenere aperte.</p>
        </div>
        <img
          className="step-visual"
          src="./images/theme/fase-progettazione.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={240}
          height={120}
        />
      </div>

      <section className="highlight-section" aria-label="In evidenza">
        <div className="section-heading">
          <div className="eyebrow">IN EVIDENZA</div>
          <div>
            <h2>Approfondimenti sui confini morali dell'IA</h2>
            <span>Due risorse selezionate per estendere la riflessione del percorso.</span>
          </div>
        </div>

        <div className="highlight-grid">
          <a
            className="highlight-card"
            href="./confini-morali-dell-ai.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="highlight-media">
              <img
                src="./images/highlight-confini-mappa.svg"
                alt="Anteprima animata della mappa interattiva sui confini morali dell'IA"
                loading="lazy"
                decoding="async"
                width={640}
                height={360}
              />
            </div>
            <span className="highlight-badge">Mappa interattiva</span>
            <h3>I confini morali dell'IA</h3>
            <p>
              Esplora una mappa interattiva per riflettere su responsabilità, limiti e scelte
              nell'uso dell'intelligenza artificiale a scuola.
            </p>
            <span className="highlight-cta">
              Apri la risorsa <ArrowUpRight size={16} />
            </span>
          </a>

          <a
            className="highlight-card highlight-card-video"
            href="https://www.youtube.com/watch?v=tNyt3EmnpUk"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="highlight-media">
              <img
                src="https://img.youtube.com/vi/tNyt3EmnpUk/hqdefault.jpg"
                alt="Anteprima del video YouTube: IA Generativa e vulnerabilità cognitiva"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <span className="highlight-play" aria-hidden="true">
                ▶
              </span>
            </div>
            <span className="highlight-badge">Video · YouTube</span>
            <h3>IA Generativa e vulnerabilità cognitiva</h3>
            <p>
              Guarda il video per approfondire il tema dei confini morali dell'intelligenza
              artificiale e le sue implicazioni educative.
            </p>
            <span className="highlight-cta">
              Guarda su YouTube <ArrowUpRight size={16} />
            </span>
          </a>
        </div>
      </section>

      <div className="two-perspectives">
        <article
          className={`perspective-card perspective-card-with-image ${openPerspective === 0 ? "open" : ""}`}
        >
          <div className="perspective-visual">
            <img
              className="perspective-hero-image"
              src="./images/theme/anim-brain.svg"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              width={220}
              height={180}
            />
          </div>

          <span>PROSPETTIVA 01</span>

          <h2>Custodire il limite</h2>

          <p>
            Ascoltare uno studente, interpretare un percorso e motivare una valutazione richiedono
            responsabilità professionale. Quale parte del tuo lavoro può ricevere supporto e quale
            non vuoi delegare?
          </p>

          <button
            className="perspective-toggle"
            aria-expanded={openPerspective === 0}
            onClick={() => setOpenPerspective(openPerspective === 0 ? null : 0)}
          >
            {openPerspective === 0 ? "Chiudi la scheda" : "Apri la scheda"}

            <ChevronDown size={16} />
          </button>

          {openPerspective === 0 && (
            <div className="perspective-body">
              <p>
                Il limite non coincide con ciò che la macchina non sa fare. È una scelta
                professionale: ascoltare, interpretare, valutare e accompagnare richiedono una
                relazione e una responsabilità che non si trasferiscono a un sistema.
              </p>

              <p>
                Distinguere tra supporto e delega aiuta a usare l’IA senza svuotare il ruolo
                docente. Un testo generato può offrire uno spunto; la lettura del contesto, la
                scelta dei criteri e la responsabilità della decisione restano umane.
              </p>

              <p>
                Il limite è anche una forma di tutela: protegge la dignità dello studente, la
                fiducia della famiglia e la credibilità della scuola.
              </p>

              <p className="perspective-takeaway">
                In sintesi: custodire il limite significa decidere consapevolmente che cosa non
                delegare, anche quando sarebbe tecnicamente possibile.
              </p>
            </div>
          )}
        </article>

        <article
          className={`perspective-card perspective-card-with-image ${openPerspective === 1 ? "open" : ""}`}
        >
          <div className="perspective-visual">
            <img
              className="perspective-hero-image"
              src="./images/theme/anim-leaf.svg"
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              width={220}
              height={180}
            />
          </div>

          <span>PROSPETTIVA 02</span>

          <h2>Governare la tecnologia</h2>

          <p>
            Criteri didattici, controllo dei materiali, tutela dei dati e alternative accessibili
            rendono gli usi discutibili e rivedibili. Quali decisioni spettano a te e quali vanno
            chiarite con l’istituto?
          </p>

          <button
            className="perspective-toggle"
            aria-expanded={openPerspective === 1}
            onClick={() => setOpenPerspective(openPerspective === 1 ? null : 1)}
          >
            {openPerspective === 1 ? "Chiudi la scheda" : "Apri la scheda"}

            <ChevronDown size={16} />
          </button>

          {openPerspective === 1 && (
            <div className="perspective-body">
              <p>
                Governare significa rendere l’uso dell’IA discutibile, verificabile e rivedibile.
                Non basta adottare uno strumento: servono criteri didattici, verifica dei materiali,
                tutela dei dati e alternative accessibili.
              </p>

              <p>
                La governance non è solo un compito dirigenziale. Il docente può chiedere chiarezza
                su finalità, dati, conservazione, accessi e responsabilità; può documentare le
                proprie scelte e condividerle con i colleghi.
              </p>

              <p>
                Un uso governato accetta la possibilità di sospendere o modificare la scelta se le
                evidenze non sostengono l’apprendimento.
              </p>

              <p className="perspective-takeaway">
                In sintesi: governare la tecnologia significa trasformare una scelta individuale in
                una pratica trasparente, verificabile e rivedibile.
              </p>
            </div>
          )}
        </article>
      </div>

      <div className="resource-heading">
        <h2>Un piccolo glossario</h2>

        <label className="search">
          <Search size={16} />

          <input
            aria-label="Cerca nel glossario"
            placeholder="Cerca una parola"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="glossary">
        {glossary

          .filter(([term, def]) => `${term} ${def}`.toLowerCase().includes(search.toLowerCase()))

          .map(([term, def, refs]) => (
            <details key={term}>
              <summary>
                {term}

                {Array.isArray(refs) && refs.length > 0 && (
                  <span className="glossary-refs">{refs.map((r) => `T${r}`).join(" · ")}</span>
                )}

                <ChevronDown size={17} />
              </summary>

              <p>{def}</p>

              {Array.isArray(refs) && refs.length > 0 && (
                <p className="glossary-refline">
                  Compare nelle tappe: {refs.map((r) => r).join(", ")}
                </p>
              )}
            </details>
          ))}

        {!glossary.some(([term, def]) =>
          `${term} ${def}`.toLowerCase().includes(search.toLowerCase()),
        ) && <p>Nessuna parola trovata. Prova un altro termine.</p>}
      </div>

      <section className="references-section">
        <div className="resource-heading">
          <h2>Riferimenti</h2>
        </div>

        <ul className="reference-list">
          {references.map((reference) => (
            <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noreferrer">
                {reference.title}
              </a>
              <p>{reference.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
