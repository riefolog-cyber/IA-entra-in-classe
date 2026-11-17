/**
 * Prompt per leggere il percorso con un modello esterno (Gemini, ChatGPT,
 * Claude…), caricando il PDF del quaderno: il sito non chiama alcun modello.
 *
 * Perché vive qui e non nel testo della vista: lo stesso testo serve al
 * pulsante "copia", alla documentazione e ai test che controllano che le
 * istruzioni non perdano pezzi (le dieci tappe, le citazioni, le cautele).
 */

export const GEMINI_ANALYSIS_PROMPT = [
  "Sei un formatore esperto che accompagna docenti nella riflessione professionale sull'uso dell'IA a scuola. Ti ho allegato il mio quaderno di aggiornamento in PDF. Leggilo e costruisci un QUADRO COMPLETO del mio percorso: non un riassunto, non una valutazione.",
  "",
  "CHE COSA CONTANO COME MIE PAROLE",
  "Nel PDF ci sono testi scritti dal sito (introduzione della tappa, «Una chiave di lettura», «In sintesi», descrizioni degli scenari) e testi scritti da me. Considera MIE SOLO:",
  '- "Riflessione 1", "Riflessione 2" e le risposte ai prompt;',
  '- "Risposta scelta" della verifica;',
  '- "Scelta personale" dello scenario;',
  '- "La mia motivazione".',
  "Tutto il resto è materiale del corso: non attribuirmelo e non interpretarlo come mia scelta.",
  "",
  "REGOLE",
  "- Il percorso ha 10 tappe: considerale TUTTE, comprese quelle non compilate, che vanno dichiarate come non ancora lavorate e NON interpretate.",
  "- Ogni affermazione importante deve poggiare su una citazione letterale breve (max 12 parole) delle mie risposte, con il numero della tappa.",
  "- Non inventare citazioni: se non trovi una frase che sostiene un'affermazione, togli l'affermazione.",
  "- Non fare diagnosi, non dare punteggi, non usare etichette sulla persona, non giudicare.",
  "- I punti di forza sono risorse professionali riconoscibili nel testo, non complimenti. Le tensioni sono punti in cui il percorso si complica, non difetti.",
  "- I temi non affrontati sono assenze, non mancanze morali.",
  "- Un campo vuoto è un dato mancante, non un segnale psicologico.",
  "- Se il materiale è scarso, dillo nella confidenza: meglio un quadro onesto e incompleto che uno pieno di supposizioni.",
  "- Scrivi in italiano, in modo chiaro e asciutto.",
  "",
  "RISPONDI CON QUESTE SEZIONI, IN QUEST'ORDINE",
  "1. Titolo (max 8 parole) e lettura d'insieme (4-6 frasi): che cosa rivela il mio percorso del mio modo di insegnare?",
  "2. Copertura: quante tappe risultano lavorate su 10 e quali sono vuote. La lettura si fonda su questo, non su ciò che manca.",
  '3. Le dieci tappe, una per una (tappa 1 … tappa 10): per ciascuna, 1-3 frasi su che cosa mostra, oppure "non ancora lavorata". Aggiungi la citazione che la sostiene.',
  "4. Dimensioni trasversali (scegli le 3-5 più presenti, con citazione e una domanda aperta per ciascuna): progettazione · verifica delle fonti · valutazione e feedback · processo visibile · regole condivise · comunicazione · inclusione e dati · sperimentazione · sostenibilità · relazione professionale.",
  '5. Intenzioni e pratiche (max 3 voci): che cosa dichiaro e che cosa scelgo davvero. Segna "allineata" o "tensione", con le citazioni delle due parti.',
  "6. Risorse professionali (2-4) e tensioni da esplorare (2-4).",
  "7. Temi non ancora affrontati (0-4), se ci sono.",
  "8. Domande per me (2-4): aperte, senza suggerire la risposta.",
  "9. Passi concreti (1-3): per ciascuno l'azione, quale evidenza mi farà capire che ha funzionato, entro quanto tempo.",
  "10. Confidenza: bassa / media / alta, su che cosa si fonda, e quali risposte la cambierebbero.",
  "11. Avvertenza finale: una frase sul carattere interpretativo e parziale della lettura.",
].join("\n");

/** Precisazione da inviare dopo una lettura che non rappresenta il docente. */
export const GEMINI_CORRECTION_PROMPT =
  "Questa lettura non mi rappresenta in un punto: [spiega, per esempio «nella tappa 3 ho scelto quella risposta perché…»]. Rifai il quadro tenendo conto di questa precisazione, mantenendo tutte e dieci le tappe e citando le mie parole. Dimmi anche che cosa cambia rispetto alla lettura precedente.";

/** Variante per chi vuole il risultato in JSON, da riusare altrove. */
export const GEMINI_JSON_SUFFIX =
  "Restituisci tutto in un unico oggetto JSON valido, senza testo fuori dal JSON, con i campi: headline, narrative, coverage{stepsTotal,stepsWorked,emptySteps}, steps[{step,title,worked,reading,evidence[{step,quote}]}], dimensions[{dimension,whatEmerges,evidence,openQuestion}], coherence[{intention,practice,kind,evidence}], strengths[], tensions[], blindSpots[], questions[], nextSteps[{action,howYouWillKnow,within}], confidence{level,because,whatWouldChangeIt}, caution.";

/** Avviso da mostrare accanto al pulsante: caricare il PDF è un invio a terzi. */
export const GEMINI_PRIVACY_NOTE =
  "Caricando il PDF su un servizio esterno invii tutto il quaderno, compreso il tuo nome in copertina. Togli prima eventuali nomi di studenti, colleghi o famiglie.";

/** Link diretto: nessun tracciamento, si apre in una nuova scheda. */
export const GEMINI_URL = "https://gemini.google.com/app";
