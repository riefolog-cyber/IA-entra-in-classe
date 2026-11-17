/**
 * Letture ricevute da un modello esterno, conservate sul dispositivo.
 *
 * Il sito non chiama alcun modello: il docente incolla qui la risposta che ha
 * ricevuto altrove. Restano nello stesso browser del quaderno, con data e
 * modello, e si possono copiare o eliminare una per una. Nessun invio, nessuna
 * sincronizzazione: se si cancellano i dati del sito, spariscono anche queste.
 */
import { steps } from "./teacher-content";

export const READINGS_KEY = "restare-umani-letture-v1";

/** Oltre questo numero le letture più vecchie escono: il quaderno non è un archivio. */
export const MAX_READINGS = 5;

/** Un incolla enorme è quasi sempre un errore: il testo di un modello sta qui. */
export const MAX_READING_LENGTH = 20_000;

export type SavedReading = {
  id: string;
  at: number;
  /** Modello usato, così il docente sa da dove arriva la lettura. */
  model: string;
  /** Tappa (0-based) o `null` per tutto il quaderno. */
  scope: number | null;
  text: string;
};

/** Riserva in memoria: senza `localStorage` la funzione resta utilizzabile. */
let memory: SavedReading[] = [];

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Un ambito è valido solo se punta a una tappa che esiste. */
function validScope(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < steps.length
    ? value
    : null;
}

function sanitize(value: unknown): SavedReading | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<SavedReading>;
  if (typeof entry.id !== "string" || !entry.id) return null;
  if (typeof entry.at !== "number" || !Number.isFinite(entry.at)) return null;
  if (typeof entry.text !== "string" || !entry.text.trim()) return null;
  if (entry.text.length > MAX_READING_LENGTH) return null;
  const scope =
    typeof entry.scope === "number" &&
    Number.isInteger(entry.scope) &&
    entry.scope >= 0 &&
    entry.scope < 10
      ? entry.scope
      : null;
  return {
    id: entry.id,
    at: entry.at,
    model: typeof entry.model === "string" ? entry.model.slice(0, 60) : "",
    scope,
    text: entry.text,
  };
}

/** La più recente sta in cima. */
export function loadReadings(): SavedReading[] {
  const store = storage();
  if (!store) return [...memory];
  try {
    const parsed: unknown = JSON.parse(store.getItem(READINGS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitize)
      .filter((entry): entry is SavedReading => entry !== null)
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_READINGS);
  } catch {
    return [];
  }
}

function persist(list: SavedReading[]) {
  const store = storage();
  if (!store) {
    memory = list;
    return;
  }
  try {
    store.setItem(READINGS_KEY, JSON.stringify(list));
  } catch {
    // Quota piena o storage negato: la vista aggiorna comunque il suo stato.
    memory = list;
  }
}

/** Aggiunge una lettura; restituisce l'elenco aggiornato. */
export function saveReading(input: {
  model: string;
  scope: number | null;
  text: string;
}): SavedReading[] {
  const text = input.text.trim().slice(0, MAX_READING_LENGTH);
  if (text.length < 40) return loadReadings();

  const reading: SavedReading = {
    // `crypto.randomUUID` non esiste ovunque: l'istante più un suffisso basta.
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    model: input.model.trim().slice(0, 60),
    scope: validScope(input.scope),
    text,
  };

  const list = [reading, ...loadReadings()].sort((a, b) => b.at - a.at).slice(0, MAX_READINGS);
  persist(list);
  return list;
}

export function removeReading(id: string): SavedReading[] {
  const list = loadReadings().filter((entry) => entry.id !== id);
  persist(list);
  return list;
}

export function formatReadingDate(at: number): string {
  return new Date(at).toLocaleString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
