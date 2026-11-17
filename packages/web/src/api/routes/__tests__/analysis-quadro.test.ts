import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";

import app from "../../index";
import { buildAnalysisPayload } from "../../../web/lib/ai-summary";
import { steps } from "../../../web/lib/teacher-content";
import { resetAnalysisStateForTests } from "../profile-analysis";
import { extractJson } from "../analysis/provider";
import {
  analysisSchema,
  ensureAllSteps,
  verifyQuotes,
  type Analysis,
  type AnalysisDossier,
} from "../analysis/schema";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function baseAnalysis(overrides: Record<string, unknown> = {}): Analysis {
  return analysisSchema.parse({
    headline: "Un percorso che parte dalla verifica",
    narrative: "Testo di lettura.",
    ...overrides,
  });
}

function dossierWithOneStep(): AnalysisDossier {
  const state = {
    answers: {
      "0-p0": "Ho verificato le fonti prima di usare la scheda con la classe.",
      "0-quiz": String(steps[0].correct),
    },
    completed: [0],
    current: 0,
    name: "",
  };
  return buildAnalysisPayload(state).dossier;
}

beforeEach(() => {
  resetAnalysisStateForTests();
  setSystemTime(new Date("2026-11-17T10:00:00Z"));
  process.env = { ...originalEnv };
  setEnv({
    AI_GATEWAY_BASE_URL: "https://example.test",
    AI_GATEWAY_API_KEY: "chiave-di-prova",
    AI_ANALYSIS_RATE_LIMIT: "0",
    AI_ANALYSIS_RATE_LIMIT_GLOBAL: "0",
    AI_ANALYSIS_DAILY_LIMIT: "0",
    AI_ANALYSIS_TWO_PHASE: undefined,
  });
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  setSystemTime();
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

describe("estrazione del JSON", () => {
  test("accetta un oggetto dentro un blocco di codice", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  test("ignora il testo dopo l'oggetto", () => {
    expect(extractJson('Ecco il risultato: {"a":{"b":2}} — spero vada bene')).toEqual({
      a: { b: 2 },
    });
  });

  test("non si confonde con le graffe dentro le stringhe", () => {
    expect(extractJson('{"testo":"una {graffa} qui","n":3}')).toEqual({
      testo: "una {graffa} qui",
      n: 3,
    });
  });

  test("restituisce null quando non c'è un oggetto", () => {
    expect(extractJson("nessun json qui")).toBeNull();
  });
});

describe("citazioni verificate", () => {
  const dossier = dossierWithOneStep();

  test("una citazione presente nel quaderno resta ed è marcata come verificata", () => {
    const analysis = baseAnalysis({
      steps: [
        {
          step: 1,
          worked: true,
          reading: "Verifichi prima di usare.",
          evidence: [{ step: 1, quote: "Ho verificato le fonti prima di usare la scheda." }],
        },
      ],
    });

    const { analysis: verified, droppedQuotes } = verifyQuotes(analysis, dossier);
    expect(droppedQuotes).toBe(0);
    expect(verified.steps[0].evidence[0]?.verified).toBe(true);
  });

  test("una citazione inventata viene scartata", () => {
    const analysis = baseAnalysis({
      steps: [
        {
          step: 1,
          worked: true,
          reading: "Lettura.",
          evidence: [{ step: 1, quote: "Preferisco la lavagna di ardesia ogni mattina." }],
        },
      ],
      dimensions: [
        {
          dimension: "progettazione",
          whatEmerges: "Progetti.",
          evidence: [{ step: 1, quote: "Preferisco la lavagna di ardesia ogni mattina." }],
        },
      ],
    });

    const { analysis: verified, droppedQuotes } = verifyQuotes(analysis, dossier);
    expect(droppedQuotes).toBe(2);
    expect(verified.steps[0].evidence).toHaveLength(0);
    expect(verified.dimensions[0].evidence).toHaveLength(0);
  });
});

describe("le dieci tappe", () => {
  test("le tappe mancanti vengono ricostruite dalla scheda", () => {
    const dossier = dossierWithOneStep();
    const analysis = baseAnalysis({ steps: [{ step: 1, worked: true, reading: "Prima tappa." }] });

    const complete = ensureAllSteps(analysis, dossier);
    expect(complete.steps).toHaveLength(10);
    expect(complete.steps.map((step) => step.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(complete.steps[0].reading).toBe("Prima tappa.");
    expect(complete.steps[1].worked).toBe(false);
    expect(complete.steps[9].reading).toContain("non ancora lavorata");
  });
});

describe("analisi in due fasi", () => {
  test("mappa le tappe lavorate e produce un quadro con tutte le tappe", async () => {
    const state = {
      answers: {
        "0-p0": "Ho verificato le fonti prima di usare la scheda con la classe.",
        "0-quiz": String(steps[0].correct),
        "0-reason": "Meglio perdere dieci minuti che proporre un errore.",
      },
      completed: [0],
      current: 0,
      name: "",
    };
    const payload = buildAnalysisPayload(state);

    let mapCalls = 0;
    let synthesisCalls = 0;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ content: string }>;
      };
      const prompt = body.messages[1]?.content ?? "";

      if (prompt.includes("Analizzi UNA tappa alla volta")) {
        mapCalls += 1;
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    '{"criterion":"verificare prima di usare","decision":"controllo le fonti","tension":"tempo","quotes":[{"field":"Riflessione 1","quote":"Ho verificato le fonti prima di usare la scheda."}]}',
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      synthesisCalls += 1;
      const readings = Array.from({ length: 10 }, (_, i) => ({
        step: i + 1,
        title: steps[i].title,
        worked: i === 0,
        reading:
          i === 0 ? "Controlli le fonti prima di usare un materiale." : "Non ancora lavorata.",
        evidence:
          i === 0
            ? [
                { step: 1, quote: "Ho verificato le fonti prima di usare la scheda." },
                { step: 1, quote: "La lavagna di ardesia resta la mia preferita." },
              ]
            : [],
      }));

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headline: "Verifica prima, poi strumento",
                  narrative: "La lettura mostra un criterio chiaro.",
                  steps: readings,
                  dimensions: [
                    {
                      dimension: "verifica delle fonti",
                      whatEmerges: "La verifica è il primo gesto.",
                      evidence: [
                        { step: 1, quote: "Ho verificato le fonti prima di usare la scheda." },
                      ],
                      openQuestion: "Che cosa fai quando il tempo manca?",
                    },
                  ],
                  coherence: [],
                  strengths: ["Criterio dichiarato e applicato."],
                  tensions: ["Il tempo resta il vincolo."],
                  blindSpots: ["Nessun accenno alla valutazione."],
                  questions: ["Come documenti la verifica?"],
                  nextStep: "Annota la fonte controllata accanto alla scheda.",
                  nextSteps: [
                    {
                      action: "Aggiungi una riga «fonte verificata il…» alle schede.",
                      howYouWillKnow: "Ogni scheda usata ha una data e una fonte.",
                      within: "2 settimane",
                    },
                  ],
                  confidence: {
                    level: "bassa",
                    because: "Una sola tappa lavorata.",
                    whatWouldChangeIt: "Completare le altre tappe.",
                  },
                  caution: "Lettura parziale.",
                }),
              },
            },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const response = await app.fetch(
      new Request("http://localhost/api/rpc/analyzeProfile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: { summary: payload.summary, dossier: payload.dossier } }),
      }),
    );

    const result = ((await response.json()) as { json: Record<string, unknown> }).json;
    expect(result.ok).toBe(true);
    expect(result.twoPhase).toBe(true);
    expect(result.stepsMapped).toBe(1);
    expect(mapCalls).toBe(1);
    expect(synthesisCalls).toBe(1);

    const analysis = result.analysis as Analysis;
    expect(analysis.steps).toHaveLength(10);
    expect(analysis.coverage?.stepsWorked).toBe(1);
    expect(analysis.coverage?.emptySteps).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(analysis.confidence?.level).toBe("bassa");
    // La citazione inventata non arriva all'utente.
    expect(result.droppedQuotes).toBe(1);
    expect(analysis.steps[0].evidence).toHaveLength(1);
    expect(analysis.steps[0].evidence[0].verified).toBe(true);
  });

  test("con la lettura in due fasi disattivata resta una sola chiamata", async () => {
    setEnv({ AI_ANALYSIS_TWO_PHASE: "0" });
    const payload = buildAnalysisPayload({
      answers: { "0-p0": "Ho verificato le fonti prima di usare la scheda." },
      completed: [0],
      current: 0,
      name: "",
    });

    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '{"headline":"Titolo","narrative":"Testo","strengths":["a"],"tensions":["b"],"questions":["c"],"nextStep":"d","caution":"e"}',
              },
            },
          ],
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const response = await app.fetch(
      new Request("http://localhost/api/rpc/analyzeProfile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: { summary: payload.summary, dossier: payload.dossier } }),
      }),
    );

    const result = ((await response.json()) as { json: Record<string, unknown> }).json;
    expect(result.ok).toBe(true);
    expect(result.twoPhase).toBe(false);
    expect(calls).toBe(1);
  });
});
