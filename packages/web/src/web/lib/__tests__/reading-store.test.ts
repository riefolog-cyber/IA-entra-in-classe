import { beforeEach, describe, expect, test } from "bun:test";

import {
  formatReadingDate,
  loadReadings,
  MAX_READINGS,
  READINGS_KEY,
  removeReading,
  saveReading,
} from "../reading-store";

/** Storage minimo: il test non dipende da un browser. */
function installStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;

  (globalThis as unknown as Record<string, unknown>).localStorage = storage;
  return { data, storage };
}

const LONG = "Questa è una lettura abbastanza lunga da poter essere conservata.";

beforeEach(() => {
  installStorage();
});

describe("letture conservate", () => {
  test("una lettura troppo breve non viene salvata", () => {
    expect(saveReading({ model: "Gemini", scope: null, text: "breve" })).toEqual([]);
  });

  test("salva con data, modello e ambito, la più recente in cima", () => {
    saveReading({ model: " Gemini ", scope: 2, text: LONG });
    const list = saveReading({ model: "ChatGPT", scope: null, text: `${LONG} Seconda.` });

    expect(list).toHaveLength(2);
    expect(list[0].model).toBe("ChatGPT");
    expect(list[0].scope).toBeNull();
    expect(list[1].model).toBe("Gemini");
    expect(list[1].scope).toBe(2);
    expect(list[0].at).toBeGreaterThanOrEqual(list[1].at);
  });

  test("tiene al massimo cinque letture", () => {
    for (let i = 0; i < MAX_READINGS + 3; i += 1) {
      saveReading({ model: "Gemini", scope: null, text: `${LONG} Numero ${i}.` });
    }
    expect(loadReadings()).toHaveLength(MAX_READINGS);
  });

  test("un ambito fuori intervallo diventa «tutto il quaderno»", () => {
    const list = saveReading({ model: "Gemini", scope: 42, text: LONG });
    expect(list[0].scope).toBeNull();
  });

  test("un contenuto corrotto non rompe la vista", () => {
    const { data } = installStorage();
    data.set(READINGS_KEY, "{non è json");
    expect(loadReadings()).toEqual([]);

    data.set(READINGS_KEY, JSON.stringify([{ id: 1 }, null, { id: "x", at: 1, text: "" }]));
    expect(loadReadings()).toEqual([]);
  });

  test("elimina una lettura specifica", () => {
    const list = saveReading({ model: "Gemini", scope: null, text: LONG });
    expect(removeReading(list[0].id)).toEqual([]);
  });

  test("la data è leggibile in italiano", () => {
    expect(formatReadingDate(Date.now())).toMatch(/\d{4}/);
  });
});
