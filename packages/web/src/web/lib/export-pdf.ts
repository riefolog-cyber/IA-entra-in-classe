import {
  steps as teacherSteps,
  glossary as teacherGlossary,
  references as teacherReferences,
  stepSources,
  type SavedState,
} from "./teacher-content";
import { siteMeta } from "./site-meta";

const GREEN: [number, number, number] = [31, 61, 51];
const TERRA: [number, number, number] = [196, 119, 90];
const SAGE: [number, number, number] = [158, 196, 147];
const PAPER: [number, number, number] = [246, 243, 234];
const INK: [number, number, number] = [32, 59, 50];
const MUTED: [number, number, number] = [110, 120, 110];

const phaseColor = (phase?: string): [number, number, number] => {
  switch (phase) {
    case "Pratica":
      return TERRA;
    case "Progettazione inclusiva":
      return [104, 122, 96];
    case "Istituzione":
    case "Scuola":
      return [124, 106, 84];
    default:
      return GREEN;
  }
};

export async function exportPdf(state: SavedState, previousVersion = false) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const steps = teacherSteps;
  const glossary = teacherGlossary;
  const pageWidth = 210;
  const margin = 22;
  const width = pageWidth - margin * 2;
  let y = 26;

  const clean = (s: string) =>
    s
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/→/g, ">")
      .replace(/·/g, "-");

  const newPage = () => {
    doc.addPage();
    y = 26;
  };

  const ensure = (height: number) => {
    if (y + height > 272) newPage();
  };

  const para = (
    value: string,
    size = 11,
    style: "normal" | "bold" | "italic" = "normal",
    color: [number, number, number] = INK,
    font: "helvetica" | "times" = "helvetica",
    after = 4,
    indent = 0,
  ) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines: string[] = doc.splitTextToSize(clean(value), width - indent);
    for (const line of lines) {
      ensure(size * 0.5);
      doc.text(line, margin + indent, y);
      y += size * 0.48;
    }
    y += after;
  };

  const label = (value: string) => {
    ensure(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TERRA);
    const lines: string[] = doc.splitTextToSize(clean(value.toUpperCase()), width);
    for (const line of lines) {
      ensure(5);
      doc.text(line, margin, y);
      y += 4.8;
    }
    y += 2.4;
  };

  const answer = (value: string) => {
    const text = clean(value.trim() || "[Nessuna risposta]");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const lines: string[] = doc.splitTextToSize(text, width - 12);
    const height = Math.max(lines.length * 5.2 + 9, 18);
    ensure(height + 6);
    doc.setFillColor(248, 245, 236);
    doc.rect(margin, y - 4, width, height, "F");
    doc.setFillColor(...TERRA);
    doc.rect(margin, y - 4, 1.6, height, "F");
    doc.setTextColor(...INK);
    let lineY = y + 3;
    for (const line of lines) {
      doc.text(line, margin + 7, lineY);
      lineY += 5.2;
    }
    y += height + 5;
  };

  const sectionTitle = (value: string, size = 15) => {
    ensure(size);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...GREEN);
    doc.text(clean(value), margin, y);
    y += size * 0.6 + 5;
  };

  // ---------------------------------------------------------------- copertina
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 297, "F");
  doc.setFillColor(...TERRA);
  doc.rect(0, 0, pageWidth, 9, "F");
  doc.setTextColor(...PAPER);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("RESTARE UMANI", margin, 40);
  doc.setDrawColor(...SAGE);
  doc.setLineWidth(0.4);
  doc.line(margin, 46, margin + 40, 46);

  doc.setFont("times", "italic");
  doc.setFontSize(40);
  doc.text("Il mio quaderno", margin, 88);
  doc.text("di aggiornamento.", margin, 104);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...SAGE);
  doc.text(
    clean(
      previousVersion
        ? "Percorso personale precedente"
        : "IA a scuola: decisioni, evidenze, sperimentazione",
    ),
    margin,
    124,
  );

  doc.setFontSize(11);
  doc.setTextColor(...PAPER);
  const exported = new Date().toLocaleDateString("it-IT");
  doc.text(
    `${state.name.trim() ? `${state.name.trim()} · ` : ""}esportato il ${exported}`,
    margin,
    142,
  );
  doc.text(
    `${state.completed.length} tappe concluse su ${steps.length} · ${Object.values(state.answers).filter((a) => a.trim()).length} risposte`,
    margin,
    149,
  );

  doc.setDrawColor(...SAGE);
  doc.line(margin, 236, pageWidth - margin, 236);
  doc.setFontSize(10);
  doc.setTextColor(...PAPER);
  doc.text(`${siteMeta.author} · ${siteMeta.role}`, margin, 246);
  doc.setTextColor(...SAGE);
  doc.text(`Contenuti aggiornati a ${siteMeta.reviewedAt} · ${siteMeta.license}`, margin, 253);
  doc.text(siteMeta.url, margin, 260);

  // ------------------------------------------------------------- introduzione
  newPage();
  sectionTitle("Come leggere questo quaderno", 17);
  para(
    "Raccoglie le attività del percorso e le risposte presenti al momento dell'esportazione. Le risposte mancanti sono indicate. Non è una valutazione della persona, non è una certificazione e non sostituisce le procedure dell'istituto.",
  );
  para(
    "I casi sono inventati e i contenuti sono aggiornati alla data indicata in copertina. Prima di usare uno strumento in classe verifica le condizioni d'uso e le indicazioni del tuo istituto. Non inserire dati identificativi di studenti, colleghi o famiglie.",
  );

  // --------------------------------------------------------------- le tappe
  steps.forEach((step, i) => {
    newPage();
    const color = phaseColor(step.phase);

    doc.setFillColor(...color);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(clean((step.phase || "Percorso").toUpperCase()), margin, 11);
    doc.setFont("times", "italic");
    let titleLines: string[] = doc.splitTextToSize(clean(step.title), width - 26);
    if (titleLines.length > 1) {
      doc.setFontSize(15);
      titleLines = doc.splitTextToSize(clean(step.title), width - 26).slice(0, 2);
    } else {
      doc.setFontSize(19);
    }
    doc.text(titleLines[0], margin, titleLines.length > 1 ? 18 : 22);
    if (titleLines[1]) doc.text(titleLines[1], margin, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1).padStart(2, "0"), pageWidth - margin, 22, { align: "right" });
    y = 40;

    para(
      state.completed.includes(i) ? "Tappa segnata come conclusa." : "Tappa non ancora conclusa.",
      9,
      "normal",
      MUTED,
    );
    para(step.intro);
    sectionTitle("Una chiave di lettura", 12);
    para(step.concept, 10.5);
    sectionTitle("In sintesi", 12);
    para(step.takeaway, 10.5, "italic");

    step.prompts.forEach((prompt, n) => {
      label(prompt);
      answer(state.answers[`${i}-p${n}`] || "");
    });

    sectionTitle("Verifica la comprensione", 12);
    para(step.question, 10.5, "bold");
    step.options.forEach((option, n) => para(`${n + 1}. ${option}`, 10));
    const quiz = state.answers[`${i}-quiz`];
    para(
      `Risposta scelta: ${quiz !== undefined ? step.options[Number(quiz)] : "[Nessuna risposta]"}`,
      10,
      "bold",
    );
    para(`Risposta corretta: ${step.options[step.correct]}`, 10);
    para(step.explanation, 10);

    sectionTitle("Scenario e prospettive", 12);
    para(step.scenario, 10.5);
    step.choices.forEach((choice, n) => {
      para(`${n + 1}. ${choice}`, 10.5, "bold");
      para(step.perspectives[n], 9.5, "normal", MUTED);
    });
    const scenario = state.answers[`${i}-scenario`];
    para(
      `Scelta personale: ${scenario !== undefined ? step.choices[Number(scenario)] : "[Nessuna risposta]"}`,
      10,
      "bold",
    );
    label("La mia motivazione");
    answer(state.answers[`${i}-reason`] || "");

    const sources = (stepSources[i] ?? []).map((index) => teacherReferences[index]).filter(Boolean);
    if (sources.length) {
      sectionTitle("Riferimenti per questa tappa", 11);
      sources.forEach((reference) => {
        para(reference.title, 9.5, "bold");
        doc.setTextColor(...MUTED);
        para(reference.url, 8.5, "normal", MUTED);
      });
    }
  });

  // ------------------------------------------------------------- glossario
  newPage();
  sectionTitle("Glossario", 17);
  glossary.forEach(([term, definition]) => {
    para(term, 10.5, "bold", GREEN, "helvetica", 1);
    para(definition, 9.5, "normal", INK, "helvetica", 5);
  });

  if (!previousVersion) {
    newPage();
    sectionTitle("Riferimenti", 17);
    teacherReferences.forEach((reference) => {
      para(reference.title, 10.5, "bold", GREEN, "helvetica", 1);
      para(reference.description, 9.5, "normal", MUTED, "helvetica", 1);
      doc.setTextColor(...INK);
      doc.setFontSize(8.5);
      doc.textWithLink(reference.url, margin, y, { url: reference.url });
      y += 9;
    });
  }

  // ---------------------------------------------------------------- footer
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    if (page === 1) continue;
    doc.setDrawColor(220, 224, 214);
    doc.setLineWidth(0.3);
    doc.line(margin, 283, pageWidth - margin, 283);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Restare umani · ${siteMeta.url.replace("https://", "")}`, margin, 289);
    doc.text(`${page} / ${count}`, pageWidth - margin, 289, { align: "right" });
  }

  doc.save(
    previousVersion
      ? "restare-umani-percorso-precedente.pdf"
      : "restare-umani-quaderno-docente.pdf",
  );
}
