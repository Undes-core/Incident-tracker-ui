# Quickstart: AI Incident Response Orchestrator Dashboard

## Prerequisites

Node.js and a package manager (project has none installed yet — the first setup task scaffolds
`package.json`). No backend is required: MSW serves every PRD §9 endpoint from
`api/fixtures/seeded-dataset.ts` (research.md §7).

## Run

```bash
npm install
npm run dev        # Vite dev server; MSW registers in the browser automatically in dev mode
```

Open the printed local URL. The dashboard should be interactive against the seeded dataset with no
backend running — that's the point of Assumption 1.

## Verify the golden path manually

1. Six KPI tiles render before any chart (FR-074/P-2). Click "P1 active" — the table filters, the
   URL gains a drill-down param, and the row count matches the tile (SC-005).
2. Open the approvals queue. Approve a `LOW`/`MEDIUM` card in one click; approve a `HIGH` card and
   confirm the second-click modal appears first. Watch a card resolve from "Executing…" to
   success/failure without a manual refresh (AR-7).
3. Reject a card without typing a reason — submission is refused. Type one — it succeeds.
4. Click an incident row. The drawer opens over a still-interactive dashboard, deep-links at
   `?incident=<internal-id>`, and reload restores the same open incident (FR-036, SC-010).
5. In the drawer, confirm any `FAILED` agent run is expanded by default and everything else is
   collapsed (FR-041).
6. In Band B, click a funnel stage — the table shows that stage's drop-set, and the row count
   matches the stage's displayed drop count (FR-052a, SC-005).
7. Tab through the approvals queue and the open drawer with the mouse untouched; confirm `Esc`
   closes the drawer and focus returns to the row that opened it (A11Y-3).

## Test commands (once scaffolded)

```bash
npm run test         # Vitest: domain/ unit tests + component tests (RTL)
npm run test:e2e     # Playwright: keyboard traversal, focus trap, full approve/reject flow
npm run typecheck    # tsc --noEmit, strict mode
```

## Where things live

See `component-inventory.md` for the component list and `data-model.md` / `contracts/*.md` for the
data every component consumes. `research.md` explains every "why this library" decision.
