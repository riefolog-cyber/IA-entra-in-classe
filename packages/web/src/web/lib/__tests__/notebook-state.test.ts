import { describe, expect, test } from "bun:test";

import {
  MAX_ANSWER_LENGTH,
  MAX_BACKUPS,
  MAX_NAME_LENGTH,
  freshState,
  parseBackups,
  pushBackup,
  isEmptyState,
  parseState,
  serializableState,
  stepCount,
} from "../notebook-state";
import { steps } from "../teacher-content";

describe("stato del quaderno", () => {
  test("un valore assente o illeggibile produce uno stato vuoto nuovo", () => {
    expect(parseState(null)).toEqual(freshState());
    expect(parseState("{non-json")).toEqual(freshState());
    expect(parseState('"stringa"')).toEqual(freshState());
    expect(parseState(null)).not.toBe(parseState(null));
  });

  test("scarta chiavi e indici non validi, conservando le risposte buone", () => {
    const state = parseState(
      JSON.stringify({
        answers: {
          "0-p0": "Una riflessione",
          "0-quiz": "2",
          "0-scenario": "9",
          "99-p0": "Fuori percorso",
          "0-altro": "chiave sconosciuta",
          "1-p0": 42,
        },
        completed: [1, 1, stepCount, -3, "2"],
        current: 1.7,
        name: "Docente",
      }),
    );

    expect(state.answers).toEqual({ "0-p0": "Una riflessione", "0-quiz": "2" });
    expect(state.completed).toEqual([1]);
    expect(state.current).toBe(1);
    expect(state.name).toBe("Docente");
  });

  test("limita la tappa corrente all'intervallo del percorso", () => {
    expect(parseState(JSON.stringify({ current: 999 })).current).toBe(0);
    expect(parseState(JSON.stringify({ current: -2 })).current).toBe(0);
    expect(parseState(JSON.stringify({ current: stepCount - 1 })).current).toBe(stepCount - 1);
  });

  test("la riscrittura conserva solo le tappe concluse esistenti", () => {
    const state = { ...freshState(), completed: [0, 3, stepCount + 2] };
    expect(serializableState(state).completed).toEqual([0, 3]);
  });

  test("scarta una scelta fuori dal numero di opzioni della tappa", () => {
    const options = steps[0].options.length;
    const choices = steps[0].choices.length;

    const state = parseState(
      JSON.stringify({
        answers: {
          "0-quiz": String(options),
          "0-scenario": String(choices),
          "1-quiz": "1",
        },
      }),
    );

    expect(state.answers["0-quiz"]).toBeUndefined();
    expect(state.answers["0-scenario"]).toBeUndefined();
    expect(state.answers["1-quiz"]).toBe("1");
  });

  test("tronca risposte e nome oltre il limite", () => {
    const state = parseState(
      JSON.stringify({
        answers: { "0-p0": "a".repeat(MAX_ANSWER_LENGTH + 50) },
        name: "n".repeat(MAX_NAME_LENGTH + 20),
      }),
    );

    expect(state.answers["0-p0"]).toHaveLength(MAX_ANSWER_LENGTH);
    expect(state.name).toHaveLength(MAX_NAME_LENGTH);
  });

  test("le copie di sicurezza ruotano e restano in ordine di data", () => {
    let list = parseBackups(null);

    for (let i = 0; i < MAX_BACKUPS + 2; i += 1) {
      list = pushBackup(
        list,
        { ...freshState(), answers: { "0-p0": `copia ${i}` } },
        "importazione",
      );
    }

    expect(list).toHaveLength(MAX_BACKUPS);
    expect(list[0].state.answers["0-p0"]).toBe(`copia ${MAX_BACKUPS + 1}`);
    expect(list[0].reason).toBe("importazione");
    expect(list[0].savedAt).toBeGreaterThan(list[1].savedAt);
    expect(parseBackups(JSON.stringify(list))).toHaveLength(MAX_BACKUPS);
    expect(parseBackups("{non-json")).toEqual([]);
  });

  test("una copia con dati non validi viene ripulita in lettura", () => {
    const raw = JSON.stringify([
      {
        savedAt: 1,
        reason: "importazione",
        state: { answers: { "0-quiz": "9", "0-p0": "ok" }, completed: [99, 2.5] },
      },
    ]);

    const [backup] = parseBackups(raw);

    expect(backup.state.answers).toEqual({ "0-p0": "ok" });
    expect(backup.state.completed).toEqual([]);
  });

  test("riconosce lo stato vuoto anche dopo un ciclo di salvataggio", () => {
    const roundTrip = parseState(JSON.stringify(freshState()));
    expect(isEmptyState(roundTrip)).toBe(true);
    expect(isEmptyState({ ...roundTrip, name: "Ada" })).toBe(false);
  });
});
