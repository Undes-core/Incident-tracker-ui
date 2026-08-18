import { useBreakdowns } from "../../api/dashboard/breakdowns";
import { PanelBoundary } from "../shared/PanelBoundary";
import { BreakdownBars } from "./BreakdownBars";

export function PriorityBreakdownPanel() {
  const { data, isLoading, isError, error, refetch } = useBreakdowns();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.byPriority.length === 0}
      emptyNoDataMessage="Priority breakdown arrives once incidents are worked in the active range."
      skeleton={<div>Loading priority breakdown…</div>}
    >
      {(breakdowns) => <BreakdownBars variant="priority" rows={breakdowns.byPriority} />}
    </PanelBoundary>
  );
}
