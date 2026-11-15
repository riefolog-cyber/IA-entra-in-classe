import { siteMeta } from "./site-meta";
import { steps, type SavedState } from "./teacher-content";

const GREEN: [number, number, number] = [31, 61, 51];
const TERRA: [number, number, number] = [196, 119, 90];
const SAGE: [number, number, number] = [158, 196, 147];
const PAPER: [number, number, number] = [246, 243, 234];
const INK: [number, number, number] = [32, 59, 50];
const MUTED: [number, number, number] = [110, 120, 110];

/** Messaggio unico della guardia: anche l'hook di export lo riusa. */
export const NAME_REQUIRED_MESSAGE = "Inserisci il tuo nome prima di generare l'attestazione.";

/** L'attestazione richiede un nome: senza, il documento non è intestabile. */
export function canExportAttestation(state: SavedState): boolean {
  // Meglio bloccare il pulsante che produrre un PDF con una riga di trattini.
  return state.name.trim().length > 0;
}

/**
 * Attestazione di partecipazione, generata nel browser come il resto del
 * quaderno. Non è una certificazione: è la dichiarazione di ciò che il docente
 * ha effettivamente svolto, con i numeri presi dal suo quaderno.
 */
export async function exportAttestation(state: SavedState) {
  if (!canExportAttestation(state)) {
    throw new Error(NAME_REQUIRED_MESSAGE);
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = 210;
  const margin = 24;
  const width = pageWidth - margin * 2;
  const name = state.name.trim();

  const answered = Object.values(state.answers).filter((answer) => answer.trim()).length;
  const correctQuizzes = steps.filter(
    (step, index) => state.answers[`${index}-quiz`] === String(step.correct),
  ).length;
  const chosen = steps.filter(
    (_, index) => state.answers[`${index}-scenario`] !== undefined,
  ).length;
  const exportedOn = new Date().toLocaleDateString("it-IT");

  doc.setProperties({
    title: "Restare umani · attestazione di partecipazione",
    subject: "Percorso di aggiornamento sull'IA a scuola",
    author: siteMeta.author,
    creator: "Restare umani",
    keywords: "attestazione, partecipazione, aggiornamento, docenti, IA",
  });

  // Bocca del documento
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(...TERRA);
  doc.rect(0, 0, pageWidth, 10, "F");

  doc.setTextColor(...PAPER);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("RESTARE UMANI · IA A SCUOLA", margin, 44);

  doc.setDrawColor(...SAGE);
  doc.setLineWidth(0.4);
  doc.line(margin, 50, margin + 46, 50);

  doc.setFont("times", "italic");
  doc.setFontSize(34);
  doc.text("Attestazione", margin, 88);
  doc.text("di partecipazione", margin, 104);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...SAGE);
  doc.text("Percorso di aggiornamento professionale per docenti", margin, 122);

  // Riquadro con i dati dichiarati
  const boxTop = 146;
  const boxHeight = 84;
  doc.setFillColor(...PAPER);
  doc.roundedRect(margin, boxTop, width, boxHeight, 3, 3, "F");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DOCENTE", margin + 10, boxTop + 16);
  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text(name, margin + 10, boxTop + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...GREEN);
  doc.text(
    doc.splitTextToSize(
      "ha svolto il percorso «Restare umani — IA a scuola: decisioni, evidenze, sperimentazione», articolato in dieci tappe con riflessioni professionali, verifiche di comprensione e scenari decisionali.",
      width - 20,
    ),
    margin + 10,
    boxTop + 40,
  );

  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  const summary = [
    `Tappe concluse: ${state.completed.length}/${steps.length}`,
    `Risposte compilate: ${answered}`,
    `Verifiche corrette: ${correctQuizzes}/${steps.length}`,
    `Scenari scelti: ${chosen}/${steps.length}`,
  ].join("   ·   ");
  doc.text(doc.splitTextToSize(summary, width - 20), margin + 10, boxTop + 74);

  doc.setTextColor(...PAPER);
  doc.setFontSize(10);
  doc.text(`Generata il ${exportedOn} dal quaderno dell'interessato`, margin, 254);

  doc.setFontSize(8.5);
  doc.setTextColor(...SAGE);
  doc.text(
    doc.splitTextToSize(
      "Autocertificazione di partecipazione. Non è una certificazione, non attribuisce crediti formativi e non sostituisce la formazione o le procedure dell'istituto. I dati provengono esclusivamente dal quaderno salvato nel browser del docente.",
      width,
    ),
    margin,
    264,
  );

  doc.setTextColor(...MUTED);
  doc.text(`${siteMeta.author} · ${siteMeta.url}`, margin, 286);
  doc.text(`${siteMeta.license} · contenuti aggiornati a ${siteMeta.reviewedAt}`, margin, 291);

  doc.save("restare-umani-attestazione.pdf");
}
