import { useCallback, useEffect, useRef, useState } from "react";

import {
  KEY,
  PREVIOUS_KEY,
  freshState,
  isEmptyState,
  parseState,
  serializableState,
  stepCount,
} from "../lib/notebook-state";
import {
  detectSyncBackend,
  idbGet,
  robustGetSync,
  robustRemove,
  robustSet,
  type StorageBackend,
} from "../lib/safe-storage";
import type { SavedState } from "../lib/teacher-content";

function load(key: string): SavedState {
  return parseState(robustGetSync(key));
}

/** Il salvataggio attende la pausa nella scrittura: niente serializzazione a ogni tasto. */
const SAVE_DEBOUNCE_MS = 400;

export function useNotebook() {
  const [data, setData] = useState<SavedState>(() => load(KEY));
  const [previousData, setPreviousData] = useState<SavedState>(() => load(PREVIOUS_KEY));
  const [saveMode, setSaveMode] = useState<StorageBackend>(() => detectSyncBackend());
  const [hydrated, setHydrated] = useState(false);
  const [saveTick, setSaveTick] = useState(0);
  const [toast, setToast] = useState("");
  // Dopo una cancellazione non si riscrive subito lo stato vuoto: i dati devono sparire davvero.
  const skipNextSave = useRef(false);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const notify = useCallback((message: string) => setToast(message), []);

  // Un unico effetto di avvio: prima si recupera lo stato da IndexedDB (solo se i
  // livelli sincroni sono bloccati), poi si abilita il salvataggio. Invertendo
  // l'ordine, la scrittura iniziale dello stato vuoto sovrascriveva la sessione
  // recuperata, perdendo le risposte salvate in modalità compatibilità.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (robustGetSync(KEY) === null) {
        const raw = await idbGet(KEY);
        if (!cancelled && raw !== null) {
          const parsed = parseState(raw);
          // Se nel frattempo l'utente ha già scritto, non sovrascrivere nulla.
          if (!isEmptyState(parsed))
            setData((current) => (isEmptyState(current) ? parsed : current));
        }
      }

      if (!cancelled && robustGetSync(PREVIOUS_KEY) === null) {
        const rawPrevious = await idbGet(PREVIOUS_KEY);
        if (!cancelled && rawPrevious !== null) {
          const parsed = parseState(rawPrevious);
          if (!isEmptyState(parsed)) setPreviousData(parsed);
        }
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Scrittura con debounce: una pausa di 400 ms raggruppa i tasti premuti.
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void robustSet(KEY, JSON.stringify(serializableState(data))).then((mode) => {
        if (!cancelled) setSaveMode(mode);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data, hydrated, saveTick]);

  // Chiudere la scheda non deve perdere gli ultimi caratteri: si scrive subito.
  useEffect(() => {
    const flush = () => {
      void robustSet(KEY, JSON.stringify(serializableState(dataRef.current)));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Due schede aperte sullo stesso dispositivo: l'ultima scrittura vince, ma
  // senza sovrascrivere in silenzio la sessione visibile nell'altra.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY && event.newValue) setData(parseState(event.newValue));
      if (event.key === PREVIOUS_KEY && event.newValue) setPreviousData(parseState(event.newValue));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const write = useCallback((key: string, value: string) => {
    setData((d) => ({ ...d, answers: { ...d.answers, [key]: value } }));
  }, []);

  const toggleComplete = useCallback(
    (i?: number) => {
      const target =
        typeof i === "number" && Number.isInteger(i) && i >= 0 && i < stepCount
          ? i
          : dataRef.current.current;

      const wasCompleted = dataRef.current.completed.includes(target);

      setData((d) => ({
        ...d,
        completed: d.completed.includes(target)
          ? d.completed.filter((n) => n !== target)
          : [...d.completed, target],
      }));

      notify(wasCompleted ? "Tappa riaperta." : "Tappa conclusa. Puoi sempre tornarci.");
    },
    [notify],
  );

  const retrySave = useCallback(() => setSaveTick((t) => t + 1), []);

  const clearAll = useCallback(() => {
    skipNextSave.current = true;
    robustRemove(KEY);
    robustRemove(PREVIOUS_KEY);
    setData(freshState());
    setPreviousData(freshState());
    setSaveMode(detectSyncBackend());
  }, []);

  return {
    data,
    setData,
    previousData,
    saveMode,
    hydrated,
    toast,
    notify,
    write,
    toggleComplete,
    retrySave,
    clearAll,
  };
}
