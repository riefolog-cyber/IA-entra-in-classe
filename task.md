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

## Iterazione «piano di miglioramento» (novembre 2026)

- Refactor di `learning.tsx` (2.241 righe) in shell + cinque viste + hook dedicati; nessun file oltre ~580 righe.
- Rotte con hash (`#/tappa/n`, `#/approfondimenti`, `#/riepilogo`, `#/privacy`): deep link, tasto Indietro, stato condivisibile.
- Persistenza con debounce (400 ms), flush su chiusura scheda, sincronizzazione tra schede, indicatore di salvataggio.
- Stato estratto in `lib/notebook-state.ts` e coperto da test (chiavi fuori range, valori corrotti, round-trip).
- Analisi locale (`teacher-profile.ts`) esposta quando il backend non c'è: sostituisce il «servizio non disponibile».
- Accessibilità: card con link + pulsante separato, radio native per quiz e scenari, `<dialog>` nativo con `showModal()`.
- Endpoint IA: tetto di 900 token, guardia sul testo troppo breve, test aggiornati.
- Disponibilità API verificata dal contenuto JSON, non dal solo status: il fallback SPA non fa più credere che esista un backend.
- Host canonico Render (`ia-entra-in-classe.onrender.com`): blueprint `render.yaml`, avvio `bun packages/web/src/__server.ts`, health check `/api/health`, metadati/canonical/sitemap allineati.
- Analisi IA mantenuta anche in caso di controllo di salute fallito: timeout 10 s e pulsante di riprova, con analisi locale solo come lettura di riserva.
- Contrasto dei pulsanti outline corretto sul tema scuro.
- Asset: Poppins in WOFF2 (452 KB → 23 KB), dimensioni intrinseche delle immagini, service worker versionato dalla build.
- Igiene: `.gitattributes` con LF, `.oxfmtrc.json`, oxlint nel comando `lint`, job `check` in CI che blocca il deploy.
- Rimossi duplicati e residui: copia root della pagina «confini», script Playwright `.py` non mantenuti, `.url`, dipendenze non usate.
- Documentazione riscritta: README di progetto, `design.md` aggiornato, informativa in `#/privacy`.
