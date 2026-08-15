# Component Inventory

Principle I requires a component contract (props, states, events, errors, loading, empty) before
implementation. At plan time, before any component exists, that contract is only meaningful once a
component's *identity* and *classification* are fixed — this inventory is that fixation. The full
per-component contract (every prop typed, every state enumerated) is written and reviewed at
task-level, per the constitution's Definition of Done item 1, immediately before that component's
code — `/speckit-tasks` generates one task per row below with "write its contract" as the task's
first checklist item.

Classification is one of: **Page**, **Layout**, **Feature Component**, **Shared Component**,
**Form Component**, **UI Primitive** (constitution, Technology Constraints).

## Layout

| Component | Classification | Responsibility |
|---|---|---|
| `App` | Page | Mounts providers (`QueryClientProvider`, `OperatorContext`), the single route, MSW registration in dev. |
| `DashboardHeader` | Layout | Title, environment filter, time range, live indicator (§4). |
| `BandA` / `BandB` | Layout | Section wrappers; `BandA` is never range-filtered (FR-005). |

## Band A — Summary tiles

| Component | Classification | FRs |
|---|---|---|
| `KpiStrip` | Feature Component | FR-007–FR-011. One TanStack Query (`GET /api/dashboard/summary`) — Principle VIII isolation boundary for the whole strip. |
| `KpiTile` | UI Primitive | Renders one tile; owns the alert/amber styling (FR-009) and its own drill-down click (FR-011, FR-004a/b). |

## Band A — Approvals

| Component | Classification | FRs |
|---|---|---|
| `ApprovalQueue` | Feature Component | FR-012, FR-013, FR-025. One query (`GET /api/approvals/pending`) — its own isolation boundary. |
| `ApprovalCard` | Feature Component | FR-014–FR-017, FR-021/FR-021a, FR-023, FR-024. Owns the approve/reject mutations. |
| `ApproveConfirmModal` | Form Component | FR-018. Uses `useFocusTrap` (research.md §9). |
| `RejectForm` | Form Component | FR-019, FR-020. React Hook Form; required-reason validation. |
| `ParametersViewer` | Shared Component | FR-016. Dynamically imports the tokenizer + `sql-formatter` (research.md §8) on first expand. |
| `WhyThisAction` | Shared Component | FR-017/AR-4. |
| `OperatorNamePrompt` | Form Component | FR-077a. Modal-like; blocks the triggering action's completion until submitted. |

## Band A — Incident table

| Component | Classification | FRs |
|---|---|---|
| `IncidentTable` | Feature Component | FR-026, FR-028–FR-032, FR-034. One query (`GET /api/incidents`), server-side sort/page/search. |
| `IncidentRow` | UI Primitive | Row rendering + click-to-open (FR-027). |
| `AgePill`, `PriorityPill`, `StatusPill`, `AutomationIcon` | UI Primitive | All carry a text label alongside colour (Principle X). |

## Detail drawer

| Component | Classification | FRs |
|---|---|---|
| `IncidentDetailDrawer` | Feature Component | FR-035, FR-036. Owns URL sync for `?incident=`, focus trap + restore (FR-071). One query (`GET /api/incidents/:id`) — isolation boundary for the whole drawer. |
| `IncidentHeaderActions` | Feature Component | FR-037, FR-038, FR-038a. Disabled-with-reason state until the `PATCH` contract exists. |
| `ClassificationPanel` | Shared Component | FR-039. |
| `AgentRunTrace` | Feature Component | FR-040, FR-041. Lazy input/output fetch per run on expand. |
| `SimilarityMatchList` | Shared Component | FR-042. "Show all" triggers the uncapped fetch. |
| `ActionsAndExecutions` | Feature Component | FR-043, FR-044. Reuses `ApprovalCard`'s approve/reject behavior for any still-`PROPOSED` action found here. |
| `EventTimeline` | Feature Component | FR-045–FR-048. Server-side `agentOnly` toggle (contracts/incidents-endpoints.md). |
| `FeedbackForm` | Form Component | FR-049. React Hook Form. |

## Band B

| Component | Classification | FRs |
|---|---|---|
| `AutomationFunnel` | Feature Component | FR-050–FR-053. Hand-rolled (research.md §4); drop-set click → `IncidentTable` filter. |
| `ExecutionOutcomeDonut` | Feature Component | FR-054–FR-058. Recharts `Pie`. |
| `VolumeChart` | Feature Component | FR-059, FR-060. Recharts `ComposedChart` (stacked bars + line). |
| `BreakdownBars` | Feature Component | FR-061, FR-062. Three instances (priority/category/service); Recharts `BarChart`. |
| `AccessibleChartTable` | Shared Component | A11Y-4. One per chart, toggled visible; fed the same domain-computed series as its chart sibling. |

## Cross-cutting shared components

| Component | Classification | Responsibility |
|---|---|---|
| `PanelBoundary` | Shared Component | Error boundary + the four-state switch (loading/empty-no-data/empty-filtered/error) wrapping every Feature Component above that owns a query (Principle VII, VIII). |
| `StaleBanner` | Shared Component | "Last updated Nm ago — reconnecting" (Principle VII stale rule). |
| `RelativeTime` | UI Primitive | Relative-by-default, absolute+timezone on hover (X-5). |
| `ConfidenceBar` | UI Primitive | Bar + numeric value + low-confidence qualifier (AR-2). |

## Domain modules (no React — Principle III)

`domain/automation.ts` (§6.1 + automation icon), `domain/funnel.ts` (drop-set/annotation),
`domain/age.ts` (per-priority thresholds), `domain/median.ts`, `domain/filters.ts` (URL↔query
translation, FR-004a's single-drill-down rule), `domain/clock.ts` (injected `Clock` interface).

## Infrastructure

`api/client.ts` (typed `fetch` wrapper, one module per resource: `dashboard.ts`, `incidents.ts`,
`approvals.ts`, `feedback.ts`), `api/types.ts` (mirrors data-model.md), `api/fixtures/` (MSW seed
data), `state/useUrlState.ts`, `state/OperatorContext.tsx`, `state/queryClient.ts`.
