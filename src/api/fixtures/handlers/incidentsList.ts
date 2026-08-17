import { http, HttpResponse } from "msw";
import {
  INCIDENTS,
  SERVICES,
  RECOMMENDED_ACTIONS,
  EXECUTED_ACTIONS,
  SIMILARITY_MATCHES,
} from "../seededDataset";
import type { AutomationStatus, Priority } from "../../types";
import type { IncidentListResponse } from "../../incidents/list";

const CLOSED_STATUSES = ["RESOLVED", "CLOSED"];
const PRIORITY_ORDER: Record<Priority, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

function automationStatusFor(incidentId: string): AutomationStatus {
  const actions = RECOMMENDED_ACTIONS.filter((a) => a.incidentId === incidentId);
  if (actions.length === 0) return "none";
  if (actions.some((a) => a.status === "PROPOSED")) return "needs_human";

  const succeeded = (actionId: string) =>
    EXECUTED_ACTIONS.some((e) => e.recommendedActionId === actionId && e.status === "SUCCESS");

  if (actions.some((a) => !a.approvalRequired && succeeded(a.id))) return "fully_automated";
  if (actions.some((a) => a.approvalRequired && a.status === "APPROVED" && succeeded(a.id))) {
    return "human_approved";
  }
  return "needs_human";
}

// US1 scope: status/env/service/search/includeResolved/sort/page + the Now-tab kpiTile
// drill-downs. funnelDropAt/funnelStage/breakdown/candidate are extended in by US3/US4/US5
// (tasks.md's shared-file caveat).
export const incidentsListHandlers = [
  http.get("/api/incidents", ({ request }) => {
    const url = new URL(request.url);
    const includeResolved = url.searchParams.get("includeResolved") === "true";
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const envParam = url.searchParams.get("env");
    const serviceParam = url.searchParams.get("service");
    const kpiTile = url.searchParams.get("kpiTile");
    const sort = url.searchParams.get("sort");
    const page = Number(url.searchParams.get("page") ?? "1");

    let rows = INCIDENTS.filter((i) => includeResolved || !CLOSED_STATUSES.includes(i.status));

    if (envParam) {
      const envs = envParam.split(",");
      rows = rows.filter((i) => envs.includes(i.environment));
    }
    if (serviceParam) {
      rows = rows.filter((i) => i.serviceId === serviceParam);
    }
    if (q) {
      rows = rows.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.externalId.toLowerCase().includes(q),
      );
    }

    if (kpiTile === "escalated") {
      rows = rows.filter((i) => i.status === "ESCALATED");
    } else if (kpiTile === "unassigned") {
      rows = rows.filter((i) => !i.assignedTo && !CLOSED_STATUSES.includes(i.status));
    } else if (kpiTile === "openIncidents") {
      rows = rows.filter((i) => !CLOSED_STATUSES.includes(i.status));
    } else if (kpiTile === "oldestOpen") {
      const open = rows.filter((i) => !CLOSED_STATUSES.includes(i.status));
      const oldest = open.reduce<(typeof open)[number] | null>(
        (acc, i) => (acc === null || i.createdAt < acc.createdAt ? i : acc),
        null,
      );
      rows = oldest ? [oldest] : [];
    }

    const sorted = [...rows].sort((a, b) => {
      if (sort === "age") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "confidence") return (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
      const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return byPriority !== 0 ? byPriority : b.createdAt.localeCompare(a.createdAt);
    });

    const pageSize = 25;
    const start = (page - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    const body: IncidentListResponse = {
      rows: pageRows.map((i) => {
        const bestMatch = SIMILARITY_MATCHES.filter((m) => m.incidentId === i.id).sort(
          (a, b) => b.score - a.score,
        )[0];
        return {
          id: i.id,
          externalId: i.externalId,
          priority: i.priority,
          status: i.status,
          title: i.title,
          serviceName: SERVICES.find((s) => s.id === i.serviceId)?.name ?? "",
          environment: i.environment,
          category: i.category,
          isKnownIncident: i.isKnownIncident,
          bestMatchScore: bestMatch?.score ?? null,
          confidenceScore: i.confidenceScore,
          createdAt: i.createdAt,
          assignedTo: i.assignedTo,
          automationStatus: automationStatusFor(i.id),
          source: i.source,
          candidateReason: null,
          recurrenceCount: null,
        };
      }),
      totalCount: sorted.length,
      page,
    };

    return HttpResponse.json(body);
  }),
];
