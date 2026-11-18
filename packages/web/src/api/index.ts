import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";

// API features are oRPC procedures, one file per feature in ./routes/,
// composed into this router — typed end-to-end via the clients
// (mobile: lib/api.ts; il sito web non ha client: non chiama l'API).
// Keep each routes/ file under 500 lines (`bun run lint` enforces this);
// split into more feature files as they grow.
// Patterns and examples: skills/app/references/api.md
//
// Il sito non ha procedure: l'analisi è affidata al prompt per un modello
// esterno e tutto il resto vive nel browser. Il router resta perché
// `createApp` monta `/api/health` e oRPC; aggiungere una procedura qui è
// l'unico punto da toccare quando servirà.
export const router = {};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
// Rare plain-HTTP endpoints (webhooks, streaming, the Better Auth handler)
// register here with full paths, e.g. app.post("/api/webhooks/example", ...)

export default app;
