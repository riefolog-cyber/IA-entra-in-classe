import { useRef, useState } from "react";

import { NAME_REQUIRED_MESSAGE, exportAttestation } from "../lib/export-attestation";
import { exportPdf, type ExportPdfOptions } from "../lib/export-pdf";
import { parseState } from "../lib/notebook-state";
import type { SavedState } from "../lib/teacher-content";

type Options = {
  data: SavedState;
  previousData: SavedState;
  setData: (updater: (d: SavedState) => SavedState) => void;
  notify: (message: string) => void;
  /** Salva una copia del quaderno attuale prima di sostituirlo. */
  backup: () => boolean;
};

export function useExportPdf({ data, previousData, setData, notify, backup }: Options) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const download = async (options: ExportPdfOptions = {}) => {
    setExporting(true);
    setExportError("");

    try {
      // Un frame di respiro: il pulsante mostra lo stato "Generazione…" prima
      // che jsPDF occupi il thread principale.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const state = options.previousVersion ? previousData : data;
      await exportPdf(state, options);
      notify(
        options.partial
          ? "PDF del lavoro in corso generato. Controlla i download del browser."
          : "PDF generato. Controlla i download del browser.",
      );
    } catch {
      setExportError(
        "Il PDF non è stato generato. Riprova o usa un altro browser. Le risposte restano qui.",
      );
    } finally {
      setExporting(false);
    }
  };

  /** Estratto di una sola tappa: utile per portare un caso in dipartimento. */
  const downloadStep = async (index: number) => {
    setExporting(true);
    setExportError("");

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await exportPdf(data, { stepIndex: index });
      notify(`PDF della tappa ${index + 1} generato.`);
    } catch {
      setExportError(
        "Il PDF non è stato generato. Riprova o usa un altro browser. Le risposte restano qui.",
      );
    } finally {
      setExporting(false);
    }
  };

  /** Attestazione di partecipazione: un documento breve, non un certificato. */
  const downloadAttestation = async () => {
    setExporting(true);
    setExportError("");

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await exportAttestation(data);
      notify("Attestazione generata. Controlla i download del browser.");
    } catch (error) {
      // La guardia sul nome è un messaggio per il docente, non un guasto tecnico.
      setExportError(
        error instanceof Error && error.message === NAME_REQUIRED_MESSAGE
          ? NAME_REQUIRED_MESSAGE
          : "L'attestazione non è stata generata. Riprova o usa un altro browser.",
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
    a.rel = "noopener";
    document.body.append(a);
    a.click();
    a.remove();
    // Safari annulla il download se l'URL viene revocato nello stesso tick.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Dati esportati in JSON.");
  };

  const importJson = (file: File) => {
    // Un export reale di dieci tappe sta ampiamente sotto questa soglia: un file
    // enorme è quasi sempre un errore di selezione.
    if (file.size > 2 * 1024 * 1024) {
      setExportError("File troppo grande: importa un quaderno esportato da questo sito.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setExportError("File non valido: impossibile leggere il JSON.");
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result ?? "null"));
        const isNotebook =
          raw && typeof raw === "object" && raw.answers && typeof raw.answers === "object";

        if (!isNotebook) {
          setExportError("File non valido: struttura non riconosciuta.");
          return;
        }

        // parseState filtra chiavi e indici non validi: un file corrotto non può
        // più rompere il rendering del quaderno.
        // Un'importazione sostituisce tutto: prima si salva una copia locale.
        const saved = backup();
        setData(() => parseState(JSON.stringify(raw)));
        setExportError("");
        notify(
          saved
            ? "Dati importati. La copia del quaderno precedente è in «Copie di sicurezza»."
            : "Dati importati. Controlla le risposte.",
        );
      } catch {
        setExportError("File non valido: impossibile leggere il JSON.");
      }
    };

    reader.readAsText(file);
  };

  return {
    exporting,
    exportError,
    download,
    downloadStep,
    downloadAttestation,
    exportJson,
    importJson,
    fileInputRef,
  };
}
