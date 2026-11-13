export type View = "home" | "step" | "resources" | "summary" | "privacy";

export type Go = (view: View, step?: number) => void;

/**
 * Rotte con hash: funzionano identiche su GitHub Pages, Vercel, Netlify e
 * nell'anteprima statica, senza dipendere da rewrite lato server.
 */
export const HASH_PATHS = {
  home: "/",
  resources: "/approfondimenti",
  summary: "/riepilogo",
  privacy: "/privacy",
} as const;

export function pathFor(view: View, step?: number): string {
  if (view === "step") return `/tappa/${(step ?? 0) + 1}`;
  return HASH_PATHS[view];
}

/** Interpreta la posizione corrente: tappa valida oppure vista. */
export function parseLocation(
  location: string,
  stepCount: number,
): {
  view: View;
  step: number | null;
} {
  const stepMatch = /^\/tappa\/(\d+)\/?$/.exec(location);
  if (stepMatch) {
    const raw = Number(stepMatch[1]) - 1;
    return { view: "step", step: Math.min(Math.max(raw, 0), stepCount - 1) };
  }
  if (location === HASH_PATHS.resources) return { view: "resources", step: null };
  if (location === HASH_PATHS.summary) return { view: "summary", step: null };
  if (location === HASH_PATHS.privacy) return { view: "privacy", step: null };
  return { view: "home", step: null };
}
