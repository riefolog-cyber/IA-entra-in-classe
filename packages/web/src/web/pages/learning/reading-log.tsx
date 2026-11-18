import { Check, Copy, Download, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { copyText, downloadText } from "../../lib/clipboard";
import {
  formatReadingDate,
  formatReadingsExport,
  loadReadings,
  READINGS_KEY,
  MAX_READING_LENGTH,
  removeReading,
  saveReading,
  type SavedReading,
} from "../../lib/reading-store";
import { steps } from "../../lib/teacher-content";

type ReadingLogProps = {
  /** Ambito selezionato nel riquadro del prompt: la lettura lo eredita. */
  scope: number;
  notify?: (message: string) => void;
};

function scopeLabel(scope: number | null): string {
  if (scope === null) return "tutto il quaderno";
  return `tappa ${scope + 1}${steps[scope] ? ` — ${steps[scope].short}` : ""}`;
}

function downloadReading(reading: SavedReading) {
  const name =
    reading.scope === null ? "lettura-quaderno.txt" : `lettura-tappa-${reading.scope + 1}.txt`;
  downloadText(reading.text, name);
}

/**
 * Il ritorno della lettura: il docente incolla qui la risposta ricevuta dal
 * modello e la ritrova accanto al quaderno, con la data. Vive solo nel browser,
 * come le risposte.
 */
export function ReadingLog({ scope, notify }: ReadingLogProps) {
  const [readings, setReadings] = useState<SavedReading[]>(() => loadReadings());
  const [text, setText] = useState("");
  const [model, setModel] = useState("Gemini");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  /** Eliminazione in due passi: una lettura incollata non si perde per un clic. */
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se un'altra scheda cancella i dati (o salva una lettura), questa vista
  // non deve mostrare un elenco che non esiste più.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === READINGS_KEY || event.key === null) setReadings(loadReadings());
    };
    const onCleared = () => setReadings(loadReadings());
    // Un'importazione può sostituire le letture senza passare dallo storage.
    const onReplaced = () => setReadings(loadReadings());
    window.addEventListener("storage", onStorage);
    window.addEventListener("notebook:cleared", onCleared);
    window.addEventListener("notebook:readings", onReplaced);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("notebook:cleared", onCleared);
      window.removeEventListener("notebook:readings", onReplaced);
    };
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const scopeText = useMemo(() => scopeLabel(scope === -1 ? null : scope), [scope]);
  const canSave = text.trim().length >= 40;

  const save = () => {
    if (!canSave) return;
    setReadings(saveReading({ model, scope: scope === -1 ? null : scope, text }));
    setText("");
    notify?.("Lettura conservata su questo dispositivo.");
  };

  const copy = async (reading: SavedReading) => {
    const ok = await copyText(reading.text);
    if (!ok) {
      notify?.("Copia non riuscita: usa «Scarica .txt».");
      return;
    }
    setCopiedId(reading.id);
    notify?.("Lettura copiata.");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section className="reading-log" aria-labelledby="reading-log-title">
      <h4 id="reading-log-title">Conserva la lettura ricevuta</h4>
      <p>
        Incolla qui la risposta che ti ha dato il modello: resta in questo browser accanto al
        quaderno, con la data. Il sito non la invia a nessuno e non la controlla.
      </p>

      <label className="reading-log-field">
        <span>Modello usato</span>
        <input
          type="text"
          value={model}
          maxLength={60}
          placeholder="Gemini"
          onChange={(event) => setModel(event.target.value)}
        />
      </label>

      <label className="reading-log-field">
        <span>Lettura ({scopeText})</span>
        <textarea
          value={text}
          rows={5}
          maxLength={MAX_READING_LENGTH}
          placeholder="Incolla qui il quadro ricevuto dal modello…"
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      <div className="reading-log-actions">
        <button className="button outline" type="button" disabled={!canSave} onClick={save}>
          <Save size={15} aria-hidden="true" /> Conserva la lettura
        </button>
        {text.trim().length > 0 && !canSave ? (
          <span className="profile-footnote">Ancora troppo breve per essere conservata.</span>
        ) : null}
      </div>
      <output className="screen-reader-only" aria-live="polite">
        {readings.length > 0 ? `${readings.length} letture conservate` : ""}
      </output>

      {readings.length > 0 ? (
        <div className="reading-log-actions">
          <button
            className="text-button"
            type="button"
            onClick={() =>
              downloadText(formatReadingsExport(readings), "restare-umani-letture.txt")
            }
          >
            <Download size={14} aria-hidden="true" /> Scarica tutte le letture (.txt)
          </button>
        </div>
      ) : null}

      {readings.length > 0 ? (
        <ul className="reading-log-list">
          {readings.map((reading) => (
            <li key={reading.id}>
              <div className="reading-log-head">
                <strong>{formatReadingDate(reading.at)}</strong>
                <span>
                  {reading.model || "modello non indicato"} · {scopeLabel(reading.scope)}
                </span>
              </div>
              <details>
                <summary>Leggi la lettura conservata</summary>
                <pre>{reading.text}</pre>
              </details>
              <div className="reading-log-actions">
                <button className="text-button" type="button" onClick={() => void copy(reading)}>
                  {copiedId === reading.id ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                  {copiedId === reading.id ? "Copiata" : "Copia"}
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => downloadReading(reading)}
                >
                  <Download size={14} aria-hidden="true" /> Scarica .txt
                </button>
                {pendingDelete === reading.id ? (
                  <>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setReadings(removeReading(reading.id));
                        setPendingDelete(null);
                        notify?.("Lettura eliminata da questo dispositivo.");
                      }}
                    >
                      Conferma eliminazione
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPendingDelete(null)}
                    >
                      Annulla
                    </button>
                  </>
                ) : (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setPendingDelete(reading.id)}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Elimina
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
