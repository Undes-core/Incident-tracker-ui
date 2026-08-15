# Contracts: Dashboard Aggregates

Every endpoint here is named in PRD §9 verbatim. Each is a single request per Principle XI/P-3 —
no panel issues a second call to assemble its own numbers. All are read-only.

Shared query params: `from`, `to` (ISO 8601, derived from the active time range per FR-001),
`env` (repeated, from FR-002), `service` (optional, FR-003).

---

## `GET /api/dashboard/summary`

**Purpose**: All six KPI tiles (FR-007) in one payload.

**Consumed by**: `components/kpi/KpiStrip`.

**Query params**: `from`, `to`, `env`, `service`. Per FR-005, the *current-state* tiles (below)
ignore `from`/`to` server-side too — they are always "now", not "as of `to`".

**Response**:

```ts
{
  openIncidents: { value: number; deltaVsPrevious: number };       // current-state (FR-005)
  p1Active: { value: number; deltaVsPrevious: number };            // current-state
  awaitingApproval: { value: number; deltaVsPrevious: number };    // current-state
  automationRate: { value: number; deltaVsPrevious: number };      // range-scoped, PRD §6.1
  medianTimeToResolveMinutes: { value: number | null; averageMinutes: number; deltaVsPrevious: number | null }; // FR-010: median is `value`, average is tooltip-only
  knownIncidentHitRate: { value: number; deltaVsPrevious: number };
}
```

`value: null` on median time-to-resolve is the zero-resolved-incidents edge case (spec.md Edge
Cases) — the UI renders the explicit no-value state, never `0`.

**Errors**: `4xx`/`5xx` → FR-063 error state for the KPI strip only; other panels are unaffected
(Principle VIII).

**Side effects**: none.

---

## `GET /api/dashboard/funnel`

**Purpose**: Funnel stage counts (FR-050) and the §6.1 automation-rate split (FR-053). Grouped
together because the PRD nests §6.1 directly under §B1 (the funnel section) — the two-number
split is the funnel's own denominator broken down two ways, not an unrelated metric.

**Consumed by**: `components/charts/AutomationFunnel`.

**Query params**: `from`, `to`, `env`.

**Response**:

```ts
{
  stages: Array<{
    key: "received" | "classified" | "ragMatched" | "recommended" | "approvedOrAutoRun" | "executedSuccessfully" | "validatedResolved";
    label: string;
    count: number;
    dropCount: number | null;   // null only for "received" (FR-052c has no preceding stage)
  }>;
  automationRate: {
    fullyAutomatedPercent: number;   // resolved, successful execution, never required approval (PRD §6.1 query)
    humanAssistedPercent: number;    // resolved, AI proposed, human approved, execution succeeded
  };
}
```

**FR-053 note**: `fullyAutomatedPercent` and `humanAssistedPercent` MUST always render as two
adjacent numbers (FR-053) — never summed or merged into one. This is the same underlying query as
`GET /api/dashboard/summary`'s `automationRate` KPI tile value, but that endpoint returns the single
blended number the tile needs (PRD §A1 #4) while this one returns the PRD §6.1 breakdown Band B
needs; both are served by the same server-side computation, just projected differently.

The largest-drop annotation (FR-051) and the drop-set click filter (FR-052/FR-052a) are computed
client-side in `domain/funnel.ts` from `dropCount` — the server supplies counts, not narrative text.

**`validatedResolved` note**: per data-model.md's `ExecutedAction.validation_status` gap, this
stage's `count`/`dropCount` are `null` until the upstream validation record exists (Assumption 5).
The UI renders this stage as explicitly unavailable, not zero.

**Errors/Side effects**: as above; funnel-only failure per Principle VIII.

---

## `GET /api/dashboard/breakdowns`

**Purpose**: priority / category / service / volume series (FR-059–FR-061).

**Consumed by**: `components/charts/VolumeChart`, `components/charts/BreakdownBars` (×3).

**Query params**: `from`, `to`, `env`.

**Response**:

```ts
{
  volume: Array<{ bucketStart: string; known: number; unknown: number; medianResolutionMinutes: number | null }>;
  // day buckets for 7d/30d/All, hour buckets for 24h (FR-059, Assumption 4)
  byPriority: Array<{ priority: "P1" | "P2" | "P3" | "P4"; count: number }>;
  byCategory: Array<{ category: string; count: number }>;   // server pre-sorts descending, top 6 + "Other" per FR-061
  byService: Array<{ serviceId: string; serviceName: string; count: number; knownRate: number }>; // top 5 per FR-061
}
```

**Errors/Side effects**: as above; each of the four series' owning panel fails independently — a
malformed `byService` entry does not blank the volume chart.

---

## `GET /api/dashboard/executions`

**Purpose**: Outcome counts, by-type split, recent failures (FR-054–FR-058).

**Consumed by**: `components/charts/ExecutionOutcomeDonut`.

**Query params**: `from`, `to`.

**Response**:

```ts
{
  outcomes: { success: number; failed: number; rolledBack: number; running: number }; // EO-1: rolledBack always separate
  successRatePercent: number;              // donut centre label
  medianDurationMinutes: number | null;    // EO-4
  byActionType: Array<{ actionType: "SQL" | "LAMBDA" | "API" | "GITHUB_PR" | "KUBERNETES"; success: number; failed: number; rolledBack: number; running: number }>; // EO-3, toggled view
  recentFailures: Array<{ executedActionId: string; incidentId: string; actionType: string; truncatedErrorMessage: string }>; // EO-2 — incidentId (internal id) is what the link targets, per FR-036
}
```

**Errors/Side effects**: as above; outcome-panel-only failure.
