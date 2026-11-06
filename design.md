# Restare umani — Design

## Direzione approvata
Percorso di aggiornamento professionale in italiano per docenti di ogni ordine scolastico: sei tappe di riflessione e progettazione sull’uso dell’IA a scuola. Editoriale caldo, contemplativo, senza gamificazione della persona.
Palette: carta #f7f6f0, inchiostro #203b32, verde #284c3e, salvia #e4e9dd, terracotta #c07d5b. Georgia per titoli, Poppins per corpo e controlli.
Sidebar desktop, navigazione compatta mobile, hero asimmetrico con specchio geometrico CSS. Spazi 8/16/24/32/48/64px, bordi sottili, ombre minime, icone Lucide.
Sezioni: panoramica, sei tappe, approfondimenti e glossario, riepilogo. Non ripristinare sezioni fonti o guida docente, eliminate su richiesta.
Le tappe producono: obiettivo didattico e prompt, checklist di verifica, piano di valutazione, garanzie su dati/inclusione, consegna trasparente, scheda di sperimentazione. Restano quiz concettuali e scenari di discussione.
Risposte solo in localStorage, errori gestiti, cancellazione con conferma; PDF multipagina client-side con attività, risposte e glossario. Nuova versione con chiave separata; vecchie risposte esportabili senza associarle ai nuovi quesiti. Nessun account né API per dati personali. Analytics della piattaforma preservati.
Focus visibile, contrasto, etichette, movimento ridotto e layout responsive.
Implementazione: packages/web/src/web/pages/learning.tsx, lib/content.ts, lib/export-pdf.ts, styles.css. index.tsx è solo composizione. Backend invariato.

> Starter design brief. Replace this content with the app you're building before writing any UI.
> Keep it short and concrete — it's the single source of truth for palette, typography, pages,
> screens, and flows across web, mobile, and desktop.

One-line description of the app, the platforms it ships on, the visual direction (style, feel), and the core job it does for the user.

## Brand & Colors

One token set, consumed per platform:

- **Web & desktop**: CSS variables in `packages/web/src/web/styles.css` (desktop loads the web UI).
- **Mobile**: `Colors.light` / `Colors.dark` in `packages/mobile/constants/theme.ts`, read via `useColors()`; `userInterfaceStyle: "automatic"` follows the system light/dark setting.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| primary | #1F1F1F | #E5E5E5 | Buttons, active tab, accents |
| background | #FFFFFF | #0A0A0A | Page/screen background |
| card | #FFFFFF | #1A1A1A | Cards, surfaces |
| foreground | #171717 | #FAFAFA | Primary text |
| mutedForeground | #737373 | #A3A3A3 | Secondary text |
| border | #E5E5E5 | #262626 | Hairlines |
| destructive | #DC2626 | #EF4444 | Delete / errors |

## Typography

Name the display + body pairing here. Web: set font families in `styles.css` (self-hosted files go in `packages/web/public/fonts/`). Mobile: system font by default; load custom fonts with `useFonts` from `expo-font` and reference them via `Fonts` in `constants/theme.ts`.

## Pages & Screens

List each page/screen, its route file, and what it shows. Example:

- **Web — Home** (`packages/web/src/web/pages/index.tsx`) — what the user sees first.
- **Mobile — Home** (`packages/mobile/app/(tabs)/index.tsx`) — main tab.
- Add web pages under `src/web/pages/` (+ route in `app.tsx`); mobile tabs under `app/(tabs)/`, stack/modal screens under `app/`.

## Key User Flows

1. Describe the primary flow end to end (open → action → result).
2. ...

## Architecture

- **API**: typed oRPC client (`lib/api.ts` in each package) → the backend in `@template/web`. Query/mutation hooks live in `queries/` (one file per feature); pages/screens call them with `@tanstack/react-query`.
- **State/sync**: TanStack Query with optimistic updates for instant-feel interactions.
- **Auth / payments / uploads**: see `skills/app/references/` when those features are needed.
