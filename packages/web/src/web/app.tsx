import { ErrorBoundary } from "./components/error-boundary";
import Index from "./pages/index";

// Nessun provider di dati: il sito non chiama API. Se in futuro servirà uno
// stato condiviso, va aggiunto qui attorno a `<Index />`.
function App() {
  return (
    <ErrorBoundary>
      <Index />
    </ErrorBoundary>
  );
}

export default App;
