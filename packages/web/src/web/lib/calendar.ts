/**
 * Promemoria in formato iCalendar (.ics), generato nel browser.
 *
 * Serve a rispondere a «quando riprendo?» senza notifiche push: quelle
 * richiederebbero un server con chiavi e un'iscrizione del dispositivo, cioè
 * dati e infrastruttura che questo sito non ha. Il file prodotto è letto da
 * Google Calendar, Apple Calendario, Outlook e Thunderbird.
 */

/** Data locale in formato `YYYYMMDD`, quello che si usa per un evento «tutto il giorno». */
export function icsDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/** Istante UTC completo, il formato che `DTSTAMP` richiede (`20261118T093000Z`). */
function icsTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

/** Le righe di un .ics non superano 75 ottetti: le continuazioni iniziano con uno spazio. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > 75) {
      parts.push(current);
      current = " " + char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n");
}

/** Nei valori testuali servono barrare backslash, punto e virgola, virgola e a capo. */
function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export type CalendarEvent = {
  /** Giorno scelto dal docente (evento di un giorno intero). */
  date: Date;
  title: string;
  description?: string;
  /** Indirizzo da aprire: finisce nella descrizione, così il telefono lo rende toccabile. */
  url?: string;
  /** Istante di creazione, iniettabile nei test. */
  now?: Date;
};

export function buildCalendarEvent(event: CalendarEvent): string {
  const start = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const stamp = event.now ?? new Date();
  const description = [event.description, event.url].filter(Boolean).join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Restare umani//IA a scuola//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // L'UID deve essere stabile per lo stesso evento: data più sito, senza caso.
    `UID:${icsDate(start)}-restare-umani@ia-entra-in-classe`,
    `DTSTAMP:${icsTimestamp(stamp)}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(description ? [`DESCRIPTION:${escape(description)}`] : []),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}
