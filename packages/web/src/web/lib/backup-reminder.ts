/**
 * Promemoria del backup.
 *
 * Le risposte vivono solo nel browser: pulire i dati del sito, cambiare
 * dispositivo o perdere il profilo significa perderle. L'unica difesa è una
 * copia esportata, quindi il riepilogo lo ricorda — senza insistere: una sola
 * riga, e solo quando è passato abbastanza tempo.
 */
import { robustGetSync, robustSet } from "./safe-storage";

export const LAST_EXPORT_KEY = "restare-umani-ultimo-export-v1";

/** Tre settimane: abbastanza da non essere fastidioso, poco per un percorso di dieci tappe. */
export const BACKUP_REMINDER_DAYS = 21;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Segna che una copia è stata esportata (JSON o PDF: il rischio è lo stesso). */
export function markBackupExported(now: number = Date.now()): void {
  void robustSet(LAST_EXPORT_KEY, String(now));
}

/** Ultimo export, oppure `null` se non se n'è mai fatto uno. */
export function lastBackupAt(): number | null {
  const raw = robustGetSync(LAST_EXPORT_KEY);
  const value = Number(raw);
  return raw && Number.isFinite(value) ? value : null;
}

/** Il promemoria ha senso solo se c'è qualcosa da perdere e l'ultima copia è vecchia. */
export function shouldSuggestBackup(hasContent: boolean, now: number = Date.now()): boolean {
  if (!hasContent) return false;
  const last = lastBackupAt();
  return last === null || now - last >= BACKUP_REMINDER_DAYS * DAY_MS;
}
