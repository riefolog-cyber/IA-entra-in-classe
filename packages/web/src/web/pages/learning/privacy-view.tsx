import { ArrowLeft, ShieldCheck } from "lucide-react";

import { siteMeta } from "../../lib/site-meta";
import type { Go } from "./navigation";

export function PrivacyView({ go }: { go: Go }) {
  return (
    <div className="reading-page">
      <div className="eyebrow">INFORMAZIONI SUL TRATTAMENTO</div>

      <div className="step-head-visual">
        <div>
          <h1>Privacy, in breve.</h1>
          <p className="page-lead">
            Che cosa resta su questo dispositivo, che cosa esce dal browser e perché.
          </p>
        </div>
        <img
          className="step-visual"
          src="./images/theme/fase-revisione.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={240}
          height={120}
        />
      </div>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          DATI SALVATI NEL BROWSER
        </div>
        <h2>Il quaderno resta sul tuo dispositivo.</h2>
        <p>
          Risposte, nome facoltativo e avanzamento sono conservati solo nello spazio locale di
          questo browser (localStorage, sessionStorage o IndexedDB, a seconda di ciò che il browser
          consente). Non esiste un account e il sito non li invia a un server. Il pulsante «Cancella
          i miei dati» nella barra laterale li rimuove da questo browser.
        </p>
        <p>
          I PDF e i file JSON vengono generati nel browser: nessun documento viene caricato online.
          Se cancelli i dati del browser o usi un altro dispositivo, il quaderno non è più
          disponibile: esportalo prima in PDF o JSON.
        </p>
      </section>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          ANALISI DEL PERCORSO
        </div>
        <h2>Due modi, entrambi espliciti.</h2>
        <p>
          Se il sito è pubblicato senza servizi esterni, l’analisi del percorso è calcolata
          interamente nel browser: nessun testo lascia il dispositivo. Se è attiva l’analisi IA, la
          funzione resta opzionale e richiede un consenso separato: viene inviata una sintesi
          scritta del percorso, senza il nome. Il servizio IA configurato dal gestore del sito può
          conservare quel testo secondo le proprie condizioni. Non inserire dati identificativi di
          studenti, colleghi o famiglie.
        </p>
      </section>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          FEEDBACK E SERVIZI ESTERNI
        </div>
        <h2>Che cosa esce dal sito.</h2>
        <p>
          Il questionario di gradimento è anonimo e viene inviato a un modulo Google esterno: il
          servizio può registrare dati tecnici come l’indirizzo IP. Il campo libero non deve
          contenere dati personali. I video di approfondimento sono ospitati su YouTube e si aprono
          solo se li scegli.
        </p>
        <p>
          Il sito non usa cookie di profilazione, non include sistemi di analytics e non profila i
          visitatori.
        </p>
      </section>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          RESPONSABILITÀ
        </div>
        <h2>Un percorso formativo, non un servizio di valutazione.</h2>
        <p>
          Il percorso è curato dal prof. Riefolo Giovanni (docente di IRC al Ferraris Fermi di
          Verona) come materiale di aggiornamento professionale. Non costituisce certificazione, non
          valuta le persone e non sostituisce le procedure dell’istituto in materia di protezione
          dei dati. Per chiarimenti o per chiedere la rimozione di un contenuto puoi usare il
          questionario di feedback.
        </p>
      </section>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          DOMANDE FREQUENTI
        </div>
        <h2>Sei risposte rapide.</h2>

        <details className="faq-item">
          <summary>Serve un account?</summary>
          <p>No. Non c’è registrazione, non c’è profilo e non c’è una password da ricordare.</p>
        </details>

        <details className="faq-item">
          <summary>Dove finiscono le mie risposte?</summary>
          <p>
            Nel browser che stai usando, su questo dispositivo. Il sito non le invia a un server. Se
            cancelli i dati del browser, spariscono: esporta prima il PDF o il JSON.
          </p>
        </details>

        <details className="faq-item">
          <summary>L’IA vede i nomi degli studenti?</summary>
          <p>
            Non deve vederli. La sintesi inviata esclude il nome del quaderno, ma il testo che
            scrivi può contenerne altri: non inserire nomi, diagnosi o documenti di studenti e
            colleghi.
          </p>
        </details>

        <details className="faq-item">
          <summary>Posso usarlo con gli studenti?</summary>
          <p>
            Il percorso è per i docenti. Le attività possono ispirare una lezione, ma le decisioni
            vanno discusse in classe e nelle sedi dell’istituto.
          </p>
        </details>

        <details className="faq-item">
          <summary>È una certificazione?</summary>
          <p>
            No. È materiale di aggiornamento professionale: non attribuisce crediti, non valuta le
            persone e non sostituisce la formazione dell’istituto.
          </p>
        </details>

        <details className="faq-item">
          <summary>Posso stamparlo o condividerlo?</summary>
          <p>
            Sì. Il PDF si genera nel browser. I contenuti sono distribuiti con licenza{" "}
            <a href={siteMeta.licenseUrl} target="_blank" rel="noreferrer">
              {siteMeta.license}
            </a>
            : puoi condividerli citando l’autore, senza uso commerciale.
          </p>
        </details>
      </section>

      <section className="activity">
        <div className="activity-label">
          <ShieldCheck size={17} />
          CHE COSA NON È
        </div>
        <h2>Un confine dichiarato.</h2>

        <ul className="plain-list">
          <li>Non è una certificazione né un percorso con crediti formativi.</li>
          <li>Non è una valutazione della persona e non produce diagnosi.</li>
          <li>Non sostituisce le procedure dell’istituto, la valutazione dei rischi o il DPO.</li>
          <li>Non è un elenco di strumenti approvati: quelli li decide l’istituto.</li>
        </ul>
      </section>

      <p className="page-meta">
        Contenuti aggiornati a {siteMeta.reviewedAt} · licenza {siteMeta.license} · per segnalare un
        errore usa il questionario di feedback in fondo al riepilogo.
      </p>

      <div className="page-navigation">
        <button className="text-button" onClick={() => go("home")}>
          <ArrowLeft size={16} />
          Torna al percorso
        </button>
        <button className="button outline" onClick={() => go("summary")}>
          Vai al riepilogo
        </button>
      </div>
    </div>
  );
}
