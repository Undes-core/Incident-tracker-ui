import { setupWorker } from "msw/browser";

// Handlers are wired in by Phase 2 (Foundational) once the handler barrel exists,
// and appended to by each user story phase. Empty here is intentional (T005 scope).
export const worker = setupWorker();
