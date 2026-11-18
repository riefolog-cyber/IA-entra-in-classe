import { describe, expect, test } from "bun:test";

import { buildCalendarEvent, icsDate } from "../calendar";

/**
 * Il file .ics è l'alternativa locale alle notifiche push: se è malformato, il
 * calendario lo ignora senza dire niente. Qui si controllano le parti che i
 * calendari sono severi nel pretendere: CRLF, date locali, escaping, lunghezza.
 */
describe("promemoria .ics", () => {
  const event = {
    date: new Date(2026, 11, 12), // 12 dicembre 2026, ora locale
    title: "Riprendi il percorso: Restare umani",
    description: "Torna al quaderno; le risposte sono nel browser.",
    url: "https://ia-entra-in-classe.onrender.com/#/riepilogo",
    now: new Date(Date.UTC(2026, 10, 18, 9, 30, 15)),
  };

  test("usa date locali, non UTC: il giorno è quello scelto", () => {
    expect(icsDate(new Date(2026, 11, 12))).toBe("20261212");
    expect(icsDate(new Date(2026, 0, 5))).toBe("20260105");
  });

  test("DTSTAMP è un istante UTC completo, non mezzanotte locale", () => {
    const ics = buildCalendarEvent(event);

    expect(ics).toContain("DTSTAMP:20261118T093015Z");
  });

  test("produce un evento di un giorno intero che finisce il giorno dopo", () => {
    const ics = buildCalendarEvent(event);

    expect(ics).toContain("DTSTART;VALUE=DATE:20261212");
    expect(ics).toContain("DTEND;VALUE=DATE:20261213");
    expect(ics).toContain("SUMMARY:Riprendi il percorso: Restare umani");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  test("le righe usano CRLF e non superano 75 ottetti", () => {
    const ics = buildCalendarEvent({
      ...event,
      title: `Riprendi ${"molto ".repeat(30)}`.trim(),
    });

    const lines = ics.split("\r\n");
    expect(ics).not.toMatch(/[^\r]\n/);
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  test("punto e virgola, virgole e a capo non rompono il formato", () => {
    const ics = buildCalendarEvent({
      ...event,
      title: "Riprendi; controlla, poi scrivi",
      description: "Prima riga\nSeconda riga",
    });

    expect(ics).toContain("SUMMARY:Riprendi\\; controlla\\, poi scrivi");
    expect(ics).toContain("DESCRIPTION:Prima riga\\nSeconda riga");
  });

  test("l'URL è nella descrizione, così il telefono lo rende toccabile", () => {
    const ics = buildCalendarEvent(event);
    const unfolded = ics.replace(/\r\n /g, "");

    expect(unfolded).toContain("https://ia-entra-in-classe.onrender.com/#/riepilogo");
  });
});
