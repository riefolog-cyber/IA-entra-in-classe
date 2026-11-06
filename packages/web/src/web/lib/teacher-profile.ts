import { steps, type SavedState } from "./teacher-content";

export type TeacherProfile = {
  headline: string;
  summary: string;
  strengths: string[];
  growth: string[];
  questions: string[];
};

const themes = [
  {
    key: "verifica",
    label: "la verifica delle fonti e dei materiali",
    words: ["verific", "font", "controll", "attendibil", "error", "riscontr", "affidabil"],
  },
  {
    key: "dati",
    label: "la tutela dei dati e l'inclusione",
    words: ["dati", "privacy", "inclus", "accessib", "barrier", "diagnos", "document", "tutel"],
  },
  {
    key: "valutazione",
    label: "la valutazione e il feedback",
    words: ["valut", "feedback", "criter", "evidenz", "rubric", "giudiz"],
  },
  {
    key: "progettazione",
    label: "la progettazione didattica",
    words: ["obiettiv", "progett", "apprend", "lezione", "attivit", "compit", "consegn"],
  },
  {
    key: "relazione",
    label: "la relazione e il confronto tra colleghi",
    words: ["relazion", "confront", "colleg", "ascolt", "dialog", "gruppo", "dipartiment", "famigl"],
  },
  {
    key: "sperimentazione",
    label: "la sperimentazione e la revisione",
    words: ["speriment", "prova", "rived", "sospend", "monitor", "risultat", "revision"],
  },
  {
    key: "sostenibilita",
    label: "la sostenibilità del lavoro docente",
    words: ["tempo", "caric", "sostenib", "frett", "veloc", "durata"],
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countOccurrences(text: string, word: string) {
  return text.split(word).length - 1;
}

export function buildTeacherProfile(data: SavedState): TeacherProfile {
  const promptTexts = steps.map((_, i) => (data.answers[`${i}-p0`] || "").trim());
  const reasonTexts = steps.map((_, i) => (data.answers[`${i}-reason`] || "").trim());
  const quizAnswers = steps.map((_, i) => data.answers[`${i}-quiz`]);
  const allText = normalize([...promptTexts, ...reasonTexts].join(" "));
  const answeredCount = Object.values(data.answers).filter((v) => String(v).trim()).length;

  const themeCounts = themes
    .map((theme) => ({
      ...theme,
      count: theme.words.reduce((total, word) => total + countOccurrences(allText, word), 0),
    }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);

  const topThemes = themeCounts.slice(0, 2);
  const presentKeys = new Set(themeCounts.map((theme) => theme.key));
  const correctCount = steps.filter((s, i) => quizAnswers[i] === String(s.correct)).length;
  const wrongSteps = steps.filter(
    (s, i) => quizAnswers[i] !== undefined && quizAnswers[i] !== String(s.correct),
  );
  const missingQuiz = steps.filter((_, i) => quizAnswers[i] === undefined);
  const detailedSteps = steps.filter(
    (_, i) => promptTexts[i].length >= 60 || reasonTexts[i].length >= 60,
  );
  const filledScenarios = steps.filter((_, i) => data.answers[`${i}-scenario`] !== undefined);
  const motivatedScenarios = steps.filter(
    (_, i) => data.answers[`${i}-scenario`] !== undefined && reasonTexts[i].length >= 30,
  );
  const shortSteps = steps.filter(
    (_, i) => promptTexts[i].length < 20 && reasonTexts[i].length < 20,
  );

  const headline = topThemes.length
    ? `Un profilo che mette al centro ${topThemes[0].label}${
        topThemes[1] ? ` e ${topThemes[1].label}` : ""
      }`
    : "Un profilo in costruzione";

  const summaryParts = [
    `${data.completed.length}/6 tappe concluse`,
    `${correctCount}/6 quiz corretti`,
    `${answeredCount} risposte compilate`,
  ];
  if (filledScenarios.length) summaryParts.push(`${filledScenarios.length} scenari scelti`);
  if (detailedSteps.length) summaryParts.push(`${detailedSteps.length} riflessioni approfondite`);

  const strengths: string[] = [];
  if (topThemes.length) {
    strengths.push(
      `Dalle tue risposte emerge un'attenzione ricorrente verso ${topThemes[0].label}${
        topThemes[1] ? ` e verso ${topThemes[1].label}` : ""
      }.`,
    );
  }

  const strongSteps = steps.filter(
    (s, i) =>
      (promptTexts[i].length >= 60 || reasonTexts[i].length >= 60) &&
      quizAnswers[i] === String(s.correct),
  );
  for (const step of strongSteps.slice(0, 2)) {
    const index = steps.indexOf(step);
    strengths.push(
      `Nella tappa ${index + 1} («${step.short}») hai unito una riflessione personale a una risposta corretta al quiz: è un segno di comprensione applicata.`,
    );
  }

  if (data.completed.length >= 4) {
    strengths.push(
      `Hai portato a termine ${data.completed.length} tappe su 6: il percorso sta diventando una pratica costante, non una lettura isolata.`,
    );
  } else if (data.completed.length > 0) {
    strengths.push(
      `Hai già concluso ${data.completed.length} tappe: il profilo può crescere con le tappe ancora aperte.`,
    );
  }

  if (motivatedScenarios.length >= 2) {
    strengths.push(
      `In ${motivatedScenarios.length} scenari hai accompagnato la scelta con una motivazione: stai rendendo esplicito il tuo criterio professionale.`,
    );
  }
  if (strengths.length === 0) {
    strengths.push(
      "Hai iniziato il percorso: anche poche risposte possono diventare un punto di partenza per l'autovalutazione.",
    );
  }

  const growth: string[] = [];
  for (const step of wrongSteps.slice(0, 2)) {
    const index = steps.indexOf(step);
    growth.push(
      `Nella tappa ${index + 1} («${step.short}») il quiz segnala un concetto da riprendere: prova a rispiegare la risposta corretta con un esempio della tua disciplina.`,
    );
  }
  if (missingQuiz.length) {
    const step = missingQuiz[0];
    const index = steps.indexOf(step);
    growth.push(
      `Il quiz della tappa ${index + 1} («${step.short}») non è ancora compilato: è un punto rapido per verificare la tua comprensione.`,
    );
  }
  for (const step of shortSteps.slice(0, 2)) {
    const index = steps.indexOf(step);
    growth.push(
      `Nella tappa ${index + 1} («${step.short}») la riflessione scritta è ancora essenziale: aggiungi un caso concreto, un rischio e una condizione da verificare.`,
    );
  }
  const uncompleted = steps.filter((_, i) => !data.completed.includes(i));
  if (uncompleted.length && uncompleted.length < steps.length) {
    const step = uncompleted[0];
    const index = steps.indexOf(step);
    growth.push(
      `La tappa ${index + 1} («${step.short}») non è ancora segnata come conclusa: riprendila quando vuoi trasformare la riflessione in una scelta verificabile.`,
    );
  }
  if (topThemes.length < 2) {
    growth.push(
      "Le tue risposte esplorano pochi temi: prova a collegare la scelta dell'IA a dati, inclusione e valutazione, non solo allo strumento.",
    );
  }
  if (growth.length === 0) {
    growth.push(
      "Il quadro è equilibrato: scegli una tappa e prova a scrivere una motivazione più articolata, con un esempio e un possibile rischio.",
    );
  }
  if (growth.length < 2) {
    growth.push(
      "Trasforma una riflessione in una micro-sperimentazione: scegli un'obiezione, un'evidenza osservabile e un criterio per rivedere la scelta.",
    );
  }

  const questions: string[] = [];
  if (!presentKeys.has("verifica")) {
    questions.push("Come controlleresti un materiale generato prima di usarlo in classe?");
  }
  if (!presentKeys.has("dati")) {
    questions.push(
      "Quali dati o dettagli degli alunni non inseriresti in uno strumento esterno, e perché?",
    );
  }
  if (!presentKeys.has("valutazione")) {
    questions.push(
      "Quali evidenze useresti per distinguere un prodotto curato da un apprendimento reale?",
    );
  }
  if (!presentKeys.has("relazione")) {
    questions.push("Con chi discuteresti una scelta di uso dell'IA prima di adottarla?");
  }
  if (!presentKeys.has("sperimentazione")) {
    questions.push(
      "Quale piccola prova potresti fare, con quali evidenze e quale criterio per fermarti?",
    );
  }
  if (themeCounts.length >= 2 && themeCounts[themeCounts.length - 1].count < topThemes[0].count) {
    const weakTheme = themeCounts[themeCounts.length - 1];
    questions.push(
      `Le tue risposte mettono al centro ${topThemes[0].label}: quale rapporto vedi con ${weakTheme.label}?`,
    );
  }
  if (wrongSteps.length) {
    const step = wrongSteps[0];
    const index = steps.indexOf(step);
    questions.push(
      `Rileggendo la tappa ${index + 1}, sapresti spiegare perché la risposta corretta è «${
        step.options[step.correct]
      }»?`,
    );
  }
  if (questions.length < 3) {
    questions.push(
      "Quale parte del tuo lavoro desideri proteggere dalla delega, anche quando l'IA potrebbe svolgerla?",
    );
  }
  if (questions.length < 3) {
    questions.push(
      "Se un collega ti chiedesse perché hai fatto questa scelta, quale argomento useresti?",
    );
  }

  return {
    headline,
    summary: summaryParts.join(" · ") + ".",
    strengths: strengths.slice(0, 4),
    growth: growth.slice(0, 4),
    questions: questions.slice(0, 3),
  };
}
