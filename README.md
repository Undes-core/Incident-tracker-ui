# Incident Tracker UI

Frontend for the **AI Incident Response Orchestrator** dashboard — a hackathon MVP for Cox
Automotive's ReconMVS team. It gives an on-call engineer or eng manager one place to see incidents
an AI agent has triaged, watch what it recommended and ran, approve or reject its proposed
actions, and track how well the automation is actually performing.

## What's here

The UI is built around a persistent **alert strip** (active P1s + actions awaiting approval, always
visible, polling independently of whatever else is on screen) above three tabs:

- **Now** — live incident table with KPI tiles, filtering, search, and a detail drawer per
  incident (AI classification, agent run trace, similar incidents/runbooks, recommended actions
  and their executions, event timeline).
- **Performance** — trend charts and breakdowns over a selectable time range (median resolution
  time, automation rate, outcome mix).
- **Knowledge** — the AI's classification/feedback accuracy over time, with a suppressed-below-10
  feedback-impact widget.

There is no real backend yet: every API call is intercepted in the browser by **MSW** against a
seeded fixture dataset, so the app is fully interactive with `npm run dev` and zero setup.

**Current status**: Setup, Foundational, and User Story 1 (the Now tab end-to-end) are built and
tested. Approve/reject, Performance, and Knowledge are not yet implemented — see
`specs/001-incident-response-dashboard/tasks.md` for the full build order.

## Running it

Requires Node 20 (dependency versions in `package.json` are pinned for compatibility with this
version — see `CLAUDE.md` for why). A project-local `.npmrc` points installs at the public npm
registry regardless of any global registry config.

```bash
npm install
npm run dev        # http://localhost:5173, mock API included
```

Other scripts:

```bash
npm run build       # typecheck + production build
npm run preview      # serve the production build locally
npm run test         # unit/component tests (Vitest)
npm run test:watch   # same, in watch mode
npm run test:e2e     # end-to-end tests (Playwright; run `npx playwright install` first time)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

## Project layout

```
src/
  components/   UI, grouped by area (layout, kpi, incidents, approvals, charts, shared)
  domain/       Pure business logic (age thresholds, deltas, timeline math) — clock-injected,
                no framework or fetch dependencies
  api/          Typed HTTP client + one module per endpoint, plus fixtures/ (seeded dataset and
                MSW handlers used by both the dev server and tests)
  state/        Cross-cutting state: URL query-string state (filters, active tab, open incident),
                operator identity, focus trap
```

## Where the real detail lives

This repo is driven by [Spec Kit](https://github.com/github/spec-kit) — the product spec,
architecture plan, data model, and full task breakdown live under
`specs/001-incident-response-dashboard/`, governed by the 14 binding principles in
`.specify/memory/constitution.md`. Start with `CLAUDE.md` at the repo root for a map of all of it,
including the requirements most likely to be broken by an obvious-looking change (the alert strip
never stops polling, median not average, `ROLLED_BACK` is its own bucket, approve is idempotent,
and more).
