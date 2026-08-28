import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "./index.css";

import "@fontsource-variable/playwrite-hr-lijeva/wght.css";
import "@fontsource-variable/jost/wght.css";
import "@fontsource-variable/fraunces/wght.css";

import App from "./App";

const rootElement = document.getElementById("root");
if (rootElement) {
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  );

  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
  } else {
    createRoot(rootElement).render(app);
  }
}
