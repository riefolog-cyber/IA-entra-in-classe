import { beforeEach, describe, expect, test } from "bun:test";

import {
  BACKUP_REMINDER_DAYS,
  LAST_EXPORT_KEY,
  lastBackupAt,
  markBackupExported,
  shouldSuggestBackup,
} from "../backup-reminder";

const DAY = 24 * 60 * 60 * 1000;

function installStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };
  (globalThis as unknown as Record<string, unknown>).window = { localStorage: storage };
  (globalThis as unknown as Record<string, unknown>).localStorage = storage;
  return data;
}

beforeEach(() => {
  installStorage();
});

describe("promemoria del backup", () => {
  test("un quaderno vuoto non produce promemoria", () => {
    expect(shouldSuggestBackup(false)).toBe(false);
  });

  test("senza export precedente il promemoria appare subito", () => {
    expect(lastBackupAt()).toBeNull();
    expect(shouldSuggestBackup(true)).toBe(true);
  });

  test("dopo un export il promemoria tace finché non passa il tempo", () => {
    const now = Date.UTC(2026, 10, 18);
    markBackupExported(now);

    expect(lastBackupAt()).toBe(now);
    expect(shouldSuggestBackup(true, now + DAY)).toBe(false);
    expect(shouldSuggestBackup(true, now + BACKUP_REMINDER_DAYS * DAY - DAY)).toBe(false);
    expect(shouldSuggestBackup(true, now + BACKUP_REMINDER_DAYS * DAY)).toBe(true);
  });

  test("un valore corrotto nello storage non blocca il promemoria", () => {
    const data = installStorage();
    data.set(LAST_EXPORT_KEY, "non un numero");

    expect(lastBackupAt()).toBeNull();
    expect(shouldSuggestBackup(true)).toBe(true);
  });
});
