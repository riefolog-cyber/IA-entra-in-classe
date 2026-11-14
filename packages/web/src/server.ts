// Entry di produzione: il server vive in http-server.ts, fuori dai file `__`
// protetti dal template (che la piattaforma può riscrivere senza preavviso).
import { startServer } from "./http-server";

startServer();
