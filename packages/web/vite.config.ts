import crypto from "node:crypto";
import fs from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";
import honoDevPlugin from "./vite/__plugins/hono-dev-plugin.ts";
import assetOptimizerPlugin from "./vite/__plugins/asset-optimizer-plugin.ts";
import ports from "../../__ports.cjs";

const root = path.resolve(import.meta.dirname, "../..");

/**
 * Service worker versionato dalla build: sostituisce "__BUILD_ID__" con un hash
 * dell'index compilato, così la cache non serve mai asset di un deploy vecchio.
 */
function serviceWorkerVersion(): Plugin {
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

      fs.writeFileSync(swPath, fs.readFileSync(swPath, "utf8").replace("__BUILD_ID__", buildId));
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
    plugins: [honoDevPlugin(), react(), tailwind(), assetOptimizerPlugin(), serviceWorkerVersion()],
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
