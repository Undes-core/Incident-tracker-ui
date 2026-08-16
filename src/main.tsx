import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Placeholder for Phase 1 (Setup). Superseded by the real entry point in
// Phase 2 (Foundational, T038): mounts providers, registers MSW in dev mode.
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
