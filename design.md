# Restare umani — Design

## Direzione approvata

Percorso di aggiornamento professionale in italiano per **docenti della scuola secondaria di secondo grado**. Dieci tappe di riflessione e progettazione sull’uso dell’IA a scuola. Editoriale caldo, contemplativo, senza gamificazione della persona.

Palette: carta `#f7f6f0`, inchiostro `#203b32`, verde `#284c3e`, salvia `#e4e9dd`, terracotta `#c07d5b`. Georgia per titoli, Poppins per corpo e controlli.

**Tema:** il sito è pubblicato in tema scuro (classi `dark` su `html`/`body` nell’`index.html`). Non c’è più un effetto che impone il tema a ogni avvio: la scelta è dichiarata nel markup, così non viene scritta silenziosamente nel browser. La palette chiara resta nei token di base; un eventuale tema chiaro richiederebbe un interruttore e una revisione del contrasto.

Sidebar desktop, navigazione compatta mobile, hero asimmetrico con specchio geometrico CSS. Spazi 8/16/24/32/48/64 px, bordi sottili, ombre minime, icone Lucide.

## Sezioni e rotte

Le viste hanno un URL con hash, funzionante su qualunque host statico:

- **Panoramica** (`#/`): hero, avanzamento, mappa delle dieci tappe per fase.
- **Tappa** (`#/tappa/1…10`): intro, chiave di lettura, caso disciplinare, riflessione, quiz con spiegazione, scenario con tre prospettive e motivazione.
- **Approfondimenti** (`#/approfondimenti`): due prospettive, due risorse esterne, glossario ricercabile, riferimenti bibliografici.
- **Riepilogo** (`#/riepilogo`): metriche, esportazione PDF/JSON, importazione, nome, sintesi per tappa, analisi del percorso, feedback anonimo.
- **Privacy** (`#/privacy`): informativa breve su dati locali, analisi, servizi esterni.

Le tappe coprono: progettazione, verifica dei materiali, valutazione, processo visibile, regole d’uso, comunicazione, inclusione e dati, accessibilità/UDL, sperimentazione, scelte istituzionali. Restano quiz concettuali e scenari di discussione.

## Lingua e pubblico

- Registro adulto, non moralistico; nessun punto esclamativo e nessuna gamificazione.
- Terminologia coerente con la secondaria di secondo grado: «studenti», non «alunni».
- Lessico specialistico (UDL, accountability, automation bias) spiegato nel glossario e, quando serve, nel testo.
- Ogni tappa include un caso disciplinare per parlare anche a docenti di area scientifica, linguistica e umanistica.
- Nessuna interpretazione psicologica dei silenzi o dei campi vuoti.

## Dati e privacy

- Risposte, nome e avanzamento solo nello storage locale del browser; nessun account.
- Scrittura con debounce (400 ms) e salvataggio immediato alla chiusura della scheda; sincronizzazione tra schede via evento `storage`.
- Esportazione PDF/JSON lato client; cancellazione con conferma.
- L’analisi IA è **opzionale**, richiede consenso esplicito e invia una sintesi senza il nome. Il servizio esterno può trattenerla secondo le proprie condizioni: il sito non la conserva.
- Se il backend non è raggiungibile, la funzione esterna resta dichiarata e riprovabile: la vista mostra un avviso con «Riprova a contattare il servizio IA» e, nel frattempo, un’analisi locale deterministica calcolata nel browser. Il timeout del controllo di salute è ampio (10 s) per non declassare l’analisi durante un avvio a freddo di Render.
- Feedback anonimo inviato a un Google Form; nessun dato personale raccolto dal sito.
- Vecchie risposte (`restare-umani-v1`) esportabili senza associarle ai nuovi quesiti.

## Accessibilità

- Focus visibile, contrasto, etichette, `aria-live` sui feedback, movimento ridotto, layout responsive, skip link.
- Le card delle tappe sono un link reale con un pulsante separato per segnare la conclusione: nessun controllo interattivo annidato.
- Quiz e scenari usano radio native dentro un `fieldset`: semantica di gruppo, navigazione con frecce, stato letto correttamente.
- La conferma di cancellazione è un `<dialog>` aperto con `showModal()`: focus trap, `Escape` e sfondo inerte gestiti dal browser.

## Implementazione

- `packages/web/src/web/pages/learning/index.tsx`: shell (sidebar, topbar, footer, toast, dialogo) e instradamento.
- `packages/web/src/web/pages/learning/{home,step,resources,summary,privacy}-view.tsx`: viste.
- `packages/web/src/web/pages/learning/navigation.ts`: tipi di vista, percorsi con hash, parsing della posizione.
- `packages/web/src/web/hooks/use-notebook.ts`: stato del quaderno, debounce, sincronizzazione tra schede, cancellazione.
- `packages/web/src/web/hooks/use-export-pdf.ts`, `use-ai-analysis.ts`, `use-feedback.ts`: esportazione, analisi, feedback.
- `packages/web/src/web/lib/notebook-state.ts`: chiavi di storage, parsing e sanificazione dello stato, fasi, campi totali.
- `packages/web/src/web/lib/teacher-content.ts`: contenuti delle dieci tappe, glossario e riferimenti.
- `packages/web/src/web/lib/teacher-profile.ts`: profilo locale deterministico (analisi offline).
- `packages/web/src/web/lib/ai-summary.ts`: sintesi inviata al servizio IA (senza nome).
- `packages/web/src/web/lib/export-pdf.ts`: PDF multipagina client-side.
- `packages/web/src/web/lib/safe-storage.ts`: catena localStorage → sessionStorage → IndexedDB → memoria.
- `packages/web/src/web/components/error-boundary.tsx`: rete di sicurezza dell’interfaccia.
- `packages/web/src/web/learning.css` e `styles.css`: stile editoriale e token.
- Backend: `packages/web/src/api/routes/profile-analysis.ts` (oRPC), opzionale, con tetto di token e guardia sul testo troppo breve.
- Deploy: server Bun su Render (servizio web con API e analisi IA, health check su `/api/health`) oppure GitHub Pages come mirror statico senza IA.

## Asset e prestazioni

- Poppins servito in WOFF2 (tre pesi, circa 8 KB ciascuno) invece dei TTF originali da 150 KB.
- Immagini SVG con dimensioni intrinseche dichiarate, per evitare salti di layout.
- Service worker con nome cache derivato dall’hash della build: un deploy non lascia in cache l’indice precedente.
- Tema chiaro "carta" opzionale, con interruttore nel topbar e preferenza salvata nel browser; il tema scuro resta il default e la scelta è applicata prima del primo paint.
- Metadati e sitemap puntano al dominio Render (`https://ia-entra-in-classe.onrender.com/`), che è l’host canonico.
- `jspdf` e `html2canvas` restano in chunk dinamici: non vengono scaricati all’avvio.
