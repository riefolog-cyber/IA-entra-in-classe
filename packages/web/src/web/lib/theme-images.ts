const PHASE_FILES: Record<string, string> = {
  Progettazione: "progettazione",
  Pratica: "pratica",
  "Progettazione inclusiva": "inclusione",
  Revisione: "revisione",
};

/** Immagine di fase, relativa alla base del sito (funziona anche su sottopercorso). */
export function phaseImage(phase?: string): string {
  return `./images/theme/fase-${PHASE_FILES[phase ?? ""] ?? "progettazione"}.svg`;
}
