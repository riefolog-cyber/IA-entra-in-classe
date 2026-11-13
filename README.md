# Restare umani — IA a scuola

Percorso di aggiornamento professionale in italiano per docenti della secondaria di secondo grado: dieci tappe con riflessioni, quiz, scenari, glossario, riferimenti e un quaderno esportabile in PDF o JSON.

Il sito è un'applicazione Vite + React servita dal server Bun su Render (`https://ia-entra-in-classe.onrender.com/`), con API e analisi IA attive. Le risposte restano nel browser; l'analisi del percorso usa il servizio IA configurato, con consenso esplicito, e ha una lettura locale di riserva se il backend non risponde.

## Comandi

I nomi dei comandi sono il contratto con gli strumenti di pubblicazione: le implementazioni possono cambiare, i nomi no.

- `bun run dev` avvia il sito in sviluppo.
- `bun run dev:desktop` e `bun run dev:mobile` avviano i client di piattaforma (scaffolding, non necessari al sito).
- `bun run build` compila tutti i pacchetti.
- `bun run build:web` compila il sito e rigenera `docs/` (output statico versionato per la pubblicazione).
- `bun run start` / `bun run stop` avviano o fermano il server Bun di produzione con pm2.
- `bun run start:server` avvia il server Bun in primo piano (comando usato da Render).
- `bun run lint` verifica formattazione (oxfmt) e regole di correttezza (oxlint).
- `bun run lint:fix` applica la formattazione.
- `bun run typecheck` esegue TypeScript su tutti i pacchetti.
- `bun test packages/web/src` esegue i test dei contenuti, dello stato e dell'API.
- `bun run db:generate`, `db:migrate`, `db:push` gestiscono il database (non usato dal percorso).

## Struttura

- `packages/web/src/web/pages/learning/` — shell, viste (`home`, `step`, `resources`, `summary`, `privacy`) e rotte con hash.
- `packages/web/src/web/hooks/` — quaderno locale (`useNotebook`), esportazione (`useExportPdf`), analisi IA (`useAiAnalysis`), feedback.
- `packages/web/src/web/lib/` — contenuti delle tappe, stato e sua sanificazione, sintesi inviata all'IA, profilo locale, PDF.
- `packages/web/src/api/` — API Hono + oRPC: `/api/health` e `analyzeProfile`.
- `packages/web/public/` — asset statici, immagini, font WOFF2, service worker.
- `docs/` — build statica committata, rigenerata da `build:web`.

Le rotte sono con hash (`#/tappa/3`, `#/approfondimenti`, `#/riepilogo`, `#/privacy`): funzionano su GitHub Pages e su qualunque host statico senza rewrite.

## Dati e privacy

- Risposte, nome facoltativo e avanzamento solo in `localStorage` (con ripiego su `sessionStorage`/IndexedDB se bloccati).
- Nessun account, nessun analytics, nessuna profilazione.
- PDF e JSON generati nel browser; cancellazione con conferma.
- L'analisi IA è opzionale, richiede consenso e invia una sintesi senza il nome. Se il backend non risponde, la vista mostra un'analisi locale deterministica.
- La sintesi informativa è nella pagina `#/privacy`.

## Analisi IA (attiva su Render)

Variabili nel `.env` alla radice:

```
AI_GATEWAY_BASE_URL=
AI_GATEWAY_API_KEY=
AI_PROFILE_MODEL=openai/gpt-4.1-mini
AI_ANALYSIS_RATE_LIMIT=20
AI_ANALYSIS_RATE_LIMIT_GLOBAL=120
```

Senza queste variabili l'endpoint risponde `missing_config` e il sito resta utilizzabile, ma senza analisi IA. Su Render vanno inserite nel pannello Environment del servizio: `render.yaml` le dichiara come `sync: false` proprio per non versionare la chiave. I limiti sono in memoria di processo: proteggono da raffiche, non sostituiscono un limite condiviso o la quota del provider. L'endpoint è pubblico per scelta (nessun account): se lo esponi su un host con traffico reale, metti davanti un limite condiviso o una verifica anti-bot.

## Pubblicazione

- **Render (host principale, con IA)**: `render.yaml` descrive il servizio. Build `bun install && bun run build:web`, avvio `bun packages/web/src/__server.ts`, health check `/api/health`. Le variabili `AI_GATEWAY_BASE_URL` e `AI_GATEWAY_API_KEY` vanno impostate in Render → Environment (non nel repository). Con queste variabili l'analisi IA resta attiva; senza, l'endpoint risponde `missing_config` e il riquadro IA mostra l'errore al momento della richiesta.
- **GitHub Pages**: workflow `.github/workflows/deploy.yml` con job `check` che blocca il deploy se typecheck, lint o test falliscono. È un mirror statico: l'analisi IA non è disponibile lì e la vista ripiega sulla lettura locale con pulsante di riprova.
- **Vercel / Netlify**: configurazioni statiche, senza API né analisi IA.
- **Server Bun + pm2**: `bun run start`, con API e analisi IA.

## Verifiche

`bun run typecheck`, `bun run lint`, `bun test packages/web/src`, `bun run build:web`. Non esiste ancora una suite end-to-end nel browser.
