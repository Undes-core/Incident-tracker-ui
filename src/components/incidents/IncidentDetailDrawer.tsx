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
  useFocusTrap(containerRef, isOpen);

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
      <div data-testid="scrim" onClick={() => setIncident(null)} />
      <div role="dialog" aria-modal="true" aria-label="Incident detail" ref={containerRef}>
        <button type="button" onClick={() => setIncident(null)} aria-label="Close incident detail">
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
          skeleton={<p>Loading incident…</p>}
        >
          {(detail) => (
            <>
              <IncidentHeaderActions incident={detail.incident} />
              <ClassificationPanel detail={detail} />
              <AgentRunTrace incidentId={detail.incident.id} runs={detail.agentRuns} />
              <SimilarityMatchList incidentId={detail.incident.id} matches={detail.similarityMatches} />
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
            </>
          )}
        </PanelBoundary>
      </div>
    </>
  );
}
