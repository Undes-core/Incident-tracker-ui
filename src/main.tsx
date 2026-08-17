import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

async function enableMocking() {
  if (!import.meta.env.DEV) return;
  const { worker } = await import("./api/fixtures/browser");
  await worker.start({ onUnhandledRequest: "warn" });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
