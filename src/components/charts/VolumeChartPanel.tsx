import { useBreakdowns } from "../../api/dashboard/breakdowns";
import { useUrlState } from "../../state/useUrlState";
import { PanelBoundary } from "../shared/PanelBoundary";
import { VolumeChart } from "./VolumeChart";

// Shares the same /api/dashboard/breakdowns query as the three BreakdownBars panels (TanStack
// Query dedups the network request) but owns its own PanelBoundary/error boundary, so a render
// failure here never blanks the breakdowns (Principle VIII).
export function VolumeChartPanel() {
  const { timeRange } = useUrlState();
  const { data, isLoading, isError, error, refetch } = useBreakdowns();

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.volume.length === 0}
      emptyNoDataMessage="Volume data arrives once incidents are worked in the active range."
      skeleton={<div>Loading volume…</div>}
    >
      {(breakdowns) => <VolumeChart buckets={breakdowns.volume} timeRange={timeRange} />}
    </PanelBoundary>
  );
}
