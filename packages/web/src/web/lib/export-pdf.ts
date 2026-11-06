import { jsPDF } from "jspdf";
import { steps as previousSteps, glossary as previousGlossary } from "./content";
import { steps as teacherSteps, glossary as teacherGlossary, type SavedState } from "./teacher-content";

export function exportPdf(state: SavedState, previousVersion = false) {
  const steps = previousVersion ? previousSteps : teacherSteps;
  const glossary = previousVersion ? previousGlossary : teacherGlossary;
  const doc = new jsPDF();
  let y = 25;
  const clean = (s: string) =>
    s
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/→/g, ">");
  const paragraph = (text: string, size = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(32, 59, 50);
    const lines: string[] = doc.splitTextToSize(clean(text), 166);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, 22, y);
      y += size * 0.48;
    }
    y += 4;
  };
  paragraph("RESTARE UMANI", 24, true);
  paragraph(previousVersion ? "Percorso personale precedente" : "IA a scuola · Il mio quaderno di aggiornamento professionale", 14);
  paragraph(
    `Esportato il ${new Date().toLocaleDateString("it-IT")} · ${state.completed.length} tappe segnate come concluse su 6`,
  );
  if (state.name.trim()) paragraph(`Nome o pseudonimo: ${state.name}`);
  paragraph(
    "Questo documento raccoglie tutte le attività del percorso e le risposte presenti al momento dell’esportazione. Le risposte mancanti sono indicate. Non è una valutazione della persona. Condividi solo ciò che desideri; conserva il file con cura.",
  );
  if (!previousVersion) paragraph("Percorso per docenti: progettazione, verifica dei materiali, valutazione, inclusione e dati, regole d’uso e sperimentazione. I casi sono inventati. Non inserire dati identificativi degli alunni. Le attività non sostituiscono le procedure dell’istituto.");
  steps.forEach((step, i) => {
    doc.addPage();
    y = 25;
    paragraph(`Tappa ${i + 1} · ${step.title}`, 19, true);
    paragraph(
      state.completed.includes(i) ? "Segnata come conclusa" : "Non ancora segnata come conclusa",
      10,
    );
    paragraph(step.intro);
    paragraph("Idea da approfondire", 12, true);
    paragraph(step.concept);
    step.prompts.forEach((prompt, n) => {
      paragraph(prompt, 11, true);
      paragraph(state.answers[`${i}-p${n}`] || "[Nessuna risposta]");
    });
    paragraph("Quiz di comprensione", 13, true);
    paragraph(step.question, 11, true);
    step.options.forEach((o, n) => paragraph(`${n + 1}. ${o}`, 10));
    const q = state.answers[`${i}-quiz`];
    paragraph(
      `Risposta scelta: ${q !== undefined ? step.options[Number(q)] : "[Nessuna risposta]"}`,
    );
    paragraph(`Risposta corretta: ${step.options[step.correct]}`);
    paragraph(`Spiegazione: ${step.explanation}`);
    paragraph("Scenario e prospettive", 13, true);
    paragraph(step.scenario);
    step.choices.forEach((c, n) => {
      paragraph(`${n + 1}. ${c}`, 11, true);
      paragraph(step.perspectives[n], 10);
    });
    const s = state.answers[`${i}-scenario`];
    paragraph(
      `Scelta personale: ${s !== undefined ? step.choices[Number(s)] : "[Nessuna risposta]"}`,
    );
    paragraph("La mia motivazione", 11, true);
    paragraph(state.answers[`${i}-reason`] || "[Nessuna risposta]");
  });
  doc.addPage();
  y = 25;
  paragraph(previousVersion ? "Il mio diario libero" : "Il mio diario professionale", 20, true);
  paragraph(state.answers.diary || "[Nessuna nota]");
  paragraph("Glossario", 17, true);
  glossary.forEach(([term, definition]) => {
    paragraph(term, 11, true);
    paragraph(definition);
  });
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 110, 100);
    doc.text("Restare umani · Documento personale", 22, 286);
    doc.text(`${page} / ${count}`, 185, 286, { align: "right" });
  }
  doc.save(previousVersion ? "restare-umani-percorso-precedente.pdf" : "restare-umani-quaderno-docente.pdf");
}
