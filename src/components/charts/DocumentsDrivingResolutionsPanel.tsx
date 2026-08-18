import { useKnowledge } from "../../api/dashboard/knowledge";
import { PanelBoundary } from "../shared/PanelBoundary";
import { DocumentsDrivingResolutions } from "./DocumentsDrivingResolutions";

// See CoverageGapsChartPanel.tsx: shares the same underlying query, owns its own render-error
// isolation.
export function DocumentsDrivingResolutionsPanel() {
  const { data, isLoading, isError, error, refetch } = useKnowledge();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.documentsDrivingResolutions.length === 0}
      emptyNoDataMessage="No documents have driven a resolution yet."
      skeleton={<div>Loading documents driving resolutions…</div>}
    >
      {(knowledge) => <DocumentsDrivingResolutions documents={knowledge.documentsDrivingResolutions} />}
    </PanelBoundary>
  );
}
