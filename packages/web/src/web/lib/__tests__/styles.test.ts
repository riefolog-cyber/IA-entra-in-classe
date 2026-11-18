import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

/**
 * Il foglio di stile è stratificato per strati numerati: quando una vista
 * sparisce restano le sue regole, e centinaia di righe di CSS morto non le nota
 * nessuno finché non si prova a cambiarle. Questo test le rende un errore.
 *
 * Le classi si cercano solo dove possono stare davvero (`className`, `class`,
 * `classList`): un nome citato in un commento non tiene in vita una regola. Le
 * classi composte (`summary-status-${status}`) valgono per prefisso.
 */
const WEB = path.resolve(import.meta.dirname, "../../../..");

function files(dir: string, extensions: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") return [];
      return files(full, extensions);
    }
    return extensions.test(entry.name) ? [full] : [];
  });
}

/** Solo il codice: i commenti non contano come uso di una classe. */
function code(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

function classNameCorpus(): string {
  const sources = files(path.join(WEB, "src/web"), /\.(ts|tsx)$/).map(code);
  const html = [path.join(WEB, "index.html"), ...files(path.join(WEB, "public"), /\.html$/)].map(
    code,
  );
  return [...sources, ...html].join("\n");
}

describe("foglio di stile", () => {
  test("ogni classe nei CSS è usata da una vista o composta da un template", () => {
    const corpus = classNameCorpus();
    const used = new Set<string>();
    const prefixes = new Set<string>();

    for (const match of corpus.matchAll(
      /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\}|\{([^}]*)\})/g,
    )) {
      const chunk = match.slice(1).filter(Boolean).join(" ");
      for (const name of chunk.match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? []) used.add(name);
    }
    for (const match of corpus.matchAll(/classList\.(?:add|remove|toggle)\("([^"]+)"\)/g)) {
      for (const name of match[1].match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? []) used.add(name);
    }
    for (const match of corpus.matchAll(/class="([^"]*)"/g)) {
      for (const name of match[1].match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? []) used.add(name);
    }
    for (const match of corpus.matchAll(/([A-Za-z][A-Za-z0-9_-]*-)\$\{/g)) prefixes.add(match[1]);

    const dead: string[] = [];
    for (const file of files(path.join(WEB, "src/web/styles"), /\.css$/)) {
      // `url(...)` contiene nomi di file (.woff2), non classi.
      const css = code(file).replace(/url\([^)]*\)/g, "");
      for (const name of new Set(css.match(/\.([A-Za-z][A-Za-z0-9_-]*)/g) ?? [])) {
        const className = name.slice(1);
        if (!used.has(className) && ![...prefixes].some((prefix) => className.startsWith(prefix))) {
          dead.push(`.${className} (${path.relative(WEB, file)})`);
        }
      }
    }

    expect(dead).toEqual([]);
  });
});
