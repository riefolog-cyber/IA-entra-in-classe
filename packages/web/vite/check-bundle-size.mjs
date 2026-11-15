/**
 * Budget di peso.
 *
 * Il progetto è già cresciuto di ~780 kB in un giorno (precache troppo largo).
 * Questo controllo trasforma quella deriva in un errore visibile in CI invece
 * che in un decimo di secondo in più sul Wi-Fi di scuola.
 *
 * Tre numeri distinti, perché un totale unico non dice dove intervenire:
 *   - bundle JS/CSS (`dist/assets`), il numero che l'utente paga all'avvio;
 *   - chunk vendor, quello che cresce quando si aggiunge una dipendenza;
 *   - risorse statiche (HTML, immagini, pagine delle tappe): misurate e
 *     riportate, fuori budget per scelta — sono contenuti, non codice.
 */
import fs from "node:fs";
import path from "node:path";

const BUDGETS = { assetsKb: 1400, vendorKb: 260 };
const dist = path.resolve(import.meta.dirname, "../dist");
const assetsDir = path.join(dist, "assets");

if (!fs.existsSync(assetsDir)) {
  console.error("check-bundle-size: manca dist/assets. Esegui prima `vite build`.");
  process.exit(1);
}

const files = fs
  .readdirSync(assetsDir)
  .map((name) => ({ name, size: fs.statSync(path.join(assetsDir, name)).size }))
  .sort((a, b) => b.size - a.size);

const totalKb = files.reduce((sum, file) => sum + file.size, 0) / 1024;
const vendor = files.find((file) => file.name.startsWith("vendor-"));
const vendorKb = (vendor?.size ?? 0) / 1024;

const staticKb =
  fs
    .readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter(
      (entry) => !path.relative(dist, path.join(entry.parentPath, entry.name)).startsWith("assets"),
    )
    .reduce((sum, entry) => sum + fs.statSync(path.join(entry.parentPath, entry.name)).size, 0) /
  1024;

for (const file of files) {
  console.log(`${(file.size / 1024).toFixed(0).padStart(6)} kB  ${file.name}`);
}

console.log("");
console.log(
  `Bundle JS/CSS: ${totalKb.toFixed(0)} kB su ${BUDGETS.assetsKb} kB · vendor: ${vendorKb.toFixed(0)} kB su ${BUDGETS.vendorKb} kB`,
);
console.log(
  `Risorse statiche (HTML, immagini, pagine delle tappe): ${staticKb.toFixed(0)} kB (fuori budget)`,
);

const failures = [];
if (totalKb > BUDGETS.assetsKb)
  failures.push(`bundle oltre il budget di ${(totalKb - BUDGETS.assetsKb).toFixed(0)} kB`);
if (vendorKb > BUDGETS.vendorKb)
  failures.push(`vendor oltre il budget di ${(vendorKb - BUDGETS.vendorKb).toFixed(0)} kB`);

if (failures.length) {
  console.error(
    `\n${failures.join("\n")}\nAlleggerisci o aggiorna BUDGETS giustificando l'aumento in questo file.`,
  );
  process.exit(1);
}
