import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { analysisStatus, analyzeProfile } from "./routes/profile-analysis";
import { isForeignOrigin } from "./security";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (web: src/web/lib/api.ts, mobile: lib/api.ts).
// Keep each routes/ file under 500 lines (`bun run lint` enforces this);
// split into more feature files as they grow.
// Patterns and examples: skills/app/references/api.md
export const router = {
  ping,
  analyzeProfile,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
// Rare plain-HTTP endpoints (webhooks, streaming, the Better Auth handler)
// register here with full paths, e.g. app.post("/api/webhooks/example", ...)
// Stato leggibile del servizio IA: dice se è configurato e quanto budget resta,
// senza esporre chiavi né testo. Serve a diagnosticare un errore dal browser.
// Stessa regola di origine delle procedure: è diagnostica, non pubblica.
app.get("/api/status", (c) =>
  isForeignOrigin(c.req.raw.headers)
    ? c.json({ ok: false, reason: "forbidden_origin" }, 403)
    : c.json(analysisStatus()),
);

export default app;
