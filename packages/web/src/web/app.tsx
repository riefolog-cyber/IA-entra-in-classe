import { Route, Switch } from "wouter";

import { ErrorBoundary } from "./components/error-boundary";
import { Provider } from "./components/provider";
import Index from "./pages/index";

function App() {
  return (
    <ErrorBoundary>
      <Provider>
        <Switch>
          <Route path="*" component={Index} />
        </Switch>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
