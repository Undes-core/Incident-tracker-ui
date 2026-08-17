import { useBreakdowns } from "../../api/dashboard/breakdowns";
import { PanelBoundary } from "../shared/PanelBoundary";
import { BreakdownBars } from "./BreakdownBars";

export function CategoryBreakdownPanel() {
  const { data, isLoading, isError, error, refetch } = useBreakdowns();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.byCategory.length === 0}
      emptyNoDataMessage="Category breakdown arrives once incidents are worked in the active range."
      skeleton={<div>Loading category breakdown…</div>}
    >
      {(breakdowns) => <BreakdownBars variant="category" rows={breakdowns.byCategory} />}
    </PanelBoundary>
  );
}
