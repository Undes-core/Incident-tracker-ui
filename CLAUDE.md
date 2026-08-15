<!-- SPECKIT START -->
Active plan: `specs/001-incident-response-dashboard/plan.md` (branch `001-incident-response-dashboard`).
For technologies, project structure, and other implementation context, read that plan and its
`research.md`, `data-model.md`, `component-inventory.md`, and `contracts/*.md` alongside it.
<!-- SPECKIT END -->

# Incident-tracker-ui

Frontend for the **AI Incident Response Orchestrator** dashboard (MVP / hackathon). Parent
workspace guidance also applies (`../../CLAUDE.md`, `../CLAUDE.md`).

## Current state — greenfield

There is **no application code, package manager, build system, or test runner yet**. The repo
contains only:

| Path | What it is |
|---|---|
| `docs/ui_prd_incident_orchestrator_dashboard.md` | The authoritative spec. Numbered requirements (`AR-*`, `IT-*`, `EO-*`, `TL-*`, `X-*`, `A11Y-*`, `P-*`), the API surface (§9), acceptance criteria (§11), and build order (§12). |
| `docs/incident_dashboard_prototype.html` | Self-contained wireframe — inline CSS + vanilla JS + hardcoded mock data, zero dependencies. Open it directly (`open docs/incident_dashboard_prototype.html`); do not add a bundler to it. It is the visual reference, not code to extend. |
| `.specify/`, `.claude/skills/` | Spec Kit 0.8.6 scaffolding (see below). |

The stack is fixed by the constitution: **React + TypeScript (strict), functional components,
React Hook Form, React Testing Library**, layered `src/components/` · `src/domain/` · `src/api/`
(+ `src/state/` for URL/operator state, added in the plan below). The libraries below that line are
now decided in `specs/001-incident-response-dashboard/plan.md` and its `research.md`: **Vite**
(build), **no router** (single route, custom URL-state hook), **TanStack Query** (server state),
**Recharts** + a hand-rolled funnel (charts), **Vitest** (unit/component), **Playwright** (e2e),
**MSW** (mocked HTTP boundary for both dev-without-backend and tests). See
`.specify/memory/constitution.md` → "Technology and Architecture Constraints" for what's fixed vs.
what was this plan's to decide.

The PRD declares `Depends on: ai_incident_response_database_schema.md`, which is **not in this
repo**. Table/column names in the PRD (`incidents`, `recommended_actions`, `executed_actions`,
`agent_runs`, `similarity_matches`, `incident_events`, `developer_feedback`) come from there —
treat them as given and don't invent adjacent ones.

## Spec Kit workflow

This repo drives work through Spec Kit (sequential branch numbering, `sh` scripts, `claude`
integration). Skills live in `.claude/skills/` and are invoked as `/speckit.*`:

```
/speckit.constitution → /speckit.specify → /speckit.clarify → /speckit.plan
  → /speckit.tasks → /speckit.analyze → /speckit.implement
```

- Artifacts land in `specs/<NNN>-slug/` (`spec.md`, `plan.md`, `tasks.md`, `checklists/`).
  The feature dir is resolved from the current branch's numeric prefix, so `004-fix-bug` and
  `004-add-feature` share `specs/004-*/`. Override with `export SPECIFY_FEATURE=<branch>` when
  working off-branch.
- Helper scripts: `.specify/scripts/bash/check-prerequisites.sh --json`, `setup-plan.sh`,
  `setup-tasks.sh`, `create-new-feature.sh`. Most accept `--json` and `--paths-only`.
- `.specify/memory/constitution.md` is **ratified at v1.0.0** (2026-08-13) — 14 numbered
  principles, binding on every spec/plan/task. `/speckit.analyze` treats a violation as CRITICAL,
  and `plan.md`'s Constitution Check is a real gate with a concrete checklist. Amend only via
  `/speckit.constitution`, never by editing the file directly.
- The `git` extension hooks (`.specify/extensions.yml`) fire around every command with
  `auto_execute_hooks: true`, but `.specify/extensions/git/git-config.yml` has all `auto_commit`
  entries `false`. So in practice: `/speckit.specify` creates the feature branch; commits stay
  manual.

## Requirements that constrain implementation

Quick reference only — the binding form of these is `.specify/memory/constitution.md`. They are the
PRD decisions most easily broken by an obvious-looking implementation:

- **Median, never average**, for resolution time in the KPI tile (§A1); average goes in the tooltip.
- **`ROLLED_BACK` is its own bucket** everywhere — not a success, not a failure (EO-1).
- **Approve must be idempotent** — disable on click. A double-fired remediation Lambda is a real
  outage (X-4).
- **Row click opens the right-side drawer**, never a page navigation (IT-1). Drawer is
  deep-linkable at `/?incident=<id>`.
- **Filters (time range / environment / service) persist in the URL query string** (§4, §11.7).
- **Band A shows current state regardless of the time range**; only Band B is range-filtered.
- **JSONB fields** (`parameters`, `input`, `output`, `execution_logs`, `response_payload`) are
  fetched lazily on expand and never included in list responses (P-4).
- **Rejection reason is required** and writes both `recommended_actions.status='REJECTED'` and a
  `developer_feedback` row (AR-6).
- **Colour is never the only signal** — every priority/risk/status pill carries a text label
  (AR-1, A11Y-1).
- Four distinct states per component: loading, empty-no-data, empty-filtered, error (§8, §11.8).
  Errors are per-component; a failed chart must not take down the dashboard.
