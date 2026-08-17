import { useQuery } from "@tanstack/react-query";
import { apiRequest, buildQuery } from "../client";
import type { ActionType } from "../types";
import type { FunnelStage } from "../../domain/funnel";

export interface PerformanceTiles {
  automationRatePercent: { value: number; deltaVsPrevious: number };
  medianTimeToResolveMinutes: { value: number | null; averageMinutes: number; deltaVsPrevious: number | null };
  knownIncidentHitRate: { value: number; deltaVsPrevious: number };
}

export interface PerformanceFunnel {
  stages: FunnelStage[];
  automationRate: { fullyAutomatedPercent: number; humanAssistedPercent: number };
}

export interface OutcomeCounts {
  success: number;
  failed: number;
  rolledBack: number;
  running: number;
}

export interface PerformanceOutcomes {
  counts: OutcomeCounts;
  successRatePercent: number;
  medianDurationMinutes: number | null;
  byActionType: Array<{ actionType: ActionType } & OutcomeCounts>;
  recentFailures: Array<{
    executedActionId: string;
    incidentId: string;
    actionType: string;
    truncatedErrorMessage: string;
  }>;
}

export interface PerformanceData {
  tiles: PerformanceTiles;
  funnel: PerformanceFunnel;
  outcomes: PerformanceOutcomes;
}

export interface PerformanceParams {
  from?: string;
  to?: string;
  environment?: string[];
  service?: string | null;
}

// FR-080/FR-083/FR-089/FR-090: one request serves the three Performance tiles, the funnel, and
// execution outcomes together (contracts/dashboard-endpoints.md — these are read as one set, not
// independently fetched sub-pages). Each consuming component still fails/retries independently
// (Principle VIII) via its own PanelBoundary around this shared query's data.
export function fetchPerformance(params: PerformanceParams = {}): Promise<PerformanceData> {
  const query = buildQuery({
    from: params.from,
    to: params.to,
    env: params.environment?.join(","),
    service: params.service ?? undefined,
  });
  return apiRequest<PerformanceData>(`/api/dashboard/performance${query}`);
}

export function usePerformance(params: PerformanceParams = {}) {
  return useQuery({
    queryKey: ["dashboard", "performance", params],
    queryFn: () => fetchPerformance(params),
  });
}
