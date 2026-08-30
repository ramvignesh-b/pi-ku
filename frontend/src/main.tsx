import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import "@fontsource-variable/playwrite-hr-lijeva/wght.css";
import "@fontsource-variable/jost/wght.css";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";

import App from "./App";

const rootElement = document.getElementById("root");
if (rootElement) {
  // The boot shell in index.html is markup, not a render of this app, so there
  // is nothing to hydrate. React's first commit clears it in a single frame.
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
