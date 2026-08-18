import { usePerformance } from "../../api/dashboard/performance";
import { PanelBoundary } from "../shared/PanelBoundary";
import { AutomationFunnel } from "./AutomationFunnel";

// Fetches the same shared /api/dashboard/performance query as KpiStripPerformance and
// ExecutionOutcomeDonutPanel (TanStack Query dedups the actual network request, per contracts/
// dashboard-endpoints.md's "one request serves all three") but owns its own PanelBoundary/error
// boundary, so a render failure here never blanks the other two sections (Principle VIII).
export function AutomationFunnelPanel() {
  const { data, isLoading, isError, error, refetch } = usePerformance();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={() => false}
      emptyNoDataMessage="Funnel data arrives once incidents are worked in the active range."
      skeleton={<div>Loading funnel…</div>}
    >
      {(perf) => <AutomationFunnel stages={perf.funnel.stages} automationRate={perf.funnel.automationRate} />}
    </PanelBoundary>
  );
}
