import { describe, expect, test } from "bun:test";

import {
  freshState,
  isEmptyState,
  parseState,
  serializableState,
  stepCount,
} from "../notebook-state";

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

  test("riconosce lo stato vuoto anche dopo un ciclo di salvataggio", () => {
    const roundTrip = parseState(JSON.stringify(freshState()));
    expect(isEmptyState(roundTrip)).toBe(true);
    expect(isEmptyState({ ...roundTrip, name: "Ada" })).toBe(false);
  });
});
