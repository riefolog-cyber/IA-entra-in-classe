/**
 * Regole di origine condivise da tutte le route `/api`.
 *
 * Il CORS del template riflette qualunque `Origin`: senza un controllo esplicito
 * una pagina di terzi potrebbe usare gli endpoint (e la quota del provider) dal
 * browser dei suoi visitatori. Le richieste senza `Origin` (app, curl, test)
 * restano ammesse.
 */

/** Host dichiarati dalla richiesta: `x-forwarded-host` vale più di `host` dietro un proxy. */
export function requestHosts(headers: Headers): string[] {
  const values = [headers.get("x-forwarded-host"), headers.get("host")]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );

  return [...new Set(values)];
}

/** Origini fidate in più rispetto a quelle del sito (`AI_ALLOWED_ORIGINS`, separate da virgola). */
export function trustedOrigins(): string[] {
  return ((process.env as Record<string, string | undefined>).AI_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const FORBIDDEN_ORIGIN_MESSAGE =
  "Richiesta non consentita da questa origine. Apri questa funzione dalla pagina del percorso.";

/** True quando l'`Origin` dichiarata non corrisponde a nessuno degli host della richiesta. */
export function isForeignOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  if (trustedOrigins().includes(origin)) return false;

  const hosts = requestHosts(headers);
  if (!hosts.length) return false;

  try {
    const originHost = new URL(origin).host;
    return !hosts.includes(originHost);
  } catch {
    return true;
  }
}
