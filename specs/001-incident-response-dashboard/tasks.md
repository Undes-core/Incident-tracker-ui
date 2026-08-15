# Tasks: AI Incident Response Orchestrator Dashboard

**Input**: Design documents from `/specs/001-incident-response-dashboard/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [component-inventory.md](./component-inventory.md),
[contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: MANDATORY (Constitution Principle XII). Every user story phase writes its tests first;
implementation follows. `[REQ]` on every task cites the PRD requirement ID(s) spec.md attached to
the functional requirement(s) it satisfies — the FR number itself appears in the description text
for a direct spec.md lookup.

## Format: `[ID] [P?] [Story] [REQ] Description`

- **[P]**: different file, no dependency on an incomplete task in this list
- **[Story]**: `US1`/`US2`/`US3`/`US4` — omitted for Setup, Foundational, and Polish
- **[REQ]**: PRD requirement ID(s) or §11 criterion, per Constitution Principle II

## Path Conventions

React SPA, single project (plan.md → Project Structure): `src/components/`, `src/domain/`,
`src/api/`, `src/state/` at repository root; component/unit tests colocated as `*.test.ts(x)`;
Playwright specs under `tests/e2e/`.

---

## Phase 1: Setup

**Purpose**: Scaffold the project — there is no `package.json` yet (CLAUDE.md's greenfield note).

- [ ] T001 Initialize Vite + React + TypeScript-strict project (`package.json`, `vite.config.ts`,
      `tsconfig.json` with `strict: true`, `noImplicitAny: true`) at repo root (research.md §1)
- [ ] T002 [P] Configure ESLint + Prettier for TS/React, forbidding `any` (constitution Technology
      Constraints) in `eslint.config.js`
- [ ] T003 [P] Configure Vitest sharing Vite's config + RTL setup file in `vitest.config.ts` /
      `tests/setupTests.ts` (research.md §5)
- [ ] T004 [P] Configure Playwright (`playwright.config.ts`, `tests/e2e/`) (research.md §6)
- [ ] T005 [P] Install and scaffold MSW: `src/api/fixtures/browser.ts` (`setupWorker`) and
      `src/api/fixtures/server.ts` (`setupServer`) (research.md §7)
- [ ] T006 Create directory skeleton: `src/components/{layout,kpi,approvals,incidents,charts,
      shared}/`, `src/domain/`, `src/api/{dashboard,incidents,approvals}/`, `src/api/fixtures/
      handlers/`, `src/state/`, `tests/e2e/` (plan.md → Project Structure)
- [ ] T007 [P] Add `dev`/`build`/`test`/`test:e2e`/`typecheck`/`lint` scripts to `package.json`
      (quickstart.md)

**Checkpoint**: `npm run dev` serves an empty app; `npm run test`/`test:e2e`/`typecheck` all run
(green on nothing, but wired).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure every user story's panels depend on. No story starts before this phase
is done — every "one query per panel" (Principle VIII) and "URL is the shareable state"
(Principle IX) claim in the plan rests on what's built here.

**⚠️ CRITICAL**: Blocks all user stories.

- [ ] T008 Define shared types in `src/api/types.ts` mirroring data-model.md's nine entities;
      mark `[INFERRED]`/`[GAP]` fields with a code comment pointing back to data-model.md
- [ ] T009 [P] Build the seeded fixture dataset in `src/api/fixtures/seededDataset.ts` from the
      PRD's own numbers (§B1 funnel: 142/98/87/79/71/68; §B4 breakdown counts; §A2's worked example)
      (research.md §7)
- [ ] T010 Create the MSW handler barrel `src/api/fixtures/handlers/index.ts` (starts empty; each
      story phase appends its own handler module here)
- [ ] T011 Wire MSW worker registration into `src/main.tsx`, dev-mode only (research.md §7)
- [ ] T012 [P] Implement `src/api/client.ts`: typed `fetch` wrapper (base URL, JSON parsing, error
      normalization) — the only place `fetch` appears (constitution Technology Constraints)
- [ ] T013 [P] [REQ Principle III] Implement `src/domain/clock.ts`: a `Clock` interface + a
      system-clock implementation, injected everywhere else in `domain/` — never `Date.now()`
      called directly outside this file
- [ ] T014 [P] [REQ Principle III,XII] Unit test for `domain/clock.ts` (default vs. injected
      clock) in `src/domain/clock.test.ts`
- [ ] T015 [P] [REQ PRD §A1,§B1,§B4 / FR-004a,FR-004b] Implement `src/domain/filters.ts`: pure
      functions for "at most one active drill-down, selecting a new one replaces the old" and
      "clear drill-down without disturbing global filters"
- [ ] T016 [P] [REQ FR-004a,FR-004b] Unit test for `domain/filters.ts` (replace-not-accumulate;
      clear leaves time range/env/service/search untouched) in `src/domain/filters.test.ts`
- [ ] T017 [REQ PRD §4,§7,§11.7 / FR-001,FR-002,FR-003,FR-004,FR-036] Implement
      `src/state/useUrlState.ts`: typed hook over `URLSearchParams` + `history.replaceState`
      exposing time range/env/service/search/includeResolved/drill-down/`incident` (internal id),
      built on `domain/filters.ts` (research.md §2)
- [ ] T018 [REQ FR-004,FR-036,SC-010] Test for `useUrlState` round-trip (set → serialize → parse
      restores identical state) in `src/state/useUrlState.test.ts`
- [ ] T019 [P] Implement `src/state/queryClient.ts`: TanStack `QueryClient` with shared defaults
      (retry, `staleTime`) (research.md §3)
- [ ] T020 [P] [REQ AR-8,FR-077,FR-077b / Assumption 10,12] Implement `src/state/
      OperatorContext.tsx`: React Context + `localStorage`-backed operator name, plus the
      configurable low-confidence threshold (default 0.70) — scaffold only; the
      prompt-blocks-until-supplied behavior (FR-077a) is wired in US2, where attribution first
      matters
- [ ] T021 [REQ FR-077,FR-077b] Unit test for `OperatorContext` (localStorage persistence,
      change-name) in `src/state/OperatorContext.test.tsx`
- [ ] T022 [P] [REQ Principle VII / FR-063,FR-064] Implement `src/components/shared/
      PanelBoundary.tsx`: error boundary + the four-state switch (loading skeleton /
      empty-no-data / empty-filtered / inline retryable error)
- [ ] T023 [REQ FR-063,FR-064,Principle VIII] Component test for `PanelBoundary`'s four states and
      that its failure doesn't propagate outward, in `src/components/shared/PanelBoundary.test.tsx`
- [ ] T024 [P] [REQ Principle VII stale rule / FR-065] Implement `src/components/shared/
      StaleBanner.tsx`: "Last updated Nm ago — reconnecting"
- [ ] T025 [P] [REQ X-5 / FR-068 / Assumption 9] Implement `src/components/shared/
      RelativeTime.tsx`: relative by default, absolute + timezone on hover
- [ ] T026 [REQ X-5,FR-068] Unit test for `RelativeTime` formatting with an injected clock in
      `src/components/shared/RelativeTime.test.tsx`
- [ ] T027 [P] [REQ AR-2 / FR-015,FR-069] Implement `src/components/shared/ConfidenceBar.tsx`:
      bar + numeric value + low-confidence qualifier, reading the threshold from `OperatorContext`
- [ ] T028 [P] [REQ AR-1,A11Y-1 / FR-014,FR-069] Implement `src/components/shared/
      PriorityPill.tsx`, `StatusPill.tsx`, `RiskBadge.tsx`, `OutcomeBadge.tsx` — every one renders
      a text label alongside colour, never colour alone
- [ ] T029 [REQ A11Y-1,A11Y-2] Component tests for all four pill/badge components (text label
      present; contrast-safe class applied) in `src/components/shared/*Pill*.test.tsx` and
      `*Badge*.test.tsx`
- [ ] T030 [P] [REQ A11Y-3] Implement `src/state/useFocusTrap.ts`: cycles Tab/Shift+Tab within a
      container ref, restores focus to the triggering element on close (research.md §9)
- [ ] T031 [REQ A11Y-3] Unit test for `useFocusTrap` (cycling, restore-on-close) in
      `src/state/useFocusTrap.test.ts`
- [ ] T032 [P] [REQ A11Y-4 / FR-072] Implement `src/components/shared/
      AccessibleChartTable.tsx`: renders a domain-computed series as a table, visibly toggled
- [ ] T033 [REQ A11Y-4 / FR-072] Component test for `AccessibleChartTable` toggle + table content
      in `src/components/shared/AccessibleChartTable.test.tsx`
- [ ] T034 Implement `src/App.tsx`: mounts `QueryClientProvider`, `OperatorContext.Provider`, the
      single route
- [ ] T035 [P] [REQ PRD §4 / FR-001,FR-002,FR-006] Implement `src/components/layout/
      DashboardHeader.tsx`: title, environment multi-select, time-range segmented control, live
      indicator + manual refresh — all wired to `useUrlState`
- [ ] T036 [REQ FR-001,FR-002,FR-006] Component test for `DashboardHeader` (each control updates
      URL state correctly) in `src/components/layout/DashboardHeader.test.tsx`
- [ ] T037 [P] [REQ PRD §4 / FR-005] Implement `src/components/layout/BandA.tsx` and
      `BandB.tsx`: section wrappers — `BandA` never reads the time-range filter
- [ ] T038 Implement `src/main.tsx`: entry point mounting `App` inside providers

**Checkpoint**: Foundation ready. `npm run dev` shows the header and empty bands; every shared
primitive and hook has a passing unit/component test. User story work can begin.

---

## Phase 3: User Story 1 - Triage what needs a human right now (Priority: P1) 🎯 MVP

**Goal**: An on-call engineer opens the dashboard, reads the six KPI tiles, scans the incident
table, and opens any incident's full detail — all read-only, all without leaving the page.

**Independent Test**: Load against the seeded dataset; verify tile values, table filtering/sort/
search, row-click-opens-drawer-without-navigation, and URL round-trip on reload (spec.md's own
Independent Test for this story).

### Tests for User Story 1 (MANDATORY — write first) ⚠️

- [ ] T039 [P] [US1] [REQ PRD §A1 / FR-007-011,§11.1] Contract test for
      `GET /api/dashboard/summary` (all six tile shapes, median/average pairing, null-median edge
      case) in `src/api/dashboard/summary.contract.test.ts`
- [ ] T040 [P] [US1] [REQ IT-1,IT-2,IT-3,IT-4,IT-5,IT-6,P-3,P-4 / FR-026-034,FR-075,FR-076]
      Contract test for `GET /api/incidents` (filter/sort/search/pagination/`totalCount` per
      IT-5/FR-031, source field per IT-6/FR-032, zero JSONB fields present) in
      `src/api/incidents/list.contract.test.ts`
- [ ] T041 [P] [US1] [REQ PRD §D1-D6,§11.6 / FR-035-048] Contract test for
      `GET /api/incidents/:id` (top-level shape, no inline JSONB, 404 handling) in
      `src/api/incidents/detail.contract.test.ts`
- [ ] T042 [P] [US1] [REQ PRD §A1 / FR-009,FR-010,FR-011] Component test for `KpiTile`: alert/amber
      styling, median-not-average value with average in tooltip, click sets the drill-down, in
      `src/components/kpi/KpiTile.test.tsx`
- [ ] T043 [P] [US1] [REQ P-2 / FR-007,FR-008] Component test for `KpiStrip`: renders all six
      tiles from one query, correct delta-is-good-or-bad direction per tile, in
      `src/components/kpi/KpiStrip.test.tsx`
- [ ] T044 [P] [US1] [REQ IT-2,IT-3,IT-4,IT-5 / FR-028,FR-029,FR-030,FR-031,FR-033,FR-034]
      Component test for `IncidentTable`: header sort, free-text search, include-resolved toggle,
      pagination at 25 rows, age flagging, escalated/non-prod styling, in
      `src/components/incidents/IncidentTable.test.tsx`
- [ ] T045 [P] [US1] [REQ IT-1,IT-6,§11.6 / FR-027,FR-032] Component test for `IncidentRow`:
      click opens the drawer via URL state with no navigation event, source-badge icon renders in
      the title cell, in `src/components/incidents/IncidentRow.test.tsx`
- [ ] T046 [P] [US1] [REQ PRD §7,A11Y-3 / FR-035,FR-036] Component test for
      `IncidentDetailDrawer`: opens over an interactive dashboard, `Esc`/click-outside close,
      focus returns to the opening row, in `src/components/incidents/
      IncidentDetailDrawer.test.tsx`
- [ ] T047 [P] [US1] [REQ PRD §D3,§11.6 / FR-041] Component test for `AgentRunTrace`: `FAILED`
      run expanded by default with its error visible, all others collapsed, in
      `src/components/incidents/AgentRunTrace.test.tsx`
- [ ] T048 [P] [US1] [REQ PRD §D4 / FR-042] Component test for `SimilarityMatchList`: capped at
      five, "show all" fetches the rest, in `src/components/incidents/
      SimilarityMatchList.test.tsx`
- [ ] T049 [P] [US1] [REQ TL-1,TL-2,TL-3 / FR-045,FR-046,FR-047,FR-048] Component test for
      `EventTimeline`: agent-only filter, failure-event flags, cumulative elapsed time per row,
      in `src/components/incidents/EventTimeline.test.tsx`
- [ ] T050 [P] [US1] [REQ §11.7,SC-010 / FR-036] Playwright e2e: open `?incident=<internal-id>`
      directly, confirm the drawer is open on load; reload, confirm it's still open, in
      `tests/e2e/deepLink.spec.ts`
- [ ] T051 [P] [US1] [REQ SC-002,SC-003] Playwright e2e: golden-path triage — load, click a KPI
      tile, click the resulting row, read every drawer section — in `tests/e2e/triage.spec.ts`

### Domain for User Story 1

- [ ] T052 [P] [US1] [REQ PRD §A3 / FR-033] Implement `src/domain/age.ts`: per-priority age
      thresholds (P1 30m / P2 2h / P3 8h / P4 24h) as a pure function of `createdAt` + injected
      clock
- [ ] T053 [P] [US1] [REQ FR-033] Unit test for `domain/age.ts` threshold transitions in
      `src/domain/age.test.ts`
- [ ] T054 [P] [US1] [REQ PRD §A1 / FR-008,FR-010] Implement `src/domain/kpi.ts`: per-tile
      delta-is-good-or-bad interpretation, median null-guard/no-value formatting (spec.md Edge
      Cases: zero resolved incidents)
- [ ] T055 [P] [US1] [REQ FR-008,FR-010] Unit test for `domain/kpi.ts` in `src/domain/kpi.test.ts`
- [ ] T056 [P] [US1] [REQ PRD §A3,A11Y-1 / FR-026] Implement `src/domain/automationIcon.ts`: maps
      the server-computed `automationStatus` enum to an icon + text label (🤖/👤/⚠️/—)
- [ ] T057 [P] [US1] [REQ A11Y-1] Unit test for `domain/automationIcon.ts` covering all four
      values in `src/domain/automationIcon.test.ts`
- [ ] T058 [P] [US1] [REQ TL-3] Implement `src/domain/timeline.ts`: `cumulativeElapsed(eventAt,
      incidentCreatedAt)` — a pure timestamp difference, no clock needed (both are historical)
- [ ] T059 [P] [US1] [REQ TL-3] Unit test for `domain/timeline.ts` in
      `src/domain/timeline.test.ts`

### API + MSW for User Story 1

- [ ] T060 [P] [US1] [REQ FR-007-011] Implement `src/api/dashboard/summary.ts`
- [ ] T061 [P] [US1] MSW handler for `GET /api/dashboard/summary` in `src/api/fixtures/handlers/
      dashboardSummary.ts`, sourced from `seededDataset.ts`
- [ ] T062 [P] [US1] [REQ IT-1,IT-2,IT-3,IT-4,IT-5,IT-6,P-3,P-4 / FR-026-034,FR-075,FR-076]
      Implement `src/api/incidents/list.ts` (all query params from
      contracts/incidents-endpoints.md, including pagination/`totalCount` and source)
- [ ] T063 [P] [US1] MSW handler for `GET /api/incidents` in `src/api/fixtures/handlers/
      incidentsList.ts` (kpiTile drill-down param supported now; funnel/breakdown drill-downs
      added by US3/US4)
- [ ] T064 [P] [US1] [REQ PRD §D1-D7,P-4 / FR-035-049,FR-076] Implement
      `src/api/incidents/detail.ts`: `GET /api/incidents/:id` plus the lazy sub-fetches (agent-run
      io, similarity-matches show-all, events with `agentOnly`) — none of the lazy JSONB is
      fetched until the caller explicitly requests it
- [ ] T065 [P] [US1] MSW handlers for `GET /api/incidents/:id` and its lazy sub-endpoints in
      `src/api/fixtures/handlers/incidentsDetail.ts`
- [ ] T066 [US1] Register the US1 handlers in `src/api/fixtures/handlers/index.ts`

### Components for User Story 1

- [ ] T067 [US1] [REQ FR-007,P-2] Implement `src/components/kpi/KpiStrip.tsx`: one TanStack Query
      against `dashboard/summary`, `PanelBoundary`-wrapped
- [ ] T068 [US1] [REQ FR-007-011,A11Y-1] Implement `src/components/kpi/KpiTile.tsx`: value +
      delta via `domain/kpi.ts`, alert/amber styling, click → `useUrlState` drill-down
- [ ] T069 [US1] [REQ IT-1,IT-2,IT-3,IT-4,IT-5,P-2,P-3 / FR-026-031,FR-074,FR-075] Implement
      `src/components/incidents/IncidentTable.tsx`: one TanStack Query, server-side
      sort/search/page/includeResolved, `PanelBoundary`-wrapped, disambiguates empty-no-data vs.
      empty-filtered, renders after `KpiStrip` per FR-074's tiles-before-charts ordering
- [ ] T070 [US1] [REQ IT-1,IT-6,A11Y-1 / FR-027,FR-032,FR-033,FR-034] Implement
      `src/components/incidents/IncidentRow.tsx`: age via `domain/age.ts` + `AgePill`,
      source-badge icon in the title cell, escalated/non-prod styling, click → drawer via
      `useUrlState`
- [ ] T071 [US1] [REQ PRD §7,A11Y-3 / FR-035,FR-036,FR-071] Implement
      `src/components/incidents/IncidentDetailDrawer.tsx`: slide-over + scrim, `Esc`/outside-click
      close, `useFocusTrap` (traps focus while open, restores it on close per FR-071),
      `?incident=` sync via `useUrlState`, one TanStack Query
- [ ] T072 [US1] [REQ PRD §D1 / FR-037,FR-038,FR-038a] Implement `src/components/incidents/
      IncidentHeaderActions.tsx`: header fields (FR-037) plus the four mutation controls rendered
      **disabled with the reason stated**, per contracts/incidents-endpoints.md's undefined-PATCH
      gap (FR-038a) — this disabled state is the real, tested v1 behavior, not a placeholder
- [ ] T073 [US1] [REQ PRD §D2 / FR-039] Implement `src/components/incidents/
      ClassificationPanel.tsx`: "AI said X → human corrected to Y" side-by-side when a correction
      exists
- [ ] T074 [US1] [REQ PRD §D3,§11.6 / FR-040,FR-041] Implement `src/components/incidents/
      AgentRunTrace.tsx`: ordered by `startedAt`, `FAILED` expanded by default, lazy input/output
      fetch on expand
- [ ] T075 [US1] [REQ PRD §D4 / FR-042] Implement `src/components/incidents/
      SimilarityMatchList.tsx`: capped at 5 + lazy "show all"
- [ ] T076 [US1] [REQ PRD §D5 / FR-043] Implement `src/components/incidents/
      ActionsAndExecutions.tsx`: read-only rendering (type, risk, confidence, status, duration,
      collapsed payload/logs); approve/reject wiring for any still-`PROPOSED` action is added in
      US2 per FR-044
- [ ] T077 [US1] [REQ PRD §D6,TL-1,TL-2,TL-3 / FR-045-048] Implement `src/components/incidents/
      EventTimeline.tsx`: server-side `agentOnly` re-fetch, failure-event flags, cumulative
      elapsed via `domain/timeline.ts`

**Checkpoint**: User Story 1 fully functional and independently testable — quickstart.md steps 1,
4, 5, 7 pass (step 2's approve/reject and step 6's funnel drill-down land in US2/US3).

---

## Phase 4: User Story 2 - Approve or reject an AI-proposed action (Priority: P2)

**Goal**: The human-in-the-loop gate — approve (with a HIGH-risk confirm step) or reject (with a
required reason) a proposed action, watching it resolve in place.

**Independent Test**: Approve a HIGH-risk action through its confirmation step and watch it
resolve in place; reject another and confirm the reason is required; double-click Approve and
confirm exactly one execution (spec.md's own Independent Test).

### Tests for User Story 2 (MANDATORY — write first) ⚠️

- [ ] T078 [P] [US2] [REQ AR-5,AR-6,AR-7,AR-8,§11.2,§11.3,§11.9 / FR-018-024] Contract test for
      `POST /api/actions/:id/approve` and `/reject` (`confirmedHighRisk` gate, empty-reason 400,
      `409` reconciliation) in `src/api/approvals/actions.contract.test.ts`
- [ ] T079 [P] [US2] [REQ AR-9,AR-10 / FR-012,FR-013,FR-025] Contract test for
      `GET /api/approvals/pending` (excludes `approval_required=false`, sort order, empty-state
      count) in `src/api/approvals/pending.contract.test.ts`
- [ ] T080 [P] [US2] [REQ AR-7 / FR-021,FR-021a] Contract test for
      `GET /api/actions/:id/execution` polling shape in
      `src/api/approvals/execution.contract.test.ts`
- [ ] T081 [P] [US2] [REQ AR-1,AR-2,AR-3,AR-4] Component test for `ApprovalCard`: risk badge with
      text label, confidence bar + low-confidence caption, parameters collapsed/expand, "why this
      action" evidence, in `src/components/approvals/ApprovalCard.test.tsx`
- [ ] T082 [P] [US2] [REQ AR-5,§11.2] Component test for `ApproveConfirmModal`: HIGH requires the
      second click, LOW/MEDIUM skip it entirely, focus trapped while open, in
      `src/components/approvals/ApproveConfirmModal.test.tsx`
- [ ] T083 [P] [US2] [REQ AR-6,§11.3] Component test for `RejectForm`: empty reason refused,
      optional corrections accepted, successful submit writes feedback, in
      `src/components/approvals/RejectForm.test.tsx`
- [ ] T084 [P] [US2] [REQ X-4,§11.9,SC-006 / FR-023] Component test:
      double-click/repeat-activation on `ApprovalCard`'s Approve triggers exactly one request, in
      `src/components/approvals/ApprovalCard.idempotency.test.tsx`
- [ ] T085 [P] [US2] [REQ FR-021a] Component test: `ApprovalCard` switches to "still running" at
      the 2-minute bound (injected clock), never reports a failure it hasn't observed, in
      `src/components/approvals/ApprovalCard.timeout.test.tsx`
- [ ] T086 [P] [US2] [REQ X-1 / FR-024] Component test: a failed approve/reject rolls the
      optimistic UI back and surfaces the error, in
      `src/components/approvals/ApprovalCard.rollback.test.tsx`
- [ ] T087 [P] [US2] [REQ FR-077a] Component test: `OperatorNamePrompt` blocks the triggering
      action's completion until a name is supplied, in
      `src/components/approvals/OperatorNamePrompt.test.tsx`
- [ ] T088 [P] [US2] [REQ SC-001,SC-006,SC-007] Playwright e2e: full flow — approve LOW in one
      click, approve HIGH through confirm, reject without a reason is refused, reject with one
      succeeds — in `tests/e2e/approvalFlow.spec.ts`
- [ ] T089 [P] [US2] [REQ A11Y-3,SC-009] Playwright e2e: keyboard-only traversal of the approval
      queue (`Tab`, `Enter`, `Esc`) in `tests/e2e/approvalKeyboard.spec.ts`

### Domain for User Story 2

- [ ] T090 [US2] [REQ AR-6 / Assumption 6] Implement `src/domain/rejection.ts`: maps a reject
      form's reason + optional corrections to the `DeveloperFeedback` request shape (reason
      travels via `comments`, per data-model.md's rejection-reason gap note)
- [ ] T091 [US2] Unit test for `domain/rejection.ts` mapping in `src/domain/rejection.test.ts`

### API + MSW for User Story 2

- [ ] T092 [P] [US2] [REQ FR-012,FR-013,AR-9,AR-10] Implement `src/api/approvals/pending.ts`
- [ ] T093 [P] [US2] MSW handler for `GET /api/approvals/pending` in `src/api/fixtures/handlers/
      approvalsPending.ts` — excludes `approval_required=false` at the fixture level
- [ ] T094 [P] [US2] [REQ AR-5,AR-8,X-4 / FR-018,FR-022,FR-023] Implement `src/api/approvals/
      approve.ts`: TanStack `useMutation` keyed by action id, `actor` sourced from
      `OperatorContext`
- [ ] T095 [P] [US2] [REQ AR-6,AR-8 / FR-019,FR-020,FR-022] Implement `src/api/approvals/
      reject.ts`
- [ ] T096 [P] [US2] MSW handlers for the approve/reject `POST`s, including `409`/`400` simulation
      paths, in `src/api/fixtures/handlers/approvalsActions.ts`
- [ ] T097 [P] [US2] [REQ AR-7 / FR-021,FR-021a] Implement `src/api/approvals/execution.ts`:
      polling query, fast cadence switching to the slower one at the 2-minute bound
- [ ] T098 [P] [US2] MSW handler for `GET /api/actions/:id/execution` in `src/api/fixtures/
      handlers/approvalsExecution.ts`
- [ ] T099 [US2] Register the US2 handlers in `src/api/fixtures/handlers/index.ts`

### Components for User Story 2

- [ ] T100 [US2] [REQ AR-9,P-2 / FR-012,FR-013,FR-025] Implement `src/components/approvals/
      ApprovalQueue.tsx`: one TanStack Query, positive empty state, `PanelBoundary`-wrapped
- [ ] T101 [US2] [REQ AR-1,AR-2,AR-3,AR-4,X-1,X-4 / FR-021,FR-021a,FR-023,FR-024] Implement
      `src/components/approvals/ApprovalCard.tsx`
- [ ] T102 [US2] [REQ AR-5,A11Y-3 / FR-018] Implement `src/components/approvals/
      ApproveConfirmModal.tsx` using `useFocusTrap`
- [ ] T103 [US2] [REQ AR-6 / FR-019,FR-020] Implement `src/components/approvals/RejectForm.tsx`
      with React Hook Form
- [ ] T104 [US2] [REQ AR-3,P-4 / FR-016,FR-076] Implement `src/components/approvals/
      ParametersViewer.tsx`: dynamic `import()` of `sql-formatter` + the regex tokenizer on first
      expand only (research.md §8)
- [ ] T105 [US2] [REQ AR-4 / FR-017] Implement `src/components/approvals/WhyThisAction.tsx`
- [ ] T106 [US2] [REQ FR-077a] Implement `src/components/approvals/OperatorNamePrompt.tsx`,
      wired to `OperatorContext`
- [ ] T107 [US2] [REQ PRD §D5 / FR-044] Wire `ActionsAndExecutions.tsx` (built in US1) to reuse
      `ApprovalCard`'s approve/reject behavior for any still-`PROPOSED` action found in the drawer

**Checkpoint**: US1 + US2 independently functional. This is PRD §12's phases 1–2 — "a coherent,
demoable product" per the PRD's own words.

---

## Phase 5: User Story 3 - Judge whether the automation is trustworthy (Priority: P3)

**Goal**: The funnel, the fully-automated/human-assisted split, and the execution-outcome
breakdown — the trust argument.

**Independent Test**: Verify each funnel stage and outcome count independently; confirm
rolled-back is never folded into success/failure; click a stage and confirm the resulting list
reconciles exactly with its displayed drop count (spec.md's own Independent Test).

### Tests for User Story 3 (MANDATORY — write first) ⚠️

- [ ] T108 [P] [US3] [REQ PRD §B1,§6.1 / FR-050-053,§11.4] Contract test for
      `GET /api/dashboard/funnel` (stage shape, `dropCount` semantics, the automation-rate split)
      in `src/api/dashboard/funnel.contract.test.ts`
- [ ] T109 [P] [US3] [REQ EO-1..4 / FR-054-058] Contract test for `GET /api/dashboard/executions`
      in `src/api/dashboard/executions.contract.test.ts`
- [ ] T110 [P] [US3] [REQ PRD §B1 / FR-050,FR-051] Unit test for `domain/funnel.ts`:
      percentage-of-stage-above + automatic largest-drop annotation, in
      `src/domain/funnel.test.ts`
- [ ] T111 [P] [US3] [REQ §11.4 / FR-052,FR-052a,FR-052b,FR-052c] Unit test for `domain/funnel.ts`
      drop-set selection, including the zero-loss stage and the first-stage (no drop-set) edge
      cases, in `src/domain/funnel.dropset.test.ts`
- [ ] T112 [P] [US3] [REQ PRD §B1,§11.4 / FR-050-052c] Component test for `AutomationFunnel`:
      stage rendering, click → drill-down, filtered-empty (not no-data) on a zero-loss stage, in
      `src/components/charts/AutomationFunnel.test.tsx`
- [ ] T113 [P] [US3] [REQ PRD §6.1 / FR-053] Component test: fully-automated/human-assisted
      always render as two separate numbers, never merged, in
      `src/components/charts/AutomationFunnel.rate.test.tsx`
- [ ] T114 [P] [US3] [REQ EO-1,SC-008 / FR-054,FR-055] Component test for
      `ExecutionOutcomeDonut`: rolled-back is always its own bucket, in
      `src/components/charts/ExecutionOutcomeDonut.test.tsx`
- [ ] T115 [P] [US3] [REQ EO-2,EO-3,EO-4 / FR-056,FR-057,FR-058] Component test for
      `ExecutionOutcomeDonut`: recent-failures list, by-action-type toggle, median-duration
      caption, in `src/components/charts/ExecutionOutcomeDonut.details.test.tsx`
- [ ] T116 [P] [US3] [REQ A11Y-4] Component test: `AccessibleChartTable` integration for both
      Band B charts built in this story, in `src/components/charts/chartsAccessibility.test.tsx`
- [ ] T117 [P] [US3] [REQ SC-005,§11.4,§11.5] Playwright e2e: a funnel drop-set click's row count
      exactly matches its displayed drop count; rolled-back never appears folded into failed, in
      `tests/e2e/funnelReconciliation.spec.ts`

### Domain for User Story 3

- [ ] T118 [P] [US3] [REQ PRD §B1 / FR-050,FR-051,FR-052-052c] Implement `src/domain/funnel.ts`:
      percentage-of-above, largest-drop annotation, drop-set selection (incl. FR-052b/c edge
      cases)

### API + MSW for User Story 3

- [ ] T119 [P] [US3] [REQ FR-050-053] Implement `src/api/dashboard/funnel.ts`
- [ ] T120 [P] [US3] MSW handler for `GET /api/dashboard/funnel` in `src/api/fixtures/handlers/
      dashboardFunnel.ts` — seeded with the PRD's 142/98/87/79/71/68, `validatedResolved` returned
      as unavailable per Assumption 5
- [ ] T121 [P] [US3] [REQ FR-054-058] Implement `src/api/dashboard/executions.ts`
- [ ] T122 [P] [US3] MSW handler for `GET /api/dashboard/executions` in `src/api/fixtures/
      handlers/dashboardExecutions.ts`
- [ ] T123 [US3] Register the US3 handlers in `src/api/fixtures/handlers/index.ts`; extend
      `src/api/fixtures/handlers/incidentsList.ts` to honor `funnelDropAt`/`funnelStage`

### Components for User Story 3

- [ ] T124 [US3] [REQ PRD §B1,P-2 / FR-050,FR-051,FR-052-052c] Implement `src/components/charts/
      AutomationFunnel.tsx`: hand-rolled stage rows, click → `useUrlState` drill-down,
      `PanelBoundary`-wrapped
- [ ] T125 [US3] [REQ PRD §6.1 / FR-053] Implement the fully-automated/human-assisted two-number
      display within `AutomationFunnel.tsx`
- [ ] T126 [US3] [REQ EO-1..4 / FR-054-058] Implement `src/components/charts/
      ExecutionOutcomeDonut.tsx`: Recharts `Pie`, rolled-back as its own slice + count,
      by-type toggle, recent-failures list, median-duration caption
- [ ] T127 [US3] [REQ A11Y-4] Wire `AccessibleChartTable` into both `AutomationFunnel` and
      `ExecutionOutcomeDonut`

**Checkpoint**: US1 + US2 + US3 independently functional — PRD §12 phase 3, "the trust argument."

---

## Phase 6: User Story 4 - See where incidents concentrate (Priority: P4)

**Goal**: Volume trend with resolution-time overlay, the three breakdown charts, and the
always-available feedback form.

**Independent Test**: Verify volume buckets and the overlay series, the three breakdowns, and
that clicking any segment filters the list; submit feedback and confirm it appears in that
incident's history (spec.md's own Independent Test).

### Tests for User Story 4 (MANDATORY — write first) ⚠️

- [ ] T128 [P] [US4] [REQ PRD §B3,§B4 / FR-059-062] Contract test for
      `GET /api/dashboard/breakdowns` (volume bucket granularity, top-6+Other, top-5 services) in
      `src/api/dashboard/breakdowns.contract.test.ts`
- [ ] T129 [P] [US4] [REQ PRD §D7 / FR-049] Contract test for
      `POST /api/incidents/:id/feedback` in `src/api/feedback.contract.test.ts`
- [ ] T130 [P] [US4] [REQ PRD §B3 / FR-059 / Assumption 4] Component test for `VolumeChart`: day
      buckets for 7d/30d/All, hour buckets for 24h, in
      `src/components/charts/VolumeChart.test.tsx`
- [ ] T131 [P] [US4] [REQ PRD §B3 / FR-060] Component test for `VolumeChart`: median-resolution
      line overlaid on a secondary axis, in `src/components/charts/VolumeChart.overlay.test.tsx`
- [ ] T132 [P] [US4] [REQ PRD §B4 / FR-061,FR-062] Component test for `BreakdownBars` (all three
      variants): ordering, top-N+Other, inline known-rate, click → drill-down, in
      `src/components/charts/BreakdownBars.test.tsx`
- [ ] T133 [P] [US4] [REQ PRD §D7 / FR-049] Component test for `FeedbackForm`: type + comments
      required, optional corrections, existing feedback listed above the form, in
      `src/components/incidents/FeedbackForm.test.tsx`
- [ ] T134 [P] [US4] [REQ SC-004] Playwright e2e: read automation rate, median resolve, and the
      noisiest service across Band B without leaving the dashboard, in
      `tests/e2e/managerView.spec.ts`

### Domain for User Story 4

- [ ] T135 [P] [US4] [REQ PRD §B3 / FR-059 / Assumption 4] Implement
      `src/domain/volumeBuckets.ts`: bucket-granularity selection by active time range

### API + MSW for User Story 4

- [ ] T136 [P] [US4] [REQ FR-059-061] Implement `src/api/dashboard/breakdowns.ts`
- [ ] T137 [P] [US4] MSW handler for `GET /api/dashboard/breakdowns` in `src/api/fixtures/
      handlers/dashboardBreakdowns.ts`
- [ ] T138 [P] [US4] [REQ FR-049] Implement `src/api/feedback.ts`
- [ ] T139 [P] [US4] MSW handler for `POST /api/incidents/:id/feedback` in `src/api/fixtures/
      handlers/feedback.ts`
- [ ] T140 [US4] Register the US4 handlers in `src/api/fixtures/handlers/index.ts`; extend
      `src/api/fixtures/handlers/incidentsList.ts` to honor `breakdown=`

### Components for User Story 4

- [ ] T141 [US4] [REQ PRD §B3,P-2 / FR-059,FR-060] Implement `src/components/charts/
      VolumeChart.tsx`: Recharts `ComposedChart`, stacked known/unknown + median-resolve line
- [ ] T142 [US4] [REQ PRD §B4 / FR-061,FR-062] Implement `src/components/charts/
      BreakdownBars.tsx` (parameterized for priority/category/service), click → `useUrlState`
      drill-down
- [ ] T143 [US4] [REQ A11Y-4] Wire `AccessibleChartTable` into `VolumeChart` and `BreakdownBars`
- [ ] T144 [US4] [REQ PRD §D7 / FR-049] Implement `src/components/incidents/FeedbackForm.tsx`
      with React Hook Form, listing existing feedback above the form

**Checkpoint**: All four user stories independently functional — full PRD §12 scope (phases 1–4).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification passes that span every story — PRD §12 phase 5, "ship quality."

- [ ] T145 [P] [REQ P-1 / FR-073] Measure first-meaningful-paint against the seeded dataset
      (Lighthouse or equivalent); confirm < 2s
- [ ] T146 [P] [REQ X-2,X-3 / FR-066,FR-067] Verify Band A 30s / Band B 5-minute polling via each
      query's `refetchInterval`; confirm animated, non-jumping value transitions across every
      tile/chart
- [ ] T147 [P] [REQ A11Y-2 / FR-070] Run an automated contrast check (e.g. `axe`) across every
      pill/badge and chart series; fix any WCAG AA failure found
- [ ] T148 [P] [REQ A11Y-3,SC-009] Playwright e2e: full keyboard traversal of the open drawer —
      agent trace, similarity matches, actions, timeline, feedback form — in
      `tests/e2e/drawerKeyboard.spec.ts`
- [ ] T149 [P] [REQ Principle VIII,SC-011] Playwright e2e: force one panel's MSW handler to error
      and confirm every other panel stays interactive, in
      `tests/e2e/failureIsolation.spec.ts`
- [ ] T150 [REQ quickstart.md] Walk quickstart.md's 7-step manual golden-path check end-to-end;
      record the result
- [ ] T151 [P] Document `npm run dev`/`test`/`test:e2e` in `README.md` per quickstart.md
- [ ] T152 Run `npm run typecheck` and `npm run lint` clean across `src/`; fix any strict-mode or
      lint violation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — **blocks all user stories**
- **User Stories (Phase 3–6)**: all depend on Foundational; **independent of each other** by
  design (each has its own API modules, MSW handler file, and component tree) — see the one
  shared-file caveat below
- **Polish (Phase 7)**: depends on all four user stories

### User Story Dependencies

- **US1 (P1)**: no dependency on US2/US3/US4
- **US2 (P2)**: builds `ApprovalCard` independently of US1, but its final task (T107) wires into
  US1's `ActionsAndExecutions.tsx` — the only cross-story integration point, and it's additive
  (US1 works with or without it)
- **US3 (P3)**: no dependency on US1/US2/US4
- **US4 (P4)**: no dependency on US1/US2/US3

### The one shared-file caveat

Every story's last task registers its MSW handlers into `src/api/fixtures/handlers/index.ts`
(T066, T099, T123, T140) and, where relevant, extends `incidentsList.ts`'s drill-down handling
(T063 → T123 → T140, same file, additive branches). These are one-line, low-conflict edits by
design — sequence them if two stories are worked in parallel by different people, but they are
not a reason to serialize the rest of each story's work.

### Within Each User Story

- Tests are written first and MUST fail before implementation begins (Constitution XII)
- Domain modules before the API layer that composes them
- API + MSW before the components that consume them
- Story complete and independently demoable before moving to the next priority

### Parallel Opportunities

- All Setup `[P]` tasks run together
- All Foundational `[P]` tasks run together (T009, T012–T033, T035, T037 — respecting the few
  intra-phase orderings noted, e.g. `useUrlState` (T017) needs `domain/filters.ts` (T015) first)
- Once Foundational is done, **all four user stories can proceed in parallel** — this is the
  point of the spec's story-independence design (spec.md, per-story Independent Test)
- Within a story, every test task is `[P]` against every other test task in that story (different
  files); domain/API/component tasks are `[P]` against siblings once their own dependency (if any)
  is met

---

## Parallel Example: User Story 1

```bash
# All US1 tests together (T039-T051), before any US1 implementation:
Task: "Contract test for GET /api/dashboard/summary in src/api/dashboard/summary.contract.test.ts"
Task: "Contract test for GET /api/incidents in src/api/incidents/list.contract.test.ts"
Task: "Component test for KpiTile in src/components/kpi/KpiTile.test.tsx"
Task: "Component test for IncidentTable in src/components/incidents/IncidentTable.test.tsx"
# ...remaining T039-T051

# All US1 domain modules together (T052, T054, T056, T058), each with its adjacent test:
Task: "Implement src/domain/age.ts"
Task: "Implement src/domain/kpi.ts"
Task: "Implement src/domain/automationIcon.ts"
Task: "Implement src/domain/timeline.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational — **critical, blocks everything**
3. Phase 3: User Story 1
4. **Stop and validate**: run quickstart.md steps 1, 4, 5, 7 against the seeded dataset
5. This alone proves the data model end to end (PRD §12 phase 1's own rationale)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → demoable read-only dashboard (MVP)
3. + US2 → PRD §12's "coherent, demoable product" (phases 1–2) — the demo moment
4. + US3 → "the trust argument" (phase 3)
5. + US4 → full PRD scope (phase 4)
6. + Polish → ship quality (phase 5)

### Parallel Team Strategy

Once Foundational is done: one person per user story (US1–US4) in parallel, per the
Dependencies section's story-independence analysis above; coordinate only on the shared-file
caveat's four registration lines.

---

## Notes

- `[P]` = different file, no dependency on an incomplete task
- `[REQ]` = PRD requirement ID(s)/§11 criterion; every FR number from spec.md appears in at least
  one task's description text for direct spec.md traceability (Constitution Principle II)
- Every component task's Definition of Done includes all four states (Principle VII) and the
  accessibility obligations for that surface (Principle X) — not called out as separate tasks per
  component, since the constitution makes them part of every component's completion, not an
  optional follow-up
- Full per-component contracts (props/states/events/errors) are written immediately before that
  component's implementation task, per the constitution's Definition of Done item 1 —
  component-inventory.md fixed each component's *identity and classification* at plan time; the
  full contract is this task's first sub-step, not a separate task
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before continuing
