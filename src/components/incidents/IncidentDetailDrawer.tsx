import { useEffect, useRef } from "react";
import { useIncidentDetail } from "../../api/incidents/detail";
import { useUrlState } from "../../state/useUrlState";
import { useFocusTrap } from "../../state/useFocusTrap";
import { PanelBoundary } from "../shared/PanelBoundary";
import { ActionsAndExecutions } from "./ActionsAndExecutions";
import { AgentRunTrace } from "./AgentRunTrace";
import { ClassificationPanel } from "./ClassificationPanel";
import { EventTimeline } from "./EventTimeline";
import { FeedbackForm } from "./FeedbackForm";
import { FeedbackImpactWidget } from "./FeedbackImpactWidget";
import { IncidentHeaderActions } from "./IncidentHeaderActions";
import { SimilarityMatchList } from "./SimilarityMatchList";

// FR-058/FR-059/A11Y-3: right-side slide-over over an interactive dashboard, closes on Esc or
// click-outside, deep-linkable by internal id (?incident=), and restores focus to whatever opened
// it (handled by useFocusTrap's own cleanup).
export function IncidentDetailDrawer() {
  const { incidentId, setIncident } = useUrlState();
  const isOpen = incidentId !== null;
  const { data, isLoading, isError, error, refetch } = useIncidentDetail(incidentId);
  const containerRef = useRef<HTMLDivElement>(null);
  // "container": the first focusable child is "Close" — focusing it initially would let a
  // keyboard-triggered open (Enter on the incident row) immediately self-dismiss the drawer
  // (see useFocusTrap.ts's UseFocusTrapOptions doc).
  useFocusTrap(containerRef, isOpen, { initialFocus: "container" });

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIncident(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setIncident]);

  if (!isOpen) return null;

  return (
    <>
      <div
        data-testid="scrim"
        onClick={() => setIncident(null)}
        className="fixed inset-0 z-40 bg-black/25"
      />
      {/* IT-1: a slide-over pinned to the right, over a dashboard that stays live behind it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Incident detail"
        ref={containerRef}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(760px,92vw)] flex-col gap-4 overflow-y-auto border-l border-border bg-card p-5 shadow-[-8px_0_24px_rgba(20,24,35,.12)]"
      >
        <button
          type="button"
          onClick={() => setIncident(null)}
          aria-label="Close incident detail"
          className="self-end rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Close
        </button>
        <PanelBoundary
          isLoading={isLoading}
          isError={isError}
          errorMessage={(error as Error | undefined)?.message}
          onRetry={refetch}
          data={data}
          isEmpty={() => false}
          emptyNoDataMessage=""
          skeleton={
            <p className="py-8 text-center text-[13px] text-muted-foreground">Loading incident…</p>
          }
        >
          {(detail) => (
            <div className="grid gap-4">
              <IncidentHeaderActions incident={detail.incident} />
              <ClassificationPanel detail={detail} />
              <AgentRunTrace incidentId={detail.incident.id} runs={detail.agentRuns} />
              <SimilarityMatchList
                incidentId={detail.incident.id}
                matches={detail.similarityMatches}
              />
              <ActionsAndExecutions
                actions={detail.actions}
                incident={detail.incident}
                similarityMatches={detail.similarityMatches}
              />
              <EventTimeline
                incidentId={detail.incident.id}
                incidentCreatedAt={detail.incident.createdAt}
                events={detail.events}
              />
              <FeedbackImpactWidget />
              <FeedbackForm incidentId={detail.incident.id} existingFeedback={detail.feedback} />
            </div>
          )}
        </PanelBoundary>
      </div>
    </>
  );
}
