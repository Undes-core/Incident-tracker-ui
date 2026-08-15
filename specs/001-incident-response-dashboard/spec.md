# Feature Specification: AI Incident Response Orchestrator Dashboard

**Feature Branch**: `001-incident-response-dashboard`  
**Created**: 2026-08-14  
**Status**: Draft  
**Input**: User description: "review the @docs/ui_prd_incident_orchestrator_dashboard.md and @docs/incident_dashboard_prototype.html to create the spec"

## Clarifications

### Session 2026-08-14

- Q: PRD §D1 requires four incident-mutation controls (assign, change priority, escalate, resolve) but PRD §9 defines no endpoint for them — how should FR-038 be resolved? → A: Treat it as a PRD §9 gap and close it — one documented incident-update operation covers all four controls, recorded as a dependency rather than invented ad hoc.
- Q: When a drill-down is already active and the user clicks a different tile, funnel stage, or breakdown segment, what happens? → A: One drill-down at a time — the new selection replaces the previous. Global filters, search and include-resolved always apply in addition, preserving exact reconciliation.
- Q: How long should a card track a running execution before it stops implying imminent resolution? → A: 2 minutes, then switch to a "still running" state with elapsed time, a slower poll, and a manual re-check — never inferring failure from silence.
- Q: Which incident identifier should the deep link carry? → A: The internal identifier, matching PRD §7 and §9 as written. The external identifier stays a display value only, avoiding a second undefined lookup.

## User Scenarios & Testing *(mandatory)*

Two people share one screen. The **on-call engineer** works the top band under time pressure; the
**eng manager / SRE lead** reads the bottom band to decide whether the automation can be trusted.
There is no role switching — the layout separates them.

### User Story 1 - Triage what needs a human right now (Priority: P1)

An on-call engineer opens the dashboard and, without reading a database or asking anyone, sees how
many incidents are open, how many are critical, and how many AI actions are blocked waiting on a
person. They scan the open incident list, spot the one that is aging past its priority threshold,
click the row, and read the full story of that incident — what the AI classified it as, how
confident it was, which past incidents it matched, what it did or proposed, and the minute-by-minute
timeline — all without losing the dashboard behind it.

**Why this priority**: This is the read-only spine. It proves the whole data model end to end and is
the only story that delivers value on its own — an engineer can triage with nothing else built. Every
later story hangs off the same incident context.

**Independent Test**: Load the dashboard against a seeded dataset with a mix of open/resolved
incidents; verify the six tiles report correct values, the table lists open incidents in priority
order, clicking any row opens the detail panel over a still-interactive dashboard, and reloading a
copied URL restores the same filters and the same open incident.

**Acceptance Scenarios**:

1. **Given** a seeded dataset, **When** the dashboard loads, **Then** six summary tiles display
   open incidents, active P1 count, actions awaiting approval, automation rate, median time to
   resolve, and known-incident hit rate, each with a delta against the preceding period.
2. **Given** the tiles are displayed, **When** the engineer clicks the "P1 active" tile, **Then** the
   incident list below filters to exactly those P1 open incidents and the active filter is named on
   screen and reflected in the URL.
3. **Given** the incident list, **When** the engineer clicks any row, **Then** a right-side detail
   panel slides over the dashboard, the dashboard remains visible and interactive behind it, and no
   page navigation occurs.
4. **Given** the detail panel is open, **When** the engineer presses `Esc` or clicks outside it,
   **Then** it closes and keyboard focus returns to the row that opened it.
5. **Given** an incident whose agent trace contains a failed run, **When** the detail panel opens,
   **Then** that failed run is already expanded with its error message visible while successful runs
   stay collapsed.
6. **Given** a URL containing an incident identifier, **When** it is opened in a new browser session,
   **Then** the dashboard loads with that incident's detail panel already open.
7. **Given** an incident older than its priority threshold (30m for P1, 2h for P2, 8h for P3, 24h for
   P4), **When** the list renders, **Then** its age is visually flagged and carries a text label, not
   colour alone.

---

### User Story 2 - Approve or reject an AI-proposed action (Priority: P2)

A proposed remediation is waiting. The engineer reads the card: priority, risk level, the action the
AI wants to run, its confidence, the parameters it will use, and the evidence that led it there. If
it looks right they approve it — for a high-risk action they confirm a second time — and the card
resolves in place from "Executing…" to success or failure without a refresh. If it looks wrong they
reject it and must say why, which feeds the learning loop.

**Why this priority**: This is the human-in-the-loop gate and the demo moment. It is also the only
part of the product that changes production state, so it carries the most risk per line of code.
Delivered on top of Story 1 it makes the dashboard a tool rather than a report.

**Independent Test**: With pending proposed actions in the seeded dataset, approve a high-risk action
through its confirmation step and watch the card resolve in place; reject another and confirm the
form refuses to submit without a reason; double-click Approve and confirm exactly one execution is
triggered.

**Acceptance Scenarios**:

1. **Given** actions proposed and requiring approval, **When** the queue renders, **Then** one card
   appears per action sorted by incident priority, then risk level, then age — and actions not
   requiring approval never appear.
2. **Given** a card for a HIGH-risk action, **When** the engineer clicks Approve, **Then** a
   confirmation step restates the action and requires a second explicit click before anything runs.
3. **Given** a card for a LOW or MEDIUM-risk action, **When** the engineer clicks Approve, **Then**
   the action is submitted in one click with no confirmation step.
4. **Given** an approval has been submitted, **When** the engineer clicks Approve again or
   double-clicks it, **Then** the control is already disabled and exactly one execution is triggered.
5. **Given** an approved action is running, **When** the engineer stays on the page, **Then** the card
   shows an executing state with an elapsed timer and resolves in place to success or to failure with
   the error message — with no manual refresh.
6. **Given** the engineer clicks Reject, **When** they submit without entering a reason, **Then**
   submission is refused and the reason field is flagged as required.
7. **Given** a rejection with a reason, **When** it is submitted, **Then** the action is recorded as
   rejected, the reason is captured as developer feedback, and an optional corrected category or
   priority is recorded when supplied.
8. **Given** a proposed action, **When** the engineer expands "Why this action", **Then** the
   similarity matches that drove it are listed with document type, title, score, and a link to the
   source.
9. **Given** an action whose confidence is below the low-confidence threshold, **When** the card
   renders, **Then** it is visibly qualified with a "review parameters" caption in addition to the
   numeric confidence.
10. **Given** an approve or reject request that fails, **When** the response arrives, **Then** the
    optimistic change is rolled back and the failure is surfaced without losing the engineer's input.
11. **Given** no actions are awaiting approval, **When** the queue renders, **Then** it states the
    positive outcome including how many actions ran automatically in the active period.
12. **Given** no operator name has been recorded yet, **When** the engineer approves or rejects,
    **Then** they are asked for their name first and the action does not proceed until it is supplied.

---

### User Story 3 - Judge whether the automation is trustworthy (Priority: P3)

An eng manager wants to know if the AI is actually working. They read the funnel from incidents
received down to validated-and-resolved, see which stage loses the most incidents, and read the
fully-automated and human-assisted rates as two separate numbers. They check the execution outcome
split — and specifically how many actions rolled back, because a silent rollback is worse than a
loud failure. Clicking any stage drops them into the incidents behind that number.

**Why this priority**: This is the trust argument. It converts the dashboard from an operations
console into evidence that the orchestrator works, but nobody is blocked on it — the engineer's
triage loop is complete without it.

**Independent Test**: Against the seeded dataset, verify each funnel stage count and each execution
outcome count independently, confirm rolled-back executions are never folded into success or failure,
click a stage and confirm the resulting incident list reconciles exactly with the number displayed.

**Acceptance Scenarios**:

1. **Given** the active time range and environment, **When** the funnel renders, **Then** each stage
   shows an absolute count and its percentage of the stage above it.
2. **Given** the funnel is rendered, **When** stage-to-stage drops are compared, **Then** the largest
   drop is annotated automatically with the stage pair and the magnitude.
3. **Given** the funnel is rendered, **When** the manager clicks a stage, **Then** the incident list
   filters to the incidents that reached the preceding stage but did not pass this one, and the row
   count reconciles exactly with the drop count displayed on that stage.
4. **Given** a stage that lost no incidents, **When** the manager clicks it, **Then** the list shows
   the filtered-empty state naming that stage rather than a no-data state.
5. **Given** executed actions of mixed status, **When** the outcome breakdown renders, **Then**
   rolled-back executions are reported as their own count, separate from both success and failure,
   everywhere they appear.
6. **Given** the outcome breakdown, **When** the manager toggles the by-type view, **Then** outcomes
   split by action type so an unreliable automation class is identifiable.
7. **Given** recent failed executions exist, **When** the outcome panel renders, **Then** the most
   recent failures are listed with action type, incident, a truncated error message, and a link that
   opens that incident's detail panel.
8. **Given** the automation rate is displayed, **When** the manager reads it, **Then** the
   fully-automated percentage and the human-assisted percentage appear as two adjacent numbers, never
   merged into one.

---

### User Story 4 - See where incidents concentrate (Priority: P4)

The manager wants to know whether volume is rising, whether resolution time held, and which service
is generating the noise. They read the volume trend with known versus unknown incidents stacked and
median resolution time overlaid, then scan the priority, category and service breakdowns — where a
service with high volume and a low known-rate marks the runbook gap. They can also leave feedback on
an incident's classification.

**Why this priority**: This rounds out the manager view and closes the learning loop, but every
number here is a refinement of a question Story 3 already answers.

**Independent Test**: Against the seeded dataset, verify the volume buckets and overlay series, the
three breakdowns, and that clicking any segment filters the incident list; submit feedback on an
incident and confirm it appears in that incident's feedback history.

**Acceptance Scenarios**:

1. **Given** a 7-day or 30-day range, **When** the volume chart renders, **Then** incidents are
   stacked as known versus unknown in day buckets; **and** for a 24-hour range, in hour buckets.
2. **Given** the volume chart, **When** it renders, **Then** median resolution time is overlaid on a
   secondary axis so volume and resolution time are readable in one frame.
3. **Given** the breakdown charts, **When** they render, **Then** priority is shown P1 through P4,
   category is shown descending with the top six plus "Other", and the top five services each show
   their known-rate inline.
4. **Given** any breakdown segment, **When** the manager clicks it, **Then** the incident list filters
   to that segment and the filter is reflected in the URL.
5. **Given** an incident detail panel, **When** the manager submits feedback with a type and
   comments, **Then** it is recorded and listed above the form with any existing feedback.

---

### Edge Cases

- **No data at all versus nothing matching the filter** — an empty dataset explains how incidents
  arrive; an over-filtered view says so and offers a one-click clear. These must never render the
  same way.
- **Median over zero resolved incidents** — the tile shows an explicit no-value state, not `0m`.
- **Funnel with zero incidents received** — stage percentages have no denominator; the funnel reports
  the empty state rather than dividing by zero or showing `NaN`.
- **A funnel stage that lost nothing** — clicking it is still meaningful and yields the filtered-empty
  state for that stage, never a no-data state and never a silently unclickable row.
- **No operator name recorded yet** — any action needing attribution asks for one first rather than
  writing an empty or anonymous actor.
- **An action resolved by someone else while its card is on screen** — the approve or reject attempt
  is refused; the card reconciles to the true state and explains why, without appearing to have
  succeeded.
- **An execution that never reports completion** — the executing state does not spin forever; after 2
  minutes the card states that it is still running with elapsed time, slows its polling, and offers a
  manual re-check. Silence is never interpreted as failure.
- **Polling fails** — affected surfaces label how stale they are and that reconnection is being
  attempted; stale numbers are never presented as live.
- **An incident with no agent runs, no similarity matches, or no actions** — each detail section shows
  its own empty state independently; the panel still opens and the timeline still renders.
- **A deep link to an incident that does not exist or is outside the current filters** — the panel
  reports that the incident could not be loaded without breaking the dashboard behind it; an incident
  outside the active filters still opens.
- **Missing or null confidence, unassigned incidents, unnamed services** — rendered as explicit
  unknown/unassigned states, with "Unassigned" treated as a warning rather than blank.
- **Very large parameter, log, or payload content** — expanding is scrollable and bounded; it never
  reflows the surrounding layout or blocks interaction.
- **A drill-down filter combined with a time-range change** — the current-state band keeps showing
  current state, the range-filtered band updates, and the active drill-down survives and is
  re-evaluated against the new range rather than being silently dropped or reinterpreted.
- **Rejecting an action whose incident has already been resolved** — permitted, with the resulting
  feedback still recorded, since the learning loop is the point.

## Requirements *(mandatory)*

### Functional Requirements

> Each FR MUST cite the PRD requirement ID(s) it derives from (`AR-*`, `IT-*`, `EO-*`, `TL-*`,
> `X-*`, `A11Y-*`, `P-*`) or the §11 acceptance criterion — Constitution Principle II.
> Every data-bound component in scope MUST have its four states (loading, empty-no-data,
> empty-filtered, error) stated as requirements — Constitution Principle VII.

**Global controls and shareable state**

- **FR-001**: Users MUST be able to set a time range of 24h, 7d, 30d, or All, defaulting to 7d.
  (PRD §4)
- **FR-002**: Users MUST be able to multi-select environment from Production, Staging and
  Development, defaulting to Production only. (PRD §4)
- **FR-003**: Users MUST be able to filter to a single service, defaulting to all services. (PRD §4)
- **FR-004**: The time range, environment, service, free-text search, active drill-down filter, and
  the open detail panel MUST all persist in the URL so any view can be shared or bookmarked and
  restored by reload. (PRD §4, §11.7)
- **FR-004a**: At most one drill-down — a summary tile, a funnel stage, or a breakdown segment — MAY be
  active at a time; selecting another MUST replace it, never accumulate. The time range, environment
  and service filters, the free-text search and the include-resolved toggle MUST always apply in
  addition to the active drill-down. (PRD §A1, §B1, §B4)
- **FR-004b**: The active drill-down MUST be named on screen and MUST offer a one-click clear that
  returns the list to its default filter without disturbing the global filters. (PRD §A1, §8)
- **FR-005**: The operational band MUST show current state regardless of the selected time range;
  only the performance band and the volume chart are range-filtered. (PRD §4)
- **FR-006**: The dashboard MUST show a live indicator stating how long ago data was updated, and
  MUST offer a manual refresh. (PRD §4)

**Summary tiles**

- **FR-007**: The system MUST display six tiles: open incidents, active P1 count, actions awaiting
  approval, automation rate, median time to resolve, and known-incident hit rate. (PRD §A1)
- **FR-008**: Each tile MUST show a delta against the preceding equivalent period, with the direction
  of "good" reflected correctly (a rising open-incident count is not an improvement). (PRD §A1)
- **FR-009**: The active-P1 tile MUST become visually urgent when above zero, and the awaiting-approval
  tile MUST become visually cautionary when above zero — both with text labels, not colour alone.
  (PRD §A1, A11Y-1)
- **FR-010**: Resolution time MUST be reported as the **median**; the average MAY be exposed in the
  tile's tooltip and MUST be labelled as the average. (PRD §A1)
- **FR-011**: Every tile MUST be clickable and MUST filter the incident list to exactly the rows that
  produced its value, with the drill-down expressed in the URL. (PRD §A1, §11.1)

**Approvals queue**

- **FR-012**: The queue MUST show one card per proposed action requiring approval, sorted by incident
  priority, then risk level, then age. (PRD §A2)
- **FR-013**: Actions not requiring approval MUST NOT appear in the queue; they surface only in the
  performance band and the incident timeline. (AR-10)
- **FR-014**: Risk level MUST be rendered as an unmissable badge carrying a text label in every case.
  (AR-1, A11Y-1)
- **FR-015**: Confidence MUST be rendered as a bar together with its numeric value; below a
  configurable threshold (default 0.70) the card MUST be visibly qualified and state that parameters
  need review. (AR-2)
- **FR-016**: Action parameters MUST be collapsed by default and expandable, rendered monospaced and
  syntax-highlighted; a SQL action MUST render as formatted SQL rather than raw payload. (AR-3)
- **FR-017**: "Why this action" MUST expand to the similarity matches that drove the recommendation —
  document title, type, score, and a link to the source. (AR-4)
- **FR-018**: Approving a HIGH-risk action MUST require a confirmation step restating the action and
  a second explicit click; LOW and MEDIUM risk MUST approve in one click. (AR-5, §11.2)
- **FR-019**: Rejecting MUST require a free-text reason and MUST accept an optional corrected category
  and priority; submission without a reason MUST be refused. (AR-6, §11.3)
- **FR-020**: A rejection MUST record the action as rejected **and** record developer feedback of type
  rejected carrying the reason. (AR-6, §11.3)
- **FR-021**: On approval the card MUST enter an executing state with elapsed time and MUST resolve in
  place to success or to failure with its error message, without a manual refresh. (AR-7, §11.2)
- **FR-021a**: If an execution has not reported completion within 2 minutes, the card MUST switch to a
  "still running" state showing elapsed time, MUST reduce its polling cadence, and MUST offer a manual
  re-check. It MUST NOT report a failure it has not observed. (AR-7, PRD §8)
- **FR-022**: Every approve and reject MUST record who acted and when, and MUST emit the corresponding
  incident event. (AR-8)
- **FR-023**: The Approve control MUST disable immediately on activation so that repeated or
  double-clicks cannot trigger more than one execution. (X-4, §11.9)
- **FR-024**: Approve and reject MUST apply optimistically and MUST roll back with a clear error if
  the write fails. (X-1)
- **FR-025**: The queue's empty state MUST be phrased as a positive outcome and MUST include how many
  actions executed automatically in the active period. (AR-9)

**Incident list**

- **FR-026**: The list MUST default to unresolved incidents, sorted by priority then newest first,
  showing priority, status, title, service, environment, category, known-incident indicator with the
  best match score, AI confidence, age, assignee, and an automation indicator. (PRD §A3)
- **FR-027**: Clicking a row MUST open the detail panel over the dashboard and MUST NOT navigate away
  from it. (IT-1, §11.6)
- **FR-028**: Users MUST be able to sort by priority, age and confidence from the column headers.
  (IT-2)
- **FR-029**: Users MUST be able to search free-text across incident title, description and external
  identifier. (IT-3)
- **FR-030**: Users MUST be able to toggle "include resolved" to extend the list to all statuses
  within the active time range. (IT-4)
- **FR-031**: The list MUST paginate at 25 rows, with paging applied at the data source rather than by
  filtering a fully-loaded client set. (IT-5, P-3)
- **FR-032**: Each row MUST carry a source indicator (email, Slack, PagerDuty, API or manual) in the
  title cell. (IT-6)
- **FR-033**: Age MUST be flagged once it passes its per-priority threshold — 30 minutes for P1, 2
  hours for P2, 8 hours for P3, 24 hours for P4. (PRD §A3)
- **FR-034**: Escalated status MUST be visually distinct from open, and non-production environments
  MUST be de-emphasised — both while retaining text labels. (PRD §A3, A11Y-1)

**Incident detail panel**

- **FR-035**: The panel MUST open as a right-side slide-over occupying roughly 55% of the viewport,
  leave the dashboard visible and interactive behind a scrim, and close on `Esc` or click-outside.
  (PRD §7)
- **FR-036**: The panel MUST be deep-linkable by the incident's **internal** identifier. The external
  identifier is a display value only and MUST NOT be used for addressing. (PRD §7, §11.7)
- **FR-037**: The panel header MUST show external identifier, title, status, priority, service,
  environment, assignee, created and resolved timestamps, and source. (PRD §D1)
- **FR-038**: The panel MUST offer assign-to-me, change-priority, escalate and mark-resolved actions.
  All four MUST persist through a single incident-update operation and MUST record the acting operator
  per FR-077. (PRD §D1)
- **FR-038a**: While that incident-update operation is unavailable, the four controls MUST be visibly
  disabled with the reason stated — never hidden, and never appearing to succeed. (PRD §D1)
- **FR-039**: The panel MUST show the AI's category, priority and confidence, and where a human
  correction exists MUST show "AI said X → human corrected to Y" side by side. (PRD §D2)
- **FR-040**: The panel MUST list agent runs in start order with agent name and version, status,
  duration, confidence, and collapsible input and output. (PRD §D3)
- **FR-041**: Failed agent runs MUST be expanded by default with the error visible; all other runs
  MUST be collapsed. (PRD §D3, §11.6)
- **FR-042**: The panel MUST list similarity matches descending by score with document-type badge,
  title, score bar, summary snippet and external source link, capped at five with a show-all control.
  (PRD §D4)
- **FR-043**: The panel MUST list recommended actions with their executions nested underneath, showing
  type, description, risk, confidence, status, approver and timestamp, and — for executed actions —
  duration with collapsible response payload and execution logs. (PRD §D5)
- **FR-044**: Pending actions inside the panel MUST offer the same approve and reject behaviour as the
  queue, including the HIGH-risk confirmation and the required rejection reason. (PRD §D5)
- **FR-045**: The panel MUST show a chronological event timeline with an icon per event type, a
  human-readable description, relative and absolute timestamps, the actor, and expandable per-event
  payload. (PRD §D6)
- **FR-046**: The timeline MUST offer an "agent events only" filter. (TL-1)
- **FR-047**: Failure events — validation failed, action rejected, escalated — MUST be visually
  flagged with a text label. (TL-2, A11Y-1)
- **FR-048**: Each timeline event MUST show cumulative elapsed time since the incident was created.
  (TL-3)
- **FR-049**: The panel MUST offer a feedback form at all times — type, comments, and optional
  corrected category, priority and resolution — and MUST list existing feedback above it. (PRD §D7)

**Performance band**

- **FR-050**: The funnel MUST show incidents received, classified, RAG-matched, action-recommended,
  approved-or-auto-run, executed-successfully and validated-and-resolved, each with an absolute count
  and its percentage of the stage above. (PRD §B1)
- **FR-051**: The funnel MUST annotate the largest stage-to-stage drop automatically, naming the stage
  pair and the magnitude. (PRD §B1)
- **FR-052**: Clicking a funnel stage MUST filter the incident list to that stage's **drop-set** — the
  incidents that reached the preceding stage but did not pass this one. (PRD §B1)
- **FR-052a**: Each stage MUST display its drop count alongside its own count, so that the filtered row
  count reconciles exactly with a number visible on the funnel. (PRD §B1, §11.4)
- **FR-052b**: A stage that lost no incidents MUST remain clickable and MUST produce the
  filtered-empty state naming that stage — distinguishable from having no data at all. (PRD §B1, §8)
- **FR-052c**: The first stage (incidents received) has no preceding stage and therefore no drop-set;
  clicking it MUST filter to all incidents in the active range. (PRD §B1)
- **FR-053**: Automation rate MUST be computed as resolved incidents that had a successful execution
  and never required human approval, and MUST be presented as two adjacent numbers — fully automated
  and human-assisted. (PRD §6.1)
- **FR-054**: Execution outcomes MUST be shown as a distribution over success, failed, rolled-back and
  running, with the success rate as the centre label. (PRD §B2)
- **FR-055**: Rolled-back executions MUST be counted and displayed separately from both success and
  failure everywhere they appear. (EO-1, §11.5)
- **FR-056**: The system MUST list the most recent failed executions with action type, incident,
  truncated error message and a link that opens that incident's detail panel. (EO-2)
- **FR-057**: Users MUST be able to toggle an outcome breakdown by action type — SQL, Lambda, API,
  GitHub PR, Kubernetes. (EO-3)
- **FR-058**: Median execution duration MUST be shown as a caption on the outcome panel. (EO-4)
- **FR-059**: The volume chart MUST stack known versus unknown incidents in day buckets for 7d and
  30d ranges and hour buckets for 24h. (PRD §B3)
- **FR-060**: The volume chart MUST overlay median resolution time on a secondary axis. (PRD §B3)
- **FR-061**: The system MUST show breakdowns by priority (P1→P4), by category (descending, top six
  plus "Other"), and by service (top five, each with its known-rate inline). (PRD §B4)
- **FR-062**: Every breakdown segment MUST be clickable and MUST filter the incident list. (PRD §B4)

**States, behaviour, accessibility, performance**

- **FR-063**: Every data-bound component MUST implement four distinct states — loading as a skeleton
  matching the final layout with no layout shift, empty-no-data explaining how data arrives,
  empty-filtered distinguishable from no-data with a one-click clear, and an inline retryable error.
  (PRD §8, §11.8)
- **FR-064**: A component's failure MUST NOT take down the dashboard; each panel fails and retries
  independently. (PRD §8)
- **FR-065**: When polling fails the affected surface MUST state how stale it is and that reconnection
  is in progress; stale values MUST NOT be presented as live. (PRD §8)
- **FR-066**: The operational band MUST refresh every 30 seconds; the performance band MUST refresh on
  filter change and every 5 minutes. (X-2)
- **FR-067**: Refreshed values MUST NOT cause layout jump; value transitions are animated in place.
  (X-3)
- **FR-068**: Timestamps MUST display relative by default and absolute with timezone on hover. (X-5)
- **FR-069**: Colour MUST never be the sole carrier of meaning — every priority, risk, status and
  outcome indicator MUST carry a text label. (A11Y-1)
- **FR-070**: All indicators, text and chart series MUST meet WCAG AA contrast. (A11Y-2)
- **FR-071**: The approval queue and detail panel MUST be fully keyboard operable — tab through
  cards, `Enter` to open detail, `Esc` to close — with focus trapped in the panel while open and
  restored on close. (A11Y-3, §11.10)
- **FR-072**: Every chart MUST offer an accessible tabular equivalent. (A11Y-4)
- **FR-073**: First meaningful paint MUST be under 2 seconds on the seeded dataset. (P-1)
- **FR-074**: Summary tiles MUST render before charts; components load progressively and
  independently. (P-2)
- **FR-075**: Each aggregate MUST be served by a single request, with no per-row follow-up requests
  for the incident list. (P-3)
- **FR-076**: Large payloads — action parameters, agent input and output, execution logs and response
  payloads — MUST be fetched only when expanded and MUST NEVER be included in list responses. (P-4)
- **FR-077**: Approving, rejecting, assigning, escalating, resolving and submitting feedback MUST
  record the acting operator's identity. The operator supplies their own name once; it persists across
  reloads on that browser and accompanies every subsequent attributed action. (AR-8, PRD §D1, §D7)
- **FR-077a**: When no operator name has been supplied yet, the first action requiring attribution MUST
  prompt for one, and MUST NOT complete until it is given. (AR-8)
- **FR-077b**: The operator MUST be able to see and change the name currently being recorded. (AR-8)

### Out of Scope (v1)

These are explicit non-goals (PRD §1) and MUST NOT be implemented by this feature:

- Creating or editing incidents from the dashboard — incidents arrive from email, monitoring and API.
- Authoring or editing knowledge base documents and runbooks.
- User management, role-based access control, on-call rotations, and SLA configuration.
- Historical report export.
- Role switching between the two personas — both share one screen and one layout.

### Key Entities

- **Incident**: A problem arriving from email, Slack, PagerDuty, API or manual entry. Carries external
  identifier, title, description, priority, status, environment, category, service, assignee, AI
  confidence, known-incident flag, and created/resolved timestamps.
- **Service**: The system an incident belongs to; supplies the name shown in the list and the service
  breakdown.
- **Recommended Action**: A remediation the AI proposes for an incident — type, description, risk
  level, confidence, parameters, whether approval is required, status, and approver with timestamp.
- **Executed Action**: The record of a recommended action actually running — status (success, failed,
  rolled back, running), start and finish times, error message, response payload, execution logs.
- **Agent Run**: One agent's contribution to handling an incident — agent name and version, status,
  timing, confidence, input, output, error message.
- **Similarity Match**: A link from an incident to a knowledge document (past incident, runbook,
  postmortem, issue, documentation) with a relevance score, summary snippet and source link.
- **Incident Event**: A timestamped entry in an incident's history — event type, description, actor,
  payload.
- **Developer Feedback**: A human judgement on an incident or action — feedback type, comments, and
  optional corrected category, priority or resolution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An on-call engineer clears a full approval queue — reading the evidence and deciding on
  each pending action — in under 60 seconds.
- **SC-002**: An engineer can explain any incident's handling (what the AI classified it as, what it
  matched, what ran, and what happened) without leaving the dashboard or querying a database.
- **SC-003**: The dashboard becomes useful within 2 seconds of opening on the seeded dataset, with the
  six summary tiles readable before any chart has drawn.
- **SC-004**: An eng manager can state the period's automation rate, median time to resolve, and the
  noisiest service without asking anyone.
- **SC-005**: Every displayed aggregate reconciles exactly with the incidents behind it when drilled
  into — a tile value, a breakdown segment, and a funnel stage's drop count each return the row set
  they claim, with zero discrepancy.
- **SC-006**: Approving the same action twice — by double-click or repeat activation — executes it
  exactly once, in 100% of attempts.
- **SC-007**: 100% of rejections capture a reason; none can be submitted without one.
- **SC-008**: Rolled-back executions are reported separately from successes and failures in 100% of
  the places execution outcomes appear.
- **SC-009**: The entire approval and inspection flow is completable using only a keyboard.
- **SC-010**: A URL copied from one browser reproduces the same filters, drill-down and open incident
  in another.
- **SC-011**: Any single failing data source degrades only its own panel; the rest of the dashboard
  stays usable.

## Assumptions

1. **Backend availability** — the data services described in PRD §9 may not be running while this is
   built. The dashboard is therefore built against a fixed data contract, and a seeded stand-in
   dataset substitutes for live data so that every scenario above remains demonstrable and testable.
   No data shapes beyond those PRD §9 describes are introduced.
2. **Delta baseline** — range-scoped tiles (automation rate, median resolve, known-incident hit rate)
   compare against the immediately preceding window of equal length. Current-state tiles (open, P1
   active, awaiting approval) compare against their value at the start of the active window, since
   PRD §4 fixes them as current-state regardless of range.
3. **Execution polling cadence** — while an execution is running its status is polled substantially
   faster than the 30-second operational-band cadence (target ~2 seconds), because AR-7 requires the
   card to resolve in place. That fast cadence is bounded at 2 minutes, after which FR-021a takes over.
   The exact interval within that bound is a plan-level decision.
4. **"All" time range** — the volume chart uses day buckets, extending the 7d/30d rule; PRD §B3 only
   specifies buckets for 24h/7d/30d.
5. **Validated-and-resolved funnel stage** — PRD §10 item 4 records that no validation record exists,
   so this stage cannot be computed. Per Constitution XIV it is **not** inferred from payload
   contents: the stage renders as explicitly unavailable, naming the missing upstream record, until
   that record exists.
6. **Rejection reason storage** — PRD §10 item 2 notes there is no dedicated rejection-reason field
   yet, so the reason is carried on the developer-feedback record. FR-019 and FR-020 are satisfied
   either way; only the storage location changes if the field is added.
7. **Agent run duration** — where a measured latency is unavailable, duration is derived from start
   and finish timestamps (PRD §D3 permits either).
8. **PRD §12 phase 5 is not a separate story** — accessibility, the four component states and polling
   are requirements on every story (Constitution VII and X), not a deferred polish pass.
9. **Timezone** — relative timestamps are the default; absolute values render in the viewer's local
   timezone with the zone named, per X-5.
10. **Low-confidence threshold** defaults to 0.70 and is configurable without a code change, per AR-2.
11. **Both personas share one unauthenticated view** — no role switching, no per-role gating, since
    RBAC is an explicit v1 non-goal. Any control visibility is presentational only; the server remains
    the authority on whether an action is permitted (Constitution XIII).
12. **Operator identity is self-declared and unverified** (resolves FR-077) — the operator types their
    own name, which persists locally and is attached to attributed actions. This is an attribution
    convenience for the demo, not authentication: it is trivially spoofable, and no permission decision
    may depend on it. Replacing it with a real authenticated identity later changes only where the name
    comes from, not any requirement above.
13. **Funnel stage clicks select the drop-set** (resolves FR-052) — clicking a stage answers "show me
    the ones we lost here", per PRD §B1's stated intent. Each stage therefore displays its drop count
    as well as its own count, which is what §11.4's exact-reconciliation criterion is asserted against.

## Dependencies

- `docs/ui_prd_incident_orchestrator_dashboard.md` — the authoritative product spec this feature
  implements. All requirement IDs cited above are defined there.
- `ai_incident_response_database_schema.md` — **not present in this repository**. It owns every entity
  and field name used in Key Entities. Names are treated as given; adjacent ones are not invented
  (Constitution I).
- The orchestrator backend exposing PRD §9 — see Assumption 1 for how absence is handled.
- **An incident-update operation, which PRD §9 does not currently define** — required by FR-038 for
  assignee, priority, escalation and resolution. This is a gap in PRD §9 of the same kind §10 records
  for the schema, and closing it is a prerequisite for those four controls being enabled (FR-038a
  governs behaviour until then). No other write beyond PRD §9 is introduced.
- `docs/incident_dashboard_prototype.html` — visual reference for layout, states and interaction only.
  It is a dependency-free wireframe with mock data and is not extended as application code.
