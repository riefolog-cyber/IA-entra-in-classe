import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { siteMeta } from "../site-meta";

/**
 * I metadati social e i dati strutturati vivono in `index.html`, hardcoded:
 * l'unica cosa che può andare storta è una divergenza silenziosa con
 * `siteMeta` (URL, autore, licenza) o un JSON-LD che non è più JSON valido.
 */
const html = fs.readFileSync(path.resolve(import.meta.dirname, "../../../../index.html"), "utf8");

describe("metadati della pagina", () => {
  test("canonical, og:url e twitter puntano allo stesso sito di `siteMeta`", () => {
    const canonical = /rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    const ogUrl = /property="og:url" content="([^"]+)"/.exec(html)?.[1];

    expect(canonical).toBe(siteMeta.url);
    expect(ogUrl).toBe(siteMeta.url);
  });

  test("il JSON-LD è valido e descrive una risorsa didattica gratuita", () => {
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(raw).toBeDefined();

    const data = JSON.parse(raw as string);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("LearningResource");
    expect(data.url).toBe(siteMeta.url);
    expect(data.inLanguage).toBe("it-IT");
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.license).toBe(siteMeta.licenseUrl);
    expect(data.creator.name).toBe(siteMeta.author);
  });

  test("l'anteprima social ha immagine, testo alternativo e lingua", () => {
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="og:image:alt"');
    expect(html).toContain('property="og:locale" content="it_IT"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image:alt"');
  });
});
