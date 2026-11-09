# Restare umani — Design

## Direzione approvata

Percorso di aggiornamento professionale in italiano per **docenti della scuola secondaria di secondo grado**. Dieci tappe di riflessione e progettazione sull’uso dell’IA a scuola. Editoriale caldo, contemplativo, senza gamificazione della persona.

Palette: carta `#f7f6f0`, inchiostro `#203b32`, verde `#284c3e`, salvia `#e4e9dd`, terracotta `#c07d5b`. Georgia per titoli, Poppins per corpo e controlli.

Sidebar desktop, navigazione compatta mobile, hero asimmetrico con specchio geometrico CSS. Spazi 8/16/24/32/48/64 px, bordi sottili, ombre minime, icone Lucide.

## Sezioni

- **Panoramica** (`home`): hero, avanzamento, mappa delle dieci tappe per fase.
- **Tappa** (`step`): intro, chiave di lettura, caso disciplinare, riflessione, quiz con spiegazione, scenario con tre prospettive e motivazione.
- **Approfondimenti** (`resources`): due prospettive, glossario ricercabile, riferimenti bibliografici.
- **Riepilogo** (`summary`): metriche, esportazione PDF/JSON, nome, sintesi per tappa, analisi IA opzionale con consenso, feedback anonimo.

Le tappe coprono: progettazione, verifica dei materiali, valutazione, processo visibile, regole d’uso, comunicazione, inclusione e dati, accessibilità/UDL, sperimentazione, scelte istituzionali. Restano quiz concettuali e scenari di discussione.

## Lingua e pubblico

- Registro adulto, non moralistico; nessun punto esclamativo e nessuna gamificazione.
- Terminologia coerente con la secondaria di secondo grado: «studenti», non «alunni».
- Lessico specialistico (UDL, accountability, automation bias) spiegato nel glossario e, quando serve, nel testo.
- Ogni tappa include un caso disciplinare per parlare anche a docenti di area scientifica, linguistica e umanistica.
- Nessuna interpretazione psicologica dei silenzi o dei campi vuoti.

## Dati e privacy

- Risposte, nome e avanzamento solo in `localStorage`; nessun account.
- Esportazione PDF/JSON lato client; cancellazione con conferma.
- L’analisi IA è **opzionale**, richiede consenso esplicito e invia una sintesi senza il nome. Il servizio esterno può trattenerla secondo le proprie condizioni: il sito non la conserva.
- Se il backend non è raggiungibile (es. pubblicazione statica), la funzione viene nascosta e il resto del percorso resta utilizzabile.
- Feedback anonimo inviato a un Google Form; nessun dato personale raccolto dal sito.
- Vecchie risposte (`restare-umani-v1`) esportabili senza associarle ai nuovi quesiti.

## Accessibilità

Focus visibile, contrasto, etichette, `aria-live` sui feedback, movimento ridotto, layout responsive, skip link, dialog con gestione del focus e `Escape`.

## Implementazione

- `packages/web/src/web/pages/learning.tsx`: composizione delle viste e stato del percorso.
- `packages/web/src/web/lib/teacher-content.ts`: contenuti delle dieci tappe, glossario e riferimenti.
- `packages/web/src/web/lib/export-pdf.ts`: PDF multipagina client-side.
- `packages/web/src/web/lib/teacher-profile.ts`: profilo locale di riserva (non ancora esposto nell’interfaccia).
- `packages/web/src/web/components/error-boundary.tsx`: rete di sicurezza dell’interfaccia.
- `packages/web/src/web/learning.css` e `styles.css`: stile editoriale e token.
- Backend: `packages/web/src/api/routes/profile-analysis.ts` (oRPC), opzionale.
- Deploy: GitHub Pages statico (workflow Actions) oppure server Bun/pm2 con API.
