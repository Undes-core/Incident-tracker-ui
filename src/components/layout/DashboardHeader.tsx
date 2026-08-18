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

// The design's two neutral control shapes: a bordered white box, and a quiet ghost button.
const BOX = "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] text-foreground";
const GHOST_BUTTON =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

function LiveIndicator() {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const label = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-[6px] shrink-0 rounded-full bg-ok" />
        <span className="meta">Updated {label}</span>
      </span>
      <button
        aria-label="Refresh"
        className={GHOST_BUTTON}
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
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = draft.trim();
          if (trimmed) {
            setOperatorName(trimmed);
            setEditing(false);
          }
        }}
      >
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          Your name
          <input
            className={`${BOX} w-32`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        <button type="button" className={GHOST_BUTTON} onClick={() => setEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="meta">{operatorName ?? "Name not set"}</span>
      <button
        type="button"
        className={GHOST_BUTTON}
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
  const { timeRange, setTimeRange, environment, setEnvironment, service, setService } =
    useUrlState();

  return (
    <header className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h1 className="truncate text-[17px] font-semibold tracking-[-0.3px]">
          Incident Response Orchestrator
        </h1>
        <span className="meta shrink-0 text-[11px] uppercase tracking-[0.12em]">Autonomous</span>
      </div>

      {/* The whole control cluster wraps as one unit, so a narrow window drops it to its own row
          rather than interleaving controls with the title. */}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        {/* Segmented control: the selected range is carried by aria-pressed, which also drives the
            white pill — the visual state cannot drift from what assistive tech is told. */}
        <div
          role="group"
          aria-label="Time range"
          className="flex items-center gap-0.5 rounded-lg bg-muted p-1"
        >
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              aria-pressed={timeRange === range}
              className="rounded-md px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          aria-label="About the time range"
          title={TIME_RANGE_TOOLTIP}
          data-tip={TIME_RANGE_TOOLTIP}
          className="size-[18px] shrink-0 rounded-full bg-muted text-[11px] leading-none text-muted-foreground hover:bg-border"
        >
          ?
        </button>

        <span aria-hidden="true" className="h-5 w-px bg-border" />

        {/*
          The one control that can't take the design's single-line box: the environment filter is
          genuinely multi-select (FR-002), so it stays a listbox rather than silently becoming a
          single-choice control.
        */}
        <select
          aria-label="Environment"
          multiple
          // size={3} lets the browser size the listbox to exactly its options — no clipped rows,
          // no scrollbar inside a 3-item list.
          size={3}
          className={`${BOX} py-1 leading-[1.7]`}
          value={environment}
          onChange={(event) =>
            setEnvironment(Array.from(event.target.selectedOptions, (o) => o.value))
          }
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </select>

        <select
          aria-label="Service"
          className={BOX}
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
      </div>
    </header>
  );
}
