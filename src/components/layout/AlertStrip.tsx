import { useAlertStrip } from "../../api/dashboard/alertStrip";
import { useUrlState } from "../../state/useUrlState";

export const APPROVAL_QUEUE_FLASH_EVENT = "incident-tracker:flash-approval-queue";

// AS-1..AS-8: mounted in the header, outside every TabPanel, so it is unaffected by which tab is
// visible and its 30s poll (useAlertStrip) never pauses (FR-015, research.md §12).
export function AlertStrip() {
  const { data, isError, error } = useAlertStrip();
  const { setTab, setFilter } = useUrlState();

  if (isError) {
    return (
      <div role="status" aria-live="polite" data-severity="error">
        {(error as Error | undefined)?.message ?? "Could not load the alert strip."}
      </div>
    );
  }

  if (!data) {
    return (
      <div role="status" aria-live="polite" data-severity="loading">
        Loading alert strip…
      </div>
    );
  }

  const severity = data.p1Active > 0 ? "hot" : data.awaitingApproval > 0 ? "warm" : "calm";

  if (severity === "calm") {
    return (
      <div role="status" aria-live="polite" data-severity="calm">
        <span>No critical incidents · no approvals pending</span>
        <span>Automation handled {data.autoExecutedCountInRange} actions in the last 7 days</span>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" data-severity={severity}>
      {data.p1Active > 0 && (
        <button
          onClick={() => {
            setTab("now");
            setFilter({ kind: "kpiTile", key: "p1Active", label: "P1 active" });
          }}
        >
          <b>{data.p1Active}</b> P1 active
        </button>
      )}
      {data.awaitingApproval > 0 && (
        <button
          onClick={() => {
            setTab("now");
            window.dispatchEvent(new CustomEvent(APPROVAL_QUEUE_FLASH_EVENT));
          }}
        >
          <b>{data.awaitingApproval}</b> awaiting approval
        </button>
      )}
      <span>
        {data.oldestPendingAgeMinutes != null
          ? `oldest pending ${data.oldestPendingAgeMinutes}m`
          : "nothing blocked on a human"}
      </span>
    </div>
  );
}
