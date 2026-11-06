export const steps = [
  {
    title: "Il mio specchio digitale",
    short: "Io e l’IA",
    subtitle: "Riconoscere abitudini, aspettative e bisogni.",
    time: 10,
    category: "AUTOCOMPRENSIONE",
    intro:
      "Una calcolatrice restituisce un numero. Un sistema generativo restituisce parole che possono sembrarci comprensione. Partiamo da come lo usiamo, senza giudicarci.",
    concept:
      "L’IA generativa produce contenuti a partire da regolarità apprese nei dati. Una risposta fluida non è, da sola, una prova di verità, comprensione o cura.",
    prompts: [
      "In quali situazioni uso l’IA? Che cosa cerco: velocità, idee, conferme o ascolto?",
      "Che cosa provo quando una risposta sembra capirmi? Quale aspettativa nasce in me?",
    ],
    question: "Una risposta molto convincente è necessariamente affidabile?",
    options: [
      "Sì, la sicurezza del tono indica precisione.",
      "No, bisogna verificare contenuto e fonti.",
      "Sì, se è abbastanza lunga.",
    ],
    correct: 1,
    explanation:
      "La fluidità del linguaggio e l’affidabilità sono cose diverse. Controllare fonti, contesto e possibili errori resta un compito umano.",
    scenario:
      "Per preparare una presentazione, un compagno propone di usare un testo generato dall’IA senza controllarlo: «È scritto benissimo». Come rispondi?",
    choices: [
      "Lo usiamo così: il tono è convincente.",
      "Controlliamo le affermazioni e dichiariamo come abbiamo usato l’IA.",
      "Scartiamo tutto, senza leggerlo.",
    ],
    perspectives: [
      "La qualità dello stile non prova la verità. Quali affermazioni dovreste verificare?",
      "Verifica e trasparenza possono sostenere la vostra autonomia. Chi controlla quali fonti?",
      "Rifiutare tutto può evitare alcuni rischi, ma anche perdere uno spunto utile. Puoi valutare il testo senza delegare il giudizio?",
    ],
  },
  {
    title: "Quando mi fido troppo",
    short: "Fiducia e bias",
    subtitle: "Distinguere autorevolezza e autorità apparente.",
    time: 10,
    category: "PENSIERO CRITICO",
    intro:
      "Il testo allegato introduce l’automation bias: la tendenza a dare un peso eccessivo ai suggerimenti automatici. Non riguarda solo gli altri; può riguardare ciascuno di noi.",
    concept:
      "Una macchina può apparire neutrale, ma dati, progettazione e contesto d’uso influenzano il suo risultato. Il controllo critico non è sfiducia indiscriminata.",
    prompts: [
      "Ricordo una volta in cui ho accettato una risposta automatica senza verificarla? Che cosa mi ha convinto?",
      "Quali tre controlli posso fare prima di usare un’informazione generata?",
    ],
    question: "Quale comportamento aiuta a ridurre l’automation bias?",
    options: [
      "Confrontare la risposta con fonti indipendenti e pertinenti.",
      "Chiedere allo stesso sistema se è sicuro.",
      "Fidarsi solo delle risposte che ci danno ragione.",
    ],
    correct: 0,
    explanation:
      "Chiedere conferma allo stesso sistema non costituisce una verifica indipendente. Il confronto con fonti attendibili rende più solida la valutazione.",
    scenario:
      "Un assistente suggerisce una citazione perfetta per il tuo elaborato, ma non trovi il libro da cui sarebbe tratta. Che cosa fai?",
    choices: [
      "La inserisco perché esprime bene la mia idea.",
      "Cerco la fonte originale; se non la trovo, non la attribuisco.",
      "Chiedo al sistema di inventare un riferimento plausibile.",
    ],
    perspectives: [
      "Una bella frase può diventare una falsa attribuzione. Come potresti usarla senza spacciarla per una citazione?",
      "La verificabilità conta più della comodità. Quale fonte primaria potresti cercare?",
      "Un riferimento inventato rende più difficile controllare il lavoro. Quale responsabilità hai verso chi legge?",
    ],
  },
  {
    title: "Il valore del limite",
    short: "Limiti e libertà",
    subtitle: "Capire che cosa desideriamo non delegare.",
    time: 15,
    category: "DISCERNIMENTO",
    intro:
      "Nel dibattito allegato si confrontano due idee: il limite come ostacolo tecnico da correggere e il limite come confine che protegge l’esperienza umana. Non sono la stessa cosa.",
    concept:
      "Un errore di calcolo è un problema tecnico. La scelta di non affidare una decisione intima a un sistema è un confine etico. Riconoscere questa differenza apre il confronto, non lo chiude.",
    prompts: [
      "Quale decisione posso farmi aiutare a esplorare, ma non voglio delegare? Perché?",
      "Quando la disponibilità continua di uno strumento mi aiuta, e quando rischia di sostituire il confronto con una persona?",
    ],
    question: "Quale esempio esprime soprattutto un limite etico?",
    options: [
      "Un modello non riesce ad aprire un file.",
      "Un sistema impiega troppo tempo a rispondere.",
      "Una persona sceglie di non delegare una decisione morale.",
    ],
    correct: 2,
    explanation:
      "Il limite etico riguarda ciò che riteniamo giusto fare o non fare, anche quando tecnicamente è possibile. Non è semplicemente un malfunzionamento.",
    scenario:
      "Devi chiarire un conflitto con un amico. L’IA offre una risposta netta su chi ha ragione, basandosi soltanto sul tuo racconto.",
    choices: [
      "Le chiedo di decidere al posto mio.",
      "Uso qualche spunto, poi ascolto il mio amico e decido.",
      "Non uso l’IA e ne parlo con una persona di fiducia.",
    ],
    perspectives: [
      "Il sistema vede una sola versione dei fatti. Che cosa manca per un giudizio equo?",
      "Lo strumento può aiutare a formulare domande, ma non sostituisce l’ascolto reciproco. Quale domanda farai?",
      "Scegliere il confronto umano è un confine legittimo. Come puoi chiedere ascolto senza cercare solo conferme?",
    ],
  },
  {
    title: "Chi è responsabile?",
    short: "Responsabilità",
    subtitle: "Guardare oltre l’algoritmo, verso le persone.",
    time: 10,
    category: "CITTADINANZA DIGITALE",
    intro:
      "Dire «lo ha deciso l’algoritmo» rischia di nascondere le scelte umane. Chi progetta, chi mette in uso e chi utilizza un sistema ha responsabilità diverse da chiarire.",
    concept:
      "Accountability significa poter chiedere conto delle decisioni e delle conseguenze. La difficoltà di interpretare un modello non annulla il bisogno di verifiche, supervisione e possibilità di contestazione.",
    prompts: [
      "Se un sistema produce un risultato ingiusto, quali persone o organizzazioni dovrebbero darne conto?",
      "Quali garanzie vorrei prima che la scuola adottasse uno strumento di IA?",
    ],
    question: "Che cosa descrive meglio l’accountability?",
    options: [
      "Attribuire una coscienza morale al software.",
      "Rendere identificabili le responsabilità e chiedere conto delle decisioni.",
      "Considerare ogni errore inevitabile e quindi irrilevante.",
    ],
    correct: 1,
    explanation:
      "L’accountability riguarda persone e organizzazioni: ruoli chiari, verifiche e rimedi. Non richiede di trattare il modello come una persona.",
    scenario:
      "La scuola valuta di usare un sistema automatico per selezionare chi accederà a un progetto. I criteri non sono spiegati agli studenti.",
    choices: [
      "Accettiamo: l’automazione è sempre imparziale.",
      "Chiediamo criteri, controllo umano e un modo per contestare il risultato.",
      "Chiediamo di non adottarlo finché mancano garanzie.",
    ],
    perspectives: [
      "Anche i sistemi automatici possono riprodurre distorsioni. Quali effetti dovrebbero essere monitorati?",
      "Trasparenza, supervisione e contestazione aiutano la tutela degli studenti. Chi dovrebbe rispondere alle richieste?",
      "La cautela può essere ragionevole quando le conseguenze sono importanti. Quali condizioni permetterebbero di rivalutare la proposta?",
    ],
  },
  {
    title: "Due prospettive, un dialogo",
    short: "Il confronto",
    subtitle: "Ascoltare una tesi diversa dalla propria.",
    time: 15,
    category: "DIALOGO IN GRUPPO",
    intro:
      "Una prospettiva mette al centro i confini antropologici: non tutto ciò che è umano è delegabile. L’altra insiste sulla governance: regole e responsabilità possono rendere l’uso più sicuro.",
    concept:
      "Le due prospettive possono convergere sulla dignità umana, pur proponendo rimedi diversi. Comprendere una posizione non significa doverla condividere.",
    prompts: [
      "Qual è l’argomento più forte a favore di confini non delegabili all’IA?",
      "Qual è l’argomento più forte a favore di regole e responsabilità umane? Dove le due prospettive si incontrano?",
    ],
    question: "Quale frase favorisce un confronto rigoroso?",
    options: [
      "Chi non è d’accordo non capisce la tecnologia.",
      "Se ci sono rischi, ogni uso è sbagliato.",
      "Riformulo la tua tesi e distinguo i fatti dai giudizi di valore.",
    ],
    correct: 2,
    explanation:
      "Riformulare la tesi dell’altro aiuta a non ridurla a una caricatura. Distinguere fatti e valori permette di vedere i veri punti di disaccordo.",
    scenario:
      "Il gruppo si divide: alcuni vogliono vietare l’IA nelle attività scolastiche, altri vorrebbero usarla per qualsiasi compito.",
    choices: [
      "Cerchiamo usi consentiti, confini e motivazioni condivise.",
      "Difendo la mia posizione senza ascoltare.",
      "Chiedo a ogni parte di esporre prima l’argomento migliore dell’altra.",
    ],
    perspectives: [
      "Un patto condiviso può evitare il tutto-o-niente. Quale uso consentireste e quale no?",
      "La convinzione è legittima, ma non basta per dialogare. Quale obiezione potresti ascoltare davvero?",
      "Questo esercizio rende il confronto più equo. Che cosa cambia quando descrivi l’altra posizione con rispetto?",
    ],
  },
  {
    title: "Il mio patto di autonomia",
    short: "Il mio patto",
    subtitle: "Trasformare la riflessione in una scelta concreta.",
    time: 10,
    category: "SINTESI PERSONALE",
    intro:
      "Non si tratta di essere a favore o contro l’IA. Si tratta di scegliere come usarla, quali responsabilità mantenere e quali relazioni custodire.",
    concept:
      "Un patto di autonomia è un impegno rivedibile: dice come verificare, quando fermarsi e a chi rivolgersi. Non è una diagnosi né un profilo della tua personalità.",
    prompts: [
      "Completa il mio patto: userò l’IA per… Verificherò sempre… Non delegherò…",
      "Quale piccolo gesto farò nella prossima settimana per proteggere la mia autonomia e il confronto umano?",
    ],
    question: "Quale impegno è più concreto e verificabile?",
    options: [
      "Non sbaglierò mai più.",
      "Controllerò le fonti delle informazioni che inserisco nei miei lavori.",
      "Lascerò sempre decidere al sistema.",
    ],
    correct: 1,
    explanation:
      "Un impegno concreto descrive un’azione praticabile. L’autonomia non richiede infallibilità, ma attenzione, revisione e responsabilità.",
    scenario:
      "Fra una settimana userai di nuovo l’IA per un lavoro importante. Come porti con te questo percorso?",
    choices: [
      "Mi preparo una breve lista di controlli e limiti.",
      "Non cambio nulla: la riflessione resta qui.",
      "Condivido con il gruppo un patto d’uso, senza le mie risposte intime.",
    ],
    perspectives: [
      "Una lista può rendere operativo il patto. Quali tre controlli vuoi includere?",
      "Anche questa è una scelta da esplorare. Quale ostacolo rende difficile cambiare una piccola abitudine?",
      "La condivisione può sostenere la responsabilità, rispettando la riservatezza. Che cosa vuoi mantenere personale?",
    ],
  },
];
export const glossary = [
  [
    "IA generativa",
    "Sistemi che producono testi, immagini o altri contenuti sulla base di modelli appresi dai dati. La plausibilità del risultato non ne garantisce la verità.",
  ],
  [
    "Automation bias",
    "Tendenza ad attribuire eccessiva fiducia a un suggerimento automatico, riducendo la verifica critica.",
  ],
  [
    "Discernimento",
    "Valutazione attenta di possibilità, conseguenze e valori, per arrivare a una scelta di cui assumersi la responsabilità.",
  ],
  [
    "Limite etico",
    "Confine su ciò che riteniamo giusto fare: non coincide con ciò che la tecnologia è o non è capace di fare.",
  ],
  [
    "Accountability",
    "Possibilità di identificare chi deve rispondere di scelte, effetti e rimedi, anziché attribuire tutto alla macchina.",
  ],
  [
    "Scatola nera",
    "Metafora della difficoltà di spiegare in dettaglio i processi interni di un modello. Non significa che ogni controllo sia impossibile.",
  ],
  [
    "Guardrail e red teaming",
    "Misure di protezione e prove intenzionali per cercare comportamenti problematici. Possono ridurre il rischio, senza garantire sicurezza assoluta.",
  ],
  [
    "Antropomorfizzazione",
    "Attribuzione di caratteristiche umane a un sistema: ad esempio interpretare una frase empatica come prova di sentimenti.",
  ],
];
export const sources = [
  {
    title: "Il testo di partenza",
    description:
      "Trascrizione del dibattito fornita dall’utente. Le attività sono una rielaborazione didattica, non citazioni letterali. Le tesi filosofiche sono presentate come prospettive da discutere.",
    url: "",
  },
  {
    title: "Cucci e Giacchetti · La Civiltà Cattolica",
    description:
      "Per un’intelligenza artificiale al servizio della dignità umana, novembre 2026. Titolo e autori riscontrati nell’indice pubblico; testo integrale non verificato. Non riprendiamo statistiche o casi di cronaca della trascrizione come fatti accertati.",
    url: "https://www.laciviltacattolica.it/articolo/per-unintelligenza-artificiale-al-servizio-della-dignita-umana/",
  },
  {
    title: "Leone XIV · Magnifica Humanitas",
    description:
      "Fonte ufficiale dell’enciclica sulla tutela della persona nell’epoca dell’intelligenza artificiale. Il riferimento a «Leone X» nella trascrizione è corretto in Leone XIV. Nessun estratto letterale è usato nelle attività.",
    url: "https://www.vatican.va/content/leo-xiv/en/encyclicals/documents/20260515-magnifica-humanitas.html",
  },
];
export type Answers = Record<string, string>;
export type SavedState = { answers: Answers; completed: number[]; current: number; name: string };
export const emptyState: SavedState = { answers: {}, completed: [], current: 0, name: "" };
