# Restare umani — IA a scuola

Percorso di aggiornamento professionale in italiano per docenti della secondaria di secondo grado: dieci tappe con riflessioni, quiz, scenari, glossario, riferimenti e un quaderno esportabile in PDF o JSON.

Il sito è un'applicazione Vite + React servita dal server Bun su Render (`https://ia-entra-in-classe.onrender.com/`). Le risposte restano nel browser: il sito calcola l'avanzamento e prepara un prompt da usare con un modello scelto dal docente (per esempio Gemini), allegando il PDF del quaderno. Nessun servizio IA è chiamato dal sito.

## Comandi

I nomi dei comandi sono il contratto con gli strumenti di pubblicazione: le implementazioni possono cambiare, i nomi no.

- `bun run dev` avvia il sito in sviluppo.
- `bun run dev:desktop` e `bun run dev:mobile` avviano i client di piattaforma (scaffolding, non necessari al sito).
- `bun run build` compila tutti i pacchetti.
- `bun run build:web` compila il sito in `packages/web/dist`.
- `bun run start` / `bun run stop` avviano o fermano il server Bun di produzione con pm2.
- `bun run start:server` avvia il server Bun in primo piano (comando usato da Render).
- `bun run lint` verifica formattazione (oxfmt) e regole di correttezza (oxlint).
- `bun run lint:fix` applica la formattazione.
- `bun run typecheck` esegue TypeScript su tutti i pacchetti.
- `bun test packages/web/src` esegue i test dei contenuti, dello stato e dell'API.
- `bun run test:e2e` esegue i test end-to-end con Playwright sul sito compilato (prima volta: `bunx playwright install chromium`). Coprono il download dell'attestazione PDF, la cancellazione tra due schede (anche delle letture conservate), l'avviso di aggiornamento, la registrazione del service worker e il prompt per Gemini (copia, download, ambito, persistenza).
- `bun run size` verifica tre budget separati: 800 kB per l'avvio (i file citati da `index.html`), 440 kB per il chunk vendor, 950 kB per i chunk caricati su richiesta (jsPDF, html2canvas, purify). Il peso delle risorse statiche è riportato ma fuori budget: è contenuto, non codice.
- `bun run og` rigenera l'immagine di condivisione 1200×630 (`packages/web/public/images/og-restare-umani.png`).
- `bun run db:generate`, `db:migrate`, `db:push` gestiscono il database (non usato dal percorso).

## Struttura

- `packages/web/src/web/pages/learning/` — shell, viste (`home`, `step`, `resources`, `summary`, `privacy`) e rotte con hash.
- `packages/web/src/web/hooks/` — quaderno locale (`useNotebook`), esportazione (`useExportPdf`), feedback.
- `packages/web/src/web/lib/` — contenuti delle tappe, stato e sua sanificazione, prompt per l'analisi esterna, PDF.
- `packages/web/src/http-server.ts` — server Bun di produzione: file statici, fallback SPA, `Cache-Control` e header di sicurezza (fuori dai file `__` protetti dal template).
- `packages/web/src/api/` — server Hono + oRPC: `/api/health` e la procedura `ping` (usata dal client mobile di scaffolding); nessun servizio esterno, nessuna chiave.
- `packages/web/src/csp.ts` — unica fonte delle direttive CSP, condivisa da server Bun, `<meta>` del mirror e sviluppo.
- `packages/web/src/web/boot-guard.ts` — schermata di emergenza se il bootstrap dell'app fallisce.
- `packages/web/e2e/` — test Playwright sul build, con `playwright.config.ts` che avvia l'anteprima.
- `packages/web/public/` — asset statici, immagini, font WOFF2, service worker.
- `packages/web/dist/` — build statica (non versionata): la produce `bun run build:web` e la pubblica il workflow di GitHub Pages, con `sitemap.xml`.

Le rotte sono con hash (`#/tappa/3`, `#/approfondimenti`, `#/riepilogo`, `#/privacy`): funzionano su GitHub Pages e su qualunque host statico senza rewrite.

`packages/mobile/` (Expo) e `packages/desktop/` (Electron) sono **scaffolding del template**, non fanno parte del sito: `turbo check` e `turbo typecheck` li compilano, quindi una modifica all'API deve restare compatibile con `packages/mobile/queries/ping.ts`. Se un giorno non servono, vanno tolti dal workspace insieme alle loro voci in `turbo.json`, non lasciati marcire: togliere una procedura dall'API ha già fatto fallire la CI proprio da lì.

## Dati e privacy

- Risposte, nome facoltativo, avanzamento e letture incollate solo in `localStorage` (con ripiego su `sessionStorage`/IndexedDB se bloccati).
- Nessun account, nessun analytics, nessuna profilazione.
- PDF, attestazione di partecipazione e JSON generati nel browser; cancellazione con conferma.
- Copie di sicurezza locali (fino a tre) create prima di un'importazione: stessa sede del quaderno, rimosse con lo stesso pulsante di cancellazione, che elimina anche le letture conservate.
- Nessun testo delle risposte viene inviato dal sito: non ci sono chiamate a servizi IA.
- Per un'interpretazione più ampia il sito offre un prompt da usare con un modello esterno scelto dal docente (Gemini o altro), allegando il PDF: quello è un invio a un terzo, dichiarato nella pagina e nell'avviso accanto al pulsante.
- La sintesi informativa è nella pagina `#/privacy`.

## Lettura del percorso con un modello esterno

Il sito non chiama alcun modello e non conserva chiavi. Nel riepilogo, il riquadro "Leggi il percorso con Gemini" (`lib/gemini-prompt.ts`) prepara un prompt che chiede un quadro completo — tutte e dieci le tappe, citazioni letterali, dimensioni, coerenza, passi concreti, confidenza — da incollare dopo aver allegato il PDF del quaderno. Si può scegliere l'ambito (tutto il quaderno o una sola tappa), copiare il prompt o scaricarlo in `.txt`; il riquadro dichiara prima quante tappe sono lavorate e quali restano vuote (`lib/notebook-coverage.ts`).

La risposta ricevuta dal modello può essere incollata in "Conserva la lettura ricevuta" (`lib/reading-store.ts`): resta in `localStorage` con data, modello e ambito, fino a cinque letture, e si può copiare, scaricare o eliminare. La scelta del modello e l'invio sono del docente, fuori dal sito; nessuna lettura viene inviata o verificata dal sito.

## Pubblicazione

- **Render (host principale)**: `render.yaml` descrive il servizio. Build `bun install && bun run build:web`, avvio `bun packages/web/src/server.ts`, health check `/api/health`. Nessuna chiave o variabile di modello è necessaria.
- **GitHub Pages**: sorgente impostata su "GitHub Actions" (non più `main`/`docs`). Il workflow `.github/workflows/deploy.yml` ha i job `check` (typecheck su tutti i pacchetti, lint, test) ed `e2e` (Playwright su Chromium): il deploy parte solo se entrambi passano, e pubblica l'artefatto `packages/web/dist`. È un mirror statico: il quaderno, il PDF e il prompt per Gemini funzionano allo stesso modo, perché non richiedono backend.
- **Server Bun + pm2**: `bun run start`, con l'API di base (`/api/health`).

## Sicurezza

Le direttive di policy vivono in `packages/web/src/csp.ts`: le stesse stringhe servono l'header del server Bun, il `<meta>` del mirror e l'header `Report-Only` dello sviluppo, così un'aggiunta fatta per il sito non può rompere in silenzio l'altro deploy. `http-server.ts` invia a ogni risposta `Content-Security-Policy`, `Referrer-Policy`, `HSTS`, `X-Frame-Options`, `Permissions-Policy` e `nosniff`. La policy dell'app ammette solo risorse della stessa origine, più il modulo Google del feedback, le miniature YouTube e i video incorporati. La pagina `confini-morali-dell-ai.html` è un artefatto autonomo con script inline e CDN esterni: ha una policy propria, più larga, limitata al suo percorso — è candidata alla sostituzione con una pagina statica autoconsistente. La build statica in `dist/` riceve la stessa policy come `<meta>` nell'HTML compilato, perché GitHub Pages non può inviare header.

## Verifiche

`bun run typecheck`, `bun run lint`, `bun test packages/web/src` (57 test), `bun run build:pages`, `bun run size`, `bun run test:e2e` (5 test in Chromium). Il workflow di Pages esegue gli stessi comandi, più build e deploy.
