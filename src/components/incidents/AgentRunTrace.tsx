import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgentRunIO } from "../../api/incidents/detail";
import type { IncidentDetail } from "../../api/incidents/detail";

interface AgentRunTraceProps {
  incidentId: string;
  runs: IncidentDetail["agentRuns"];
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function AgentRunEntry({ incidentId, run }: { incidentId: string; run: IncidentDetail["agentRuns"][number] }) {
  // FR-065: failed runs start expanded with the error visible; every other run starts collapsed.
  const [expanded, setExpanded] = useState(run.hasError);
  // P-4: input/output are JSONB and only fetched once this run is expanded, never eagerly.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["incidents", incidentId, "agent-runs", run.id, "io"],
    queryFn: () => fetchAgentRunIO(incidentId, run.id),
    enabled: expanded,
  });

  return (
    <li data-error={run.hasError}>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        {run.agentName} v{run.agentVersion}
      </button>
      <span>{run.status}</span>
      <span>{formatDuration(run.latencyMs)}</span>
      <span>{run.confidenceScore != null ? run.confidenceScore.toFixed(2) : "—"}</span>
      {run.hasError && <span data-error="true">Error</span>}
      {expanded && (
        <div>
          {isLoading && <p>Loading input/output…</p>}
          {isError && <p role="alert">Could not load input/output.</p>}
          {data && (
            <>
              <pre>{JSON.stringify(data.input, null, 2)}</pre>
              <pre>{JSON.stringify(data.output, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </li>
  );
}

// FR-064: agent runs in start order, with name/version, status, duration, confidence, and
// input/output collapsible per-run (fetched lazily on expand, per P-4).
export function AgentRunTrace({ incidentId, runs }: AgentRunTraceProps) {
  if (runs.length === 0) {
    return <p>No agent runs recorded for this incident.</p>;
  }

  return (
    <section aria-label="Agent run trace">
      <ol>
        {runs.map((run) => (
          <AgentRunEntry key={run.id} incidentId={incidentId} run={run} />
        ))}
      </ol>
    </section>
  );
}
