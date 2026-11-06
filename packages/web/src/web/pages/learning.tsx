import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Feather,
  LayoutGrid,
  LockKeyhole,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { emptyState, glossary, steps, type SavedState } from "../lib/teacher-content";
import { buildTeacherProfile } from "../lib/teacher-profile";
import { exportPdf } from "../lib/export-pdf";

const KEY = "restare-umani-docenti-v2";
const PREVIOUS_KEY = "restare-umani-v1";
type View = "home" | "step" | "resources" | "summary";
function load(key = KEY): SavedState {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    if (!parsed || typeof parsed !== "object") return emptyState;
    const answers = Object.fromEntries(
      Object.entries(parsed.answers || {}).filter(
        ([k, v]) =>
          typeof v === "string" &&
          (/^[0-5]-(p[01]|quiz|scenario|reason)$/.test(k)),
      ),
    );
    for (const k of Object.keys(answers))
      if (/(quiz|scenario)$/.test(k) && !["0", "1", "2"].includes(answers[k] as string))
        delete answers[k];
    return {
      answers: answers as Record<string, string>,
      name: typeof parsed.name === "string" ? parsed.name : "",
      completed: Array.isArray(parsed.completed)
        ? [
            ...new Set<number>(
              parsed.completed.filter(
                (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 6,
              ),
            ),
          ]
        : [],
      current:
        typeof parsed.current === "number" && parsed.current >= 0 && parsed.current < 6
          ? Math.floor(parsed.current)
          : 0,
    };
  } catch {
    return emptyState;
  }
}

export default function Learning() {
  const [data, setData] = useState<SavedState>(load);
  const [previousData, setPreviousData] = useState<SavedState>(() => load(PREVIOUS_KEY));
  const [view, setView] = useState<View>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [toast, setToast] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [openPerspective, setOpenPerspective] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (v: View, step?: number) => {
    setView(v);
    setMobileOpen(false);
    if (step !== undefined) setData((d) => ({ ...d, current: step }));
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      const target = document.querySelector("main") as HTMLElement | null;
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  };
  const write = (key: string, value: string) =>
    setData((d) => ({ ...d, answers: { ...d.answers, [key]: value } }));
  const toggleComplete = () => {
    setData((d) => ({
      ...d,
      completed: d.completed.includes(d.current)
        ? d.completed.filter((n) => n !== d.current)
        : [...d.completed, d.current],
    }));
    setToast(
      data.completed.includes(data.current)
        ? "Tappa riaperta."
        : "Tappa conclusa. Puoi sempre tornarci.",
    );
  };
  const download = async (previousVersion = false) => {
    setExporting(true);
    setExportError("");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await exportPdf(previousVersion ? previousData : data, previousVersion);
      setToast("PDF generato. Controlla i download del browser.");
    } catch {
      setExportError(
        "Il PDF non è stato generato. Riprova o usa un altro browser. Le risposte restano qui.",
      );
    } finally {
      setExporting(false);
    }
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "restare-umani-dati.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Dati esportati in JSON.");
  };
  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && typeof parsed === "object" && parsed.answers) {
          setData(parsed as SavedState);
          setToast("Dati importati. Controlla le risposte.");
        } else {
          setExportError("File non valido: struttura non riconosciuta.");
        }
      } catch {
        setExportError("File non valido: impossibile leggere il JSON.");
      }
    };
    reader.readAsText(file);
  };
  const step = steps[data.current];
  const profile = buildTeacherProfile(data);
  const answered = Object.entries(data.answers).filter(([_, v]) => v.trim()).length;
  const field = (
    key: string,
    label: string,
    placeholder = "Parti dal tuo contesto professionale. Usa esempi inventati, senza dati degli alunni.",
  ) => (
    <label className="text-field" key={key}>
      <span>{label}</span>
      <textarea
        aria-label={label}
        value={data.answers[key] || ""}
        onChange={(e) => write(key, e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
      <small>Riflessione professionale · niente nomi o dati identificativi degli alunni</small>
    </label>
  );
  const exportButton = (
    <button className="button primary" disabled={exporting} onClick={() => download()}>
      <Download size={16} />
      {exporting ? "Generazione…" : "Esporta il percorso in PDF"}
    </button>
  );
  const names: Record<View, string> = {
    home: "Il tuo percorso",
    step: `Tappa ${data.current + 1}`,
    resources: "Approfondimenti",
    summary: "Il mio riepilogo",
  };
  return (
    <>
      <a className="skip-link" href="#main-content">
        Vai al contenuto principale
      </a>
      <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="Restare umani, torna al percorso"
        >
          <span className="brand-icon">
            <Feather size={24} />
          </span>
          <span>
            restare
            <br />
            <strong>umani.</strong>
          </span>
        </button>
        <button
          className="close-mobile icon-button"
          onClick={() => setMobileOpen(false)}
          aria-label="Chiudi menu"
        >
          <X />
        </button>
        <div className="sidebar-label">UNO SPAZIO PER RIFLETTERE</div>
        <nav aria-label="Navigazione principale">
          <button
            className={`nav-item ${view === "home" ? "active" : ""}`}
            onClick={() => go("home")}
          >
            <LayoutGrid size={18} />
            Il tuo percorso
          </button>
          <button
            className={`nav-item ${view === "resources" ? "active" : ""}`}
            onClick={() => go("resources")}
          >
            <BookOpen size={18} />
            Approfondimenti
          </button>
        </nav>
        <div className="sidebar-label path-label">LE TAPPE DEL PERCORSO</div>
        <nav className="step-nav" aria-label="Le sei tappe">
          {steps.map((s, i) => (
            <button
              key={s.short}
              className={view === "step" && data.current === i ? "selected" : ""}
              onClick={() => go("step", i)}
            >
              <span className={data.completed.includes(i) ? "step-dot done" : "step-dot"}>
                {data.completed.includes(i) ? <Check size={12} /> : i + 1}
              </span>
              {s.short}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Le tue parole restano tue.</strong>
              <p>Risposte salvate solo in questo browser, su questo dispositivo.</p>
            </div>
          </div>
          <button className="reset-link" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} />
            Cancella i miei dati
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="menu-backdrop"
          aria-label="Chiudi il menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Apri menu"
            >
              <Menu size={20} />
            </button>
            <span>Il laboratorio</span>
            <span className="crumb-slash">/</span>
            <strong>{names[view]}</strong>
          </div>
          <div className={`save-status ${storageError ? "error" : ""}`}>
            <span />
            {storageError ? "Salvataggio non disponibile" : "Salvataggio sul dispositivo"}
          </div>
        </header>
        <main id="main-content">
          {storageError && (
            <div className="alert">
              Il browser non permette il salvataggio locale. Non chiudere questa pagina prima di
              esportare il PDF.
            </div>
          )}
          {exportError && (
            <div className="alert" role="alert">
              {exportError}
            </div>
          )}
          {view === "home" && (
            <>
              <div className="home-credit-banner">
                <Feather size={16} />
                <span>Realizzato dal prof. Riefolo Giovanni</span>
                <small>Docente di IRC al Ferraris Fermi di Verona</small>
              </div>
              {(Object.keys(previousData.answers).length > 0 || previousData.completed.length > 0 || previousData.name) && <div className="notice"><strong>Le tue risposte precedenti sono conservate.</strong><p>Le attività sono cambiate: il quaderno docente usa uno spazio distinto, per non associare risposte vecchie a domande nuove.</p><button className="text-button" disabled={exporting} onClick={() => download(true)}>Esporta il percorso precedente <Download size={15}/></button></div>}
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
                      {answered || data.completed.length
                        ? "Riprendi il percorso"
                        : "Inizia il percorso"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
                <div className="mirror-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="mirror">
                    <div className="mirror-inner">
                      <span className="mirror-star">✳</span>
                      <div className="reflection-line" />
                      <div className="mirror-horizon" />
                    </div>
                  </div>
                  <div className="art-dot" />
                  <div className="art-caption">
                    LA TECNOLOGIA CAMBIA.
                    <br />
                    <strong>Il discernimento resta nostro.</strong>
                  </div>
                </div>
              </section>
              <section className="progress-panel">
                <div className="progress-icon">
                  <Sparkles size={22} />
                </div>
                <div className="progress-copy">
                  <strong>
                    {data.completed.length
                      ? "Ogni domanda è un passo avanti."
                      : "Il tuo percorso comincia da qui."}
                  </strong>
                  <span>Sei tappe. Un quaderno di scelte professionali.</span>
                </div>
                <div className="progress-detail">
                  <div>
                    <span>Il tuo avanzamento</span>
                    <strong>
                      {data.completed.length} <small>/ 6 tappe</small>
                    </strong>
                  </div>
                  <progress
                    className="progress-track"
                    aria-label="Tappe concluse"
                    value={data.completed.length}
                    max={6}
                  />
                </div>
                <button
                  className="icon-button progress-arrow"
                  onClick={() => go("summary")}
                  aria-label="Apri riepilogo"
                >
                  <ArrowRight size={20} />
                </button>
              </section>
              <section className="path-section">
                <div className="section-heading">
                  <div className="eyebrow">IL PERCORSO</div>
                  <div>
                    <h2>Sei tappe, dalla riflessione alla pratica.</h2>
                    <span>Rifletti. Progetta. Verifica.</span>
                  </div>
                </div>
                <div className="path-grid">
                  {steps.map((s, i) => (
                    <button
                      className={`path-card ${i === data.current ? "current-card" : ""}`}
                      key={s.title}
                      onClick={() => go("step", i)}
                    >
                      <div className="card-top">
                        <span className="card-number">0{i + 1}</span>
                        <span className="card-time">
                          {data.completed.includes(i) ? (
                            <>
                              <CheckCircle2 size={13} />
                              Conclusa
                            </>
                          ) : (
                            <>
                              <Clock3 size={13} />
                              {s.time} min
                            </>
                          )}
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
                    </button>
                  ))}
                </div>
              </section>
              <section className="quote-band">
                <span className="quote-mark">“</span>
                <blockquote>
                  Che cosa deve restare umano
                  <br />
                  nel tuo modo di insegnare?
                </blockquote>
                <div>
                  LA DOMANDA CHE CI ACCOMPAGNA<span>Responsabilità, relazione, discernimento</span>
                </div>
              </section>
              <section className="home-bottom">
                <div>
                  <LockKeyhole size={20} />
                  <span>
                    Un quaderno professionale, non una certificazione.
                    <small>
                      Non inserire dati degli alunni. Su dispositivi condivisi, esporta e cancella le
                      risposte.
                    </small>
                  </span>
                </div>
                <button className="text-button" onClick={() => go("summary")}>
                  Il mio riepilogo <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {view === "step" && (
            <div className="reading-page step-reading">
              <div className="page-eyebrow">
                TAPPA 0{data.current + 1} / 06{" "}
                <span>
                  <Clock3 size={14} />
                  {step.time} MINUTI
                </span>
              </div>
              <h1>{step.title}</h1>
              <p className="page-lead">{step.subtitle}</p>
              <div className="step-pills">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    className={data.current === i ? "active" : ""}
                    onClick={() => go("step", i)}
                    aria-label={`Apri tappa ${i + 1}`}
                  >
                    {data.completed.includes(i) ? <Check size={16} /> : `0${i + 1}`}
                  </button>
                ))}
              </div>
              <p className="intro-text">{step.intro}</p>
              <div className="concept-box">
                <BookOpen size={22} />
                <div>
                  <strong>Una chiave di lettura</strong>
                  <p>{step.concept}</p>
                </div>
              </div>
              <section className="activity">
                <div className="activity-label">
                  <Feather size={17} />
                  01 · RIFLETTI E PROGETTA
                </div>
                <h2>Rispondi in poche righe.</h2>
                <p>Una domanda per il tuo contesto. La tua risposta entrerà nel quaderno finale.</p>
                {step.prompts.map((p, i) => field(`${data.current}-p${i}`, p))}
              </section>
              <section className="activity">
                <div className="activity-label">
                  <CheckCircle2 size={17} />
                  02 · VERIFICA LA COMPRENSIONE
                </div>
                <h2>{step.question}</h2>
                <p>Il quiz verifica un concetto, non valuta chi sei.</p>
                <fieldset className="option-list" aria-label="Risposte al quiz">
                  {step.options.map((o, i) => (
                    <button
                      key={o}
                      aria-pressed={data.answers[`${data.current}-quiz`] === String(i)}
                      className={`option ${data.answers[`${data.current}-quiz`] === String(i) ? "chosen" : ""}`}
                      onClick={() => write(`${data.current}-quiz`, String(i))}
                    >
                      <span className="radio-dot" />
                      {o}
                    </button>
                  ))}
                </fieldset>
                {data.answers[`${data.current}-quiz`] !== undefined && (
                  <output className="feedback" aria-live="polite">
                    <strong>
                      {Number(data.answers[`${data.current}-quiz`]) === step.correct
                        ? "Hai individuato il concetto."
                        : "Un’occasione per approfondire."}
                    </strong>
                    <p>{step.explanation}</p>
                    <small>Risposta corretta: {step.options[step.correct]}</small>
                  </output>
                )}
              </section>
              <section className="activity">
                <div className="activity-label">
                  <MessageCircle size={17} />
                  03 · ESPLORA UNO SCENARIO
                </div>
                <h2>Nel tuo ruolo docente, che cosa faresti?</h2>
                <div className="scenario-story">{step.scenario}</div>
                <p>Non c’è un voto. Scegli un punto di partenza e discuti le sue conseguenze.</p>
                <div className="option-list">
                  {step.choices.map((c, i) => (
                    <button
                      key={c}
                      className={`option ${data.answers[`${data.current}-scenario`] === String(i) ? "chosen" : ""}`}
                      aria-pressed={data.answers[`${data.current}-scenario`] === String(i)}
                      onClick={() => write(`${data.current}-scenario`, String(i))}
                    >
                      <span className="radio-dot" />
                      {c}
                    </button>
                  ))}
                </div>
                {data.answers[`${data.current}-scenario`] !== undefined && (
                  <div className="feedback">
                    <strong>Una domanda per andare oltre</strong>
                    <p>{step.perspectives[Number(data.answers[`${data.current}-scenario`])]}</p>
                  </div>
                )}
                {field(
                  `${data.current}-reason`,
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
              <div className="completion-box">
                <div>
                  <strong>
                    {data.completed.includes(data.current)
                      ? "Questa tappa è segnata come conclusa."
                      : "Hai dedicato del tempo a questa tappa?"}
                  </strong>
                  <p>Puoi concluderla anche senza condividere o scrivere risposte.</p>
                </div>
                <button
                  className="button primary"
                  onClick={toggleComplete}
                >
                  <Check size={17} />
                  {data.completed.includes(data.current)
                    ? "Riapri la tappa"
                    : "Segna come conclusa"}
                </button>
              </div>
              <div className="page-navigation">
                <button
                  className="text-button"
                  onClick={() => (data.current ? go("step", data.current - 1) : go("home"))}
                >
                  <ArrowLeft size={16} />
                  {data.current ? "Tappa precedente" : "Il percorso"}
                </button>
                <button
                  className="button outline"
                  onClick={() => (data.current < 5 ? go("step", data.current + 1) : go("summary"))}
                >
                  {data.current < 5 ? "Tappa successiva" : "Vai al riepilogo"}
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="mobile-step-cta">
                <button className="button primary" onClick={toggleComplete}>
                  <Check size={16} />
                  {data.completed.includes(data.current)
                    ? "Riapri questa tappa"
                    : "Concludi questa tappa"}
                </button>
              </div>
            </div>
          )}
          {view === "resources" && (
            <div className="reading-page">
              <div className="eyebrow">STRUMENTI PER PENSARE</div>
              <h1>Andare un po’ più a fondo.</h1>
              <p className="page-lead">
                Parole da chiarire e prospettive da tenere aperte.
              </p>
              <div className="two-perspectives">
                <article className={`perspective-card ${openPerspective === 0 ? "open" : ""}`}>
                  <span>PROSPETTIVA 01</span>
                  <h2>Custodire il limite</h2>
                  <p>
                    Ascoltare un alunno, interpretare un percorso e motivare una valutazione richiedono responsabilità professionale. Quale parte del tuo lavoro può ricevere supporto e quale non vuoi delegare?
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
                        professionale: ascoltare, interpretare, valutare e accompagnare richiedono
                        una relazione e una responsabilità che non si trasferiscono a un sistema.
                      </p>
                      <p>
                        Distinguere tra supporto e delega aiuta a usare l’IA senza svuotare il
                        ruolo docente. Un testo generato può offrire uno spunto; la lettura del
                        contesto, la scelta dei criteri e la responsabilità della decisione restano
                        umane.
                      </p>
                      <p>
                        Il limite è anche una forma di tutela: protegge la dignità dell’alunno, la
                        fiducia della famiglia e la credibilità della scuola.
                      </p>
                      <p className="perspective-takeaway">
                        In sintesi: custodire il limite significa decidere consapevolmente che cosa
                        non delegare, anche quando sarebbe tecnicamente possibile.
                      </p>
                    </div>
                  )}
                </article>
                <article className={`perspective-card ${openPerspective === 1 ? "open" : ""}`}>
                  <span>PROSPETTIVA 02</span>
                  <h2>Governare la tecnologia</h2>
                  <p>
                    Criteri didattici, controllo dei materiali, tutela dei dati e alternative accessibili rendono gli usi discutibili e rivedibili. Quali decisioni spettano a te e quali vanno chiarite con l’istituto?
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
                        Governare significa rendere l’uso dell’IA discutibile, verificabile e
                        rivedibile. Non basta adottare uno strumento: servono criteri didattici,
                        verifica dei materiali, tutela dei dati e alternative accessibili.
                      </p>
                      <p>
                        La governance non è solo un compito dirigenziale. Il docente può chiedere
                        chiarezza su finalità, dati, conservazione, accessi e responsabilità; può
                        documentare le proprie scelte e condividerle con i colleghi.
                      </p>
                      <p>
                        Un uso governato accetta la possibilità di sospendere o modificare la
                        scelta se le evidenze non sostengono l’apprendimento.
                      </p>
                      <p className="perspective-takeaway">
                        In sintesi: governare la tecnologia significa trasformare una scelta
                        individuale in una pratica trasparente, verificabile e rivedibile.
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
                  .filter(([term, def]) =>
                    `${term} ${def}`.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map(([term, def]) => (
                    <details key={term}>
                      <summary>
                        {term}
                        <ChevronDown size={17} />
                      </summary>
                      <p>{def}</p>
                    </details>
                  ))}
                {!glossary.some(([term, def]) =>
                  `${term} ${def}`.toLowerCase().includes(search.toLowerCase()),
                ) && <p>Nessuna parola trovata. Prova un altro termine.</p>}
              </div>
            </div>
          )}
          {view === "summary" && (
            <div className="reading-page">
              <div className="eyebrow">CIÒ CHE PORTO CON ME</div>
              <h1>Il mio percorso, fin qui.</h1>
              <p className="page-lead">
                Il tuo quaderno di aggiornamento: decisioni, consegne e una scheda di sperimentazione.
              </p>
              <div className="summary-metrics">
                <div>
                  <strong>
                    {data.completed.length}
                    <small>/6</small>
                  </strong>
                  <span>Tappe segnate come concluse</span>
                </div>
                <div>
                  <strong>
                    {answered}
                    <small>/24</small>
                  </strong>
                  <span>Domande e scelte compilate</span>
                </div>
              </div>
              <div className="concept-box">
                <Download size={24} />
                <div>
                  <strong>Un PDF con tutta l’attività</strong>
                  <p>
                    Include le sei tappe, le domande, le tue risposte, i quiz con spiegazioni, tutti
                    gli scenari e il glossario. Le risposte mancanti sono indicate: puoi
                    esportare in qualsiasi momento.
                  </p>
                  {exportButton}
                </div>
              </div>
              <div className="concept-box">
                <Download size={24} />
                <div>
                  <strong>Trasferisci i tuoi dati</strong>
                  <p>
                    Esporta le risposte in JSON per conservarle o spostarle su un altro dispositivo;
                    importa un file precedentemente esportato per riprendere il lavoro.
                  </p>
                  <div className="hero-actions">
                    <button className="button outline" onClick={exportJson}>
                      Esporta JSON
                    </button>
                    <button
                      className="button outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
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
              {steps.map((s, i) => (
                <details className="summary-step" key={s.title}>
                  <summary>
                    <span>
                      <span className="summary-number">0{i + 1}</span>
                      {s.title}
                    </span>
                    <span>
                      {data.completed.includes(i) ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <span className="pending">Da concludere</span>
                      )}
                      <ChevronDown size={16} />
                    </span>
                  </summary>
                  <div>
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
              ))}
<div className="activity">
                <h2>Il mio profilo docente</h2>
                <p>
                  Genera una lettura personalizzata delle tue risposte: punti di forza, aree da
                  esplorare e domande per l’autovalutazione. Il profilo è calcolato solo nel tuo
                  browser: confronta tappe concluse, quiz, testi scritti e scelte negli scenari.
                  Non usa un’IA, non invia dati e non produce un giudizio sulla persona.
                </p>
                <button className="button primary" onClick={() => setShowProfile(true)}>
                  Genera il mio profilo docente
                </button>
                {showProfile && (
                  <div className="profile-report">
                    <div className="profile-header">
                      <span className="profile-kicker">PROFILO DOCENTE</span>
                      <h3>{profile.headline}</h3>
                      <p>{profile.summary}</p>
                    </div>
                    <div className="profile-grid">
                      <section className="profile-panel strengths">
                        <h4>
                          <CheckCircle2 size={16} />
                          Forze
                        </h4>
                        <ul>
                          {profile.strengths.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="profile-panel growth">
                        <h4>
                          <Sparkles size={16} />
                          Da esplorare
                        </h4>
                        <ul>
                          {profile.growth.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="profile-panel questions">
                        <h4>
                          <MessageCircle size={16} />
                          Domande per te
                        </h4>
                        <ul>
                          {profile.questions.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                    <p className="profile-footnote">
                      Il profilo non è una valutazione: è una traccia per rileggere le tue scelte
                      e decidere il prossimo passo.
                    </p>
                    <div className="profile-print">
                      <button className="button outline" onClick={() => window.print()}>
                        Stampa il profilo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="notice">
                L’esportazione crea un file sul dispositivo; non lo invia al formatore. Mantieni
                private le tue riflessioni.
              </div>
            </div>
          )}
          <footer className="footer">
            <span>
              restare umani. <span>Un laboratorio di aggiornamento per docenti.</span>
            </span>
            <button onClick={() => go("resources")}>
              Approfondimenti e glossario <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <output className="toast" aria-live="polite">
          <CheckCircle2 size={18} />
          {toast}
        </output>
      )}
      {confirmDelete && (
        <div className="modal-backdrop">
          <dialog
            className="modal"
            open
            aria-modal="true"
            aria-labelledby="delete-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setConfirmDelete(false);
              if (e.key === "Tab") {
                const buttons = e.currentTarget.querySelectorAll("button");
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <Trash2 size={28} />
            <h2 id="delete-title">Cancellare le tue parole?</h2>
            <p>
              Risposte, nome e avanzamento, anche della versione precedente, saranno rimossi da questo browser. I PDF già
              scaricati non saranno cancellati. Questa operazione non può essere annullata.
            </p>
            <div>
              <button className="button outline" autoFocus onClick={() => setConfirmDelete(false)}>
                Annulla
              </button>
              <button
                className="button danger"
                onClick={() => {
                  try {
                    localStorage.removeItem(KEY);
                    localStorage.removeItem(PREVIOUS_KEY);
                  } catch {
                    /* state cleared regardless */
                  }
                  setData({ ...emptyState, answers: {}, completed: [] });
                  setPreviousData({ ...emptyState, answers: {}, completed: [] });
                  setConfirmDelete(false);
                  go("home");
                  setToast("Dati personali cancellati da questa attività.");
                }}
              >
                Cancella i dati
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
    </>
  );
}
