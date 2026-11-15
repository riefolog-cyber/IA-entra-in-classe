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

test("le pagine statiche delle tappe rispondono", async ({ page }) => {
  const response = await page.request.get("/tappe/tappa-1.html");
  expect(response.status()).toBe(200);

  const html = await response.text();
  expect(html).toContain("Tappa 1 di 10");
  expect(html).toContain('href="../#/tappa/1"');
});
