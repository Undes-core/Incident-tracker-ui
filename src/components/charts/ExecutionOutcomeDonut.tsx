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
    <section aria-label="Execution outcomes">
      <div>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="status" innerRadius={50} outerRadius={80}>
              {rows.map((row) => (
                <Cell key={row.status} fill={OUTCOME_COLORS[row.status]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p>Success rate: {outcomes.successRatePercent}%</p>
      </div>

      <ul>
        {rows.map((row) => (
          <li key={row.status}>
            <OutcomeBadge status={row.status} /> {row.value}
          </li>
        ))}
      </ul>

      <p>
        Median execution duration:{" "}
        {outcomes.medianDurationMinutes !== null ? formatAge(outcomes.medianDurationMinutes) : "Not yet available"}
      </p>

      <button type="button" onClick={() => setShowByActionType((value) => !value)} aria-expanded={showByActionType}>
        Breakdown by action type
      </button>
      {showByActionType && (
        <table>
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
              <tr key={row.actionType}>
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

      <div>
        <h3>Recent failures</h3>
        {outcomes.recentFailures.length === 0 ? (
          <p>No recent failures.</p>
        ) : (
          <ul>
            {outcomes.recentFailures.map((failure) => (
              <li key={failure.executedActionId}>
                <span>{failure.actionType}</span>
                <span>{failure.incidentId}</span>
                <span>{failure.truncatedErrorMessage}</span>
                <button type="button" onClick={() => setIncident(failure.incidentId)}>
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
