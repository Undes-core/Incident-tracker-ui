# Implementation Plan: AI Incident Response Orchestrator Dashboard

**Branch**: `001-incident-response-dashboard` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-incident-response-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A single-page React dashboard split into an operational band (KPI tiles, an approval queue for
AI-proposed remediations, and a filterable incident table) and a performance band (automation
funnel, execution-outcome breakdown, volume trend, and priority/category/service breakdowns), with
a deep-linkable detail drawer per incident. The technical approach: React + TypeScript against a
typed `api/` layer whose HTTP boundary is served by MSW from one seeded-fixture module — so the
whole feature is buildable and demoable with no backend running (spec.md Assumption 1) — with
TanStack Query giving each panel its own fetch/poll/error lifecycle (Principle VIII), a hand-written
URL-state hook making every filter and the open drawer shareable (Principle IX), and all metric math
(median, automation rate, funnel drop-sets, age thresholds) isolated in clock-injected `domain/`
modules with zero React or fetch dependencies (Principle III).

## Technical Context

**Language/Version**: TypeScript, strict mode — fixed by constitution (Technology Constraints)
**Primary Dependencies**: React + React Hook Form (fixed) · TanStack Query (server state,
Principle VIII/XI) · Recharts (charts, A11Y-4-capable) · `sql-formatter` + a hand-written regex
tokenizer (safe syntax highlighting, Principle XIII) · MSW (mocked HTTP boundary, dev + test,
Principle XII) · Vite (build/dev)
**Storage**: `localStorage` for the self-declared operator name only (FR-077b); no other
client-owned persistence — view state lives in the URL (Principle IX), server state in TanStack
Query's cache
**Testing**: React Testing Library (fixed) + Vitest (unit/component) + Playwright (e2e, keyboard
traversal, focus-trap — jsdom cannot model these) + MSW (same fixtures back both test-time mocking
and dev-without-backend, research.md §7)
**Target Platform**: Evergreen desktop browsers (latest two versions of Chrome, Edge, Firefox,
Safari). No mobile layout in v1 — the PRD's fixed band layout and the prototype's ~1360px max-width
design assume a desk-bound operator, and no responsive breakpoint appears anywhere in the PRD.
**Project Type**: Single-page React frontend; backend consumed via PRD §9 endpoints (currently
absent — see Assumption 1 and research.md §7)
**Performance Goals**: FMP < 2s on the seeded dataset (P-1); KPI tiles paint before charts (P-2);
one request per aggregate, no N+1 (P-3)
**Constraints**: JSONB (`parameters`, `input`, `output`, `execution_logs`, `response_payload`)
lazy-loaded only, never in list/queue responses (P-4); Band A polls 30s, Band B on filter change +
5min, no layout jump (X-2, X-3); execution polling bounded at 2 minutes before switching to a
slower "still running" cadence (FR-021a)
**Scale/Scope**: Seeded hackathon dataset (~142 incidents/period per PRD §B1's own numbers, dozens
of pending actions, 5–6 services) across roughly a dozen independently-loading panels on one page

*All research decisions and rationale: [research.md](./research.md).*

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Mark each gate PASS / VIOLATION (justify in Complexity Tracking) / N/A for this feature.

**Initial check (pre-research)** — all resolvable from the spec and constitution alone; the four
open technology slots are exactly what Phase 0 exists to close, so they don't block this pass:

- [x] **I. Contract-First** — PASS. Plan commits to `data-model.md`, `contracts/*.md`, and a
      component inventory before any code; full per-component contracts deferred to task-level
      per the Definition of Done, not skipped.
- [x] **II. Traceability** — PASS. Every FR in spec.md cites a PRD ID; `/speckit-tasks` will carry
      those IDs forward per the tasks-template's `[REQ]` field.
- [x] **III. Domain outside UI** — PASS. `domain/` planned with an injected `Clock`; no metric math
      planned inside a component.
- [x] **IV. Metric truthfulness** — PASS. FR-010 (median), FR-053 (§6.1 split), FR-055 (rolled-back
      bucket), FR-052a (funnel reconciliation) are all in scope with a named owning contract.
- [x] **V. Guarded irreversible actions** — PASS. FR-018/FR-023/FR-024 map directly to the
      approve/reject contracts; idempotency is designed at two layers (client disable + server 409).
- [x] **VI. HITL transparency** — PASS. FR-015, FR-017, FR-041, FR-039 all have an owning component.
- [x] **VII. Four states** — PASS. `PanelBoundary` is the shared mechanism (component-inventory.md).
- [x] **VIII. Failure isolation** — PASS. One query per panel is the explicit design rule (research.md §3).
- [x] **IX. URL is shareable state** — PASS. FR-004/FR-004a/FR-004b/FR-036 map to `useUrlState`.
- [x] **X. Accessibility** — PASS. Text-labeled pills, `useFocusTrap`, `AccessibleChartTable` all
      planned as named components.
- [ ] **XI. Performance budgets** — PENDING. Depends on the Phase 0 build-tool/charting decisions.
- [x] **XII. Testability** — PASS. Mandatory test areas map to Vitest (domain/unit) + Playwright
      (keyboard/a11y); mocked HTTP boundary is the explicit MSW decision — pending Phase 0 to name
      the tool, not pending on whether the approach is sound.
- [x] **XIII. Least trust in client** — PASS. `rel="noopener noreferrer"` (data-model.md
      KnowledgeDocument), no `dangerouslySetInnerHTML` anywhere (research.md §8), server remains
      the authorization gate (spec.md Assumption 12).
- [x] **XIV. Scope discipline** — PASS. Out of Scope section carried into component-inventory.md by
      omission; AR-10 exclusion is a named contract behavior (`GET /api/approvals/pending`).

**Post-design check (after Phase 0 + Phase 1)**:

- [x] **XI. Performance budgets** — PASS. Vite/Rollup for build speed (research.md §1); Recharts
      chosen partly *because* its SVG output doesn't block on a canvas re-paint; syntax highlighting
      and `sql-formatter` are dynamically imported only on first expand, keeping them off the P-1
      budget entirely (research.md §8); every aggregate has exactly one contract-defined endpoint
      (contracts/dashboard-endpoints.md) with no per-row follow-up in the list contract
      (contracts/incidents-endpoints.md explicitly excludes JSONB from `GET /api/incidents`).
- [x] **XII. Testability** — PASS (confirmed). Vitest + Playwright + MSW named (research.md §5, §6,
      §7); the same fixtures module backs both test mocking and the dev-without-backend story, so
      there is exactly one dataset to keep honest against the PRD's own numbers.

All 14 gates PASS. No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-incident-response-dashboard/
├── plan.md                  # This file
├── research.md              # Phase 0 — all NEEDS CLARIFICATION resolved
├── data-model.md            # Phase 1 — entities, fields, PRD citations, [INFERRED]/[GAP] flags
├── component-inventory.md   # Phase 1 — component list + classification (Principle I granularity for planning)
├── quickstart.md            # Phase 1 — run/verify instructions
├── contracts/
│   ├── dashboard-endpoints.md
│   ├── incidents-endpoints.md
│   ├── approvals-endpoints.md
│   └── feedback-endpoint.md
├── checklists/
│   └── requirements.md      # from /speckit-specify + /speckit-clarify
└── tasks.md                 # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

**Structure Decision**: Single project (no `backend/`+`frontend/` split — this repo owns only the
frontend; the backend PRD §9 describes is a separate, currently-absent system consumed over HTTP).
Layering is fixed by the constitution's Technology Constraints (`components/` · `domain/` · `api/`);
this plan adds `state/` for the URL hook and operator context, since neither is "API" nor "domain"
in the constitution's sense. Tests are colocated as `*.test.tsx`/`*.test.ts` next to the source they
cover (standard Vitest/RTL convention — keeps a component and its state/contract test reviewable
together) except Playwright specs, which by nature exercise many components at once and live under
`tests/e2e/`.

```text
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── layout/          # DashboardHeader, BandA, BandB
│   ├── kpi/             # KpiStrip, KpiTile
│   ├── approvals/       # ApprovalQueue, ApprovalCard, ApproveConfirmModal, RejectForm,
│   │                    # ParametersViewer, WhyThisAction, OperatorNamePrompt
│   ├── incidents/       # IncidentTable, IncidentRow, IncidentDetailDrawer,
│   │                    # IncidentHeaderActions, ClassificationPanel, AgentRunTrace,
│   │                    # SimilarityMatchList, ActionsAndExecutions, EventTimeline, FeedbackForm
│   ├── charts/          # AutomationFunnel, ExecutionOutcomeDonut, VolumeChart, BreakdownBars,
│   │                    # AccessibleChartTable
│   └── shared/          # PanelBoundary, StaleBanner, RelativeTime, ConfidenceBar, pills
├── domain/              # automation.ts, funnel.ts, age.ts, median.ts, filters.ts, clock.ts
├── api/
│   ├── client.ts         # typed fetch wrapper
│   ├── types.ts          # mirrors data-model.md
│   ├── dashboard.ts | incidents.ts | approvals.ts | feedback.ts
│   └── fixtures/         # MSW seed data + handlers (research.md §7)
└── state/                # useUrlState.ts, OperatorContext.tsx, queryClient.ts

tests/
└── e2e/                  # Playwright specs (approve/reject flow, keyboard traversal, focus trap)
```

Full per-component contracts (component-inventory.md's deferred detail) are written at task-level,
immediately preceding each component's implementation task, per the constitution's Definition of
Done item 1 — `/speckit-tasks` is expected to make "write the contract" the first checklist item of
each component task rather than a separate task.

## Complexity Tracking

*No entries — Constitution Check has zero violations.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
