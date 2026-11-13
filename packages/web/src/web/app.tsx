import { ErrorBoundary } from "./components/error-boundary";
import { Provider } from "./components/provider";
import Index from "./pages/index";

function App() {
  return (
    <ErrorBoundary>
      <Provider>
        <Index />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
