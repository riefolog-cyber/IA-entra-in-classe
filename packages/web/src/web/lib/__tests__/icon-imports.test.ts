import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

/**
 * Le icone arrivano da `lucide-react`: importarle una per una permette al
 * bundler di tenere solo quelle usate. Un import namespace o un default import
 * porta dentro il pacchetto intero (centinaia di kB) senza che nessun test sul
 * comportamento se ne accorga: qui si controlla la forma degli import.
 */
const SRC = path.resolve(import.meta.dirname, "../../..");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" || entry.name === "node_modules" ? [] : sources(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("import delle icone", () => {
  test("lucide-react è importato solo per nome, mai come namespace o default", () => {
    const offenders = sources(SRC)
      .map((file) => ({ file, source: fs.readFileSync(file, "utf8") }))
      .filter(({ source }) => /from "lucide-react"/.test(source))
      .filter(({ source }) =>
        // `import * as X` oppure `import X from` (senza graffe) portano tutto.
        /import\s+(?:\*\s+as\s+\w+|\w+)\s*(?:,\s*\{[^}]*\})?\s*from\s+"lucide-react"/.test(source),
      )
      .map(({ file }) => path.relative(SRC, file));

    expect(offenders).toEqual([]);
  });

  test("ogni icona importata viene usata davvero", () => {
    const unused: string[] = [];

    for (const file of sources(SRC)) {
      const source = fs.readFileSync(file, "utf8");
      const match = /import\s*\{([^}]+)\}\s*from\s*"lucide-react"/.exec(source);
      if (!match) continue;

      const body = source.slice(match.index + match[0].length);
      for (const raw of match[1].split(",")) {
        const name = raw.trim().split(/\s+as\s+/)[0];
        if (!name) continue;
        // Un'icona può comparire solo dentro JSX: basta la presenza del nome.
        if (!new RegExp(`\\b${name}\\b`).test(body))
          unused.push(`${name} in ${path.relative(SRC, file)}`);
      }
    }

    expect(unused).toEqual([]);
  });
});
