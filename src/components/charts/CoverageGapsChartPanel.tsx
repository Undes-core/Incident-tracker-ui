import { useKnowledge } from "../../api/dashboard/knowledge";
import { PanelBoundary } from "../shared/PanelBoundary";
import { CoverageGapsChart } from "./CoverageGapsChart";

// Shares the same underlying /api/dashboard/knowledge query as KpiStripKnowledge and
// DocumentsDrivingResolutionsPanel (TanStack Query dedups the network request) but owns its own
// PanelBoundary/error boundary, so a render failure here never blanks the other two sections.
export function CoverageGapsChartPanel() {
  const { data, isLoading, isError, error, refetch } = useKnowledge();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.coverageGaps.length === 0}
      emptyNoDataMessage="Coverage-gap data arrives once services have incident history to measure."
      skeleton={<div>Loading coverage gaps…</div>}
    >
      {(knowledge) => <CoverageGapsChart services={knowledge.coverageGaps} />}
    </PanelBoundary>
  );
}
