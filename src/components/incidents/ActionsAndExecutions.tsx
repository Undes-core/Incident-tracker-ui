import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActionParameters, fetchExecutionDetail } from "../../api/incidents/detail";
import type { IncidentDetail } from "../../api/incidents/detail";
import type { PendingApprovalCard } from "../../api/approvals/pending";
import { ConfidenceBar } from "../shared/ConfidenceBar";
import { RiskBadge } from "../shared/RiskBadge";
import { OutcomeBadge } from "../shared/OutcomeBadge";
import { ApprovalCard } from "../approvals/ApprovalCard";

interface ActionsAndExecutionsProps {
  actions: IncidentDetail["actions"];
  incident: IncidentDetail["incident"];
  similarityMatches: IncidentDetail["similarityMatches"];
}

const TOP_MATCHES_CAP = 3;

// FR-068: a still-PROPOSED action found here gets the exact same approve/reject behaviour as the
// queue (component-inventory.md) — built from data already loaded for this drawer, no new fetch.
function toPendingApprovalCard(
  action: IncidentDetail["actions"][number],
  incident: IncidentDetail["incident"],
  similarityMatches: IncidentDetail["similarityMatches"],
): PendingApprovalCard {
  return {
    id: action.id,
    incidentId: incident.id,
    incidentExternalId: incident.externalId,
    priority: incident.priority,
    serviceName: incident.serviceName,
    environment: incident.environment,
    incidentTitle: incident.title,
    actionType: action.actionType,
    description: action.description,
    riskLevel: action.riskLevel,
    confidenceScore: action.confidenceScore,
    topMatches: [...similarityMatches]
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_MATCHES_CAP)
      .map((m) => ({ documentType: m.documentType, title: m.title, score: m.score, sourceUrl: m.sourceUrl })),
    proposedAt: incident.createdAt,
    proposedByAgent: "Remediation Planner",
  };
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

// FR-067/FR-068: recommended actions with executions nested underneath. A still-PROPOSED action
// reuses ApprovalCard wholesale; everything else (APPROVED/REJECTED, with its execution) stays the
// plain read-only view.
export function ActionsAndExecutions({ actions, incident, similarityMatches }: ActionsAndExecutionsProps) {
  if (actions.length === 0) {
    return <p>No recommended actions for this incident.</p>;
  }

  return (
    <section aria-label="Recommended actions">
      <ul>
        {actions.map((action) =>
          action.status === "PROPOSED" ? (
            <ApprovalCard key={action.id} card={toPendingApprovalCard(action, incident, similarityMatches)} />
          ) : (
            <ActionEntry key={action.id} action={action} />
          ),
        )}
      </ul>
    </section>
  );
}
