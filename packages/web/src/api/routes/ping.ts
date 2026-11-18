import { base } from "../__core/app";

/**
 * Procedura di servizio: serve al client mobile di scaffolding per verificare
 * che l'API risponda. Il sito web non la chiama (non ha client), ma il workspace
 * la compila e i test di `/api` la usano come esempio minimo di procedura.
 */
export const ping = base.handler(() => ({ message: `Pong! ${Date.now()}` }));
