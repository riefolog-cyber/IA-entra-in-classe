import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { applySiteUrl } from "../../../../vite/site-url.mjs";

/**
 * La stessa build serve due host: Render (default) e GitHub Pages (`SITE_URL`).
 * Se la riscrittura non passa dal bundle e dal `robots.txt`, la copia su Pages
 * dichiara canonical, dati strutturati e sitemap del sito Render — contenuto
 * duplicato che si contende le stesse ricerche.
 */
function fixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-url-"));
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(
    path.join(dir, "index.html"),
    '<link rel="canonical" href="https://a.example/"><script>"url": "https://a.example/"</script>',
  );
  fs.writeFileSync(path.join(dir, "robots.txt"), "Sitemap: https://a.example/sitemap.xml");
  fs.writeFileSync(path.join(dir, "assets", "index-abc.js"), 'const u="https://a.example/#/x"');
  fs.writeFileSync(path.join(dir, "icon.png"), "binario");
  return dir;
}

describe("indirizzo pubblico della build", () => {
  test("riscrive HTML, testo e bundle, senza toccare i binari", () => {
    const dir = fixture();

    expect(applySiteUrl(dir, "https://a.example/", "https://b.example/sub/")).toBe(3);

    expect(fs.readFileSync(path.join(dir, "index.html"), "utf8")).toContain(
      "https://b.example/sub/",
    );
    expect(fs.readFileSync(path.join(dir, "robots.txt"), "utf8")).toContain(
      "https://b.example/sub/sitemap.xml",
    );
    expect(fs.readFileSync(path.join(dir, "assets/index-abc.js"), "utf8")).toContain(
      "https://b.example/sub/#/x",
    );
    expect(fs.readFileSync(path.join(dir, "icon.png"), "utf8")).toBe("binario");

    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("con lo stesso indirizzo non tocca nulla", () => {
    const dir = fixture();
    expect(applySiteUrl(dir, "https://a.example/", "https://a.example/")).toBe(0);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
