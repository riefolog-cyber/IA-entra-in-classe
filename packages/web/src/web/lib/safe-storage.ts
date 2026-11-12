// Catena di salvataggio progressiva: localStorage → sessionStorage → IndexedDB
// → memoria. Alcuni browser bloccano lo storage (impostazioni cookie, browser
// in-app): invece di mostrare subito "salvataggio non disponibile", proviamo
// ogni livello disponibile.

export type StorageBackend = "local" | "session" | "idb" | "memory";

const memory = new Map<string, string>();

function trySync(store: Storage, key: string, value?: string): boolean {
  try {
    if (value === undefined) store.removeItem(key);
    else store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function syncGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

/** Prima scrittura disponibile tra i backend sincroni. */
export function detectSyncBackend(): "local" | "session" | "memory" {
  try {
    if (trySync(window.localStorage, "__ru_test", "1") && trySync(window.localStorage, "__ru_test"))
      return "local";
  } catch {
    /* bloccato */
  }
  try {
    if (
      trySync(window.sessionStorage, "__ru_test", "1") &&
      trySync(window.sessionStorage, "__ru_test")
    )
      return "session";
  } catch {
    /* bloccato */
  }
  return "memory";
}

function getFromSyncChain(key: string): string | null {
  const local = syncGet(window.localStorage, key);
  if (local !== null) return local;
  return syncGet(window.sessionStorage, key);
}

function setInSyncChain(key: string, value: string): "local" | "session" | null {
  try {
    if (trySync(window.localStorage, key, value)) return "local";
  } catch {
    /* bloccato */
  }
  try {
    if (trySync(window.sessionStorage, key, value)) return "session";
  } catch {
    /* bloccato */
  }
  return null;
}

function removeFromSyncChain(key: string): void {
  trySync(window.localStorage, key);
  trySync(window.sessionStorage, key);
  memory.delete(key);
}

// Una sola connessione per sessione: aprire il database a ogni lettura/scrittura
// (come faceva la prima versione) rallentava il salvataggio a ogni tasto premuto.
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open("restare-umani", 1);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("indexedDB non disponibile"));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("kv")) request.result.createObjectStore("kv");
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new Error("indexedDB non disponibile"));
    request.onblocked = () => reject(new Error("indexedDB bloccato"));
  });

  // Un fallimento non deve restare in cache: il prossimo tentativo riapre il db.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

export async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
      req.onerror = () => reject(req.error ?? new Error("lettura non riuscita"));
    });
  } catch {
    return null;
  }
}

export async function idbSet(key: string, value: string): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("scrittura non riuscita"));
      tx.onabort = () => reject(tx.error ?? new Error("scrittura non riuscita"));
    });
    return true;
  } catch {
    return false;
  }
}

export async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* nessun problema: se manca il db non c'è nulla da cancellare */
  }
}

/** Scrittura con fallback: risponde con il livello effettivamente raggiunto. */
export async function robustSet(
  key: string,
  value: string,
): Promise<Exclude<StorageBackend, "memory"> | "memory"> {
  const sync = setInSyncChain(key, value);
  if (sync) {
    memory.set(key, value);
    return sync;
  }
  memory.set(key, value);
  const ok = await idbSet(key, value);
  return ok ? "idb" : "memory";
}

/** Lettura: catena sincrona, poi IndexedDB (per l'idratazione iniziale). */
export function robustGetSync(key: string): string | null {
  const sync = getFromSyncChain(key);
  if (sync !== null) return sync;
  return memory.get(key) ?? null;
}

export function robustRemove(key: string): void {
  removeFromSyncChain(key);
  void idbRemove(key);
}
