import crypto from "node:crypto";
import fs from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";
import honoDevPlugin from "./vite/__plugins/hono-dev-plugin.ts";
import assetOptimizerPlugin from "./vite/__plugins/asset-optimizer-plugin.ts";
import { DEV_CSP, META_CSP, cspHeader } from "./src/csp.ts";
import { siteMeta } from "./src/web/lib/site-meta.ts";
import { applyBuildDate, applySiteUrl } from "./vite/site-url.mjs";
import ports from "../../__ports.cjs";

const root = path.resolve(import.meta.dirname, "../..");

/**
 * Indirizzo pubblico con cui firmare canonical, dati strutturati, sitemap e
 * prompt: `SITE_URL` lo cambia per la copia su GitHub Pages, altrimenti vale
 * quello dichiarato in `siteMeta`.
 */
const siteUrl = (process.env.SITE_URL || siteMeta.url).replace(/\/?$/, "/");

/**
 * Service worker versionato e precaricato dalla build: sostituisce `__BUILD_ID__`
 * con un hash dell'index compilato (la cache non serve mai asset vecchi) e
 * `__PRECACHE__` con l'elenco essenziale degli asset.
 */
function serviceWorkerBuild(): Plugin {
  return {
    name: "sw-version",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, "dist");
      const swPath = path.join(dist, "sw.js");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(swPath) || !fs.existsSync(indexPath)) return;

      const buildId = crypto
        .createHash("sha256")
        .update(fs.readFileSync(indexPath))
        .digest("hex")
        .slice(0, 10);

      // Precache solo dell'essenziale: il codice dell'app, il vendor, il CSS e il
      // runtime. jsPDF, html2canvas e purify (~780 kB) si scaricano alla prima
      // esportazione, quando servono davvero: sono chunk dinamici, non avvio.
      const assetsDir = path.join(dist, "assets");
      const essential = /^(index|vendor|rolldown-runtime)-.*\.(js|css)$/;
      const precached = fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir).filter((name) => essential.test(name))
        : [];
      const assets = precached.map((name) => `./assets/${name}`);

      // Se il filtro smette di trovare l'app (entry rinominata, nuovo
      // `manualChunks`), il precache resterebbe sintatticamente valido ma vuoto:
      // offline si romperebbe in silenzio. Meglio un build rosso.
      const preparedKb =
        precached.reduce((sum, name) => sum + fs.statSync(path.join(assetsDir, name)).size, 0) /
        1024;
      if (!precached.some((name) => /^index-.*\.js$/.test(name)) || preparedKb < 400) {
        throw new Error(
          `sw: precache essenziale incompleto (${preparedKb.toFixed(0)} kB, entry ${precached.some((name) => /^index-.*\.js$/.test(name))})`,
        );
      }

      fs.writeFileSync(
        swPath,
        fs
          .readFileSync(swPath, "utf8")
          .replace("__BUILD_ID__", buildId)
          .replace('"__PRECACHE__"', assets.map((asset) => JSON.stringify(asset)).join(", ")),
      );
    },
  };
}

/**
 * Riscrive l'indirizzo pubblico in tutta la build quando `SITE_URL` indica un
 * host diverso: canonical, OG, dati strutturati, sitemap, robots e i link
 * generati dal codice devono parlare dell'host che serve davvero la pagina.
 */
function siteUrlPlugin(): Plugin {
  return {
    name: "site-url",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, "dist");
      if (!fs.existsSync(path.join(dist, "index.html"))) return;
      applySiteUrl(dist, siteMeta.url, siteUrl);
      // La data nei dati strutturati è quella della build, non una scritta a mano.
      applyBuildDate(dist, new Date().toISOString().slice(0, 10));
    },
  };
}

/** `sitemap.xml`: senza pagine statiche resta la sola home. */
function sitemapPlugin(): Plugin {
  return {
    name: "sitemap",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, "dist");
      if (!fs.existsSync(path.join(dist, "index.html"))) return;

      // L'app è instradata con hash: l'unico URL indicizzabile è la home.
      // `new URL` invece della concatenazione, così una barra finale mancante
      // in `siteUrl` non produce URL sbagliati in silenzio.
      const urls = [new URL("", siteUrl).href];
      const updated = new Date().toISOString().slice(0, 10);

      const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => `  <url><loc>${url}</loc><lastmod>${updated}</lastmod></url>`),
        "</urlset>",
        "",
      ].join("\n");

      fs.writeFileSync(path.join(dist, "sitemap.xml"), body);
    },
  };
}

/**
 * CSP in modalità report-only durante lo sviluppo: una violazione si vede in
 * console prima del deploy, quando è ancora gratis.
 */
function devCspPlugin(): Plugin {
  const policy = cspHeader(DEV_CSP);

  return {
    name: "dev-csp-report-only",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Content-Security-Policy-Report-Only", policy);
        next();
      });
    },
  };
}

/**
 * La build statica (`dist/`) non può inviare header: la policy stretta arriva
 * come <meta> nell'index compilato, così l'anteprima su GitHub Pages ha le
 * stesse regole del server Bun (tranne `frame-ancestors`, non supportato in meta).
 */
function mirrorCspPlugin(): Plugin {
  const policy = META_CSP;

  return {
    name: "mirror-csp-meta",
    apply: "build",
    transformIndexHtml(html: string) {
      return html.replace(
        "</head>",
        `    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  Object.assign(process.env, env);

  return {
    // Relative base so the built app works on any host path (GitHub Pages, Vercel,
    // Netlify) without hard-coding the repository name.
    base: "./",
    // All env files live at the repo root - keep Vite's own env loading there too,
    // so packages/web/.env* files can never shadow the root .env.
    envDir: root,
    plugins: [
      honoDevPlugin(),
      react(),
      tailwind(),
      assetOptimizerPlugin(),
      // Prima del service worker: il suo `BUILD_ID` deve derivare dall'index
      // definitivo, non da uno che cambia ancora dopo (URL e data).
      siteUrlPlugin(),
      serviceWorkerBuild(),
      sitemapPlugin(),
      devCspPlugin(),
      mirrorCspPlugin(),
    ],
    build: {
      // Separa le librerie sempre caricate (React, oRPC, lucide) dal codice
      // dell'app: dopo un deploy i visitatori che tornano riutilizzano la cache
      // del vendor chunk. jspdf e html2canvas restano nei chunk dinamici
      // (import("jspdf") in export-pdf) e non vengono scaricati all'avvio.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "vendor",
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|@orpc|@tanstack|lucide-react|wouter|zod)[\\/]/,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src/web"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: ports.website,
      strictPort: true,
      allowedHosts: true,
      hmr: { overlay: false },
      cors: false,
    },
  };
});
