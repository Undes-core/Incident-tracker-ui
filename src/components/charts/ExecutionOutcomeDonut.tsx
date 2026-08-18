import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PerformanceOutcomes } from "../../api/dashboard/performance";
import type { ExecutedActionStatus } from "../../api/types";
import { useUrlState } from "../../state/useUrlState";
import { formatAge } from "../../domain/age";
import { OutcomeBadge } from "../shared/OutcomeBadge";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface ExecutionOutcomeDonutProps {
  outcomes: PerformanceOutcomes;
}

const OUTCOME_COLORS: Record<ExecutedActionStatus, string> = {
  SUCCESS: "#2e7d32",
  FAILED: "#c62828",
  ROLLED_BACK: "#ef6c00",
  RUNNING: "#1565c0",
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
      <div className="flex flex-wrap items-center gap-6">
        <div className="size-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="status" innerRadius={50} outerRadius={80}>
                {rows.map((row) => (
                  <Cell key={row.status} fill={OUTCOME_COLORS[row.status]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[13px]">
          Success rate{" "}
          <b className="text-[20px] font-semibold tracking-[-0.5px]">
            {outcomes.successRatePercent}%
          </b>
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {rows.map((row) => (
          <li key={row.status} className="flex items-center gap-2">
            <OutcomeBadge status={row.status} />
            <span className="meta tabular-nums text-foreground">{row.value}</span>
          </li>
        ))}
      </ul>

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
        className="mt-3 text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
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
