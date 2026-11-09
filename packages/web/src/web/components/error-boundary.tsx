import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Errore non gestito nell’interfaccia:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="reading-page" role="alert">
          <h1>Qualcosa non ha funzionato.</h1>
          <p>
            Le tue risposte restano salvate in questo browser. Ricarica la pagina per riprendere il
            percorso; se il problema continua, esporta il quaderno e segnala l’errore.
          </p>
          <button className="button primary" type="button" onClick={() => window.location.reload()}>
            Ricarica la pagina
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
