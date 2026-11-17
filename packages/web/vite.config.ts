import crypto from "node:crypto";
import fs from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";
import honoDevPlugin from "./vite/__plugins/hono-dev-plugin.ts";
import assetOptimizerPlugin from "./vite/__plugins/asset-optimizer-plugin.ts";
import { DEV_CSP, META_CSP, cspHeader } from "./src/csp.ts";
import { renderStepPage, renderStepsIndex } from "./src/web/lib/prerender.ts";
import { siteMeta } from "./src/web/lib/site-meta.ts";
import { steps } from "./src/web/lib/teacher-content.ts";
import ports from "../../__ports.cjs";

const root = path.resolve(import.meta.dirname, "../..");

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
 * Pagine statiche delle tappe: l'app è instradata con hash, quindi una tappa non
 * ha un URL proprio. Qui ogni tappa diventa un file leggibile e indicizzabile.
 */
function prerenderStepsPlugin(): Plugin {
  return {
    name: "prerender-steps",
    apply: "build",
    transformIndexHtml(html: string) {
      // Internal link verso le pagine statiche: senza, i motori di ricerca non
      // hanno un percorso per raggiungerle dall'app. I metadati social stanno
      // già nell'index: aggiungerli qui li duplicherebbe, e i crawler leggono
      // solo il primo `og:image` che trovano.
      if (html.includes('href="./tappe/index.html"')) return html;

      return html.replace(
        "</head>",
        '    <link rel="alternate" type="text/html" href="./tappe/index.html" title="Le tappe in pagine statiche" />\n  </head>',
      );
    },
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, "dist");
      if (!fs.existsSync(path.join(dist, "index.html"))) return;

      const dir = path.join(dist, "tappe");
      fs.mkdirSync(dir, { recursive: true });
      steps.forEach((step, index) => {
        fs.writeFileSync(path.join(dir, `tappa-${index + 1}.html`), renderStepPage(step, index));
      });
      fs.writeFileSync(path.join(dir, "index.html"), renderStepsIndex());
    },
  };
}

/** `sitemap.xml` con le pagine statiche: sono loro ad avere un URL indicizzabile. */
function sitemapPlugin(): Plugin {
  return {
    name: "sitemap",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, "dist");
      if (!fs.existsSync(path.join(dist, "index.html"))) return;

      // `new URL` invece della concatenazione: se `siteMeta.url` perdesse la
      // barra finale, la concatenazione produrrebbe URL sbagliati in silenzio.
      const urls = ["", "tappe/", ...steps.map((_, index) => `tappe/tappa-${index + 1}.html`)].map(
        (path) => new URL(path, siteMeta.url).href,
      );
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
      serviceWorkerBuild(),
      prerenderStepsPlugin(),
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
