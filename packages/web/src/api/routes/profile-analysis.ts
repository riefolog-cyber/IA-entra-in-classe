import { z } from "zod";
import { base } from "../__core/app";

const inputSchema = z.object({
  summary: z.string().max(12000),
});

function buildPrompt(summary: string) {
  return [
    "Sei un formatore che accompagna docenti nella riflessione professionale sull’uso dell’IA a scuola.",
    "Non riassumere meccanicamente le risposte: individua le scelte, le tensioni professionali e i punti ancora da chiarire che emergono dal percorso.",
    "Obiettivo: sostenere l’autocomprensione professionale del docente sul proprio modo di usare (o non usare) l’IA, senza valutarlo.",
    "Leggi il percorso come documentazione professionale: come progetta, verifica, valuta, comunica, tutela e sperimenta? Quali criteri dichiara? Dove emergono incoerenze tra intenzioni e pratiche?",
    "Vincoli: non fare diagnosi, non dare punteggi, non usare etichette sulla persona, non giudicare il docente, non menzionare dati personali o studenti, non inventare fatti non presenti nel testo.",
    "Non interpretare i campi vuoti come segnali psicologici: un silenzio è un’informazione mancante, non una prova.",
    "Se il testo è scarso o frammentario, dillo con cautela e proponi domande che aiutino a completare il quadro.",
    "Rispondi in italiano, in JSON valido con questa forma:",
    '{"headline":"titolo interpretativo breve (max 8 parole)","narrative":"3-5 frasi di lettura professionale: che cosa il percorso rivela del modo di insegnare di questo docente?","strengths":["2-4 risorse professionali già presenti, non complimenti"],"tensions":["2-4 punti di tensione o incoerenza da esplorare, non difetti"],"questions":["2-4 domande aperte di autocomprensione, non retoriche"],"nextStep":"un solo passo concreto e verificabile per le prossime settimane","caution":"una frase che ricorda il carattere interpretativo e parziale della lettura"}',
    "Le strengths non sono elogi: sono risorse che il docente già possiede e che può riconoscere.",
    "Le tensions non sono difetti: sono luoghi dove il percorso si complica e dove vale la pena fermarsi.",
    "Le questions devono essere realmente aperte, senza suggerire la risposta.",
    "",
    "TESTO DEL PERCORSO:",
    summary,
  ].join("\n");
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const analyzeProfile = base.input(inputSchema).handler(async ({ input }) => {
  // Read env through an index access so the same source type-checks in the
  // mobile package, which does not include @types/bun's ProcessEnv.
  const env = (key: string) => (process.env as Record<string, string | undefined>)[key];
  const baseUrl = (env("AI_GATEWAY_BASE_URL") || "").replace(/\/$/, "");
  const apiKey = env("AI_GATEWAY_API_KEY") || "";
  if (!baseUrl || !apiKey) {
    return {
      ok: false as const,
      reason: "missing_config" as const,
      message:
        "Analisi IA non configurata sul server. Imposta AI_GATEWAY_BASE_URL e AI_GATEWAY_API_KEY, poi riavvia il server.",
    };
  }

  const model = env("AI_PROFILE_MODEL") || "openai/gpt-4.1-mini";
  const url = baseUrl.includes("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: "Rispondi solo con JSON valido." },
          { role: "user", content: buildPrompt(input.summary) },
        ],
      }),
      signal: controller.signal,
    });
    const raw = await res.text();
    if (!res.ok) {
      return {
        ok: false as const,
        reason: "provider_error" as const,
        message: `Errore dal servizio IA (${res.status}). Verifica configurazione/modello o riprova.`,
      };
    }
    type ChatResponse = {
      choices?: Array<{ message?: { content?: string } }>;
      output_text?: string;
    };
    let data: ChatResponse | null = null;
    try {
      data = JSON.parse(raw) as ChatResponse;
    } catch {
      data = null;
    }
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.output_text ??
      (typeof raw === "string" ? raw : "");
    const parsed = extractJson(String(content));
    if (!parsed) {
      return {
        ok: false as const,
        reason: "invalid_response" as const,
        message:
          "La risposta IA non era in un formato utilizzabile. Riprova più tardi o esporta il quaderno in PDF.",
      };
    }
    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 4) : [];
    return {
      ok: true as const,
      model,
      analysis: {
        headline: typeof parsed.headline === "string" ? parsed.headline : "Lettura del percorso",
        narrative: typeof parsed.narrative === "string" ? parsed.narrative : "",
        strengths: arr(parsed.strengths),
        tensions: arr(parsed.tensions),
        questions: arr(parsed.questions),
        nextStep: typeof parsed.nextStep === "string" ? parsed.nextStep : "",
        caution:
          typeof parsed.caution === "string"
            ? parsed.caution
            : "Interpretazione probabilistica: rileggi criticamente e verifica nel tuo contesto.",
      },
    };
  } catch {
    return {
      ok: false as const,
      reason: "network_error" as const,
      message:
        "Richiesta IA non riuscita (rete, timeout o configurazione). Puoi comunque esportare il quaderno.",
    };
  } finally {
    clearTimeout(timeout);
  }
});
