/**
 * Metadati editoriali del percorso: una sola fonte per data di revisione,
 * licenza e segnalazioni, usata da interfaccia, privacy e PDF.
 */
export const siteMeta = {
  url: "https://ia-entra-in-classe.onrender.com/",
  reviewedAt: "novembre 2026",
  /** Stessa data in forma ISO: è quella che finisce nei dati strutturati. */
  reviewedAtIso: "2026-11",
  license: "CC BY-NC-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it",
  author: "Prof. Riefolo Giovanni",
  role: "Docente di IRC al Ferraris Fermi di Verona",
} as const;
