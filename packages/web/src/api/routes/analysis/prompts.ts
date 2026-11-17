import { DIMENSIONS, type AnalysisDossier, type DossierStep } from "./schema";

/**
 * Versione delle istruzioni: fa parte della chiave di cache, quindi cambiare
 * una riga qui invalida le letture precedenti senza toccare altri numeri.
 */
export const PROMPT_VERSION = "2026-11-quadro-v2";

const RULES = [
  "Scrivi in italiano.",
  "Non fare diagnosi, non dare punteggi, non usare etichette sulla persona, non giudicare il docente.",
  "Non menzionare studenti, colleghi o famiglie; non riportare nomi propri.",
  "Non inventare fatti: se un'informazione non è nel testo, non c'è.",
  "Un campo vuoto è un dato mancante, non un segnale psicologico.",
].join(" ");

/** Fase 1: lettura di una singola tappa, con citazioni letterali. */
export function buildStepMapPrompt(step: DossierStep): string {
  const answers = step.answers
    .map((entry) => `${entry.field} — ${entry.question}\nRisposta: ${entry.answer || "[vuota]"}`)
    .join("\n\n");

  const quiz = step.quiz
    ? `Verifica: ${step.quiz.question}\nScelta: ${step.quiz.chosen ?? "[nessuna]"}\nRisposta corretta: ${step.quiz.correct}\nEsito: ${step.quiz.isCorrect ? "corretto" : "non corretto"}`
    : "Verifica: non compilata.";

  const scenario = step.scenario
    ? `Scenario: ${step.scenario.prompt}\nScelta: ${step.scenario.chosen ?? "[nessuna]"}\nMotivazione: ${step.reason || "[vuota]"}`
    : "Scenario: non scelto.";

  return [
    "Sei un formatore che legge il quaderno di un docente. Analizzi UNA tappa alla volta: restituisci solo ciò che questa tappa mostra, senza anticipare il resto del percorso.",
    RULES,
    "Restituisci JSON valido con questa forma:",
    '{"criterion":"il criterio professionale che il docente dichiara o usa, in una frase (o stringa vuota)","decision":"che cosa ha deciso di fare, in una frase","tension":"il punto in cui la scelta si complica (o stringa vuota)","quotes":[{"field":"nome del campo","quote":"citazione letterale, max 12 parole"}]}',
    "Le citazioni sono obbligatorie solo quando servono a sostenere una frase: massimo 2, copiate parola per parola dalle risposte, senza aggiungere parole.",
    "",
    `TAPPA ${step.step + 1} DI 10 — ${step.title} (${step.phase})`,
    step.worked ? "Stato: tappa lavorata dal docente." : "Stato: tappa non ancora lavorata.",
    answers,
    "",
    quiz,
    "",
    scenario,
  ].join("\n");
}

type SynthesisInput = {
  summary?: string;
  dossier?: AnalysisDossier;
  map: string;
  correction?: string;
};

/** Fase 2: il quadro completo, costruito sulla mappa delle dieci tappe. */
export function buildSynthesisPrompt(input: SynthesisInput): string {
  const coverage = input.dossier?.coverage;
  const coverageLine = coverage
    ? `Copertura reale: ${coverage.stepsWorked} tappe lavorate su ${coverage.stepsTotal}, ${coverage.fieldsAnswered} campi compilati su ${coverage.fieldsTotal}, ${coverage.quizAnswered} verifiche risposte (${coverage.quizCorrect} corrette). Tappe vuote: ${
        coverage.emptySteps.length
          ? coverage.emptySteps.map((step) => step + 1).join(", ")
          : "nessuna"
      }.`
    : "";

  const stepTitles = (input.dossier?.steps ?? [])
    .map((step) => `${step.step + 1}. ${step.title}`)
    .join("\n");

  return [
    "Sei un formatore esperto che accompagna docenti nella riflessione professionale sull'uso dell'IA a scuola. Devi costruire un QUADRO COMPLETO del percorso, non un riassunto.",
    RULES,
    "Il percorso ha dieci tappe: il quadro deve considerarle tutte, comprese quelle non ancora lavorate, che vanno dichiarate come tali senza interpretarle.",
    "Ogni affermazione importante deve poggiare su una citazione letterale già presente nel materiale: non inventare citazioni e non parafrasare dentro il campo quote.",
    "Leggi il percorso come documentazione professionale: come progetta, verifica, valuta, comunica, tutela, sperimenta? Quali criteri dichiara? Dove intenzioni e pratiche divergono? Che cosa non ha ancora affrontato?",
    "Le strengths sono risorse professionali riconoscibili dal testo, non complimenti. Le tensions sono luoghi in cui il percorso si complica, non difetti della persona. I blindSpots sono temi non affrontati, non mancanze morali.",
    "Se il materiale è scarso, dillo nella confidence e nelle domande: meglio un quadro onesto e incompleto che uno pieno di supposizioni.",
    "",
    "Restituisci SOLO JSON valido, con questa forma:",
    '{"headline":"titolo interpretativo breve (max 8 parole)","narrative":"4-6 frasi: che cosa rivela il percorso del modo di insegnare di questo docente","steps":[{"step":1,"title":"titolo della tappa","worked":true,"reading":"che cosa mostra questa tappa, 1-3 frasi; se non è lavorata, dichiaralo","evidence":[{"step":1,"quote":"citazione letterale"}]}],"dimensions":[{"dimension":"progettazione","whatEmerges":"che cosa emerge su questa dimensione","evidence":[{"step":2,"quote":"citazione letterale"}],"openQuestion":"domanda aperta"}],"coherence":[{"intention":"che cosa dichiara","practice":"che cosa sceglie","kind":"tensione","evidence":[{"step":3,"quote":"citazione"}]}],"strengths":["2-4 risorse professionali con un rimando concreto"],"tensions":["2-4 tensioni da esplorare"],"blindSpots":["0-4 temi non affrontati, se ci sono"],"questions":["2-4 domande aperte di autocomprensione, senza suggerire la risposta"],"nextStep":"un passo concreto e verificabile","nextSteps":[{"action":"azione","howYouWillKnow":"quale evidenza la conferma","within":"entro quanto"}],"confidence":{"level":"bassa|media|alta","because":"su che cosa si fonda","whatWouldChangeIt":"quali risposte cambierebbero il quadro"},"caution":"una frase sul carattere interpretativo e parziale della lettura"}',
    "",
    `Diminuisci il livello di confidence quando le tappe lavorate sono poche. Le dimensioni ammesse sono: ${DIMENSIONS.join(", ")}.`,
    "Nel campo `steps` devono comparire TUTTE E DIECI le tappe del percorso, in ordine, anche quelle non lavorate: per quelle usa `worked:false` e una `reading` che dice che non sono state ancora affrontate.",
    "Massimo 5 dimensioni, massimo 3 passi successivi, massimo 2 citazioni per voce: meglio poche cose fondate che molte cose vaghe.",
    "",
    coverageLine,
    stepTitles ? `\nLE DIECI TAPPE DEL PERCORSO:\n${stepTitles}` : "",
    input.correction
      ? `\nPRECISAZIONE DEL DOCENTE (tienine conto, ha la precedenza sulla tua lettura):\n"${input.correction}"`
      : "",
    "",
    "MAPPATURA DELLE TAPPE (letture già fatte, con citazioni verificate):",
    input.map,
    input.summary ? `\nTESTO COMPLETO DEL QUADERNO:\n${input.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Chiamata in un solo passaggio: nessuna scheda strutturata (client vecchi, mobile). */
export function buildSingleShotPrompt(summary: string, correction?: string): string {
  return buildSynthesisPrompt({
    summary,
    map: "Nessuna mappatura separata: leggi direttamente il testo del quaderno. Se una tappa non è compilata, dichiaralo.",
    correction,
  });
}
