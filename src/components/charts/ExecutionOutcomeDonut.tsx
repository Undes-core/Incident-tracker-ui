import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PerformanceOutcomes } from "../../api/dashboard/performance";
import type { ExecutedActionStatus } from "../../api/types";
import { useUrlState } from "../../state/useUrlState";
import { formatAge } from "../../domain/age";
import { OutcomeBadge } from "../shared/OutcomeBadge";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface ExecutionOutcomeDonutProps {
  outcomes: PerformanceOutcomes;
}

// Same hues as OutcomeBadge — the donut and the badges beside it must agree, and ROLLED_BACK in
// particular must stay its own violet, never read as a shade of warning-amber or failure-red
// (EO-1).
//
// RUNNING used to borrow --p3, the priority-3 blue. That satisfied EO-1's letter while breaking
// its intent: violet and that blue sit at ΔE 0.4 under deuteranopia, so ROLLED_BACK was protected
// from --ok and --bad and then made indistinguishable from RUNNING. --run is cyan, which clears
// every pair in the set.
const OUTCOME_COLORS: Record<ExecutedActionStatus, string> = {
  SUCCESS: "var(--ok)",
  FAILED: "var(--bad)",
  ROLLED_BACK: "var(--roll)",
  RUNNING: "var(--run)",
};

// FR-090-094/EO-1..EO-4: distribution over success/failed/rolled-back/running with the success
// rate as the centre label. ROLLED_BACK is always its own bucket — never merged into failed.
export function ExecutionOutcomeDonut({ outcomes }: ExecutionOutcomeDonutProps) {
  const [showByActionType, setShowByActionType] = useState(false);
  const { setIncident } = useUrlState();

  const rows: Array<{ status: ExecutedActionStatus; value: number }> = [
    { status: "SUCCESS", value: outcomes.counts.success },
    { status: "FAILED", value: outcomes.counts.failed },
    { status: "ROLLED_BACK", value: outcomes.counts.rolledBack },
    { status: "RUNNING", value: outcomes.counts.running },
  ];

  return (
    <section
      aria-label="Execution outcomes"
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {/* The success rate belongs in the hole. Beside the donut it left the centre empty and a
            wide dead strip to its right, so the one number the chart exists to deliver read as a
            caption. A thinner ring (18px, not 30) both makes room for it and keeps a saturated
            fill off a large block. */}
        <div className="relative size-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="status"
                innerRadius={62}
                outerRadius={80}
                stroke="var(--card)"
                strokeWidth={2}
                paddingAngle={rows.filter((row) => row.value > 0).length > 1 ? 2 : 0}
                // Off, not shortened: the panel polls, so every refetch replayed the sweep-in.
                // Recharts' 1.5s default is also long enough that the ring reads as missing on
                // load, with the centred success rate already painted inside an empty circle.
                isAnimationActive={false}
              >
                {rows.map((row) => (
                  <Cell key={row.status} fill={OUTCOME_COLORS[row.status]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, status) => [value, String(status).replace("_", " ")]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  boxShadow: "var(--shadow-md)",
                  fontSize: 12,
                }}
                labelStyle={{ display: "none" }}
                itemStyle={{ padding: 0, textTransform: "capitalize" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Proportional figures, not tabular-nums: equal-width digits make a display-size
              number look loose. Nothing here is aligned in a column. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.8px] text-foreground">
              {outcomes.successRatePercent}%
            </span>
            <span className="eyebrow mt-1.5">Success rate</span>
          </div>
        </div>

        <ul className="flex min-w-[9rem] flex-col gap-2">
          {rows.map((row) => (
            <li key={row.status} className="flex items-center justify-between gap-3">
              <OutcomeBadge status={row.status} />
              <span className="meta tabular-nums text-foreground">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[13px] text-muted-foreground">
        Median execution duration:{" "}
        {outcomes.medianDurationMinutes !== null
          ? formatAge(outcomes.medianDurationMinutes)
          : "Not yet available"}
      </p>

      <button
        type="button"
        onClick={() => setShowByActionType((value) => !value)}
        aria-expanded={showByActionType}
        className="group -mx-1.5 mt-3 flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-expanded:text-foreground"
      >
        <ChevronRight
          aria-hidden="true"
          className="size-3 shrink-0 text-subtle-foreground transition-transform duration-150 group-aria-expanded:rotate-90 group-aria-expanded:text-foreground"
        />
        Breakdown by action type
      </button>
      {showByActionType && (
        <table className="mt-3 w-full border-collapse text-[12.5px] [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-subtle-foreground">
          <thead>
            <tr>
              <th>Action type</th>
              <th>Success</th>
              <th>Failed</th>
              <th>Rolled back</th>
              <th>Running</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.byActionType.map((row) => (
              <tr key={row.actionType} className="border-b border-border-soft last:border-b-0">
                <td>{row.actionType}</td>
                <td>{row.success}</td>
                <td>{row.failed}</td>
                <td>{row.rolledBack}</td>
                <td>{row.running}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 border-t border-border-soft pt-3">
        <h3 className="eyebrow mb-2">Recent failures</h3>
        {outcomes.recentFailures.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No recent failures.</p>
        ) : (
          <ul>
            {outcomes.recentFailures.map((failure) => (
              <li
                key={failure.executedActionId}
                className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-border-soft py-2 text-[13px] first:border-t-0 first:pt-0"
              >
                <span className="rounded bg-muted px-1.5 py-px font-mono text-[10.5px] font-semibold uppercase text-muted-foreground">
                  {failure.actionType}
                </span>
                <span className="meta">{failure.incidentId}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {failure.truncatedErrorMessage}
                </span>
                <button
                  type="button"
                  onClick={() => setIncident(failure.incidentId)}
                  className="text-[12px] text-p3 underline underline-offset-2"
                >
                  Open incident
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AccessibleChartTable
        caption="Execution outcomes"
        columns={[
          { key: "status", label: "Outcome" },
          { key: "value", label: "Count" },
        ]}
        rows={rows}
      />
    </section>
  );
}
