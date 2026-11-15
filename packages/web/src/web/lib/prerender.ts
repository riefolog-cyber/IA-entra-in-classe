import { siteMeta } from "./site-meta";
import { references, stepSources, steps } from "./teacher-content";

/**
 * Pagine statiche di ogni tappa.
 *
 * L'app è instradata con hash (`#/tappa/3`), quindi una tappa non ha un URL
 * proprio da indicizzare o condividere. Queste pagine nascono in build dalla
 * stessa fonte dei contenuti: testo completo della tappa, nessuno script, un
 * rimando all'app per le attività. Sono autonome (stili inline) e funzionano
 * identiche sul server Bun e sul mirror GitHub Pages.
 *
 * Le soluzioni di quiz e scenari non vengono pubblicate: restano nel percorso.
 */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Paragrafi: il testo dei contenuti usa righe vuote come separatore. */
function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part).replace(/\n/g, "<br />")}</p>`)
    .join("\n        ");
}

/** Immagine di condivisione, generata da `vite/generate-og.mjs`. */
const OG_IMAGE = new URL("images/og-restare-umani.png", siteMeta.url).href;

const STYLE = `
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #16211d;
        color: #e8f0ea;
        font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.7;
      }
      main { max-width: 44rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
      .eyebrow { font-size: 0.7rem; letter-spacing: 0.14em; color: #9ec493; text-transform: uppercase; }
      h1 { font-family: ui-serif, Georgia, "Times New Roman", serif; font-size: clamp(2rem, 5vw, 2.75rem); line-height: 1.15; margin: 0.6rem 0 0.8rem; color: #f4f8f5; }
      h2 { font-family: ui-serif, Georgia, serif; font-size: 1.35rem; margin: 2.2rem 0 0.6rem; color: #f4f8f5; }
      .lead { font-size: 1.05rem; color: #c9dccd; margin: 0 0 1.5rem; }
      p, li { color: #d8e6dc; }
      ol, ul { padding-left: 1.2rem; }
      li { margin: 0.35rem 0; }
      .note { font-size: 0.85rem; color: #9fb6a5; }
      .cta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 2.5rem 0 0; }
      .cta a {
        display: inline-block;
        padding: 0.6rem 1rem;
        border-radius: 999px;
        border: 1px solid #3a5749;
        color: #f4f8f5;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .cta a.primary { background: #2f6b52; border-color: #2f6b52; }
      footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #2b3d35; font-size: 0.8rem; color: #9fb6a5; }
      a { color: #b9dcae; }
`;

function page({
  title,
  description,
  body,
  url,
}: {
  title: string;
  description: string;
  body: string;
  url: string;
}) {
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:site_name" content="Restare umani" />
    <meta property="og:locale" content="it_IT" />
    <meta property="og:image" content="${esc(OG_IMAGE)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Restare umani · IA a scuola, dieci tappe per docenti" />
    <meta name="twitter:card" content="summary_large_image" />
    <style>${STYLE}    </style>
  </head>
  <body>
    <main>
      ${body}
      <footer>
        ${esc(siteMeta.author)} · ${esc(siteMeta.role)} · contenuti aggiornati a ${esc(siteMeta.reviewedAt)} · ${esc(siteMeta.license)}
      </footer>
    </main>
  </body>
</html>
`;
}

/** Una tappa in una pagina: stessa fonte dei contenuti, nessun dato del quaderno. */
export function renderStepPage(step: (typeof steps)[number], index: number): string {
  const number = index + 1;
  const sources = (stepSources[index] ?? [])
    .map((sourceIndex) => references[sourceIndex])
    .filter(Boolean);

  const body = `<span class="eyebrow">${esc(step.phase || "Percorso")} · Tappa ${number} di ${steps.length}</span>
      <h1>${esc(step.title)}</h1>
      <p class="lead">${esc(step.subtitle)}</p>
      ${paragraphs(step.intro)}
      <h2>Una chiave di lettura</h2>
      ${paragraphs(step.concept)}
      <h2>In sintesi</h2>
      ${paragraphs(step.takeaway)}
      <h2>Domande per il quaderno</h2>
      <ol>
        ${step.prompts.map((prompt) => `<li>${esc(prompt)}</li>`).join("\n        ")}
      </ol>
      <h2>Verifica la comprensione</h2>
      <p>${esc(step.question)}</p>
      <ol>
        ${step.options.map((option) => `<li>${esc(option)}</li>`).join("\n        ")}
      </ol>
      <p class="note">La soluzione e la spiegazione sono nel percorso interattivo.</p>
      <h2>Scenario</h2>
      ${paragraphs(step.scenario)}
      <ol>
        ${step.choices.map((choice) => `<li>${esc(choice)}</li>`).join("\n        ")}
      </ol>
      <p class="note">Le prospettive e la scelta personale si svolgono nel percorso.</p>
      ${
        sources.length
          ? `<h2>Riferimenti per questa tappa</h2>
      <ul>
        ${sources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noreferrer">${esc(source.title)}</a></li>`).join("\n        ")}
      </ul>`
          : ""
      }
      <div class="cta">
        <a class="primary" href="../#/tappa/${number}">Apri la tappa nel percorso</a>
        <a href="../">Torna all’inizio</a>
        <a href="./">Tutte le tappe</a>
      </div>`;

  return page({
    title: `${number}. ${step.title} — Restare umani`,
    description: step.subtitle,
    body,
    url: `${siteMeta.url}tappe/tappa-${number}.html`,
  });
}

/** Indice delle pagine statiche: il punto d'ingresso per chi arriva dai motori di ricerca. */
export function renderStepsIndex(): string {
  const body = `<span class="eyebrow">Restare umani · IA a scuola</span>
      <h1>Le dieci tappe, una per pagina</h1>
      <p class="lead">Versione statica del percorso: ogni pagina contiene il testo di una tappa, da leggere o condividere.</p>
      <ol>
        ${steps
          .map(
            (step, index) =>
              `<li><a href="./tappa-${index + 1}.html">${esc(step.title)}</a> — ${esc(step.short)}</li>`,
          )
          .join("\n        ")}
      </ol>
      <div class="cta">
        <a class="primary" href="../">Apri il percorso interattivo</a>
      </div>`;

  return page({
    title: "Le tappe — Restare umani",
    description:
      "Le dieci tappe del percorso di aggiornamento sull'IA a scuola, in pagine statiche.",
    body,
    url: `${siteMeta.url}tappe/`,
  });
}
