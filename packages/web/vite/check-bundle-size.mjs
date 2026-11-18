/**
 * Budget di peso.
 *
 * Il progetto è già cresciuto di ~780 kB in un giorno (precache troppo largo).
 * Questo controllo trasforma quella deriva in un errore visibile in CI invece
 * che in un decimo di secondo in più sul Wi-Fi di scuola.
 *
 * Il totale unico non dice dove intervenire, e soprattutto puniva due cose
 * diverse come se fossero la stessa: un `vendor` da 400 kB scaricato all'avvio
 * e jsPDF da 400 kB scaricato solo quando si esporta un PDF. Ora i numeri sono
 * separati:
 *   - **avvio**: i file citati da `index.html` (script, moduli precaricati,
 *     CSS). È ciò che l'utente paga prima di vedere la pagina;
 *   - **su richiesta**: i chunk caricati con `import()` (jsPDF, html2canvas,
 *     purify). Non pesano all'avvio e non devono consumare quel budget;
 *   - **vendor**: il chunk delle dipendenze, dentro il peso d'avvio;
 *   - **risorse statiche**: HTML, immagini, pagine delle tappe; misurate e
 *     riportate, fuori budget per scelta — sono contenuti, non codice.
 */
import fs from "node:fs";
import path from "node:path";

const BUDGETS = {
  /** File citati da index.html: 731 kB oggi, con margine per una feature. */
  startupKb: 800,
  /** Chunk caricati on demand: 778 kB oggi (PDF e cattura della pagina). */
  lazyKb: 950,
  /** Chunk vendor delle dipendenze (React, icone): 400 kB oggi. */
  vendorKb: 440,
};

const dist = path.resolve(import.meta.dirname, "../dist");
const assetsDir = path.join(dist, "assets");

if (!fs.existsSync(assetsDir)) {
  console.error("check-bundle-size: manca dist/assets. Esegui prima `vite build`.");
  process.exit(1);
}

const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
/** Asset citati dall'HTML: sono quelli che il browser scarica per aprire la pagina. */
const startupAssets = new Set(
  [...indexHtml.matchAll(/\.\/assets\/([^"'?)]+)/g)].map((match) => match[1]),
);

const files = fs
  .readdirSync(assetsDir)
  .map((name) => {
    const size = fs.statSync(path.join(assetsDir, name)).size;
    return { name, size, startup: startupAssets.has(name) };
  })
  .sort((a, b) => Number(b.startup) - Number(a.startup) || b.size - a.size);

const kb = (bytes) => bytes / 1024;
const startupKb = kb(files.filter((file) => file.startup).reduce((sum, f) => sum + f.size, 0));
const lazyKb = kb(files.filter((file) => !file.startup).reduce((sum, f) => sum + f.size, 0));
const vendor = files.find((file) => file.name.startsWith("vendor-") && file.startup);
const vendorKb = kb(vendor?.size ?? 0);

const staticKb = kb(
  fs
    .readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter(
      (entry) => !path.relative(dist, path.join(entry.parentPath, entry.name)).startsWith("assets"),
    )
    .reduce((sum, entry) => sum + fs.statSync(path.join(entry.parentPath, entry.name)).size, 0),
);

for (const file of files) {
  const tag = file.startup ? "avvio" : "on-demand";
  console.log(`${(file.size / 1024).toFixed(0).padStart(6)} kB  ${tag.padEnd(10)} ${file.name}`);
}

console.log("");
console.log(
  `Avvio: ${startupKb.toFixed(0)} kB su ${BUDGETS.startupKb} kB · vendor: ${vendorKb.toFixed(0)} kB su ${BUDGETS.vendorKb} kB`,
);
console.log(`Su richiesta: ${lazyKb.toFixed(0)} kB su ${BUDGETS.lazyKb} kB`);
console.log(
  `Risorse statiche (HTML, immagini, pagine delle tappe): ${staticKb.toFixed(0)} kB (fuori budget)`,
);

const failures = [];
if (startupKb > BUDGETS.startupKb)
  failures.push(`avvio oltre il budget di ${(startupKb - BUDGETS.startupKb).toFixed(0)} kB`);
if (vendorKb > BUDGETS.vendorKb)
  failures.push(`vendor oltre il budget di ${(vendorKb - BUDGETS.vendorKb).toFixed(0)} kB`);
if (lazyKb > BUDGETS.lazyKb)
  failures.push(`chunk on demand oltre il budget di ${(lazyKb - BUDGETS.lazyKb).toFixed(0)} kB`);

if (files.length && startupAssets.size === 0) {
  failures.push("nessun asset riconosciuto in index.html: il controllo non sta misurando nulla");
}
if (files.length && !vendor) {
  // Un budget vendor a zero passerebbe sempre: meglio un errore esplicito.
  failures.push(
    "nessun chunk vendor riconosciuto: aggiorna il controllo prima di fidarti del numero",
  );
}

if (failures.length) {
  console.error(
    `\n${failures.join("\n")}\nAlleggerisci o aggiorna BUDGETS giustificando l'aumento in questo file.`,
  );
  process.exit(1);
}
