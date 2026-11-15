import { describe, expect, test } from "bun:test";

import { canExportAttestation } from "../export-attestation";
import { freshState } from "../notebook-state";

describe("attestazione di partecipazione", () => {
  test("senza nome non è esportabile", () => {
    expect(canExportAttestation(freshState())).toBe(false);
    expect(canExportAttestation({ ...freshState(), name: "   " })).toBe(false);
  });

  test("con un nome è esportabile", () => {
    expect(canExportAttestation({ ...freshState(), name: "Ada Lovelace" })).toBe(true);
  });
});
