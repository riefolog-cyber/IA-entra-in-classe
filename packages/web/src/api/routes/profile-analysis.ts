import { z } from "zod";
import { base } from "../__core/app";

const inputSchema = z.object({
  summary: z.string().max(12000),
});

// Limite in memoria per processo: serve solo a fermare raffiche abusive che
// consumerebbero la quota del provider. Le soglie sono volutamente ampie e
// configurabili, così una normale sessione di lavoro non viene mai interrotta:
//   AI_ANALYSIS_RATE_LIMIT        richieste al minuto per utente (default 20, 0 = nessun limite)
//   AI_ANALYSIS_RATE_LIMIT_GLOBAL richieste al minuto in totale (default 120, 0 = nessun limite)
// Con più istanze il limite complessivo si moltiplica: resta un'ulteriore
// barriera contro gli abusi, non un sostituto della quota lato provider.
const WINDOW_MS = 60_000;
const DEFAULT_PER_CLIENT = 20;
const DEFAULT_GLOBAL = 120;
const MAX_TRACKED_CLIENTS = 2000;
// Il gateway a volte impiega 50-60 s (latenza del provider, non del prompt):
// con 45 s la lettura falliva proprio mentre stava arrivando la risposta.
const REQUEST_TIMEOUT_MS = 90_000;
const LIMIT_HINT =
  "Le risposte sono già salvate: riprova tra poco oppure esporta il quaderno in PDF.";

const perClient = new Map<string, number[]>();
const globalHits: number[] = [];

function prune(timestamps: number[], now: number) {
  while (timestamps.length && now - timestamps[0] > WINDOW_MS) timestamps.shift();
}

function readLimit(key: string, fallback: number): number {
  const raw = (process.env as Record<string, string | undefined>)[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

/** IP del client, oppure null quando non è affidabile (sviluppo locale, assenza di proxy). */
function clientKey(headers: Headers): string | null {
  // Dietro un proxy (Vercel, Netlify, nginx) l'IP reale arriva in questi header.
  // Se il server è esposto direttamente l'header può essere inventato: per
  // questo esiste anche il tetto globale. Non è un sistema di autenticazione.
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  // Nessun limite per-utente sul lavoro locale: in sviluppo si prova e si riprova.
  if (ip === "::1" || ip === "localhost" || ip.startsWith("127.") || ip.startsWith("::ffff:127."))
    return null;
  return ip;
}

function allowRequest(key: string | null, perClientLimit: number, globalLimit: number): boolean {
  // Limiti entrambi a 0: controllo disattivato dall'ambiente.
  if (perClientLimit <= 0 && globalLimit <= 0) return true;

  const now = Date.now();

  prune(globalHits, now);
  if (globalLimit > 0 && globalHits.length >= globalLimit) return false;

  if (key && perClientLimit > 0) {
    // Evita che la mappa cresca senza limite quando arrivano molti IP diversi.
    if (!perClient.has(key) && perClient.size >= MAX_TRACKED_CLIENTS) perClient.clear();

    const hits = perClient.get(key) ?? [];
    prune(hits, now);

    if (hits.length >= perClientLimit) {
      perClient.set(key, hits);
      return false;
    }

    hits.push(now);
    perClient.set(key, hits);
  }

  globalHits.push(now);
  return true;
}

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

/** Nome, messaggio e codice causa: quanto basta per capire un errore di rete. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: { code?: string } }).cause;
    return `${error.name}: ${error.message}${cause?.code ? ` (${cause.code})` : ""}`;
  }
  return String(error);
}

function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === "AbortError";
}

type ProviderResponse = { status: number; ok: boolean; raw: string };

async function callProvider(url: string, apiKey: string, body: string): Promise<ProviderResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: controller.signal,
    });
    return { status: res.status, ok: res.ok, raw: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

export const analyzeProfile = base.input(inputSchema).handler(async ({ input, context }) => {
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

  // Il limite entra in gioco solo quando la richiesta può davvero raggiungere
  // il provider: una configurazione mancante non consuma quota.
  const perClientLimit = readLimit("AI_ANALYSIS_RATE_LIMIT", DEFAULT_PER_CLIENT);
  const globalLimit = readLimit("AI_ANALYSIS_RATE_LIMIT_GLOBAL", DEFAULT_GLOBAL);

  if (!allowRequest(clientKey(context.headers), perClientLimit, globalLimit)) {
    const scope =
      perClientLimit > 0
        ? `max ${perClientLimit} al minuto per utente`
        : `max ${globalLimit} al minuto in totale`;

    return {
      ok: false as const,
      reason: "rate_limited" as const,
      message: `Troppe richieste di analisi in poco tempo (${scope}). ${LIMIT_HINT}`,
    };
  }

  const model = env("AI_PROFILE_MODEL") || "openai/gpt-4.1-mini";
  const url = baseUrl.includes("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: "Rispondi solo con JSON valido." },
      { role: "user", content: buildPrompt(input.summary) },
    ],
  });

  let response: ProviderResponse;
  try {
    response = await callProvider(url, apiKey, body);
  } catch (firstError) {
    // Un timeout non si ritenta: raddoppierebbe l'attesa senza cambiare esito.
    if (isAbort(firstError)) {
      console.error(`[analisi-ia] timeout dopo ${REQUEST_TIMEOUT_MS / 1000}s`);
      return {
        ok: false as const,
        reason: "timeout" as const,
        message: `La lettura IA ha impiegato troppo tempo (oltre ${REQUEST_TIMEOUT_MS / 1000} secondi). Riprova tra poco. ${LIMIT_HINT}`,
      };
    }

    console.error("[analisi-ia] errore di rete:", describeError(firstError));

    // Un secondo tentativo per una caduta di rete immediata (Wi‑Fi, DNS, proxy).
    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      response = await callProvider(url, apiKey, body);
    } catch (secondError) {
      console.error("[analisi-ia] errore di rete (secondo tentativo):", describeError(secondError));
      return {
        ok: false as const,
        reason: "network_error" as const,
        message:
          "Richiesta IA non riuscita per un problema di rete. Controlla la connessione e riprova: le risposte sono già salvate e puoi esportare il quaderno.",
      };
    }
  }

  if (!response.ok) {
    const message =
      response.status === 429
        ? "Il servizio IA ha raggiunto il limite di richieste o la quota disponibile (429). Attendi qualche minuto e riprova; se il problema persiste, verifica quota/limiti e configurazione del modello."
        : `Errore dal servizio IA (${response.status}). Verifica configurazione/modello o riprova.`;
    return {
      ok: false as const,
      reason: "provider_error" as const,
      message,
    };
  }

  type ChatResponse = {
    choices?: Array<{ message?: { content?: string } }>;
    output_text?: string;
  };
  let data: ChatResponse | null = null;
  try {
    data = JSON.parse(response.raw) as ChatResponse;
  } catch {
    data = null;
  }
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.output_text ??
    (typeof response.raw === "string" ? response.raw : "");
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
});
