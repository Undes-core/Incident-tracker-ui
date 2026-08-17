import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUrlState } from "../../state/useUrlState";
import { useOperator } from "../../state/OperatorContext";
import { SERVICES } from "../../api/fixtures/seededDataset";
import type { TimeRange } from "../../domain/filters";

const TIME_RANGES: readonly TimeRange[] = ["24h", "7d", "30d", "all"];
const ENVIRONMENTS = ["Production", "Staging", "Development"];
const TIME_RANGE_TOOLTIP =
  "Time range applies to Performance and Knowledge. The alert strip and the Now tab always show current state, whatever range is selected.";

function LiveIndicator() {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const label = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div>
      <span aria-hidden="true">●</span>
      <span>Updated {label}</span>
      <button
        aria-label="Refresh"
        onClick={() => {
          queryClient.invalidateQueries();
          setSecondsAgo(0);
        }}
      >
        Refresh
      </button>
    </div>
  );
}

// FR-121: the operator can see and change the name attached to every action they take.
function OperatorNameControl() {
  const { operatorName, setOperatorName } = useOperator();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(operatorName ?? "");

  if (editing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = draft.trim();
          if (trimmed) {
            setOperatorName(trimmed);
            setEditing(false);
          }
        }}
      >
        <label>
          Your name
          <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit">Save</button>
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div>
      <span>{operatorName ?? "Name not set"}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(operatorName ?? "");
          setEditing(true);
        }}
      >
        {operatorName ? "Change name" : "Set name"}
      </button>
    </div>
  );
}

// FR-001..FR-004,FR-006: time range/env/service controls + the FR-004 tooltip explaining scope,
// live indicator + manual refresh.
export function DashboardHeader() {
  const { timeRange, setTimeRange, environment, setEnvironment, service, setService } = useUrlState();

  return (
    <header>
      <div>
        AI Incident Response Orchestrator
      </div>
      <div role="group" aria-label="Time range">
        {TIME_RANGES.map((range) => (
          <button key={range} aria-pressed={timeRange === range} onClick={() => setTimeRange(range)}>
            {range}
          </button>
        ))}
      </div>
      <button aria-label="About the time range" title={TIME_RANGE_TOOLTIP} data-tip={TIME_RANGE_TOOLTIP}>
        ?
      </button>
      <select
        aria-label="Environment"
        multiple
        value={environment}
        onChange={(event) => setEnvironment(Array.from(event.target.selectedOptions, (o) => o.value))}
      >
        {ENVIRONMENTS.map((env) => (
          <option key={env} value={env}>
            {env}
          </option>
        ))}
      </select>
      <select
        aria-label="Service"
        value={service ?? "all"}
        onChange={(event) => setService(event.target.value === "all" ? null : event.target.value)}
      >
        <option value="all">All services</option>
        {SERVICES.map((svc) => (
          <option key={svc.id} value={svc.id}>
            {svc.name}
          </option>
        ))}
      </select>
      <LiveIndicator />
      <OperatorNameControl />
    </header>
  );
}
