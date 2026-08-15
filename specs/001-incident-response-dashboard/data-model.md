# Data Model: AI Incident Response Orchestrator Dashboard

Every field below is sourced from a specific PRD passage (cited inline). Fields marked
**[INFERRED]** are needed by a functional requirement but are not named verbatim anywhere in the
PRD text — per Constitution I, they are not authored here as fact, only as the shape the mock/MSW
fixtures and the real client's TypeScript types must agree on until
`ai_incident_response_database_schema.md` is available to reconcile against. None of the API
contracts in `contracts/` invent a field beyond what is listed here.

This is a read model for the UI, not a schema migration — it exists to give `api/types.ts` a single
source of truth.

## Incident

Source: PRD §A3 table, §D1, §10.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Internal identifier. **Addressing key** — the deep link (FR-036) and every API path use this, never `external_id`. |
| `external_id` | string | Display value only (e.g. `INC-1042`). Searchable (FR-029), never used for addressing (FR-036). |
| `title` | string | Truncated in the table, full on hover (PRD §A3). |
| `description` | string | Searchable (FR-029); not shown in the table. |
| `status` | enum | At least `OPEN`, `ESCALATED`, `RESOLVED`, `CLOSED` (named across §A3, §D1, §11.5). `ESCALATED` is visually distinct from `OPEN` but both count as "not resolved/closed" for the Open Incidents tile (§A1 #1). Full enum **[INFERRED]** beyond these four. |
| `priority` | enum `P1`\|`P2`\|`P3`\|`P4` | §A1 #2, §A3. |
| `environment` | enum `Production`\|`Staging`\|`Development` | §4. |
| `category` | string | Open vocabulary; §B4 shows top-6-plus-Other, implying no fixed enum. |
| `service_id` | string → `Service.id` | §A3. |
| `assigned_to` | string \| null | Null renders as "Unassigned" styled as a warning, not blank (§A3). |
| `confidence_score` | number (0–1) \| null | AI classification confidence (§A3, §D2). |
| `is_known_incident` | boolean | Drives the known-incident hit rate tile and the ✓ icon (§A1 #6, §A3). |
| `source` | enum `Email`\|`Slack`\|`PagerDuty`\|`API`\|`Manual` | IT-6. |
| `created_at` | timestamp | Drives age (FR-033) and the time-range filter (§4). |
| `resolved_at` | timestamp \| null | Feeds median/average resolution time (§A1 #5). |
| `first_response_at` | timestamp \| null | **[GAP — PRD §10 item 1]**. Not required by any FR in this spec; not fetched or displayed in v1. Listed here only so it is not silently added later without a citation. |

**Validation**: none of the above are user-editable directly in v1 except through the incident-update
operation (see `contracts/incidents-endpoints.md`), which is itself gated on FR-038a.

## Service

Source: PRD §A3, §B4, §10 item 5.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | Shown in the table and the service breakdown (§A3, §B4). |
| `criticality` | — | **[GAP — PRD §10 item 5]**. Not in scope; no FR requires it. |

## RecommendedAction

Source: PRD §A2, §D5, §10 item 2.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `incident_id` | string → `Incident.id` | |
| `action_type` | enum `SQL`\|`LAMBDA`\|`API`\|`GITHUB_PR`\|`KUBERNETES` | EO-3. |
| `description` | string | Card body (§A2). |
| `risk_level` | enum `LOW`\|`MEDIUM`\|`HIGH` | AR-1. |
| `confidence_score` | number (0–1) | AR-2. |
| `approval_required` | boolean | `FALSE` rows never enter the queue (AR-10, FR-013). |
| `status` | enum `PROPOSED`\|`APPROVED`\|`REJECTED` | Terminal once `APPROVED`/`REJECTED` (AR-6, AR-8). |
| `approved_by` | string \| null | Operator name per FR-077, written on approve **or** reject. |
| `approved_at` | timestamp \| null | |
| `rejection_reason` | string | **[GAP — PRD §10 item 2 / Assumption 6]**. No dedicated column exists yet; the reason is carried on the linked `DeveloperFeedback.comments` row instead. `api/types.ts` still exposes `rejectionReason` on the UI-side type — the contract in `contracts/approvals-endpoints.md` documents which storage it actually reads from today. |
| `parameters` | JSON | **Lazy-loaded on expand only (P-4)** — never present on the list/queue payload; fetched via the incident-detail or action-detail call. For `action_type = 'SQL'`, this JSON's statement field is what `sql-formatter` pretty-prints (AR-3). |

**Parameters shape for `SQL`** (informative, not exhaustive — the JSON is opaque beyond needing a
`statement` string to format): `{ statement: string, ...driver-specific fields }`.

**Lifecycle**: `PROPOSED → APPROVED` (triggers an `ExecutedAction`) or `PROPOSED → REJECTED`
(terminal, writes `DeveloperFeedback`). No other transition exists.

## ExecutedAction

Source: PRD §A2, §B2, §D5, §10 item 4.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `recommended_action_id` | string → `RecommendedAction.id` | |
| `status` | enum `RUNNING`\|`SUCCESS`\|`FAILED`\|`ROLLED_BACK` | `ROLLED_BACK` is its own terminal bucket, never derived from `FAILED` (EO-1). |
| `started_at` | timestamp | |
| `finished_at` | timestamp \| null | Null while `RUNNING`. Median execution duration (EO-4) is computed from this pair. |
| `error_message` | string \| null | Shown on `FAILED` (AR-7, EO-2). |
| `response_payload` | JSON | **Lazy-loaded on expand only (P-4).** |
| `execution_logs` | string (monospace, scrollable) | **Lazy-loaded on expand only (P-4).** |
| `validation_status` | — | **[GAP — PRD §10 item 4]**. No validation record exists. The funnel's "Validated + resolved" stage (FR-050) is therefore rendered as explicitly unavailable (Assumption 5) rather than inferred from `incident_events` payloads. |

**Lifecycle**: `RUNNING → SUCCESS \| FAILED \| ROLLED_BACK`. FR-021a governs the UI's behavior if no
transition is observed within 2 minutes — this is a display-layer timeout, not a data-model state.

## AgentRun

Source: PRD §D3, §10 item 1.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `incident_id` | string → `Incident.id` | |
| `agent_name` | string | §D3 table. |
| `agent_version` | string | §D3 table. |
| `status` | enum, at least `SUCCESS`\|`FAILED` | Drives default-expand rule (FR-041). |
| `started_at` | timestamp | Ordering key (§D3: "ordered by `started_at`"). |
| `finished_at` | timestamp \| null | Duration = `finished_at - started_at` when both present. |
| `latency_ms` | number \| null | **[GAP — PRD §10 item 1: "optional metrics" not yet promoted to real columns]**. When absent, duration is derived from the timestamp pair (Assumption 7). |
| `confidence_score` | number (0–1) \| null | |
| `input` | JSON | **Lazy-loaded on expand only (P-4).** |
| `output` | JSON | **Lazy-loaded on expand only (P-4).** |
| `error_message` | string \| null | Shown expanded when `status = 'FAILED'` (FR-041). |

`tokens_input`, `tokens_output`, `model`, `prompt_version` are the remaining PRD §10 item 1 gap
fields; no FR in this spec displays them, so they are not part of this feature's read model.

## SimilarityMatch

Source: PRD §D4.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `incident_id` | string → `Incident.id` | |
| `knowledge_document_id` | string → `KnowledgeDocument.id` | |
| `score` | number (0–1) | Sort key, descending (§D4). |

## KnowledgeDocument

Source: PRD §D4.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `type` | enum, at least `INCIDENT`\|`RUNBOOK`\|`POSTMORTEM`\|`GITHUB_ISSUE`\|`DOCUMENTATION` | Values observed in PRD §A2's worked example and §D4's badge requirement; full enum **[INFERRED]**. |
| `summary` | string | Snippet shown per match (§D4). |
| `source_url` | string (URL) | External link — MUST render with `rel="noopener noreferrer"` (Constitution XIII). |

## IncidentEvent

Source: PRD §D6.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `incident_id` | string → `Incident.id` | |
| `event_type` | enum, at least `INCIDENT_CREATED`\|`ACTION_APPROVED`\|`ACTION_REJECTED`\|`ACTION_EXECUTED`\|`VALIDATION_FAILED`\|`ESCALATED` | Named across AR-8 and TL-2. Full enum **[INFERRED]**. |
| `description` | string | Human-readable (§D6). |
| `created_by` | string | Actor — agent, user, or system (§D6). For user-attributed events this is the FR-077 operator name. |
| `payload` | JSON | Expandable per row (§D6); not fetched until expanded, consistent with P-4's intent even though §D6 doesn't name it as JSONB explicitly. |
| `created_at` | timestamp | Ordering key; cumulative-elapsed-time display (TL-3) is computed from this against the incident's `created_at`. |

## DeveloperFeedback

Source: PRD §A2 (AR-6), §D2, §D7.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `incident_id` | string → `Incident.id` | |
| `recommended_action_id` | string → `RecommendedAction.id` \| null | Set when feedback originates from a reject (AR-6); null for a standalone §D7 submission. |
| `feedback_type` | enum `APPROVED`\|`REJECTED`\|`CORRECTED` | §D7. |
| `comments` | string | For a rejection, this is where the required reason lives today (see `RecommendedAction.rejection_reason`). |
| `corrected_category` | string \| null | Drives the "AI said X → human corrected to Y" display (§D2). |
| `corrected_priority` | enum \| null | Same. |
| `corrected_resolution` | string \| null | §D7 only. |
| `created_by` | string | FR-077 operator name. |
| `created_at` | timestamp | |

## Cross-cutting notes

- **Automation classification** (the incident-table icon: 🤖/👤/⚠️/—) is not a stored field — it is
  derived per incident from its `RecommendedAction`/`ExecutedAction` rows, using the same predicate
  as the §6.1 automation-rate query. This derivation lives in `domain/automation.ts`, not on this
  model, per Constitution III.
- **Age** (FR-033) is derived from `Incident.created_at` and an injected clock, not stored.
- No entity above is created or edited by this feature beyond: `RecommendedAction.status` (approve/
  reject), `ExecutedAction` (created by approval, read-only otherwise), `DeveloperFeedback` (created
  by reject or the §D7 form), and `Incident.{assigned_to, priority, status}` via the FR-038
  incident-update operation once it exists. Everything else is read-only, matching the v1 non-goals
  (Out of Scope section, spec.md).
