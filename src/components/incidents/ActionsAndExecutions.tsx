import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActionParameters, fetchExecutionDetail } from "../../api/incidents/detail";
import type { IncidentDetail } from "../../api/incidents/detail";
import { ConfidenceBar } from "../shared/ConfidenceBar";
import { RiskBadge } from "../shared/RiskBadge";
import { OutcomeBadge } from "../shared/OutcomeBadge";

interface ActionsAndExecutionsProps {
  actions: IncidentDetail["actions"];
}

function durationLabel(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "in progress";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function ExecutionEntry({ execution }: { execution: NonNullable<IncidentDetail["actions"][number]["execution"]> }) {
  const [expanded, setExpanded] = useState(false);
  // P-4: response payload + execution logs are JSONB, fetched only once this execution is expanded.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["executions", execution.id, "detail"],
    queryFn: () => fetchExecutionDetail(execution.id),
    enabled: expanded,
  });

  return (
    <div>
      <OutcomeBadge status={execution.status} />
      <span>{durationLabel(execution.startedAt, execution.finishedAt)}</span>
      {execution.errorMessage && <p role="alert">{execution.errorMessage}</p>}
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        Execution details
      </button>
      {expanded && (
        <div>
          {isLoading && <p>Loading execution details…</p>}
          {isError && <p role="alert">Could not load execution details.</p>}
          {data && (
            <>
              <pre>{JSON.stringify(data.responsePayload, null, 2)}</pre>
              <pre>{data.executionLogs}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionEntry({ action }: { action: IncidentDetail["actions"][number] }) {
  const [showParams, setShowParams] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["actions", action.id, "parameters"],
    queryFn: () => fetchActionParameters(action.id),
    enabled: showParams,
  });

  return (
    <li>
      <p>{action.actionType}</p>
      <p>{action.description}</p>
      <RiskBadge risk={action.riskLevel} />
      <ConfidenceBar confidence={action.confidenceScore} />
      <span data-status={action.status}>{action.status}</span>
      {action.approvedBy && (
        <span>
          Approved by {action.approvedBy} at {action.approvedAt}
        </span>
      )}
      <button type="button" onClick={() => setShowParams((value) => !value)} aria-expanded={showParams}>
        Parameters
      </button>
      {showParams && (
        <div>
          {isLoading && <p>Loading parameters…</p>}
          {isError && <p role="alert">Could not load parameters.</p>}
          {data && <pre>{JSON.stringify(data.parameters, null, 2)}</pre>}
        </div>
      )}
      {action.execution && <ExecutionEntry execution={action.execution} />}
    </li>
  );
}

// FR-067: recommended actions with executions nested underneath. Approve/reject (FR-068) is wired
// in US2 — this US1 view is read-only.
export function ActionsAndExecutions({ actions }: ActionsAndExecutionsProps) {
  if (actions.length === 0) {
    return <p>No recommended actions for this incident.</p>;
  }

  return (
    <section aria-label="Recommended actions">
      <ul>
        {actions.map((action) => (
          <ActionEntry key={action.id} action={action} />
        ))}
      </ul>
    </section>
  );
}
