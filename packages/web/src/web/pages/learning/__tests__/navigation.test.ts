import { describe, expect, test } from "bun:test";

import { stepCount } from "../../../lib/notebook-state";
import { HASH_PATHS, parseLocation, pathFor } from "../navigation";

describe("rotte con hash", () => {
  test("una tappa valida diventa un indice a base zero", () => {
    expect(parseLocation("/tappa/3", 10)).toEqual({ view: "step", step: 2 });
    expect(parseLocation("/tappa/10/", 10)).toEqual({ view: "step", step: 9 });
  });

  test("indici fuori percorso restano dentro l'intervallo", () => {
    expect(parseLocation("/tappa/0", 10)).toEqual({ view: "step", step: 0 });
    expect(parseLocation("/tappa/99", 10)).toEqual({ view: "step", step: 9 });
  });

  test("le viste note e un percorso sconosciuto", () => {
    expect(parseLocation(HASH_PATHS.summary, 10)).toEqual({ view: "summary", step: null });
    expect(parseLocation(HASH_PATHS.resources, 10)).toEqual({ view: "resources", step: null });
    expect(parseLocation("/boh", 10)).toEqual({ view: "home", step: null });
  });

  test("andata e ritorno tra indice e link della tappa", () => {
    expect(pathFor("step", 2)).toBe("/tappa/3");
    expect(pathFor("summary")).toBe(HASH_PATHS.summary);

    const last = stepCount - 1;
    expect(parseLocation(pathFor("step", last), stepCount).step).toBe(last);
  });
});
