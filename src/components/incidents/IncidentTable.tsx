import { useState } from "react";
import { useIncidentList } from "../../api/incidents/list";
import { useUrlState } from "../../state/useUrlState";
import { PanelBoundary } from "../shared/PanelBoundary";
import { IncidentRow } from "./IncidentRow";

type SortKey = "priority" | "age" | "confidence";

// FR-048-057, P-3: server-side filter/sort/page. Also the destination every cross-tab jump
// flashes and scrolls into view (id="incident-table" is that target, consumed starting in US3).
export function IncidentTable() {
  const { environment, service, search, includeResolved, activeFilter, setSearch, setIncludeResolved, clearFilter } =
    useUrlState();
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const { data, isLoading, isError, error, refetch } = useIncidentList({
    environment,
    service,
    q: search,
    includeResolved,
    sort: sortKey,
    kpiTile: activeFilter?.kind === "kpiTile" ? activeFilter.key : undefined,
    funnelDropAt: activeFilter?.kind === "funnelDropAt" ? activeFilter.key : undefined,
    funnelStage: activeFilter?.kind === "funnelStage" ? activeFilter.key : undefined,
    breakdown: activeFilter?.kind === "breakdown" ? activeFilter.key : undefined,
  });

  const isFiltered = Boolean(search) || Boolean(activeFilter);

  return (
    <div id="incident-table">
      <input
        placeholder="Search title, service, or external ID…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={includeResolved}
          onChange={(event) => setIncludeResolved(event.target.checked)}
        />
        Include resolved
      </label>
      {activeFilter && (
        <span>
          {activeFilter.label}
          <button onClick={clearFilter} aria-label="Clear filter">
            ×
          </button>
        </span>
      )}
      <PanelBoundary
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as Error | undefined)?.message}
        onRetry={refetch}
        data={data}
        isEmpty={(d) => d.rows.length === 0}
        isFiltered={isFiltered}
        emptyNoDataMessage="Incidents arrive from email, PagerDuty, Slack, and the API."
        emptyFilteredMessage="No incidents match these filters."
        onClearFilters={() => {
          setSearch("");
          clearFilter();
        }}
        skeleton={<div>Loading incidents…</div>}
      >
        {(list) => (
          <>
            <table>
              <thead>
                <tr>
                  <th aria-sort={sortKey === "priority" ? "ascending" : "none"} onClick={() => setSortKey("priority")}>
                    Pri
                  </th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Env</th>
                  <th>Category</th>
                  <th>Known</th>
                  <th aria-sort={sortKey === "confidence" ? "ascending" : "none"} onClick={() => setSortKey("confidence")}>
                    AI conf.
                  </th>
                  <th aria-sort={sortKey === "age" ? "ascending" : "none"} onClick={() => setSortKey("age")}>
                    Age
                  </th>
                  <th>Assignee</th>
                  <th>Auto</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <IncidentRow key={row.id} incident={row} />
                ))}
              </tbody>
            </table>
            <div>
              Showing {list.rows.length} of {list.totalCount} · page {list.page}
            </div>
          </>
        )}
      </PanelBoundary>
    </div>
  );
}
