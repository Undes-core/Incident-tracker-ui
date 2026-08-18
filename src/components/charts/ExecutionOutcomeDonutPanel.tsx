import { usePerformance } from "../../api/dashboard/performance";
import { PanelBoundary } from "../shared/PanelBoundary";
import { ExecutionOutcomeDonut } from "./ExecutionOutcomeDonut";

// See AutomationFunnelPanel.tsx: shares the same underlying query, owns its own render-error
// isolation.
export function ExecutionOutcomeDonutPanel() {
  const { data, isLoading, isError, error, refetch } = usePerformance();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={() => false}
      emptyNoDataMessage="Execution outcomes arrive once actions have run in the active range."
      skeleton={<div>Loading execution outcomes…</div>}
    >
      {(perf) => <ExecutionOutcomeDonut outcomes={perf.outcomes} />}
    </PanelBoundary>
  );
}
