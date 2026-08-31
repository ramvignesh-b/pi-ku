import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import "@fontsource-variable/playwrite-hr-lijeva/wght.css";
import "@fontsource-variable/jost/wght.css";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installGlobalErrorReporting } from "./utils/report";

installGlobalErrorReporting();

const rootElement = document.getElementById("root");
if (rootElement) {
  // The boot shell in index.html is markup, not a render of this app, so there
  // is nothing to hydrate. React's first commit clears it in a single frame.
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary
        fallback={
          <main className="min-h-screen flex items-center justify-center bg-base-200 font-sans">
            <div className="text-center space-y-3 px-6">
              <p className="text-lg">
                Something came apart while opening this.
              </p>
              <p className="text-sm opacity-70">
                Reloading the page usually settles it.
              </p>
            </div>
          </main>
        }
      >
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
