import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { applyServiceWorkerUpdate } from "../../register-service-worker";

/**
 * Avviso di versione aggiornata.
 *
 * `register-service-worker.ts` emette `app:update-ready` quando un worker nuovo
 * è pronto ma **non** ancora attivo. L'attivazione è un gesto dell'utente: la
 * pagina aperta sta lavorando, e sostituirle gli asset sotto i piedi a metà
 * esportazione sarebbe peggio di una versione vecchia.
 */
const DISMISS_KEY = "restare-umani-aggiornamento-rimandato";

function isPostponed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onReady = () => {
      if (!isPostponed()) setVisible(true);
    };

    window.addEventListener("app:update-ready", onReady);
    return () => window.removeEventListener("app:update-ready", onReady);
  }, []);

  if (!visible) return null;

  const postpone = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage bloccato: si rimanda solo per questa schermata.
    }
    setVisible(false);
  };

  return (
    <output className="update-banner">
      <span>
        È disponibile una versione aggiornata del percorso. Le risposte già salvate non si perdono.
      </span>
      <button className="button outline" type="button" onClick={applyServiceWorkerUpdate}>
        <RefreshCw size={15} />
        Aggiorna
      </button>
      <button className="text-button" type="button" onClick={postpone}>
        Più tardi
      </button>
    </output>
  );
}
