// FR-025/FR-026: at most one filter active at a time across all tabs; a new selection replaces
// the previous one rather than accumulating. FR-020/TB-5: switching tabs never clears it.
// Extended by US3 (T131) with the cross-tab jump transition.

export type Tab = "now" | "performance" | "knowledge";
export type TimeRange = "24h" | "7d" | "30d" | "all";
export type FilterKind = "kpiTile" | "funnelDropAt" | "funnelStage" | "breakdown" | "candidate";

export interface ActiveFilter {
  kind: FilterKind;
  key: string;
  label: string;
}

export interface DashboardViewState {
  tab: Tab;
  timeRange: TimeRange;
  environment: string[];
  service: string | null;
  search: string;
  includeResolved: boolean;
  activeFilter: ActiveFilter | null;
}

export function setFilter(state: DashboardViewState, filter: ActiveFilter): DashboardViewState {
  return { ...state, activeFilter: filter };
}

export function clearFilter(state: DashboardViewState): DashboardViewState {
  return { ...state, activeFilter: null };
}

export function setTab(state: DashboardViewState, tab: Tab): DashboardViewState {
  return { ...state, tab };
}
