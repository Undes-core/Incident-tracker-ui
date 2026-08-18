import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUrlState } from "../../state/useUrlState";
import { useOperator } from "../../state/OperatorContext";
import { SERVICES } from "../../api/fixtures/seededDataset";
import type { TimeRange } from "../../domain/filters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TIME_RANGES: readonly TimeRange[] = ["24h", "7d", "30d", "all"];
const ENVIRONMENTS = ["Production", "Staging", "Development"];
const TIME_RANGE_TOOLTIP =
  "Time range applies to Performance and Knowledge. The alert strip and the Now tab always show current state, whatever range is selected.";

// The design's one control shape: a white box on a hairline border, generous horizontal padding,
// 10px radius. Every dropdown and button in the header is a variation on it.
const BOX =
  "h-9 rounded-[10px] border border-border bg-card px-3.5 text-[13px] text-foreground transition-colors hover:bg-muted/40";

// Native <select> keeps the browser's own keyboard and form semantics (and is what the header's
// tests drive), so the design's chevron is drawn alongside it rather than by a JS listbox.
// Geometry only — the surface comes from the Button variant.
const BUTTON_GEOMETRY = "h-9 rounded-[10px] px-3.5 text-[13px] font-medium";

function environmentLabel(environment: readonly string[]): string {
  if (environment.length === 0) return "All environments";
  if (environment.length === 1) return environment[0];
  return `${environment.length} environments`;
}

function SelectChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground"
    >
      <path
        d="M4 6.5 8 10.5 12 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      <Button
        aria-label="Refresh"
        variant="outline"
        className={BUTTON_GEOMETRY}
        onClick={() => {
          queryClient.invalidateQueries();
          setSecondsAgo(0);
        }}
      >
        Refresh
      </Button>
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
        <Button type="submit" className={BUTTON_GEOMETRY}>
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          className={`${BUTTON_GEOMETRY} text-muted-foreground`}
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="meta">{operatorName ?? "Name not set"}</span>
      <Button
        type="button"
        variant="outline"
        className={`${BUTTON_GEOMETRY} text-muted-foreground`}
        onClick={() => {
          setDraft(operatorName ?? "");
          setEditing(true);
        }}
      >
        {operatorName ? "Change name" : "Set name"}
      </Button>
    </div>
  );
}

// FR-001..FR-004,FR-006: time range/env/service controls + the FR-004 tooltip explaining scope,
// live indicator + manual refresh.
export function DashboardHeader() {
  const { timeRange, setTimeRange, environment, setEnvironment, service, setService } =
    useUrlState();

  return (
    <header className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-3 px-6 py-3.5">
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
          className="flex items-center rounded-[10px] bg-muted p-1"
        >
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              aria-pressed={timeRange === range}
              className="rounded-[7px] px-3.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-sm"
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
          className="size-[18px] shrink-0 rounded-full text-[11px] leading-none text-subtle-foreground hover:bg-muted hover:text-foreground"
        >
          ?
        </button>

        <span aria-hidden="true" className="h-5 w-px bg-border" />

        {/*
          FR-002 requires multi-select, which a native <select multiple> can only render as a
          multi-row listbox — the one shape the design has no room for. A checkbox menu keeps the
          multi-select contract behind the same single-line box as every other header control.
        */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Environment"
              className={`${BOX} relative w-[168px] pr-8 text-left`}
            >
              {environmentLabel(environment)}
              <SelectChevron />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[168px]">
            {ENVIRONMENTS.map((env) => (
              <DropdownMenuCheckboxItem
                key={env}
                checked={environment.includes(env)}
                onCheckedChange={(checked) =>
                  setEnvironment(
                    checked ? [...environment, env] : environment.filter((e) => e !== env),
                  )
                }
              >
                {env}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative">
          <select
            aria-label="Service"
            className={`${BOX} w-[168px] appearance-none pr-8`}
            value={service ?? "all"}
            onChange={(event) =>
              setService(event.target.value === "all" ? null : event.target.value)
            }
          >
            <option value="all">All services</option>
            {SERVICES.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        <LiveIndicator />
        <OperatorNameControl />
      </div>
    </header>
  );
}
