# Contracts: Approvals

These four endpoints are the highest-scrutiny code in the feature — Constitution V and the
Development Workflow's review rule ("a change touching approve/reject requires explicit reviewer
sign-off on idempotency and the confirm path") both single them out.

---

## `GET /api/approvals/pending`

**Purpose**: Pending action cards incl. top similarity matches (FR-012).

**Consumed by**: `components/approvals/ApprovalQueue`.

**Response**:

```ts
{
  cards: Array<{
    id: string;                          // RecommendedAction.id
    incidentId: string;                  // internal id, for the "Details" link (FR-036)
    incidentExternalId: string;
    priority: "P1" | "P2" | "P3" | "P4";
    serviceName: string;
    environment: "Production" | "Staging" | "Development";
    incidentTitle: string;
    actionType: "SQL" | "LAMBDA" | "API" | "GITHUB_PR" | "KUBERNETES";
    description: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    confidenceScore: number;
    topMatches: Array<{ documentType: string; title: string; score: number; sourceUrl: string }>; // AR-4, shown under "Why this action" without a second call
    proposedAt: string;
    proposedByAgent: string;
  }>;
  autoExecutedCountInRange: number;   // AR-9's positive empty-state copy: "N executed automatically in the last 7 days"
}
```

`cards` already excludes every `approval_required = FALSE` row server-side (AR-10, FR-013) — the
client does not filter for this itself, so there is no code path that could show one by mistake.

Sort order (priority → risk → age, FR-012) is server-side, matching P-3's "no client-side
re-aggregation of a fully-loaded set."

**No `parameters` JSONB here** — fetched via `GET /api/actions/:id/parameters` only on expand
(P-4, AR-3).

---

## `POST /api/actions/:id/approve`

**Purpose**: Sets `APPROVED`, triggers execution, writes event (FR-018, FR-021, FR-022, AR-8).

**Request**:

```ts
{ actor: string; confirmedHighRisk?: true }  // confirmedHighRisk required and true iff riskLevel === "HIGH" (FR-018); server rejects a HIGH-risk approve without it
```

**Response**: `202 Accepted` with `{ executedActionId: string; status: "RUNNING" }`.

**Idempotency (FR-023, X-4)**: the client disables the control synchronously on click, before this
request is sent — this is a UI-layer guarantee, not something the server can retrofit. The mutation
is additionally keyed by action id in TanStack Query so a second call while one is in flight for the
*same* id is suppressed client-side. The server independently rejects a second approve on an
already-`APPROVED`/`REJECTED` action with `409`, so a double-fire is refused at both layers —
Principle V requires the UI-side guarantee to hold even if the server-side one didn't exist.

**Errors**:
- `409` — action no longer `PROPOSED` (someone else acted first, or it was already approved). Client
  reconciles the card to the returned true state rather than retrying (spec.md Edge Cases).
- `400` — HIGH risk without `confirmedHighRisk`.

**Side effects**: creates an `ExecutedAction` (`RUNNING`), writes `recommended_actions.approved_by`/
`approved_at`, emits an `ACTION_APPROVED` `IncidentEvent`.

---

## `POST /api/actions/:id/reject`

**Purpose**: Sets `REJECTED`, writes `developer_feedback` + event (FR-019, FR-020, AR-6, AR-8).

**Request**:

```ts
{ actor: string; reason: string; correctedCategory?: string; correctedPriority?: "P1"|"P2"|"P3"|"P4" }
```

Server returns `400` if `reason` is empty/whitespace — this backs FR-019's "submission is refused"
at the layer that can't be bypassed by a client bug; the client-side required-field validation
(React Hook Form) is the fast path, not the only guard.

**Response**: `200 OK` with the updated action `{ status: "REJECTED", approvedBy: actor, approvedAt }`.

**Errors**: `409` — same reconciliation behavior as approve, for the same reason (action no longer
`PROPOSED`). Per spec.md's edge case, rejecting an action whose *incident* has since resolved is
explicitly **allowed** — only the action's own status is checked, not the incident's.

**Side effects**: writes `recommended_actions.status='REJECTED'`, creates a `DeveloperFeedback` row
(`feedback_type='REJECTED'`, `comments = reason`) — see data-model.md's `rejection_reason` gap note
for why the reason lands there rather than on a dedicated column — and emits `ACTION_REJECTED`.

---

## `GET /api/actions/:id/execution`

**Purpose**: Poll target for live execution status (FR-021, AR-7).

**Consumed by**: `components/approvals/ApprovalCard`'s executing state, polled at research.md's
resolved fast cadence, bounded by FR-021a's 2-minute switch to the slower "still running" cadence.

**Response**: `{ status: "RUNNING" | "SUCCESS" | "FAILED" | "ROLLED_BACK"; errorMessage: string | null; startedAt: string; finishedAt: string | null }`.

The client never infers `FAILED` from the absence of a response or from a timeout — only this
field's actual value. FR-021a's 2-minute bound changes polling cadence and copy, not this contract.
