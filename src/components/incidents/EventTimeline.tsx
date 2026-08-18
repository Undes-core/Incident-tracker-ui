import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidentEvents } from "../../api/incidents/detail";
import type { IncidentDetail } from "../../api/incidents/detail";
import { cumulativeElapsed } from "../../domain/timeline";
import { RelativeTime } from "../shared/RelativeTime";

interface EventTimelineProps {
  incidentId: string;
  incidentCreatedAt: string;
  events: IncidentDetail["events"];
}

const EVENT_ICON: Record<IncidentDetail["events"][number]["eventType"], string> = {
  INCIDENT_CREATED: "🆕",
  EMAIL_RECEIVED: "📧",
  INCIDENT_CLASSIFIED: "🏷️",
  RAG_SEARCH_STARTED: "🔍",
  RAG_SEARCH_COMPLETED: "🔎",
  SIMILAR_INCIDENT_FOUND: "🧩",
  ACTION_RECOMMENDED: "💡",
  DEVELOPER_NOTIFIED: "🔔",
  ACTION_APPROVED: "✅",
  ACTION_REJECTED: "🚫",
  ACTION_EXECUTED: "⚙️",
  VALIDATION_FAILED: "⚠️",
  ESCALATED: "🚨",
};

// FR-069-072: chronological timeline, icon per event type, relative + absolute timestamps, actor,
// cumulative elapsed time, failure events flagged with a text label, and a server-side (TL-1, not
// client-filtered) "agent events only" toggle.
export function EventTimeline({ incidentId, incidentCreatedAt, events }: EventTimelineProps) {
  const [agentOnly, setAgentOnly] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["incidents", incidentId, "events", agentOnly],
    queryFn: () => fetchIncidentEvents(incidentId, agentOnly),
    initialData: agentOnly ? undefined : { events },
  });

  return (
    <section aria-label="Event timeline">
      <label>
        <input type="checkbox" checked={agentOnly} onChange={(e) => setAgentOnly(e.target.checked)} />
        Agent events only
      </label>
      {isLoading && <p>Loading events…</p>}
      {isError && (
        <div role="alert">
          <p>{(error as Error | undefined)?.message ?? "Could not load events."}</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}
      {data && data.events.length === 0 && <p>No events recorded for this incident.</p>}
      {data && data.events.length > 0 && (
        <ol>
          {data.events.map((event) => (
            <li key={event.id} data-failure={event.isFailureEvent}>
              <span aria-hidden="true">{EVENT_ICON[event.eventType]}</span>
              <p>{event.description}</p>
              <span>{event.createdBy}</span>
              <RelativeTime timestamp={event.createdAt} />
              <span>{cumulativeElapsed(event.createdAt, incidentCreatedAt)}</span>
              {event.isFailureEvent && <span data-failure="true">Failed</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
