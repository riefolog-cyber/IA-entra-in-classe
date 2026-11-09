# Restare umani — stato del lavoro

- Percorso per docenti della secondaria di secondo grado: dieci tappe, quiz, scenari, glossario, riferimenti e PDF.
- Contenuti rivisti: registro coerente con la scuola superiore («studenti», non «alunni»), refusi e accenti corretti, micro-quiz duplicati rimossi.
- Ogni tappa include un caso disciplinare; i distrattori dei quiz sono stati resi plausibili.
- Aggiunta sezione «Riferimenti» con MIM (DM 166/2025), DigCompEdu, _Magnifica Humanitas_ e _La Civiltà Cattolica_.
- Analisi IA resa esplicita e consensuale: sintesi senza nome, avviso sul trattamento esterno, funzione nascosta se il backend non risponde (deploy statico).
- Prompt dell’analisi IA rivisto: nessuna lettura dei «silenzi» o delle «paure», focus professionale.
- Privacy: risposte solo in `localStorage`; nessun account; PDF/JSON client-side; cancellazione con conferma.
- Corretta la tipizzazione delle variabili d’ambiente (`process.env`) per il typecheck del pacchetto mobile.
- Aggiunti `.prettierignore`, error boundary web e test dei contenuti (`bun test`).
- Formattazione allineata con `oxfmt` (`bun run lint`), build web riuscita, `bun run typecheck` riuscito.
- Documentazione aggiornata in `design.md`; `docs/` rigenerata dal build per GitHub Pages.
