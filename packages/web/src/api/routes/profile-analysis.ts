import { z } from "zod";
import { base } from "../__core/app";

const inputSchema = z.object({
  summary: z.string().max(12000),
});

function buildPrompt(summary: string) {
  return [
    "Sei un facilitatore di formazione docenti. Analizza SOLO il testo fornito, senza inventare fatti.",
    "Obiettivo: supportare l’autocomprensione professionale del percorso sull’IA a scuola.",
    "Vincoli: non fare diagnosi, non dare punteggi, non usare etichette sulla persona, non giudicare il docente, non menzionare dati personali o alunni.",
    "Se il testo è scarso, dillo con cautela e proponi domande utili.",
    "Rispondi in italiano, in JSON valido con questa forma:",
    '{"headline":"...","narrative":"2-4 frasi","strengths":["..."],"tensions":["..."],"questions":["..."],"nextStep":"...","caution":"..."}',
    "strengths/tensions/questions: 2-4 elementi ciascuno, brevi e concreti.",
    "",
    "TESTO DEL PERCORSO:",
    summary,
  ].join("\n");
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export const analyzeProfile = base.input(inputSchema).handler(async ({ input }) => {
  const baseUrl = (process.env.AI_GATEWAY_BASE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.AI_GATEWAY_API_KEY || "";
  if (!baseUrl || !apiKey) {
    return {
      ok: false as const,
      reason: "missing_config" as const,
      message:
        "Analisi IA non configurata sul server. Imposta AI_GATEWAY_BASE_URL e AI_GATEWAY_API_KEY, poi riavvia il server.",
    };
  }

  const model = process.env.AI_PROFILE_MODEL || "gemini-2.0-flash";
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
        temperature: 0.4,
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
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.output_text ??
      (typeof raw === "string" ? raw : "");
    const parsed = extractJson(String(content));
    if (!parsed || typeof parsed !== "object") {
      return {
        ok: false as const,
        reason: "invalid_response" as const,
        message: "La risposta IA non era in un formato utilizzabile. Riprova con il profilo locale.",
      };
    }
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 4) : []);
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
  } catch (e) {
    return {
      ok: false as const,
      reason: "network_error" as const,
      message: "Richiesta IA non riuscita (rete, timeout o configurazione). Puoi usare il profilo locale.",
    };
  } finally {
    clearTimeout(timeout);
  }
});
