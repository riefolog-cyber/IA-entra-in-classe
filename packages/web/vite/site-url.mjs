/**
 * Un solo sorgente per l'indirizzo pubblico: `siteMeta.url` è il default, ma la
 * build può dichiararne un altro (GitHub Pages) con `SITE_URL`. Senza questo,
 * la copia su Pages dichiarerebbe canonical e immagine social del sito Render:
 * due host che si contendono lo stesso contenuto.
 */
import fs from "node:fs";
import path from "node:path";

const TEXT_EXTENSIONS = new Set([".html", ".xml", ".txt", ".js", ".css", ".json", ".webmanifest"]);

/** Riscrive l'indirizzo in tutti i file testuali della build. Restituisce quanti ne ha toccati. */
export function applySiteUrl(distDir, from, to) {
  if (from === to) return 0;

  let touched = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;

      const source = fs.readFileSync(full, "utf8");
      if (!source.includes(from)) continue;
      fs.writeFileSync(full, source.split(from).join(to));
      touched += 1;
    }
  };

  walk(distDir);
  return touched;
}

/**
 * La data di modifica nei dati strutturati non deve essere scritta a mano: è
 * l'unico campo che invecchia da solo. Si sostituisce a ogni build.
 */
export function applyBuildDate(distDir, isoDate) {
  let touched = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (path.extname(entry.name) !== ".html") continue;

      const source = fs.readFileSync(full, "utf8");
      const updated = source.replace(/"dateModified":\s*"[^"]*"/g, `"dateModified": "${isoDate}"`);
      if (updated === source) continue;
      fs.writeFileSync(full, updated);
      touched += 1;
    }
  };

  walk(distDir);
  return touched;
}
