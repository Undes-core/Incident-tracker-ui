# Contracts: Incidents

---

## `GET /api/incidents`

**Purpose**: Paginated table rows (FR-026), server-side filtered/sorted/paginated (FR-031, P-3).

**Consumed by**: `components/incidents/IncidentTable`.

**Query params**: `status`, `priority`, `service`, `env`, `q` (free-text, FR-029 — matches `title`,
`description`, `external_id`), `page` (25/page, FR-031), `sort` (`priority`\|`age`\|`confidence`,
FR-028), `includeResolved` (boolean, FR-030), plus one of the drill-down params below (FR-004a — at
most one is ever sent).

**Drill-down params** (mutually exclusive, enforced client-side per FR-004a before the request is
built):

- `kpiTile=openIncidents|p1Active|awaitingApproval|automationRate|medianResolve|knownHitRate`
- `funnelDropAt=classified|ragMatched|recommended|approvedOrAutoRun|executedSuccessfully|validatedResolved`
  (FR-052 — the *drop-set* into this stage) or `funnelStage=received` (FR-052c — all incidents in range)
- `breakdown=priority:P1|category:Database|service:<serviceId>` (FR-062)

**Response**:

```ts
{
  rows: Array<{
    id: string;                 // internal id — row click addresses the drawer by this (FR-036)
    externalId: string;
    priority: "P1" | "P2" | "P3" | "P4";
    status: string;
    title: string;
    serviceName: string;
    environment: "Production" | "Staging" | "Development";
    category: string;
    isKnownIncident: boolean;
    bestMatchScore: number | null;   // paired with isKnownIncident
    confidenceScore: number | null;
    createdAt: string;               // age computed client-side from this + injected clock
    assignedTo: string | null;
    automationStatus: "fully_automated" | "human_approved" | "needs_human" | "none"; // derived server- or client-side from RecommendedAction/ExecutedAction rows; see data-model.md Cross-cutting notes
    source: "Email" | "Slack" | "PagerDuty" | "API" | "Manual";
  }>;
  totalCount: number;    // must equal the number the triggering tile/stage/segment displayed (SC-005)
  page: number;
}
```

**No JSONB fields anywhere in this response** (P-4) — `parameters`, `input`, `output`,
`execution_logs`, `response_payload` never appear here even nested.

**Empty responses**: `rows: []` with `totalCount: 0` is ambiguous between "no data" and
"no matches" — the client disambiguates using whether any filter/drill-down/search is active
(FR-063), never from the response shape alone.

**Errors/Side effects**: table-only failure (Principle VIII); read-only.

---

## `GET /api/incidents/:id`

**Purpose**: Full detail — events, agent_runs, matches, actions, feedback (FR-037–FR-049). `:id` is
the **internal** identifier (FR-036).

**Consumed by**: `components/incidents/IncidentDetailDrawer` and its child sections.

**Response** (top-level fields per FR-037; nested arrays per FR-040/FR-042/FR-043/FR-045/FR-049 —
none include their lazy JSONB, see below):

```ts
{
  incident: { id, externalId, title, status, priority, serviceName, environment, assignedTo, createdAt, resolvedAt, source };
  aiClassification: { category: string; priority: string; confidenceScore: number | null };
  correction: { correctedCategory: string | null; correctedPriority: string | null } | null; // FR-039 side-by-side display
  agentRuns: Array<{ id, agentName, agentVersion, status, startedAt, finishedAt, latencyMs: number | null, confidenceScore: number | null, hasError: boolean }>;
  similarityMatches: Array<{ id, documentType, title, score, summarySnippet, sourceUrl }>; // capped at 5 server-side; "show all" (FR-042) issues a second call, see below
  actions: Array<{
    id, actionType, description, riskLevel, confidenceScore, status, approvedBy, approvedAt,
    execution: { id, status, startedAt, finishedAt, errorMessage } | null;
  }>;
  events: Array<{ id, eventType, description, createdBy, createdAt, isAgentEvent: boolean, isFailureEvent: boolean }>; // TL-1/TL-2 flags precomputed so the client doesn't re-derive event-type taxonomy
  feedback: Array<{ id, feedbackType, comments, correctedCategory, correctedPriority, correctedResolution, createdBy, createdAt }>;
}
```

**404 (incident not found)**: renders the "could not be loaded" panel-scoped error (spec.md Edge
Cases: deep link to a nonexistent incident) — never propagates to blank the dashboard behind it.

**An incident outside the active filters**: the drawer still opens and this endpoint still returns
200; filters govern the table, not the drawer (spec.md Edge Cases).

---

## `GET /api/incidents/:id/agent-runs/:runId/io`

**Purpose**: Lazy fetch of one agent run's `input`/`output` JSONB, on expand only (P-4, FR-040).

**Response**: `{ input: unknown; output: unknown }`.

---

## `GET /api/actions/:id/parameters`

**Purpose**: Lazy fetch of one recommended action's `parameters` JSONB, on expand only (P-4, AR-3).

**Response**: `{ parameters: unknown }` — for `action_type = 'SQL'`, `parameters.statement` is what
`sql-formatter` renders (research.md §8); the client never trusts a pre-formatted string from the
server, only the raw statement text.

---

## `GET /api/executions/:id/detail`

**Purpose**: Lazy fetch of one execution's `response_payload`/`execution_logs`, on expand only
(P-4, §D5).

**Response**: `{ responsePayload: unknown; executionLogs: string }`.

---

## `GET /api/incidents/:id/similarity-matches`

**Purpose**: "Show all" beyond the capped 5 (FR-042).

**Response**: `{ matches: SimilarityMatch[] }` (same shape as the capped array above, uncapped).

---

## `GET /api/incidents/:id/events?agentOnly=`

**Purpose**: TL-1's "agent events only" toggle. Implemented as a query param on a re-fetch rather
than a client-side filter, keeping the event list consistent with P-3 (one request per view, no
client-side re-aggregation of a large payload) — this is a deliberate deviation from "server returns
everything, client filters" precisely because event volume is unbounded per incident.

**Response**: same `events` shape as `GET /api/incidents/:id`.

---

## `PATCH /api/incidents/:id` — *dependency, not yet defined by PRD §9*

**Status**: **Not implemented upstream.** This contract exists so FR-038 has a target to build
against once PRD §9 is extended; until then, `components/incidents/IncidentHeaderActions` renders
all four controls disabled with this reason shown, per FR-038a. Do not implement the calling code
as "TODO enable later" — implement the disabled state as the real, tested behavior for launch.

**Purpose**: Single operation backing all four PRD §D1 controls (assign-to-me, change-priority,
escalate, mark-resolved) — one contract instead of four, per the spec's Q1 resolution.

**Proposed request**:

```ts
{
  assignedTo?: string;       // "assign to me" sends the operator name (FR-077)
  priority?: "P1" | "P2" | "P3" | "P4";
  status?: "ESCALATED" | "RESOLVED";
  actor: string;             // FR-038, FR-077 — always sent, whichever field changed
}
```

**Proposed response**: the updated `incident` object (same shape as in `GET /api/incidents/:id`),
plus the corresponding `IncidentEvent` the write must emit (mirroring AR-8's event-emission pattern
for approve/reject).

**Errors**: `409` if the incident's `status`/`priority` changed since the drawer last read it —
client shows the same "someone else changed this" reconciliation behavior as a contested approval
(spec.md Edge Cases).
