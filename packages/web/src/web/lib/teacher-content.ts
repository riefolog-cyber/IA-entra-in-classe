export type Answers = Record<string, string>;
export type SavedState = { answers: Answers; completed: number[]; current: number; name: string };
export const emptyState: SavedState = { answers: {}, completed: [], current: 0, name: "" };

export const steps = [
  {
    title: "Prima l’apprendimento, poi l’IA",
    short: "Progettare con l’IA",
    subtitle: "Partire da un obiettivo, non da uno strumento.",
    category: "PROGETTAZIONE DIDATTICA",
    decisionFocus: "obiettivo di apprendimento vs. efficienza dello strumento",
    phase: "Progettazione",
    intro:
      "Il punto di partenza non è “cosa può fare l’IA?”, ma “che cosa devono imparare gli studenti?”.\n\nIn questo percorso non cerchiamo solo di lavorare più velocemente: chiediamoci che cosa deve restare un’esperienza attiva per la classe. Se non usi ancora l’IA, parti da un’attività che conosci bene.",
    concept:
      "Uno strumento è utile quando serve un obiettivo di apprendimento osservabile (per esempio: confrontare, argomentare, risolvere un problema).\n\nProdurre più materiali non significa far apprendere meglio. Conta decidere in anticipo: quale lavoro resta al docente, quale al sistema e quale agli studenti.",
    prompts: [
      "Quale parte del tuo lavoro non delegherai all’IA, e perché? (Pensa a una scelta o relazione professionale che vuoi mantenere in prima persona.)",
    ],
    question: "Quale criterio è più utile per decidere se integrare l’IA in una lezione?",
    options: [
      "Riduce il tempo di preparazione e permette di trattare più contenuti nello stesso numero di ore.",
      "La proposta sostiene l’obiettivo e mantiene visibile il lavoro cognitivo degli studenti.",
      "Ha funzionato in un’altra classe, quindi può essere riproposta con gli stessi materiali.",
    ],
    correct: 1,
    explanation:
      "Prima viene l’allineamento tra obiettivo, attività ed evidenze di apprendimento; poi la scelta dello strumento.\n\nRisparmio di tempo, stile e riusabilità possono aiutare, ma da soli non garantiscono comprensione.",
    scenario:
      "Devi insegnare a confrontare due spiegazioni di un fenomeno. L’IA propone una scheda con sintesi e confronto già completati.\n\nHai poco tempo per preparare la lezione: come la usi?",
    choices: [
      "La uso come esempio svolto, seguito da un nuovo confronto autonomo.",
      "Elimino il confronto finale e chiedo agli studenti di costruirlo e motivarlo.",
      "Non la uso: parto da due brevi testi selezionati da me.",
    ],
    perspectives: [
      "Un esempio svolto può sostenere chi è all’inizio. Come verifichi che nella seconda attività gli studenti confrontino davvero, invece di riprodurre il modello?",
      "Restituire il confronto agli studenti rende visibile il ragionamento. Quali domande o supporti servono per rendere il compito accessibile?",
      "Non usare l’IA è una scelta legittima se serve l’obiettivo. Quali vantaggi offrono i testi scelti e quale tempo di preparazione accetti?",
    ],
  },
  {
    title: "Prima di portarlo in classe",
    short: "Verificare i materiali",
    subtitle: "Controllare contenuti, consegne e rappresentazioni.",
    category: "QUALITÀ E PENSIERO CRITICO",
    decisionFocus: "velocità di preparazione vs. accuratezza disciplinare",
    phase: "Progettazione",
    intro:
      "Un testo generato può sembrare chiaro e ben scritto, ma contenere errori, semplificazioni scorrette o esempi poco adatti alla classe.\n\nQui entra in gioco l’automation bias: la tendenza a fidarsi troppo di un output automatico perché appare professionale (ad esempio, una scheda ordinata o una rubrica ben formattata).",
    concept:
      "Prima dell’uso in classe, vale la pena fare una revisione rapida ma mirata: correttezza disciplinare, coerenza delle consegne, chiarezza del linguaggio ed esempi/rappresentazioni inclusivi.\n\nChiedere allo stesso sistema di “confermare” il proprio risultato non è una verifica indipendente.",
    prompts: [
      "Quale controllo non salterai mai, neppure con fretta, e perché? (Es. contenuti, consegna, esempi, linguaggio, accessibilità.)",
    ],
    question:
      "L’IA ha generato esercizi con soluzioni. Quale verifica è più solida prima dell’uso?",
    options: [
      "Risolvere gli esercizi e controllare i contenuti con risorse disciplinari indipendenti.",
      "Chiedere al sistema di dichiarare il proprio livello di sicurezza e correggere solo gli esercizi che segnala come incerti.",
      "Confrontare il livello di difficoltà con il programma svolto e usare gli esercizi che includono già le soluzioni.",
    ],
    correct: 0,
    explanation:
      "La verifica deve poter scoprire errori anche quando il sistema continua a confermarli.\n\nRisolvere i compiti e usare risorse indipendenti è il controllo più solido; difficoltà e accessibilità vanno comunque valutate a parte.",
    scenario:
      "In una scheda generata trovi un errore disciplinare. Inoltre, gli esempi rappresentano un solo contesto culturale.\n\nLa lezione è domani: che cosa fai?",
    choices: [
      "Correggo la scheda e rivedo gli esempi prima di usarla.",
      "Trasformo una parte in un’attività guidata di verifica degli errori.",
      "Scarto la scheda e uso materiale già validato.",
    ],
    perspectives: [
      "La revisione può rendere utile la bozza, ma correggere un punto non basta. Come controllerai il resto del materiale e la pertinenza degli esempi?",
      "L’errore può diventare occasione di apprendimento, se gli studenti hanno strumenti per riconoscerlo. Come eviti di fissare la concezione sbagliata?",
      "Scartare il materiale è una scelta professionale, non un fallimento. Quale soglia di rischio o limite di tempo ti porta a rinunciare?",
    ],
  },
  {
    title: "Valutare senza delegare il giudizio",
    short: "Valutazione e feedback",
    subtitle: "Distinguere un suggerimento dal giudizio professionale.",
    category: "RESPONSABILITÀ VALUTATIVA",
    decisionFocus: "giudizio automatico vs. giudizio professionale",
    phase: "Pratica",
    intro:
      "Una rubrica o una bozza di feedback possono essere un buon supporto.\n\nMa il giudizio professionale non si riduce a un testo generato: richiede di leggere il processo, ascoltare lo studente e motivare la valutazione.",
    concept:
      "Valutare in modo solido significa usare criteri espliciti ed evidenze pertinenti (non solo il prodotto finale).\n\nUn indicatore automatico — ad esempio un “rilevatore” di IA — non è una prova sufficiente, né di apprendimento né di uso scorretto. Il docente deve poter spiegare e, se serve, rivedere il proprio giudizio.",
    prompts: [
      "Quale evidenza useresti per capire se uno studente ha davvero appreso, oltre al prodotto finale? (Es. spiegazione orale, bozza, revisione, applicazione in classe.)",
    ],
    question:
      "Un rilevatore segnala che un elaborato sarebbe stato generato dall’IA. Qual è l’interpretazione più prudente?",
    options: [
      "Assegnare una penalizzazione solo se il punteggio supera una soglia concordata nel dipartimento.",
      "Chiedere allo studente di riscrivere l’elaborato in classe, senza discuterne prima.",
      "La segnalazione non basta: occorrono criteri chiari e un confronto sul processo.",
    ],
    correct: 2,
    explanation:
      "Una segnalazione automatica può essere errata e non racconta come è stato svolto il lavoro.\n\nServe una verifica più ampia: regole comunicate in anticipo, ascolto, ed evidenze sul processo (non un verdetto basato solo sull’indicatore).",
    scenario:
      "Un elaborato è molto migliore dei lavori abituali dello studente. Le regole sull’uso dell’IA non erano state chiarite per quel compito.\n\nCome raccogli evidenze prima di valutare?",
    choices: [
      "Concordo un breve colloquio sul ragionamento e sulle revisioni.",
      "Chiedo un’annotazione dell’elaborato e un’integrazione svolta in classe.",
      "Valuto il prodotto con i criteri comunicati e preparo regole più chiare per il prossimo compito.",
    ],
    perspectives: [
      "Il colloquio può rendere visibile il processo senza partire dall’accusa. Come formuli domande accessibili e mantieni una procedura equa?",
      "Un’integrazione può mostrare comprensione. Quali adattamenti prevedi per non penalizzare bisogni o stili diversi?",
      "Non introdurre regole retroattive tutela la chiarezza. Come distingui ciò che il prodotto dimostra da ciò che resta incerto sull’apprendimento?",
    ],
  },
  {
    title: "Processo, non solo prodotto",
    short: "Processo visibile",
    subtitle: "Rendere trasparente il lavoro quando l’IA è coinvolta.",
    category: "INTEGRITÀ E TRASPARENZA",
    decisionFocus: "trasparenza del percorso vs. sorveglianza degli studenti",
    phase: "Pratica",
    intro:
      "Un prodotto finale curato non dice sempre come è stato costruito.\n\nQuando l’IA entra nel lavoro, è utile distinguere tre cose: aiuto consentito, revisione personale e delega del ragionamento.",
    concept:
      "Rendere visibile il processo non significa controllare tutto. Significa raccogliere alcune tracce utili all’apprendimento: bozze, versioni, fonti, annotazioni, scelte o una breve dichiarazione d’uso.\n\nLa trasparenza serve a comprendere e migliorare il lavoro, non a sorvegliare.",
    prompts: [
      "In un compito della tua disciplina, quale traccia di processo ti aiuterebbe a capire come lo studente ha usato l’IA? (Es. bozza, fonti, nota di revisione, breve dichiarazione.)",
    ],
    question:
      "Quale richiesta rende più visibile il processo senza ridurre il compito a controllo?",
    options: [
      "Chiedere soltanto il prodotto finale e un colloquio orale a campione.",
      "Chiedere la cronologia completa delle modifiche del file insieme al prodotto finale.",
      "Chiedere una bozza, una breve nota sulle scelte o sulle revisioni e il prodotto finale.",
    ],
    correct: 2,
    explanation:
      "Bozze, note di revisione e scelte dichiarate aiutano a osservare ragionamento e uso degli strumenti.\n\nCercare una “prova negativa assoluta” è spesso difficile e sposta l’attenzione dal processo di apprendimento.",
    scenario:
      "In un compito di ricerca, un gruppo consegna un testo curato ma non sa spiegare le fonti né le revisioni fatte. L’uso dell’IA era consentito per trovare idee iniziali, con dichiarazione finale.\n\nCome procedi?",
    choices: [
      "Chiedo una ricostruzione del processo: fonti consultate, parti modificate e decisioni prese.",
      "Valuto solo il testo finale, perché rispetta i requisiti formali.",
      "Annullo il compito per tutto il gruppo senza ulteriori evidenze.",
    ],
    perspectives: [
      "Ricostruire il processo aiuta a distinguere uso dichiarato, comprensione e lacune. Quali domande faresti per raccogliere evidenze utili senza trasformarlo in un interrogatorio?",
      "Valutare solo il prodotto può premiare la forma, ma lascia opaco il percorso. Quale informazione ti manca per giudicare l’apprendimento?",
      "Una decisione immediata può sembrare chiara, ma senza evidenze rischia di essere iniqua. Quale procedura serve prima di trarre conclusioni?",
    ],
  },
  {
    title: "Una consegna, regole comprensibili",
    short: "Regole condivise",
    subtitle: "Rendere trasparente che cosa è consentito e perché.",
    category: "CONFRONTO PROFESSIONALE",
    decisionFocus: "chiarezza delle consegne vs. flessibilità del docente",
    phase: "Pratica",
    intro:
      "Nel confronto tra colleghi emergono posizioni diverse: c’è chi vede nell’IA un supporto utile e chi teme che sostituisca il lavoro degli studenti.\n\nL’obiettivo qui non è “avere tutti la stessa idea”, ma costruire consegne chiare e comprensibili.",
    concept:
      "Idea chiave: una regola chiara nasce dall’obiettivo del compito.\n\nIn pratica, nella consegna esplicita:\n- che cosa è consentito (e in quale fase);\n- che cosa deve restare autonomo;\n- come dichiarare eventuali aiuti;\n- quale alternativa senza IA è disponibile.\n\nSe si usano strumenti, verifica prima accesso e condizioni con le procedure dell’istituto.",
    prompts: [
      "Quale obiezione di un collega ti sembra la più forte, e come la risponderesti con rispetto? (Puoi partire da un esempio concreto di compito.)",
    ],
    question: "Quale consegna rende più chiaro il ruolo dell’IA?",
    options: [
      "“Usate l’IA in modo responsabile”: decidete voi se e come dichiararla.",
      "“L’IA può suggerire domande; l’argomentazione è vostra, documentate gli aiuti e c’è un’alternativa senza IA.”",
      "“L’IA è facoltativa: chi la usa lo segnala, ma non serve indicare dove.”",
    ],
    correct: 1,
    explanation:
      "La consegna più chiara collega il supporto consentito a un limite concreto e rende visibili autonomia e alternative.\n\nDire “uso responsabile” o “facoltativo” non basta: servono criteri pratici e verificabili.",
    scenario:
      "Nel dipartimento si discute un compito di scrittura: alcuni vorrebbero vietare qualunque aiuto dell’IA, altri accettare qualsiasi prodotto.\n\nCome avvii un accordo?",
    choices: [
      "Distinguo ideazione, stesura e revisione, stabilendo per ogni fase gli aiuti coerenti con l’obiettivo.",
      "Propongo per ora un compito senza IA, motivato dall’obiettivo, e un’attività separata di confronto fra output.",
      "Avvio una prova circoscritta con criteri comuni, un’alternativa senza IA e una revisione tra colleghi.",
    ],
    perspectives: [
      "Distinguere le fasi evita regole generiche. Come documenti il processo in modo utile, senza trasformare la trasparenza in sorveglianza eccessiva?",
      "Un confine può essere pedagogicamente motivato. Come spieghi che cosa va appreso in autonomia senza demonizzare lo strumento?",
      "Una prova condivisa rende il confronto concreto. Quali condizioni vanno chiarite prima di coinvolgere gli studenti (obiettivi, tutele, alternative)?",
    ],
  },
  {
    title: "Comunicare con studenti e famiglie",
    short: "Comunicazione chiara",
    subtitle: "Rendere comprensibili aspettative, limiti e tutele.",
    category: "PATTO EDUCATIVO",
    decisionFocus: "trasparenza verso famiglie vs. complessità tecnica",
    phase: "Pratica",
    intro:
      "Le scelte sull’IA non restano solo “in classe”. Studenti e famiglie hanno bisogno di capire poche cose essenziali: quando si usa, perché, con quali limiti e quali alternative ci sono.",
    concept:
      "Comunicare bene significa essere chiari e pertinenti al compito. Aiuta indicare: obiettivo didattico, uso consentito/non consentito, tutele (ad esempio sui dati) e a chi rivolgersi per chiarimenti.\n\nTrasparenza non vuol dire entrare in dettagli tecnici o condividere informazioni sensibili.",
    prompts: [
      "Se dovessi spiegare a una famiglia l’uso dell’IA in un compito, quale frase useresti per chiarire obiettivo, limite e alternativa? (Prova a scriverla in 2-3 righe.)",
    ],
    question: "Quale comunicazione è più utile per famiglie e studenti?",
    options: [
      "Un avviso generico che invita a un uso consapevole, senza dettagli sul singolo compito.",
      "Una spiegazione che indica obiettivo, uso consentito o non consentito, tutele e alternativa disponibile.",
      "Una nota tecnica sul modello e sui suoi limiti, con il link alla documentazione.",
    ],
    correct: 1,
    explanation:
      "Famiglie e studenti hanno bisogno di informazioni comprensibili e legate al compito concreto.\n\nObiettivo, limiti, tutele e alternative orientano meglio di un avviso generico o di una spiegazione troppo tecnica.",
    scenario:
      "Una famiglia chiede perché in un compito di scrittura l’IA è stata vietata, mentre in un altro è stata consentita per generare domande di ricerca.\n\nCome rispondi?",
    choices: [
      "Spiego la differenza partendo dagli obiettivi dei due compiti e dalle regole comunicate.",
      "Rispondo che la decisione dipende solo dal docente, senza entrare nel merito.",
      "Invio una lunga informativa tecnica sul funzionamento dell’IA.",
    ],
    perspectives: [
      "Collegare la scelta agli obiettivi rende comprensibile la differenza tra compiti. Quale esempio concreto useresti per evitare ambiguità?",
      "La decisione docente è legittima, ma una breve spiegazione aiuta fiducia e collaborazione. Quale informazione minima dovresti comunque rendere chiara?",
      "Un testo tecnico può essere utile, ma spesso non risponde alla domanda. Come tradurresti le informazioni in indicazioni pratiche per la famiglia?",
    ],
  },
  {
    title: "Inclusione e dati: fermarsi prima",
    short: "Inclusione e dati",
    subtitle: "Personalizzare senza esporre o etichettare gli studenti.",
    category: "CURA E TUTELA",
    decisionFocus: "personalizzazione vs. esposizione di dati",
    phase: "Progettazione inclusiva",
    intro:
      "L’IA può aiutare a creare versioni alternative di un’attività o di un testo. Ma personalizzare non significa inserire documenti degli studenti in uno strumento esterno, né ridurre le aspettative.\n\nA volte la scelta più professionale è fermarsi prima.",
    concept:
      "Idea chiave: per adattare una proposta non servono dati identificativi degli studenti.\n\nIn pratica, prima di agire:\n- descrivi obiettivi e barriere in modo generico (es. “fatica a leggere testi lunghi”, “serve consegna segmentata”);\n- usa esempi inventati, non documenti reali;\n- verifica con l’istituto finalità, dati, condizioni d’uso e responsabilità.\n\nRicorda: togliere il nome non basta sempre, perché diagnosi e dettagli di contesto possono rendere riconoscibile una persona.",
    prompts: [
      "Quale dato di uno studente non inseriresti mai in uno strumento esterno, e perché? (Es. diagnosi, documenti, dettagli personali o familiari.)",
    ],
    question:
      "Vuoi adattare un’attività con un chatbot esterno. Qual è il punto di partenza più prudente?",
    options: [
      "Descrivere barriere e obiettivi senza documenti reali, chiarendo prima le condizioni d’uso con l’istituto.",
      "Caricare il piano individuale senza nome e data di nascita, chiedendo al sistema di non conservarlo.",
      "Descrivere il caso in forma anonima includendo la diagnosi, per ottenere un adattamento più preciso.",
    ],
    correct: 0,
    explanation:
      "Per ideare un adattamento non serve esporre documenti individuali. Anche senza nome, alcuni dettagli possono rendere riconoscibile lo studente.\n\nQui conta la cautela progettuale: la verifica privacy e le procedure restano responsabilità dell’istituto.",
    scenario:
      "Un collega vuole caricare un piano individuale in un chatbot personale per ottenere materiali adattati. Il nome è stato rimosso, ma restano diagnosi e dettagli del contesto.\n\nCome intervieni?",
    choices: [
      "Propongo di lavorare su obiettivi e barriere descritti in modo generico, senza caricare il documento.",
      "Sospendo la proposta e chiedo una verifica del servizio e della procedura all’istituto.",
      "Preparo gli adattamenti con il collega senza usare quel chatbot.",
    ],
    perspectives: [
      "Ridurre i dati può permettere una prima ideazione. Quali informazioni elimini e come verificherai poi, in classe, che l’adattamento sia davvero adeguato?",
      "La verifica istituzionale evita decisioni isolate su dati di terzi. Quali domande faresti su conservazione, riuso, accessi e responsabilità?",
      "Il confronto tra colleghi è un’alternativa valida. Che cosa puoi condividere nel contesto autorizzato senza trasferire dati a un servizio esterno?",
    ],
  },
  {
    title: "Accessibilità e UDL con l’IA",
    short: "Progettazione inclusiva",
    subtitle: "Ridurre barriere senza abbassare obiettivi.",
    category: "PROGETTAZIONE INCLUSIVA",
    decisionFocus: "riduzione delle barriere vs. abbassamento delle aspettative",
    phase: "Progettazione inclusiva",
    intro:
      "L’IA può aiutare a creare formati alternativi: semplificare un testo, proporre una sintesi, aggiungere domande guida o supporti multimodali.\n\nIl rischio è confondere accessibilità con “rendere tutto più facile” o con una soluzione uguale per tutti.",
    concept:
      "Idea chiave (UDL): ridurre le barriere, non l’obiettivo di apprendimento.\n\nIn pratica, puoi offrire modi diversi per accedere, lavorare e mostrare ciò che si è imparato (es. testo + audio, lessico più chiaro, domande guida) mantenendo la stessa richiesta.\n\nPrima di usare un materiale generato, verifica:\n- correttezza del contenuto;\n- chiarezza del linguaggio;\n- coerenza con l’obiettivo.",
    prompts: [
      "Quale barriera ricorrente incontri nella tua disciplina e quale adattamento vorresti provare senza ridurre l’obiettivo? (Es. linguaggio, formato, tempi, modalità di risposta.)",
    ],
    question: "Quale uso dell’IA è più coerente con un approccio UDL?",
    options: [
      "Semplificare i contenuti per chi è in difficoltà, mantenendo una versione più completa per gli altri.",
      "Proporre formati e supporti alternativi verificati, mantenendo lo stesso obiettivo di apprendimento.",
      "Cambiare il tipo di verifica per chi ha difficoltà, senza mantenere lo stesso obiettivo.",
    ],
    correct: 1,
    explanation:
      "Accessibilità non significa abbassare automaticamente la richiesta. Significa ridurre barriere con supporti alternativi e verificati.\n\nL’obiettivo di apprendimento resta lo stesso; cambiano, quando serve, i modi per raggiungerlo e dimostrarlo.",
    scenario:
      "Per una classe con bisogni diversi, l’IA propone una versione semplificata di un testo, una sintesi audio e domande guidate. Alcune semplificazioni cambiano però il significato disciplinare.\n\nChe cosa fai?",
    choices: [
      "Revisiono i materiali con criteri UDL, correggo le semplificazioni e mantengo lo stesso obiettivo.",
      "Uso subito tutti i materiali generati per offrire più opzioni nel minor tempo possibile.",
      "Scarto ogni adattamento automatico e preparo un’unica versione per tutti.",
    ],
    perspectives: [
      "La revisione permette di usare il supporto senza perdere accuratezza. Quali criteri userai per controllare significato, linguaggio e accessibilità?",
      "Avere più opzioni non aiuta se non sono affidabili. Quale rischio corri consegnando materiali non verificati?",
      "Una versione unica può essere più semplice da gestire, ma può lasciare barriere. Quali alternative potresti offrire senza automatizzare tutto?",
    ],
  },
  {
    title: "Una prova piccola, evidenze chiare",
    short: "Sperimentare e rivedere",
    subtitle: "Portare il corso nel lavoro quotidiano.",
    category: "PIANO DI AZIONE",
    decisionFocus: "evidenze di apprendimento vs. tempo risparmiato",
    phase: "Revisione",
    intro:
      "Alla fine del percorso conta una scelta professionale concreta e verificabile: una piccola sperimentazione, oppure una decisione motivata di non usare l’IA.\n\nAttenzione: il tempo risparmiato dal docente e l’apprendimento degli studenti sono risultati diversi, da osservare separatamente.",
    concept:
      "Una prova utile è “piccola ma chiara”: indica obiettivo, contesto, tempi, evidenze da osservare e criteri per modificare o fermare la scelta.\n\nNon serve dimostrare tutto. Il valore sta nel rendere la decisione rivedibile nel tempo, con cautela (classi, compiti e momenti diversi possono influenzare i risultati).",
    prompts: [
      "Quale piccola prova potresti fare nelle prossime settimane, e quale evidenza ti porterebbe a modificarla o fermarla? (Indica: obiettivo, attività, segnale da osservare.)",
    ],
    question: "Quale evidenza documenta meglio un obiettivo di argomentazione?",
    options: [
      "La classe ha concluso il programma in anticipo rispetto alla pianificazione.",
      "Gli studenti hanno prodotto elaborati più lunghi e con meno errori formali.",
      "Negli elaborati e nel confronto gli studenti motivano le tesi con evidenze, secondo criteri espliciti.",
    ],
    correct: 2,
    explanation:
      "Tempo risparmiato, gradimento o cura formale sono informazioni utili, ma non coincidono con l’apprendimento.\n\nPer valutare l’argomentazione servono evidenze del ragionamento, lette con criteri espliciti. Un miglioramento osservato non va attribuito automaticamente alla sola IA.",
    scenario:
      "Dopo una prova hai risparmiato tempo e raccolto prodotti più curati. Nel confronto orale, però, alcuni studenti non sanno spiegare i passaggi.\n\nChe cosa fai?",
    choices: [
      "Modifico l’attività per rendere visibile il ragionamento e raccolgo nuove evidenze.",
      "Sospendo l’uso dell’IA in quella fase e riprogetto il compito in autonomia.",
      "Mantengo l’uso soltanto nella mia preparazione e confronto i risultati con un collega.",
    ],
    perspectives: [
      "Rivedere l’attività può aiutare a capire se il supporto sta sostituendo il lavoro cognitivo. Quale passaggio rendi autonomo e quale evidenza raccoglierai?",
      "Sospendere non significa rifiutare ogni uso. Che cosa ti ha fatto superare la soglia di rischio didattico e quando rivaluterai la scelta?",
      "Separare preparazione docente e uso degli studenti aiuta a leggere meglio i risultati. Come distingui tempo risparmiato, qualità dei materiali e apprendimento?",
    ],
  },
  {
    title: "Policy, comunità e aggiornamento continuo",
    short: "Scelte condivise",
    subtitle: "Collegare la pratica alla scuola e alla revisione nel tempo.",
    category: "SCELTE ISTITUZIONALI",
    decisionFocus: "iniziativa individuale vs. scelta condivisa e rivedibile",
    phase: "Revisione",
    intro:
      "Le scelte sull’IA raramente riguardano solo il singolo docente: toccano strumenti, dati, criteri comuni, famiglie e studenti.\n\nPer questo è utile distinguere ciò che si può decidere in autonomia da ciò che richiede confronto e procedure d’istituto.",
    concept:
      "Idea chiave: le scelte sull’IA vanno rese chiare, condivise quando serve e rivedibili nel tempo.\n\nIn pratica, prima di adottare uno strumento:\n- definisci finalità didattica e limiti;\n- verifica tutele, dati, ruoli e responsabilità (accountability: chi decide, chi controlla, chi risponde);\n- prevedi alternative e una prova circoscritta;\n- stabilisci quando e come rivedere la scelta (governance).\n\nAggiornarsi non è solo conoscere nuovi strumenti, ma valutarne gli effetti nel proprio contesto.",
    prompts: [
      "Quale decisione sull’IA prenderesti da solo nella tua pratica e quale porteresti in dipartimento o all’istituto? Con quale criterio le distingui? (Es. impatto su dati, valutazione, equità, comunicazione.)",
    ],
    question: "Quale approccio è più sostenibile per l’adozione di un nuovo strumento IA a scuola?",
    options: [
      "Adottarlo subito in tutte le classi, per raccogliere rapidamente più dati possibili.",
      "Fare una prova circoscritta con criteri didattici, tutele, ruoli, alternative e revisione.",
      "Aspettare che altri istituti lo adottino e poi copiare la loro configurazione.",
    ],
    correct: 1,
    explanation:
      "Una scelta sostenibile tiene insieme apprendimento, tutele, responsabilità e contesto.\n\nUna prova circoscritta, con criteri chiari e revisione, permette di imparare dall’uso senza trasformare né l’adozione né il rifiuto in automatismi.",
    scenario:
      "Un nuovo strumento promette di ridurre il tempo di correzione e generare feedback automatici. Alcuni colleghi lo usano già con account personali; l’istituto non ha ancora definito criteri condivisi.\n\nChe cosa proponi?",
    choices: [
      "Propongo una valutazione condivisa: finalità, dati, qualità del feedback, alternative e prova limitata.",
      "Inizio a usarlo subito per non restare indietro, gestendo da solo eventuali problemi.",
      "Chiedo di bloccare ogni discussione finché non esiste una soluzione perfetta.",
    ],
    perspectives: [
      "Una valutazione condivisa aiuta a distribuire responsabilità e apprendere dall’esperienza. Quali domande porteresti al dipartimento prima di una prova?",
      "L’iniziativa individuale può essere rapida, ma può esporre dati o creare criteri incoerenti. Quali rischi stai assumendo da solo?",
      "Aspettare condizioni ideali può proteggere da errori, ma anche bloccare il confronto. Quale passo minimo e prudente permetterebbe di iniziare a decidere?",
    ],
  },
];

export const references = [
  {
    title: "MIM · Linee guida per l’introduzione dell’IA nelle istituzioni scolastiche",
    description:
      "Decreto ministeriale 166/2025. Quadro di riferimento per un uso consapevole e responsabile dell’IA a scuola.",
    url: "https://www.mim.gov.it/documents/20182/0/MIM_Linee+guida+IA+nella+Scuola_09_08_2025-signed.pdf/b70fdc45-4b75-1f7e-73bf-eab12989b928",
  },
  {
    title: "Commissione europea · DigCompEdu",
    description:
      "Quadro delle competenze digitali dei docenti: progettazione, valutazione, inclusione e sviluppo professionale.",
    url: "https://joint-research-centre.ec.europa.eu/digcompedu_en",
  },
  {
    title: "Leone XIV · Magnifica Humanitas",
    description:
      "Enciclica sulla custodia della persona umana nel tempo dell’intelligenza artificiale, 2026.",
    url: "https://www.vatican.va/content/leo-xiv/en/encyclicals/documents/20260515-magnifica-humanitas.html",
  },
  {
    title: "Cucci e Giacchetti · La Civiltà Cattolica",
    description:
      "Per un’intelligenza artificiale al servizio della dignità umana, 2026. Spunto per la prospettiva etica.",
    url: "https://www.laciviltacattolica.it/articolo/per-unintelligenza-artificiale-al-servizio-della-dignita-umana/",
  },
];

export const glossary = [
  [
    "IA generativa",
    "Sistema che produce contenuti sulla base di regolarità apprese nei dati. Una scheda fluida può contenere errori: il docente ne verifica contenuti e adeguatezza.",
    [1, 2],
  ],
  [
    "Automation bias",
    "Fiducia eccessiva nel suggerimento automatico. Nel lavoro docente può emergere quando si adottano soluzioni, rubriche o feedback senza revisione.",
    [2, 5],
  ],
  [
    "Allineamento didattico",
    "Coerenza fra obiettivo, attività ed evidenze di apprendimento. La scelta dell’IA viene dopo la definizione di ciò che gli studenti devono saper fare.",
    [1],
  ],
  [
    "Evidenze di apprendimento",
    "Tracce pertinenti di comprensione e capacità: ragionamenti, revisioni motivate, spiegazioni, applicazioni. Un prodotto curato non basta per ricostruire il processo.",
    [3, 9],
  ],
  [
    "Processo visibile",
    "Tracce che rendono osservabile il percorso di lavoro: bozze, versioni, fonti, annotazioni, scelte o dichiarazioni d’uso. La trasparenza sostiene l’apprendimento, non la sorveglianza.",
    [4],
  ],
  [
    "Feedback formativo",
    "Informazione che aiuta a capire come migliorare rispetto a criteri espliciti. Una bozza generata deve essere verificata e contestualizzata dal docente.",
    [3],
  ],
  [
    "Discernimento professionale",
    "Valutazione di obiettivi, conseguenze e valori per scegliere se, dove e come usare l’IA, assumendosi la responsabilità della decisione.",
    [1, 5],
  ],
  [
    "Limite etico",
    "Confine motivato su ciò che non si delega o non si comunica a un sistema, anche quando è tecnicamente possibile farlo.",
    [7],
  ],
  [
    "Accountability",
    "Possibilità di chiarire chi decide, chi controlla e chi risponde di un uso. Il docente non può sostituire una procedura istituzionale con una scelta isolata.",
    [5, 10],
  ],
  [
    "Minimizzazione dei dati",
    "Uso dei soli dati necessari alla finalità. Per ideare attività, spesso bastano casi inventati: togliere un nome non rende automaticamente anonimo un documento.",
    [7],
  ],
  [
    "Accessibilità e UDL",
    "Ridurre barriere offrendo più modi di accesso, azione ed espressione, mantenendo gli obiettivi. Personalizzare non significa abbassare automaticamente le aspettative.",
    [8],
  ],
  [
    "Trasparenza d’uso",
    "Spiegare come uno strumento contribuisce al lavoro e che cosa resta autonomo. Serve a rendere comprensibile il processo, non a esigere l’esposizione di dati personali.",
    [5],
  ],
  [
    "Comunicazione scuola-famiglia",
    "Informazione chiara su obiettivi, regole, tutele e alternative legate all’uso dell’IA. Aiuta fiducia e collaborazione senza richiedere dettagli tecnici o dati sensibili.",
    [6],
  ],
  [
    "Scatola nera",
    "Difficoltà di interpretare in dettaglio i processi interni di un modello. Non annulla la necessità di verificare output, conseguenze e condizioni d’uso.",
    [2],
  ],
  [
    "Governance scolastica",
    "Insieme di criteri, ruoli, procedure e momenti di revisione che rendono condivisibili le scelte sull’IA. Collega la pratica docente alle responsabilità dell’istituto.",
    [10],
  ],
  [
    "Sostenibilità didattica",
    "Equilibrio tra qualità dell’apprendimento, carico di lavoro del docente e tempi disponibili. Un uso sostenibile è rivedibile e non automatizza ogni fase.",
    [9, 10],
  ],
  [
    "Alternativa senza IA",
    "Percorso didattico equivalente che non richiede l’uso dell’IA, per garantire equità di accesso e chiarezza di valutazione.",
    [5, 6],
  ],
  [
    "Revisione tra pari",
    "Confronto professionale strutturato tra colleghi per verificare materiali, regole e conseguenze delle scelte sull’IA.",
    [2, 5, 10],
  ],
];


