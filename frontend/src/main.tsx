import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import "@fontsource-variable/playwrite-hr-lijeva/wght.css";
import "@fontsource-variable/jost/wght.css";
import "@fontsource-variable/fraunces/wght.css";

import App from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
