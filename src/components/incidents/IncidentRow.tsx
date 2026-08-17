import { ageMinutes, formatAge, isAgeFlagged } from "../../domain/age";
import { describeAutomation } from "../../domain/automationIcon";
import { systemClock } from "../../domain/clock";
import { useUrlState } from "../../state/useUrlState";
import { PriorityPill } from "../shared/PriorityPill";
import { StatusPill } from "../shared/StatusPill";
import type { IncidentRow as IncidentRowData } from "../../api/incidents/list";

const SOURCE_ABBREVIATION: Record<IncidentRowData["source"], string> = {
  Email: "EM",
  Slack: "SL",
  PagerDuty: "PD",
  API: "API",
  Manual: "MAN",
};

interface IncidentRowProps {
  incident: IncidentRowData;
}

// IT-1/IT-6/N3: row click opens the drawer via URL state, never a page navigation. Source badge
// in the title cell. Age flagged past its per-priority threshold; escalated/non-prod styling
// always carries a text label (A11Y-1).
export function IncidentRow({ incident }: IncidentRowProps) {
  const { setIncident } = useUrlState();
  const minutes = ageMinutes(incident.createdAt, systemClock);
  const flagged = isAgeFlagged(incident.createdAt, incident.priority, systemClock);
  const automation = describeAutomation(incident.automationStatus);
  const open = () => setIncident(incident.id);

  return (
    <tr
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
    >
      <td>
        <PriorityPill priority={incident.priority} />
      </td>
      <td>
        <StatusPill status={incident.status} />
      </td>
      <td title={incident.title}>
        <span>{SOURCE_ABBREVIATION[incident.source]}</span>
        {incident.title}
      </td>
      <td>{incident.serviceName}</td>
      <td data-nonprod={incident.environment !== "Production"}>{incident.environment}</td>
      <td>{incident.category}</td>
      <td>
        {incident.isKnownIncident ? (
          <span>
            ✓ <span>{incident.bestMatchScore?.toFixed(2)}</span>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td>{incident.confidenceScore != null ? incident.confidenceScore.toFixed(2) : "—"}</td>
      <td data-flagged={flagged}>{formatAge(minutes)}</td>
      <td>
        {incident.assignedTo ?? <span data-warning="true">Unassigned</span>}
      </td>
      <td title={automation.label}>{automation.icon}</td>
    </tr>
  );
}
