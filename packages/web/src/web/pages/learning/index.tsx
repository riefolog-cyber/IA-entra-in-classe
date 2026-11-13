import { useEffect, useRef, useState } from "react";

import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  Feather,
  LayoutGrid,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useHashLocation } from "wouter/use-hash-location";

import { useExportPdf } from "../../hooks/use-export-pdf";
import { useNotebook } from "../../hooks/use-notebook";
import { phases, stepCount, totalFields } from "../../lib/notebook-state";
import { phaseImage } from "../../lib/theme-images";
import { steps } from "../../lib/teacher-content";
import { HomeView } from "./home-view";
import { parseLocation, pathFor, type Go, type View } from "./navigation";
import { PrivacyView } from "./privacy-view";
import { ResourcesView } from "./resources-view";
import { StepView } from "./step-view";
import { SummaryView } from "./summary-view";

const names: Record<View, string> = {
  home: "Il tuo percorso",
  step: "Tappa",
  resources: "Approfondimenti",
  summary: "Il mio riepilogo",
  privacy: "Privacy",
};

export default function Learning() {
  const [location, navigate] = useHashLocation();
  const route = parseLocation(location, stepCount);
  const view = route.view;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("restare-umani-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [openPerspective, setOpenPerspective] = useState<number | null>(null);

  const {
    data,
    setData,
    previousData,
    saveMode,
    toast,
    notify,
    write,
    toggleComplete,
    retrySave,
    clearAll,
  } = useNotebook();

  const { exporting, exportError, download, exportJson, importJson, fileInputRef } = useExportPdf({
    data,
    previousData,
    setData,
    notify,
  });

  const step = steps[route.step ?? data.current] ?? steps[0];
  const answered = Object.entries(data.answers).filter(([, value]) => value.trim()).length;
  const progressPct = totalFields ? Math.round((answered / totalFields) * 100) : 0;
  const nextStepIndex = steps.findIndex((_, i) => !data.completed.includes(i));
  const nextStep = nextStepIndex >= 0 ? nextStepIndex : data.current;
  const summaryStatus =
    data.completed.length === 0 && answered === 0
      ? "empty"
      : data.completed.length === stepCount
        ? "complete"
        : "progress";

  useEffect(() => {
    const light = theme === "light";
    document.documentElement.classList.toggle("light", light);
    document.documentElement.classList.toggle("dark", !light);
    document.body.classList.toggle("light", light);
    document.body.classList.toggle("dark", !light);
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("restare-umani-theme", theme);
    } catch {
      // Preferenza non memorizzabile: il tema resta valido per la sessione.
    }
  }, [theme]);

  const go: Go = (nextView, target) => {
    const stepTarget =
      nextView === "step"
        ? Math.min(Math.max(target ?? data.current, 0), stepCount - 1)
        : undefined;
    navigate(pathFor(nextView, stepTarget));
    setMobileOpen(false);
  };

  const openGlossary = (term: string) => {
    setSearch(term);
    go("resources");
  };

  // L'URL è la fonte di verità della tappa aperta: il quaderno ricorda comunque
  // l'ultima tappa per il pulsante "Riprendi".
  const current = data.current;

  useEffect(() => {
    if (route.step !== null && route.step !== current)
      setData((d) => ({ ...d, current: route.step as number }));
  }, [route.step, current, setData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      const target = document.querySelector("main");
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  }, [location]);

  // Dialogo nativo: focus trap, Escape e sfondo inerte sono gestiti dal browser.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmDelete && !dialog.open) dialog.showModal();
    if (!confirmDelete && dialog.open) dialog.close();
  }, [confirmDelete]);

  const exportButton = (
    <button className="button primary" disabled={exporting} onClick={() => download()}>
      <Download size={16} />
      {exporting ? "Generazione…" : "Esporta il percorso in PDF"}
    </button>
  );

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

          <div className="sidebar-progress">
            <div className="sidebar-progress-info">
              <span>Tappe concluse</span>
              <strong>
                {data.completed.length} <small>/ {stepCount}</small>
              </strong>
            </div>
            <progress
              className="sidebar-progress-bar"
              aria-label="Tappe concluse"
              value={data.completed.length}
              max={stepCount}
            />
          </div>

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

          <nav className="step-nav" aria-label="Le tappe del percorso">
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

              <strong>
                {view === "step" ? `Tappa ${(route.step ?? data.current) + 1}` : names[view]}
              </strong>
            </div>

            <div className="topbar-progress">
              <div className="progress-text">
                <span>Avanzamento</span>
                <strong>{Math.round((data.completed.length / stepCount) * 100)}% completato</strong>
              </div>
              <progress
                className="progress-bar"
                aria-label="Avanzamento complessivo"
                value={data.completed.length}
                max={stepCount}
              />
            </div>

            <div className="topbar-right">
              <button
                className="icon-button theme-toggle"
                type="button"
                onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                aria-label={theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
                title={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className={`save-status ${saveMode === "memory" ? "error" : ""}`}>
                <span />
                {saveMode === "memory"
                  ? "Salvataggio non disponibile"
                  : saveMode === "session"
                    ? "Salvataggio di sessione"
                    : saveMode === "idb"
                      ? "Salvataggio in modalità compatibilità"
                      : "Salvataggio sul dispositivo"}
              </div>
            </div>
          </header>

          <main id="main-content">
            {saveMode === "memory" && (
              <div className="alert" role="alert">
                Il salvataggio automatico non è disponibile in questo browser: le risposte restano a
                schermo finché non chiudi o ricarichi la pagina, quindi esporta prima il quaderno in
                PDF o in JSON. Per abilitarlo, consenti i cookie e i dati dei siti nelle
                impostazioni del browser (in Chrome: Impostazioni sito → Cookie), poi ricarica.{" "}
                <button className="text-button" type="button" onClick={retrySave}>
                  Riprova il salvataggio
                </button>
              </div>
            )}

            {exportError && (
              <div className="alert" role="alert">
                {exportError}
              </div>
            )}

            {view === "home" && (
              <HomeView
                data={data}
                previousData={previousData}
                steps={steps}
                stepCount={stepCount}
                phases={phases}
                summaryStatus={summaryStatus}
                nextStep={nextStep}
                progressPct={progressPct}
                answered={answered}
                totalFields={totalFields}
                phaseImage={phaseImage}
                go={go}
                toggleComplete={toggleComplete}
                download={download}
                exporting={exporting}
              />
            )}

            {view === "step" && (
              <StepView
                data={data}
                step={step}
                phaseImage={phaseImage}
                go={go}
                toggleComplete={toggleComplete}
                write={write}
                openGlossary={openGlossary}
              />
            )}

            {view === "resources" && (
              <ResourcesView
                search={search}
                setSearch={setSearch}
                openPerspective={openPerspective}
                setOpenPerspective={setOpenPerspective}
              />
            )}

            {view === "summary" && (
              <SummaryView
                data={data}
                setData={setData}
                phases={phases}
                summaryStatus={summaryStatus}
                nextStep={nextStep}
                progressPct={progressPct}
                answered={answered}
                totalFields={totalFields}
                go={go}
                exportButton={exportButton}
                exportJson={exportJson}
                importJson={importJson}
                fileInputRef={fileInputRef}
                notify={notify}
              />
            )}
            {view === "privacy" && <PrivacyView go={go} />}

            <footer className="footer">
              <span>
                restare umani. <span>Un laboratorio di aggiornamento per docenti.</span>
              </span>

              <div className="footer-links">
                <button onClick={() => go("resources")}>
                  Approfondimenti e glossario <ArrowUpRight size={13} />
                </button>
                <button onClick={() => go("privacy")}>
                  Privacy <ArrowUpRight size={13} />
                </button>
              </div>

              <p className="footer-meta">
                A cura del prof. Riefolo Giovanni, docente di IRC al Ferraris Fermi di Verona ·
                contenuti aggiornati a novembre 2026 · licenza CC BY-NC-SA 4.0
              </p>
            </footer>
          </main>
        </div>

        {toast && (
          <output className="toast" aria-live="polite">
            <CheckCircle2 size={18} />

            {toast}
          </output>
        )}

        <dialog
          ref={dialogRef}
          className="modal"
          aria-labelledby="delete-title"
          onClose={() => setConfirmDelete(false)}
        >
          <Trash2 size={28} />

          <h2 id="delete-title">Cancellare le tue parole?</h2>

          <p>
            Risposte, nome e avanzamento, anche della versione precedente, saranno rimossi da questo
            browser. I PDF già scaricati non saranno cancellati. Questa operazione non può essere
            annullata.
          </p>

          <div>
            <button className="button outline" autoFocus onClick={() => setConfirmDelete(false)}>
              Annulla
            </button>

            <button
              className="button danger"
              onClick={() => {
                clearAll();
                setConfirmDelete(false);
                go("home");
                notify("Dati personali cancellati da questa attività.");
              }}
            >
              Cancella i dati
            </button>
          </div>
        </dialog>
      </div>
    </>
  );
}
