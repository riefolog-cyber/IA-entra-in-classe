import { expect, test } from "@playwright/test";
import fs from "node:fs";

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

test("il backup JSON riporta indietro anche le letture", async ({ page }) => {
  await page.goto("/#/riepilogo");

  const box = page.locator(".gemini-box");
  await box
    .getByRole("textbox", { name: /^Lettura/ })
    .fill("Lettura da conservare nel backup: testo abbastanza lungo da essere salvato.");
  await box.getByRole("button", { name: /Conserva la lettura/ }).click();
  await expect(box).toContainText("Leggi la lettura conservata");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta JSON" }).click();
  const backup = await (await download).path();
  expect(backup).not.toBeNull();

  await page.getByRole("button", { name: /Cancella i miei dati/ }).click();
  await page.getByRole("button", { name: "Cancella i dati", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("restare-umani-letture-v1")))
    .toBeNull();

  // Anche la data dell'ultimo backup sparisce: è stato salvato dal sito.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("restare-umani-ultimo-export-v1")))
    .toBeNull();

  await page.goto("/#/riepilogo");
  await page.setInputFiles('input[type="file"]', backup as string);
  await page.getByRole("button", { name: /Importa e salva copia/ }).click();

  await expect(page.locator(".gemini-box")).toContainText("Leggi la lettura conservata");
  await expect(page.locator(".gemini-box")).toContainText("Lettura da conservare nel backup");
});

test("il promemoria si scarica come file .ics", async ({ page }) => {
  await page.goto("/#/riepilogo");
  await page.getByLabel("Riprendi più avanti").fill("2026-12-12");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Aggiungi al calendario/ }).click();
  const file = await download;

  expect(file.suggestedFilename()).toBe("restare-umani-promemoria.ics");
  const ics = fs.readFileSync((await file.path()) as string, "utf8");
  expect(ics).toContain("DTSTART;VALUE=DATE:20261212");
  expect(ics).toContain("BEGIN:VEVENT");
});

test("i titoli delle pagine non saltano livelli", async ({ page }) => {
  for (const route of ["/#/", "/#/tappa/1", "/#/riepilogo", "/#/approfondimenti", "/#/privacy"]) {
    await page.goto(route);

    const levels = await page.$$eval("h1,h2,h3,h4,h5,h6", (nodes) =>
      nodes
        .filter((node) => (node as HTMLElement).offsetParent !== null)
        .map((node) => Number(node.tagName.slice(1))),
    );

    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    let previous = 0;
    for (const level of levels) {
      expect(level, `${route}: salto da h${previous} a h${level}`).toBeLessThanOrEqual(
        previous + 1,
      );
      previous = level;
    }
  }
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

test("i contorni dei campi hanno almeno 3:1 di contrasto", async ({ page }) => {
  await page.goto("/#/riepilogo");

  // WCAG 1.4.11: il bordo di un campo è l'unico segnale del suo perimetro.
  const ratios = await page.evaluate(() => {
    const parse = (value: string) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const [r, g, b, a = "1"] = match[1].split(",").map(Number);
      return { r, g, b, a };
    };
    const luminance = (color: { r: number; g: number; b: number }) => {
      const channel = (value: number) => {
        const s = value / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    };
    const background = (element: Element | null) => {
      let node: Element | null = element;
      while (node) {
        const color = parse(getComputedStyle(node).backgroundColor);
        if (color && color.a > 0) return color;
        node = node.parentElement;
      }
      return { r: 24, g: 34, b: 30, a: 1 };
    };

    return [...document.querySelectorAll("input, textarea, select")]
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => {
        const border = parse(getComputedStyle(element).borderTopColor);
        const bg = background(element);
        if (!border) return 0;
        const a = luminance(border);
        const b = luminance(bg);
        return Number(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
      });
  });

  expect(ratios.length).toBeGreaterThan(0);
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(3);
});

test("il questionario si apre precompilato in una nuova scheda", async ({ page, context }) => {
  // La rotta è intercettata: il test resta deterministico e non esce in rete.
  await context.route("https://docs.google.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>modulo</p>" }),
  );
  await page.goto("/#/riepilogo");

  const scales = page.locator(".feedback-scale");
  await scales.nth(0).getByRole("button", { name: "4" }).click();
  await scales.nth(1).getByRole("button", { name: "5" }).click();

  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: /Apri il questionario/ }).click();
  const popup = await popupPromise;

  await expect(popup).toHaveURL(/docs\.google\.com\/forms\/.+\/viewform/);
  expect(popup.url()).toContain("entry.154579810=4");
  expect(popup.url()).toContain("entry.298496945=5");
  await expect(page.locator(".notice").filter({ hasText: "nuova scheda" })).toBeVisible();
});

test("senza rete e senza copia in cache compare la pagina offline", async ({ page, context }) => {
  await page.goto("/?sw=1");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return Boolean(registration?.active);
      }),
    )
    .toBe(true);
  // Una seconda visita: il worker attivo controlla la pagina.
  await page.reload();

  await context.setOffline(true);
  await page.goto("/pagina-mai-vista").catch(() => {});
  await expect(page.getByRole("heading", { name: "Sei offline" })).toBeVisible();
  await context.setOffline(false);
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
