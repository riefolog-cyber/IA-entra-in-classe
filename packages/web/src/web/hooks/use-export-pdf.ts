import { useRef, useState } from "react";

import { exportPdf } from "../lib/export-pdf";
import { parseState } from "../lib/notebook-state";
import type { SavedState } from "../lib/teacher-content";

type Options = {
  data: SavedState;
  previousData: SavedState;
  setData: (updater: (d: SavedState) => SavedState) => void;
  notify: (message: string) => void;
};

export function useExportPdf({ data, previousData, setData, notify }: Options) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const download = async (previousVersion = false) => {
    setExporting(true);
    setExportError("");

    try {
      // Un frame di respiro: il pulsante mostra lo stato "Generazione…" prima
      // che jsPDF occupi il thread principale.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await exportPdf(previousVersion ? previousData : data, previousVersion);
      notify("PDF generato. Controlla i download del browser.");
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
        setData(() => parseState(JSON.stringify(raw)));
        setExportError("");
        notify("Dati importati. Controlla le risposte.");
      } catch {
        setExportError("File non valido: impossibile leggere il JSON.");
      }
    };

    reader.readAsText(file);
  };

  return { exporting, exportError, download, exportJson, importJson, fileInputRef };
}
