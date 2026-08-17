import { useBreakdowns } from "../../api/dashboard/breakdowns";
import { PanelBoundary } from "../shared/PanelBoundary";
import { BreakdownBars } from "./BreakdownBars";

export function ServiceBreakdownPanel() {
  const { data, isLoading, isError, error, refetch } = useBreakdowns();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.byService.length === 0}
      emptyNoDataMessage="Service breakdown arrives once incidents are worked in the active range."
      skeleton={<div>Loading service breakdown…</div>}
    >
      {(breakdowns) => <BreakdownBars variant="service" rows={breakdowns.byService} />}
    </PanelBoundary>
  );
}
