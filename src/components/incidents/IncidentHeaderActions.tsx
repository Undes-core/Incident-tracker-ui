import type { IncidentDetail } from "../../api/incidents/detail";
import { PriorityPill } from "../shared/PriorityPill";
import { StatusPill } from "../shared/StatusPill";

interface IncidentHeaderActionsProps {
  incident: IncidentDetail["incident"];
}

const DISABLED_REASON = "Incident updates are not available yet.";

// FR-060/FR-061/FR-062: header metadata plus the four update actions, visibly disabled with a
// stated reason (never hidden, never silently succeeding) until the incident-update API exists.
export function IncidentHeaderActions({ incident }: IncidentHeaderActionsProps) {
  return (
    <header>
      <p>{incident.externalId}</p>
      <h2>{incident.title}</h2>
      <div>
        <StatusPill status={incident.status} />
        <PriorityPill priority={incident.priority} />
        <span>{incident.serviceName}</span>
        <span data-nonprod={incident.environment !== "Production"}>{incident.environment}</span>
        <span>{incident.assignedTo ?? <span data-warning="true">Unassigned</span>}</span>
        <span>Source: {incident.source}</span>
      </div>
      <div>
        <span>Created {incident.createdAt}</span>
        <span>Resolved {incident.resolvedAt ?? "—"}</span>
      </div>
      <div role="group" aria-label="Incident actions">
        {["Assign to me", "Change priority", "Escalate", "Mark resolved"].map((label) => (
          <button key={label} type="button" disabled title={DISABLED_REASON} aria-disabled="true">
            {label}
          </button>
        ))}
        <p>{DISABLED_REASON}</p>
      </div>
    </header>
  );
}
