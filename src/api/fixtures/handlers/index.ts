import type { RequestHandler } from "msw";
import { alertStripHandlers } from "./alertStrip";
import { dashboardNowHandlers } from "./dashboardNow";
import { incidentsListHandlers } from "./incidentsList";
import { incidentsDetailHandlers } from "./incidentsDetail";

// Foundational (T010) creates this barrel empty; each phase appends its own handler module.
export const handlers: RequestHandler[] = [
  ...alertStripHandlers,
  ...dashboardNowHandlers,
  ...incidentsListHandlers,
  ...incidentsDetailHandlers,
];
