export { emptyState, type SavedState } from "./content";

export const steps = [
  {
    title: "Prima l’apprendimento, poi l’IA",
    short: "Progettare con l’IA",
    subtitle: "Partire da un obiettivo, non da uno strumento.",
    category: "PROGETTAZIONE DIDATTICA",
    decisionFocus: "obiettivo di apprendimento vs. efficienza dello strumento",
    phase: "Progettazione",
    intro:
      "In questo percorso non cerchiamo soltanto modi per lavorare più velocemente. Chiediamoci che cosa l’IA cambia nel nostro modo di insegnare e che cosa deve restare un’esperienza attiva degli studenti. Se non la usi ancora, parti da un’attività che conosci bene.",
    concept:
      "Uno strumento è pertinente quando serve un obiettivo di apprendimento osservabile. Produrre più materiali non equivale a far apprendere meglio: occorre decidere quale lavoro cognitivo svolge il docente, quale il sistema e quale lo studente.",
    disciplineCase:
      "Matematica: l’IA propone dieci esercizi sui limiti. Prima di assegnarli, risolvi i primi tre e decidi quale passaggio deve restare a carico degli studenti.",
    prompts: ["Quale parte del tuo lavoro non delegherai all’IA, e perché?"],
    question: "Quale criterio è più utile per decidere se integrare l’IA in una lezione?",
    options: [
      "Riduce il tempo di preparazione e permette di trattare più contenuti nello stesso numero di ore.",
      "La proposta sostiene l’obiettivo e mantiene visibile il lavoro cognitivo degli studenti.",
      "Ha funzionato in un’altra classe, quindi può essere riproposta con gli stessi materiali.",
    ],
    correct: 1,
    explanation:
      "L’allineamento fra obiettivo, attività ed evidenze di apprendimento precede la scelta dello strumento. Quantità, stile e riusabilità possono aiutare, ma non garantiscono comprensione.",
    scenario:
      "Devi insegnare a confrontare due spiegazioni di un fenomeno. L’IA propone una scheda con sintesi e confronto già completati. Hai poco tempo per preparare la lezione: come la usi?",
    choices: [
      "La uso come esempio svolto, seguito da un nuovo confronto autonomo.",
      "Elimino il confronto finale e chiedo agli studenti di costruirlo e motivarlo.",
      "Non la uso: parto da due brevi testi selezionati da me.",
    ],
    perspectives: [
      "Un esempio svolto può sostenere chi è all’inizio. Come verifichi che nella seconda attività gli studenti confrontino davvero, anziché riprodurre il modello?",
      "Restituire il confronto agli studenti rende visibile il ragionamento. Quali domande o supporti servono perché il compito sia accessibile?",
      "La scelta di non usare l’IA è legittima se serve l’obiettivo. Quali vantaggi offrono i testi scelti e quale costo di preparazione accetti?",
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
      "Un testo plausibile può contenere errori, semplificazioni scorrette o esempi poco adatti alla classe. L’automation bias riguarda anche noi docenti: un formato professionale può farci abbassare la soglia di controllo.",
    concept:
      "La revisione didattica controlla almeno correttezza disciplinare, coerenza delle consegne, adeguatezza linguistica e possibili stereotipi. Chiedere al medesimo sistema di confermarsi non è una verifica indipendente.",
    disciplineCase:
      "Scienze: una scheda generata confonde correlazione e causalità. Chiedi a un collega di disciplina di rileggerla prima della lezione.",
    prompts: ["Quale controllo non salterai mai, neppure con fretta, e perché?"],
    question:
      "L’IA ha generato esercizi con soluzioni. Quale verifica è più solida prima dell’uso?",
    options: [
      "Risolvere gli esercizi e controllare i contenuti con risorse disciplinari indipendenti.",
      "Chiedere al sistema di dichiarare il proprio livello di sicurezza e correggere solo gli esercizi che segnala come incerti.",
      "Confrontare il livello di difficoltà con il programma svolto e usare gli esercizi che includono già le soluzioni.",
    ],
    correct: 0,
    explanation:
      "La verifica deve poter individuare errori anche se il sistema continua a confermarli. Risolvere i compiti e consultare risorse indipendenti completa, ma non sostituisce, il controllo di difficoltà e accessibilità.",
    scenario:
      "In una scheda generata trovi un errore disciplinare; gli esempi rappresentano inoltre un solo contesto culturale. La lezione è domani.",
    choices: [
      "Correggo la scheda e rivedo gli esempi prima di usarla.",
      "Trasformo una parte in un’attività guidata di verifica degli errori.",
      "Scarto la scheda e uso materiale già validato.",
    ],
    perspectives: [
      "La revisione può rendere utile la bozza, ma una correzione isolata non basta. Come controllerai che l’errore non si ripeta altrove e che gli esempi siano pertinenti?",
      "L’errore può diventare occasione di apprendimento se gli studenti hanno strumenti per riconoscerlo. Come eviti di consolidare la concezione sbagliata?",
      "Rinunciare è una scelta professionale, non un fallimento. Quale soglia di rischio o limite di tempo ti porta a scartare un output?",
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
      "Una rubrica o una bozza di feedback possono essere supporti. La lettura del processo di apprendimento, l’ascolto dello studente e la motivazione del giudizio non si esauriscono nel testo prodotto da un sistema.",
    concept:
      "Una valutazione solida usa criteri espliciti ed evidenze pertinenti. Un indicatore automatico non è una prova autosufficiente di apprendimento o di uso scorretto dell’IA. Il docente deve poter spiegare e rivedere il proprio giudizio.",
    disciplineCase:
      "Italiano: un rilevatore segnala un tema come «generato». Prima di qualsiasi provvedimento, leggi il testo e chiedi allo studente di raccontare le scelte fatte.",
    prompts: [
      "Quale evidenza useresti per capire se uno studente ha davvero appreso, oltre al prodotto finale?",
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
      "Una segnalazione automatica può essere errata e non ricostruisce da sola il processo di lavoro. La verifica richiede ascolto, evidenze e regole comunicate in anticipo; non un verdetto fondato sul solo indicatore.",
    scenario:
      "Un elaborato è molto migliore dei lavori abituali dello studente. Le regole sull’uso dell’IA non erano state chiarite per quel compito. Come raccogli evidenze prima di valutare?",
    choices: [
      "Concordo un breve colloquio sul ragionamento e sulle revisioni.",
      "Chiedo un’annotazione dell’elaborato e un’integrazione svolta in classe.",
      "Valuto il prodotto con i criteri comunicati e preparo regole più chiare per il prossimo compito.",
    ],
    perspectives: [
      "Il colloquio rende visibile il processo senza partire dall’accusa. Come formuli domande accessibili e applichi la procedura con equità?",
      "Un’integrazione può mostrare comprensione. Quali adattamenti prevedi per evitare che il nuovo formato penalizzi bisogni specifici?",
      "Non introdurre regole retroattive tutela la chiarezza. Come distingui ciò che il prodotto documenta da ciò che resta incerto sull’apprendimento?",
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
      "Un buon prodotto finale non mostra sempre come è stato costruito. Se l’IA può contribuire a una fase del lavoro, diventa importante distinguere aiuto consentito, revisione personale e delega del ragionamento.",
    concept:
      "Rendere visibile il processo significa raccogliere tracce utili all’apprendimento: bozze, versioni, annotazioni, scelte, fonti o una breve dichiarazione d’uso. La trasparenza serve a comprendere e migliorare il lavoro, non a sorvegliare gli studenti.",
    disciplineCase:
      "Storia: chiedi una bozza con le fonti consultate e una nota sulle parti modificate, non solo la relazione finale.",
    prompts: [
      "In un compito della tua disciplina, quale traccia di processo ti aiuterebbe a capire come lo studente ha usato l’IA?",
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
      "Bozze, note di revisione e scelte dichiarate aiutano a osservare il ragionamento e l’uso degli strumenti. La prova negativa assoluta è difficile da ottenere e sposta l’attenzione dal processo di apprendimento.",
    scenario:
      "In un compito di ricerca, un gruppo consegna un testo curato ma non sa spiegare le fonti né le revisioni fatte. L’uso dell’IA era consentito per trovare idee iniziali, con dichiarazione finale.",
    choices: [
      "Chiedo una ricostruzione del processo: fonti consultate, parti modificate e decisioni prese.",
      "Valuto solo il testo finale, perché rispetta i requisiti formali.",
      "Annullo il compito per tutto il gruppo senza ulteriori evidenze.",
    ],
    perspectives: [
      "Ricostruire il processo permette di distinguere uso dichiarato, comprensione e lacune. Quali domande faresti per evitare un interrogatorio e raccogliere evidenze utili?",
      "Valutare solo il prodotto può premiare la forma, ma lascia opaco il percorso. Quale informazione ti manca per giudicare l’apprendimento?",
      "Una decisione immediata può sembrare chiara, ma senza evidenze rischia di essere iniqua. Quale procedura servirebbe prima di trarre conclusioni?",
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
      "Nel gruppo di aggiornamento c’è chi vede nell’IA un supporto e chi teme che sostituisca il lavoro degli studenti. Usiamo il confronto per costruire consegne chiare, non per scegliere fra entusiasmo e rifiuto assoluti.",
    concept:
      "Le regole acquistano senso quando si collegano all’obiettivo del compito. Una consegna esplicita quali supporti sono consentiti, che cosa deve essere prodotto autonomamente, come documentare l’aiuto e quale alternativa è disponibile. L’accesso degli studenti va verificato secondo le condizioni del servizio e le procedure dell’istituto.",
    disciplineCase:
      "Diritto: distingui nella consegna l’uso consentito per trovare casi, quello per riassumere e ciò che deve restare argomentazione personale.",
    prompts: [
      "Quale obiezione di un collega ti sembra la più forte, e come la risponderesti con rispetto?",
    ],
    question: "Quale consegna rende più chiaro il ruolo dell’IA?",
    options: [
      "Usate l’IA in modo responsabile; deciderete voi se e come dichiararla.",
      "L’IA può suggerire domande; l’argomentazione è vostra e documentate gli aiuti. È disponibile un percorso senza IA.",
      "L’IA è facoltativa: chi la usa lo segnala, ma non serve indicare dove.",
    ],
    correct: 1,
    explanation:
      "La seconda consegna collega il supporto a un limite concreto e rende visibili autonomia e accessibilità. La facoltatività non elimina il bisogno di criteri, e il consenso del gruppo non sostituisce le verifiche istituzionali.",
    scenario:
      "Nel dipartimento si discute un compito di scrittura: alcuni vorrebbero vietare qualunque aiuto dell’IA, altri accettare qualsiasi prodotto. Come avvii un accordo?",
    choices: [
      "Distinguo ideazione, stesura e revisione, stabilendo per ogni fase gli aiuti coerenti con l’obiettivo.",
      "Propongo per ora un compito senza IA, motivato dall’obiettivo, e un’attività separata di confronto fra output.",
      "Avvio una prova circoscritta con criteri comuni, un’alternativa senza IA e una revisione tra colleghi.",
    ],
    perspectives: [
      "Distinguere le fasi evita regole generiche. Come documenti il processo senza trasformare la trasparenza in sorveglianza eccessiva?",
      "Un confine può essere pedagogicamente motivato. Come spieghi che cosa si deve apprendere in autonomia senza demonizzare lo strumento?",
      "Una prova condivisa può rendere il confronto concreto. Quali condizioni devono essere soddisfatte prima di coinvolgere gli studenti?",
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
      "Le scelte sull’IA non riguardano solo la preparazione della lezione. Studenti e famiglie hanno bisogno di capire quando uno strumento è usato, perché, con quali limiti e quali alternative sono disponibili.",
    concept:
      "Una comunicazione efficace collega la scelta didattica all’obiettivo, usa un linguaggio adatto al contesto e chiarisce regole, tutele e canali di chiarimento. La trasparenza non richiede di condividere dati sensibili né di descrivere ogni dettaglio tecnico.",
    disciplineCase:
      "Scienze umane: spiega alla famiglia perché lo stesso strumento è vietato in un compito e ammesso in un altro, partendo dagli obiettivi.",
    prompts: [
      "Se dovessi spiegare a una famiglia l’uso dell’IA in un compito, quale frase useresti per chiarire obiettivo, limite e alternativa?",
    ],
    question: "Quale comunicazione è più utile per famiglie e studenti?",
    options: [
      "Un avviso generico che invita a un uso consapevole, senza dettagli sul singolo compito.",
      "Una spiegazione che indica obiettivo, uso consentito o non consentito, tutele e alternativa disponibile.",
      "Una nota tecnica sul modello e sui suoi limiti, con il link alla documentazione.",
    ],
    correct: 1,
    explanation:
      "Studenti e famiglie hanno bisogno di informazioni comprensibili e pertinenti al compito. Obiettivo, limiti, tutele e alternative aiutano a orientarsi; genericità e tecnicismi da soli non chiariscono le aspettative.",
    scenario:
      "Una famiglia chiede perché in un compito di scrittura l’IA è stata vietata, mentre in un altro è stata consentita per generare domande di ricerca.",
    choices: [
      "Spiego la differenza partendo dagli obiettivi dei due compiti e dalle regole comunicate.",
      "Rispondo che la decisione dipende solo dal docente, senza entrare nel merito.",
      "Invio una lunga informativa tecnica sul funzionamento dell’IA.",
    ],
    perspectives: [
      "Collegare la scelta agli obiettivi rende comprensibile la differenza tra compiti. Quali esempi concreti useresti per evitare ambiguità?",
      "La decisione docente è legittima, ma una spiegazione aiuta fiducia e collaborazione. Quale informazione minima dovresti comunque rendere chiara?",
      "Un testo tecnico può contenere dettagli utili, ma rischia di non rispondere alla domanda. Come tradurresti le informazioni in indicazioni pratiche?",
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
      "L’IA può suggerire versioni alternative di un testo, ma personalizzare non significa caricare documenti degli studenti né ridurre le aspettative. La dignità passa anche da ciò che scegliamo di non comunicare a un sistema.",
    concept:
      "La rimozione del nome non garantisce che una persona non sia riconoscibile. Per progettare, privilegia esempi inventati e descrizioni funzionali generiche. Prima di adottare strumenti, chiarisci con l’istituto finalità, dati, condizioni d’uso e responsabilità; non improvvisare autorizzazioni.",
    disciplineCase:
      "Sostegno: descrivi barriere e obiettivi in forma generica, senza caricare il PEI o la diagnosi in un chatbot esterno.",
    prompts: ["Quale dato di uno studente non inseriresti mai in uno strumento esterno, e perché?"],
    question:
      "Vuoi adattare un’attività con un chatbot esterno. Qual è il punto di partenza più prudente?",
    options: [
      "Descrivere barriere e obiettivi senza documenti reali, chiarendo prima le condizioni d’uso con l’istituto.",
      "Caricare il piano individuale dopo aver rimosso nome e data di nascita, chiedendo al sistema di non conservarlo.",
      "Descrivere il caso in forma anonima, ma includere la diagnosi per ottenere un adattamento più preciso.",
    ],
    correct: 0,
    explanation:
      "Per ideare adattamenti non è necessario esporre documenti individuali. Anche senza nome, dettagli e contesto possono rendere riconoscibile lo studente. Questa attività propone cautela progettuale, non sostituisce la verifica privacy dell’istituto.",
    scenario:
      "Un collega vuole caricare un piano individuale in un chatbot personale per ottenere materiali adattati. Il nome è stato rimosso, ma restano diagnosi e dettagli del contesto.",
    choices: [
      "Propongo di lavorare su obiettivi e barriere descritti in modo generico, senza caricare il documento.",
      "Sospendo la proposta e chiedo una verifica del servizio e della procedura all’istituto.",
      "Preparo gli adattamenti con il collega senza usare quel chatbot.",
    ],
    perspectives: [
      "Ridurre i dati può consentire una prima ideazione. Quali informazioni elimini e come verifichi poi l’adeguatezza sul piano didattico?",
      "La verifica istituzionale evita decisioni isolate su dati di terzi. Quali domande poni su conservazione, riuso, accessi e responsabilità?",
      "Il confronto professionale è un’alternativa valida. Che cosa puoi condividere tra colleghi nel contesto autorizzato senza trasferirlo al servizio esterno?",
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
      "L’IA può aiutare a creare formati alternativi, semplificare un testo o proporre supporti multimodali. Il rischio è confondere accessibilità con semplificazione automatica o con soluzioni uguali per tutti.",
    concept:
      "Nella prospettiva UDL, si riducono barriere offrendo più modi di accesso, azione ed espressione, mantenendo chiari gli obiettivi di apprendimento. Un adattamento generato va verificato: deve essere accessibile, accurato e coerente con le aspettative didattiche.",
    disciplineCase:
      "Lingue: l’IA genera un riassunto semplificato del testo. Verifica che il lessico chiave e il compito restino gli stessi, poi offri anche la versione audio.",
    prompts: [
      "Quale barriera ricorrente incontri nella tua disciplina e quale adattamento vorresti provare senza ridurre l’obiettivo?",
    ],
    question: "Quale uso dell’IA è più coerente con un approccio UDL?",
    options: [
      "Generare una versione semplificata per gli studenti in difficoltà, lasciando agli altri il testo originale.",
      "Proporre formati e supporti alternativi verificati, mantenendo lo stesso obiettivo di apprendimento.",
      "Sostituire la verifica scritta con una presentazione orale per chi ha difficoltà.",
    ],
    correct: 1,
    explanation:
      "L’accessibilità non coincide con la riduzione generalizzata della complessità. Supporti alternativi, verificati dal docente, possono ridurre barriere lasciando intatto l’obiettivo e rispettando differenze e contesti.",
    scenario:
      "Per una classe con bisogni diversi, l’IA propone una versione semplificata di un testo, una sintesi audio e domande guidate. Alcune semplificazioni cambiano però il significato disciplinare.",
    choices: [
      "Revisiono i materiali con criteri UDL, correggo le semplificazioni e mantengo lo stesso obiettivo.",
      "Uso subito tutti i materiali generati per offrire più opzioni nel minor tempo possibile.",
      "Scarto ogni adattamento automatico e preparo un’unica versione per tutti.",
    ],
    perspectives: [
      "La revisione permette di usare il supporto senza perdere accuratezza. Quali criteri userai per controllare significato, linguaggio e accessibilità?",
      "Molte opzioni non sono utili se non sono affidabili. Quale rischio corri consegnando materiali non verificati?",
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
      "Il risultato del percorso è una scelta professionale verificabile: una piccola sperimentazione, oppure una decisione motivata di non usare l’IA. Il risparmio di tempo del docente e l’apprendimento degli studenti sono risultati distinti.",
    concept:
      "Una sperimentazione utile dichiara obiettivo, condizioni, tempi, evidenze e criteri di arresto. Non dimostra automaticamente un effetto causale: differenze fra classi, compiti e momenti richiedono cautela. Il valore sta nel rendere le decisioni rivedibili.",
    disciplineCase:
      "Fisica: prima di attribuire il miglioramento all’IA, confronta la qualità delle argomentazioni in un compito senza supporto.",
    prompts: [
      "Quale piccola prova potresti fare nelle prossime settimane, e quale evidenza ti porterebbe a modificarla o fermarla?",
    ],
    question: "Quale evidenza documenta meglio un obiettivo di argomentazione?",
    options: [
      "La classe ha concluso il programma in anticipo rispetto alla pianificazione.",
      "Gli studenti hanno prodotto elaborati più lunghi e con meno errori formali.",
      "Negli elaborati e nel confronto gli studenti motivano le tesi con evidenze, secondo criteri espliciti.",
    ],
    correct: 2,
    explanation:
      "Tempo risparmiato e gradimento sono informazioni utili, ma diverse dall’apprendimento. Per l’argomentazione servono evidenze del ragionamento coerenti con criteri definiti; il miglioramento osservato non va attribuito automaticamente alla sola IA.",
    scenario:
      "Dopo una prova, hai risparmiato tempo e raccolto prodotti più curati, ma nel confronto orale alcuni studenti non sanno spiegare i passaggi.",
    choices: [
      "Modifico l’attività per rendere visibile il ragionamento e raccolgo nuove evidenze.",
      "Sospendo l’uso dell’IA in quella fase e riprogetto il compito in autonomia.",
      "Mantengo l’uso soltanto nella mia preparazione e confronto i risultati con un collega.",
    ],
    perspectives: [
      "Una revisione può chiarire se il supporto sta sostituendo il lavoro cognitivo. Quale passaggio rendi autonomo e quale evidenza raccogli?",
      "Sospendere non significa rifiutare ogni uso. Che cosa ti ha fatto superare la soglia di rischio didattico e quando rivaluterai la scelta?",
      "Separare preparazione docente e uso degli studenti aiuta a leggere i risultati. Come distingui tempo risparmiato, qualità del materiale e apprendimento?",
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
      "Le scelte sull’IA raramente restano individuali: coinvolgono strumenti, dati, criteri comuni, famiglie e studenti. Una pratica sostenibile distingue ciò che il docente può decidere in autonomia da ciò che richiede confronto e procedure d’istituto.",
    concept:
      "Governare l’uso dell’IA significa rendere le decisioni condivisibili e rivedibili: finalità, responsabilità, verifiche, alternative e momenti di revisione. L’aggiornamento continuo non è solo conoscere nuovi strumenti, ma imparare a valutare i loro effetti nel proprio contesto.",
    disciplineCase:
      "Informatica: prima di adottare un correttore automatico, concordate finalità, dati inviati, alternative e un momento di revisione dopo due settimane.",
    prompts: [
      "Quale decisione sull’IA prenderesti da solo nella tua pratica e quale porteresti in dipartimento o all’istituto? Con quale criterio le distingui?",
    ],
    question: "Quale approccio è più sostenibile per l’adozione di un nuovo strumento IA a scuola?",
    options: [
      "Adottarlo subito in tutte le classi per raccogliere dati sufficienti a valutarlo.",
      "Valutarlo con criteri didattici, tutele, ruoli, alternative e una revisione dopo una prova circoscritta.",
      "Aspettare che altri istituti lo adottino e riprendere la loro configurazione.",
    ],
    correct: 1,
    explanation:
      "Una decisione sostenibile considera apprendimento, tutele, responsabilità e contesto. Prove circoscritte e revisione permettono di imparare dall’uso senza trasformare l’adozione in automatismo né il rifiuto in immobilità.",
    scenario:
      "Un nuovo strumento promette di ridurre il tempo di correzione e generare feedback automatici. Alcuni colleghi lo usano già con account personali; l’istituto non ha ancora definito criteri condivisi.",
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
    "Trasparenza del processo",
    "Insieme di tracce che rendono osservabile il lavoro: bozze, versioni, fonti, scelte e dichiarazioni d’uso. Sostiene l'apprendimento, non il controllo.",
    [4],
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
