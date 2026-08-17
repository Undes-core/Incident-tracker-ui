import { useIncidentList } from "../../api/incidents/list";
import { useUrlState } from "../../state/useUrlState";
import { PanelBoundary } from "../shared/PanelBoundary";

// K4/FR-103/FR-104: the learning backlog — same-tab, row-click-opens-drawer list (contracts/
// incidents-endpoints.md's own note: candidate=true is not a cross-tab jump, since this panel
// already lives on a row-click list, not a jump target).
export function DocumentationCandidates() {
  const { setIncident } = useUrlState();
  const { data, isLoading, isError, error, refetch } = useIncidentList({ candidate: true });

  return (
    <PanelBoundary
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | undefined)?.message}
      onRetry={refetch}
      data={data}
      isEmpty={(d) => d.rows.length === 0}
      emptyNoDataMessage="No documentation candidates right now — every resolved incident has a match."
      skeleton={<div>Loading documentation candidates…</div>}
    >
      {(list) => (
        <section aria-label="Documentation candidates">
          <ul>
            {list.rows.map((row) => {
              const open = () => setIncident(row.id);
              return (
                <li
                  key={row.id}
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") open();
                  }}
                >
                  <span>{row.externalId}</span>
                  <span>{row.title}</span>
                  <span>{row.serviceName}</span>
                  <span>{row.candidateReason}</span>
                  {row.recurrenceCount !== null && row.recurrenceCount > 1 && (
                    <span>Recurred {row.recurrenceCount} times</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </PanelBoundary>
  );
}
