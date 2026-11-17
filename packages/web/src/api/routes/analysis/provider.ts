/**
 * Chiamate al gateway del provider: un solo posto per timeout, retry di rete,
 * estrazione del JSON e gestione degli errori leggibili.
 *
 * Non importa nulla da `node:*`: il file è condiviso con il pacchetto mobile.
 */

/** Il gateway a volte impiega 50-60 s (latenza del provider, non del prompt). */
export const REQUEST_TIMEOUT_MS = 90_000;

export type ProviderFailure = {
  kind: "timeout" | "network" | "provider" | "invalid";
  status?: number;
  detail: string;
};

export type ProviderSuccess = { kind: "ok"; json: Record<string, unknown>; raw: string };
export type ProviderOutcome = ProviderSuccess | ProviderFailure;

type ChatPayload = {
  choices?: Array<{ message?: { content?: string } }>;
  output_text?: string;
};

/** Nome, messaggio e codice causa: quanto basta per capire un errore di rete. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: { code?: string } }).cause;
    return `${error.name}: ${error.message}${cause?.code ? ` (${cause.code})` : ""}`;
  }
  return String(error);
}

export function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === "AbortError";
}

/**
 * Estrae il primo oggetto JSON completo da un testo: il modello a volte
 * aggiunge una frase prima, un blocco ```json o una virgola finale.
 */
export function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const direct = tryParse(cleaned);
  if (direct) return direct;

  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  // Conta le parentesi per trovare la chiusura reale: `lastIndexOf("}")`
  // fallisce quando il modello aggiunge testo dopo l'oggetto.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return tryParse(cleaned.slice(start, i + 1));
    }
  }
  return null;
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function post(
  url: string,
  apiKey: string,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; ok: boolean; raw: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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

/** Una richiesta JSON al provider; in caso di risposta non valida, un tentativo di riparazione. */
export async function requestJson(options: {
  url: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
  /** `response_format: json_object`: disattivabile se il gateway non lo supporta. */
  jsonMode?: boolean;
  /**
   * Tentativi per una caduta di rete (1 o 2). Le letture di tappa usano 1:
   * se la rete è giù, ritentare dieci volte non aiuta e allunga l'attesa.
   */
  attempts?: 1 | 2;
}): Promise<ProviderOutcome> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const body = (jsonMode: boolean) =>
    JSON.stringify({
      model: options.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    });

  let jsonMode = options.jsonMode !== false;

  const attempt = async (payload: string) => {
    try {
      return await post(options.url, options.apiKey, payload, timeoutMs);
    } catch (firstError) {
      // Un timeout non si ritenta: raddoppierebbe l'attesa senza cambiare esito.
      if (isAbort(firstError)) {
        return { error: { kind: "timeout" as const, detail: describeError(firstError) } };
      }
      if (options.attempts === 1) {
        return { error: { kind: "network" as const, detail: describeError(firstError) } };
      }
      // Un secondo tentativo per una caduta di rete immediata (Wi-Fi, DNS, proxy).
      await new Promise((resolve) => setTimeout(resolve, 700));
      try {
        return await post(options.url, options.apiKey, payload, timeoutMs);
      } catch (secondError) {
        return { error: { kind: "network" as const, detail: describeError(secondError) } };
      }
    }
  };

  let result = await attempt(body(jsonMode));
  if ("error" in result) return result.error;

  // Alcuni gateway compatibili rifiutano `response_format`: si riprova senza,
  // invece di far fallire l'analisi per un dettaglio opzionale.
  if (!result.ok && jsonMode && result.status === 400 && /response_format/i.test(result.raw)) {
    jsonMode = false;
    result = await attempt(body(jsonMode));
    if ("error" in result) return result.error;
  }

  if (!result.ok) {
    return {
      kind: "provider",
      status: result.status,
      detail: `HTTP ${result.status}: ${result.raw.slice(0, 300)}`,
    };
  }

  let data: ChatPayload | null = null;
  try {
    data = JSON.parse(result.raw) as ChatPayload;
  } catch {
    data = null;
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.output_text ??
    (typeof result.raw === "string" ? result.raw : "");
  const json = extractJson(String(content));
  if (!json) {
    return { kind: "invalid", detail: `risposta non JSON: ${String(content).slice(0, 200)}` };
  }

  return { kind: "ok", json, raw: String(content) };
}
