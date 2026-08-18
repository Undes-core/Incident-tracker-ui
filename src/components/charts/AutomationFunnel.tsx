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
    <section aria-label="Automation funnel" className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
        <span>
          Fully automated <b className="font-semibold">{automationRate.fullyAutomatedPercent}%</b>
        </span>
        <span>
          Human-assisted <b className="font-semibold">{automationRate.humanAssistedPercent}%</b>
        </span>
      </div>
      {drop && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          Largest drop: {drop.fromLabel} → {drop.toLabel}, −{drop.magnitude}. See the Knowledge tab
          for the likely fix.
        </p>
      )}
      <ol className="mt-3">
        {stages.map((stage, index) => {
          const selection = dropSetFor(stages, index);
          const percent = percentOfStageAbove(stages, index);
          return (
            <li key={stage.key}>
              <button
                type="button"
                disabled={selection.unavailable}
                onClick={() => handleStageClick(index)}
                className="-mx-2 grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="text-[13px]">{stage.label}</span>
                <span className="meta tabular-nums text-foreground">
                  {stage.count ?? "Not yet available"}
                  {percent !== null && (
                    <span className="ml-1.5 text-subtle-foreground">({percent}%)</span>
                  )}
                  {stage.dropCount !== null && index > 0 && (
                    <span className="ml-1.5 text-bad">−{stage.dropCount}</span>
                  )}
                </span>
                {/* The bar spans both columns so the label and count keep their own baseline. */}
                {percent !== null && (
                  <span className="col-span-2 mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      style={{ width: `${percent}%` }}
                      className="block h-full rounded-full bg-primary/60"
                    />
                  </span>
                )}
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
