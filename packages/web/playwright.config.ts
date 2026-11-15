import { defineConfig, devices } from "@playwright/test";

/**
 * E2E sul sito compilato: coprono ciò che i test unitari non raggiungono —
 * il download del PDF generato da jsPDF, il dialogo nativo di cancellazione e
 * la sincronizzazione dello storage tra due schede.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4242", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bunx vite build && bunx vite preview --port 4242 --strictPort",
    url: "http://127.0.0.1:4242",
    // In CI un server già in ascolto sarebbe una build di un altro job: i test
    // girerebbero su codice che non è quello appena compilato.
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
