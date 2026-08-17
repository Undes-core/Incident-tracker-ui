import type { FunnelStage } from "../../domain/funnel";
import { percentOfStageAbove, largestDrop, dropSetFor } from "../../domain/funnel";
import { useCrossTabJump } from "../../state/useCrossTabJump";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface AutomationFunnelProps {
  stages: FunnelStage[];
  automationRate: { fullyAutomatedPercent: number; humanAssistedPercent: number };
}

// FR-083-089/§6.1/P2: hand-rolled — each row is a click target bound to a domain-computed
// drop-set, not a generic charting-library funnel (research.md §4).
export function AutomationFunnel({ stages, automationRate }: AutomationFunnelProps) {
  const jump = useCrossTabJump();
  const drop = largestDrop(stages);

  function handleStageClick(index: number) {
    const selection = dropSetFor(stages, index);
    if (selection.unavailable) return;
    jump({
      kind: selection.kind,
      key: selection.key,
      label: selection.label,
      toastMessage: `Jumped to Now — ${selection.label.toLowerCase()}.`,
    });
  }

  return (
    <section aria-label="Automation funnel">
      <div>
        <span>Fully automated: {automationRate.fullyAutomatedPercent}%</span>
        <span>Human-assisted: {automationRate.humanAssistedPercent}%</span>
      </div>
      {drop && (
        <p>
          Largest drop: {drop.fromLabel} → {drop.toLabel}, −{drop.magnitude}. See the Knowledge tab for the likely
          fix.
        </p>
      )}
      <ol>
        {stages.map((stage, index) => {
          const selection = dropSetFor(stages, index);
          const percent = percentOfStageAbove(stages, index);
          return (
            <li key={stage.key}>
              <button type="button" disabled={selection.unavailable} onClick={() => handleStageClick(index)}>
                <span>{stage.label}</span>
                <span>{stage.count ?? "Not yet available"}</span>
                {percent !== null && <span>({percent}%)</span>}
                {stage.dropCount !== null && index > 0 && <span>−{stage.dropCount}</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <AccessibleChartTable
        caption="Automation funnel stage counts"
        columns={[
          { key: "label", label: "Stage" },
          { key: "count", label: "Count" },
          { key: "dropCount", label: "Drop count" },
        ]}
        rows={stages.map((stage) => ({
          label: stage.label,
          count: stage.count ?? "Not yet available",
          dropCount: stage.dropCount ?? "—",
        }))}
      />
    </section>
  );
}
