/**
 * Immagine di condivisione (OpenGraph, 1200×630).
 *
 * È un artefatto generato, non un'illustrazione: la palette è quella del sito e
 * il testo è già pubblico nell'app. Si riesegue con `bun run og` solo se cambia
 * il titolo del percorso; il PNG risultante è versionato in `public/images/`.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#1f3d33" />
  <rect width="1200" height="14" fill="#c4775a" />
  <g fill="#f6f3ea">
    <text x="72" y="140" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="7" fill="#9ec493">RESTARE UMANI</text>
    <text x="72" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="96">IA a scuola.</text>
    <text x="72" y="404" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-style="italic">Dieci tappe</text>
    <text x="72" y="492" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#cfe0d4">Decisioni, evidenze, sperimentazione</text>
    <text x="72" y="546" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#9ec493">Percorso di aggiornamento per docenti</text>
  </g>
  <circle cx="1010" cy="300" r="132" fill="none" stroke="#2f6b52" stroke-width="2" />
  <circle cx="1010" cy="300" r="94" fill="none" stroke="#9ec493" stroke-width="1.5" />
  <circle cx="1010" cy="300" r="10" fill="#c4775a" />
</svg>`;

const out = path.resolve(import.meta.dirname, "../public/images/og-restare-umani.png");

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);

console.log(`og-restare-umani.png · ${(fs.statSync(out).size / 1024).toFixed(0)} kB`);
