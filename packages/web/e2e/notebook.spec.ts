import { expect, test } from "@playwright/test";

/**
 * Percorsi che nessun unit test può coprire: il PDF realmente scaricato, la
 * cancellazione propagata tra schede, l'avviso di aggiornamento e le pagine
 * statiche servite davvero.
 */

const NOTEBOOK_KEY = "restare-umani-docenti-v2";

/** Attende il salvataggio (debounce 400 ms) senza dipendere da un tempo fisso. */
async function waitForSaved(page: import("@playwright/test").Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key) ?? "", NOTEBOOK_KEY))
    .toContain("Docente di prova");
}

test("senza risposte l'export «in corso» della barra è disattivato", async ({ page }) => {
  await page.goto("/#/tappa/1");

  const topbarExport = page.locator(".topbar-export");
  await expect(topbarExport).toBeDisabled();
  await expect(topbarExport).toHaveAttribute("title", /almeno una risposta/);

  // Con una risposta il comando torna disponibile: il PDF ha qualcosa da dire.
  await page
    .getByRole("textbox")
    .first()
    .fill("Ho verificato le fonti prima di usare la scheda in tavola.");
  await expect(topbarExport).toBeEnabled();
});

test("l'attestazione si scarica dal riepilogo", async ({ page }) => {
  await page.goto("/#/riepilogo");
  await page.getByLabel("Nome").fill("Docente di prova");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Scarica l'attestazione di partecipazione/ }).click();

  expect((await download).suggestedFilename()).toBe("restare-umani-attestazione.pdf");
});

test("la cancellazione fatta in un'altra scheda arriva anche qui", async ({ page, context }) => {
  await page.goto("/#/riepilogo");
  await page.getByLabel("Nome").fill("Docente di prova");
  await waitForSaved(page);

  const other = await context.newPage();
  await other.goto("/#/riepilogo");
  await other.getByRole("button", { name: /Cancella i miei dati/ }).click();
  await other.getByRole("button", { name: "Cancella i dati", exact: true }).click();

  await expect(page.getByLabel("Nome")).toHaveValue("");
});

test("l'avviso di versione si può rimandare", async ({ page }) => {
  await page.goto("/#/riepilogo");

  await page.evaluate(() => window.dispatchEvent(new CustomEvent("app:update-ready")));
  const banner = page.locator(".update-banner");
  await expect(banner).toBeVisible();

  await banner.getByRole("button", { name: "Più tardi" }).click();
  await expect(banner).toHaveCount(0);
});

test("con ?sw=1 il service worker si registra e prende il controllo", async ({ page }) => {
  await page.goto("/?sw=1");

  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return Boolean(registration?.active);
      }),
    )
    .toBe(true);
});

test("il prompt per Gemini si copia, si scarica e cambia con l'ambito", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/riepilogo");

  const box = page.locator(".gemini-box");
  await expect(box).toBeVisible();
  await expect(box).toContainText("tappe lavorate su 10");

  await box.getByRole("button", { name: "Copia il prompt", exact: true }).click();
  const wholeBook = await page.evaluate(() => navigator.clipboard.readText());
  expect(wholeBook).toContain("10 tappe");
  expect(wholeBook).toContain("citazione letterale");

  // Ambito: la sola tappa 3.
  await box.getByRole("combobox").selectOption("2");
  await box.getByRole("button", { name: "Copia il prompt", exact: true }).click();
  const single = await page.evaluate(() => navigator.clipboard.readText());
  expect(single).toContain("tappa 3");

  const download = page.waitForEvent("download");
  await box.getByRole("button", { name: /Scarica/ }).click();
  expect((await download).suggestedFilename()).toBe("prompt-gemini-tappa-3.txt");

  // La lettura ricevuta dal modello si conserva accanto al quaderno.
  await box
    .getByRole("textbox", { name: /^Lettura/ })
    .fill(
      "Lettura di prova: la tappa mostra un criterio chiaro di verifica delle fonti, con una tensione sul tempo disponibile.",
    );
  await box.getByRole("button", { name: /Conserva la lettura/ }).click();
  await expect(box).toContainText("Leggi la lettura conservata");

  await page.reload();
  await expect(page.locator(".gemini-box")).toContainText("Leggi la lettura conservata");
});

test("«Cancella i miei dati» elimina anche le letture conservate", async ({ page }) => {
  await page.goto("/#/riepilogo");

  const box = page.locator(".gemini-box");
  await box
    .getByRole("textbox", { name: /^Lettura/ })
    .fill("Lettura da cancellare: contiene una riflessione abbastanza lunga da essere conservata.");
  await box.getByRole("button", { name: /Conserva la lettura/ }).click();
  await expect(box).toContainText("Leggi la lettura conservata");

  await page.getByRole("button", { name: /Cancella i miei dati/ }).click();
  await page.getByRole("button", { name: "Cancella i dati", exact: true }).click();

  // La vista cambia rotta dopo la cancellazione: si controlla lo storage, che
  // è la verità che conta per la privacy.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("restare-umani-letture-v1")))
    .toBeNull();

  await page.goto("/#/riepilogo");
  await expect(page.locator(".gemini-box")).not.toContainText("Leggi la lettura conservata");
});
